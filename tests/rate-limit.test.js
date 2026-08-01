process.env.NODE_ENV = 'test';
process.env.JWT_KEY_TOKEN = 'cle-de-test-uniquement';
process.env.CRYPTOJS_EMAIL = 'cle-email-de-test';

const mongoose = require('mongoose');
const request = require('supertest');

// Meme raison que dans les autres suites : sans cela, Mongoose met les requetes
// en file d'attente pendant dix secondes faute de connexion, ce qui depasse le
// delai de Jest. Ces tests portent sur le middleware, pas sur la base.
mongoose.set('bufferCommands', false);

/**
 * Limitation de debit sur l'authentification.
 *
 * La suite principale tourne plafond desactive : elle enchaine les tentatives
 * de connexion et atteindrait autrement la limite, faisant echouer des tests
 * pour une raison etrangere a ce qu'ils verifient.
 *
 * Ce fichier fait l'inverse. Il recharge l'application avec un plafond de
 * trois, puis envoie quatre requetes. Sans lui, la seule protection contre
 * l'essai de mots de passe en boucle ne serait jamais exercee avant la mise en
 * production.
 *
 * Le rechargement est necessaire parce que le limiteur est monte au chargement
 * du module : changer la variable apres coup n'aurait aucun effet sur
 * l'instance deja construite.
 */
const chargerAppAvecPlafond = (plafond) => {
  const precedent = process.env.AUTH_RATE_LIMIT;
  process.env.AUTH_RATE_LIMIT = String(plafond);

  let app;
  jest.isolateModules(() => {
    app = require('../app');
  });

  if (precedent === undefined) delete process.env.AUTH_RATE_LIMIT;
  else process.env.AUTH_RATE_LIMIT = precedent;

  return app;
};

describe('Limitation de debit sur la connexion', () => {
  // Corps vide a dessein : le controleur refuse avant toute lecture en base,
  // ce qui garde ces tests independants de MongoDB. Ce qui est mesure ici est
  // le comptage des tentatives, pas leur issue.
  it('refuse la quatrieme tentative quand le plafond est de trois', async () => {
    const app = chargerAppAvecPlafond(3);

    const tentative = () =>
      request(app)
        .post('/api/auth/login')
        .send({});

    await Promise.all([tentative(), tentative(), tentative()]);

    const quatrieme = await tentative();

    expect(quatrieme.status).toBe(429);
    expect(quatrieme.body.message).toMatch(/Trop de tentatives/);
  });

  it('protege aussi la creation de compte', async () => {
    const app = chargerAppAvecPlafond(1);

    // Adresse volontairement invalide : controlEmail repond 400 avant tout
    // acces a la base. Ce qui compte ici est que la tentative ait ete comptee.
    await request(app).post('/api/auth/signup').send({ email: 'pas-une-adresse' });

    const seconde = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'pas-une-adresse-non-plus' });

    expect(seconde.status).toBe(429);
  });

  it('ne pese que sur les adresses d authentification', async () => {
    const app = chargerAppAvecPlafond(1);

    await request(app)
      .post('/api/auth/login')
      .send({});

    // La lecture du catalogue ne doit pas etre limitee : l'appliquer rendrait
    // le site inutilisable derriere une adresse partagee, un reseau
    // d'entreprise par exemple.
    const inconnue = await request(app).get('/api/route-qui-n-existe-pas');

    expect(inconnue.status).toBe(404);
  });

  it('laisse tout passer quand le plafond vaut zero', async () => {
    const app = chargerAppAvecPlafond(0);

    for (let i = 0; i < 5; i += 1) {
      const reponse = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(reponse.status).not.toBe(429);
    }
  });
});
