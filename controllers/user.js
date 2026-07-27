const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const CryptoJS = require('crypto-js');
const User = require('../models/User');

const SALT_ROUNDS = 10;
const DUREE_TOKEN = '24h';

/**
 * Les adresses e-mail ne sont pas stockees en clair : on conserve un HMAC-SHA256
 * calcule avec une cle secrete. C'est une empreinte, pas un chiffrement, elle
 * n'est donc pas reversible. Cela suffit ici : la seule operation necessaire est
 * de retrouver un compte a la connexion en comparant les empreintes.
 */
const hashEmail = (email) =>
  CryptoJS.HmacSHA256(email, process.env.CRYPTOJS_EMAIL).toString();

/** POST /api/auth/signup */
exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await User.create({
      email: hashEmail(email),
      password: hashedPassword,
    });

    return res.status(201).json({ message: 'Utilisateur cree' });
  } catch (error) {
    // 11000 = violation d'index unique. Remplace le plugin
    // mongoose-unique-validator, retire car non maintenu.
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Ce compte existe deja' });
    }
    return next(error);
  }
};

/** POST /api/auth/login */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'E-mail et mot de passe requis' });
    }

    const user = await User.findOne({ email: hashEmail(email) });

    // Meme reponse pour un compte inexistant et un mot de passe faux : sinon
    // l'API permet de decouvrir quelles adresses sont enregistrees.
    if (!user) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    const valide = await bcrypt.compare(password, user.password);

    if (!valide) {
      return res.status(401).json({ message: 'Identifiants incorrects' });
    }

    return res.status(200).json({
      userId: user._id,
      token: jwt.sign({ userId: user._id }, process.env.JWT_KEY_TOKEN, {
        expiresIn: DUREE_TOKEN,
      }),
    });
  } catch (error) {
    return next(error);
  }
};
