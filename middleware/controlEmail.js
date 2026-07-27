const validator = require('validator');

/**
 * Verifie le format de l'adresse e-mail avant creation de compte.
 *
 * validator.isEmail leve une exception si la valeur n'est pas une chaine :
 * on verifie donc le type avant, sinon un corps de requete vide fait tomber
 * le serveur en 500.
 */
module.exports = (req, res, next) => {
  const { email } = req.body;

  if (typeof email !== 'string' || email.length === 0) {
    return res.status(400).json({ message: "L'adresse e-mail est requise" });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "L'adresse e-mail n'est pas valide" });
  }

  return next();
};
