process.env.NODE_ENV = 'test';
process.env.JWT_KEY_TOKEN = 'cle-de-test-uniquement';

const jwt = require('jsonwebtoken');
const request = require('supertest');
const app = require('../app');

describe('Middleware auth', () => {
  it('refuse une requete sans en-tete Authorization', async () => {
    const response = await request(app).get('/api/sauces');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton manquant');
  });

  it('refuse un en-tete mal forme', async () => {
    const response = await request(app)
      .get('/api/sauces')
      .set('Authorization', 'jeton-sans-prefixe-bearer');

    expect(response.status).toBe(401);
  });

  it('refuse un jeton invalide', async () => {
    const response = await request(app)
      .get('/api/sauces')
      .set('Authorization', 'Bearer jeton.non.valide');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton invalide');
  });

  it('distingue un jeton expire d un jeton invalide', async () => {
    const expire = jwt.sign({ userId: 'abc' }, process.env.JWT_KEY_TOKEN, {
      expiresIn: '-1s',
    });

    const response = await request(app)
      .get('/api/sauces')
      .set('Authorization', `Bearer ${expire}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Jeton expire');
  });
});

describe('Routes inconnues', () => {
  it('renvoie 404 avec un message JSON', async () => {
    const response = await request(app).get('/api/inexistant');

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Route introuvable');
  });
});
