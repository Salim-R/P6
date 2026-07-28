process.env.NODE_ENV = 'test';
process.env.JWT_KEY_TOKEN = 'cle-de-test-uniquement';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../app');

// Sans cette ligne, Mongoose met les requetes en file d'attente pendant 10 s
// en l'absence de connexion, ce qui depasse le delai de Jest. On veut ici un
// echec immediat : ces tests portent sur le routage, pas sur la base.
mongoose.set('bufferCommands', false);

// Route protegee sans acces base : le middleware auth repond avant d'atteindre
// le controleur, ce qui permet de le tester isolement.
const ROUTE_PROTEGEE = '/api/sauces/507f1f77bcf86cd799439011/like';

describe('Middleware auth', () => {
  it('refuse une requete sans en-tete Authorization', async () => {
    const response = await request(app).post(ROUTE_PROTEGEE).send({ like: 1 });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton manquant');
  });

  it('refuse un en-tete mal forme', async () => {
    const response = await request(app)
      .post(ROUTE_PROTEGEE)
      .set('Authorization', 'jeton-sans-prefixe-bearer')
      .send({ like: 1 });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton manquant');
  });

  it('refuse un jeton invalide', async () => {
    const response = await request(app)
      .post(ROUTE_PROTEGEE)
      .set('Authorization', 'Bearer jeton.non.valide')
      .send({ like: 1 });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton invalide');
  });

  it('distingue un jeton expire d un jeton invalide', async () => {
    const expire = jwt.sign({ userId: 'abc' }, process.env.JWT_KEY_TOKEN, { expiresIn: '-1s' });

    const response = await request(app)
      .post(ROUTE_PROTEGEE)
      .set('Authorization', `Bearer ${expire}`)
      .send({ like: 1 });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton expire');
  });
});

describe('Acces public en lecture', () => {
  // Sans base connectee ces routes ne peuvent pas repondre 200, mais elles ne
  // doivent surtout plus repondre 401 : un visiteur peut consulter le
  // catalogue sans compte.
  it('la liste des sauces n exige plus de jeton', async () => {
    const response = await request(app).get('/api/sauces');

    expect(response.status).not.toBe(401);
  });

  it('le detail d une sauce n exige plus de jeton', async () => {
    const response = await request(app).get('/api/sauces/507f1f77bcf86cd799439011');

    expect(response.status).not.toBe(401);
  });
});

describe('Routes inconnues', () => {
  it('renvoie 404 avec un message JSON', async () => {
    const response = await request(app).get('/api/inexistant');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Route introuvable');
  });
});
