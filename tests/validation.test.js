process.env.NODE_ENV = 'test';

const controlEmail = require('../middleware/controlEmail');
const checkPassword = require('../middleware/password');

/** Fabrique un couple res/next factice pour tester un middleware isole. */
const createContext = () => {
  const res = {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };

  const next = jest.fn();
  return { res, next };
};

describe('Middleware controlEmail', () => {
  it('accepte une adresse valide', () => {
    const { res, next } = createContext();
    controlEmail({ body: { email: 'contact@exemple.fr' } }, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('refuse une adresse mal formee', () => {
    const { res, next } = createContext();
    controlEmail({ body: { email: 'pas-une-adresse' } }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('refuse un corps sans e-mail sans faire tomber le serveur', () => {
    const { res, next } = createContext();
    controlEmail({ body: {} }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});

describe('Middleware password', () => {
  it('accepte un mot de passe conforme', () => {
    const { res, next } = createContext();
    checkPassword({ body: { password: 'MotDePasse12' } }, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('refuse un mot de passe trop court', () => {
    const { res, next } = createContext();
    checkPassword({ body: { password: 'Ab12' } }, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });

  it('refuse un mot de passe sans majuscule ni chiffres', () => {
    const { res, next } = createContext();
    checkPassword({ body: { password: 'motdepassesimple' } }, res, next);

    expect(res.statusCode).toBe(400);
    expect(Array.isArray(res.payload.manquant)).toBe(true);
    expect(res.payload.manquant.length).toBeGreaterThan(0);
  });

  it('refuse un mot de passe contenant un espace', () => {
    const { res, next } = createContext();
    checkPassword({ body: { password: 'Mot De Passe12' } }, res, next);

    expect(res.statusCode).toBe(400);
  });

  it('refuse un corps sans mot de passe', () => {
    const { res, next } = createContext();
    checkPassword({ body: {} }, res, next);

    expect(res.statusCode).toBe(400);
  });
});
