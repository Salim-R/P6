const PasswordValidator = require('password-validator');

const REGLES_LISIBLES = {
  min: 'au moins 8 caracteres',
  max: 'au maximum 100 caracteres',
  uppercase: 'au moins une majuscule',
  lowercase: 'au moins une minuscule',
  digits: 'au moins 2 chiffres',
  spaces: 'aucun espace',
  oneOf: 'un mot de passe moins courant',
};

const schema = new PasswordValidator();

schema
  .is()
  .min(8)
  .is()
  .max(100)
  .has()
  .uppercase()
  .has()
  .lowercase()
  .has()
  .digits(2)
  .has()
  .not()
  .spaces()
  .is()
  .not()
  .oneOf(['Passw0rd', 'Password123']);

/**
 * Verifie la robustesse du mot de passe avant creation de compte et renvoie
 * la liste des regles non respectees.
 */
module.exports = (req, res, next) => {
  const { password } = req.body;

  if (typeof password !== 'string' || password.length === 0) {
    return res.status(400).json({ message: 'Le mot de passe est requis' });
  }

  // L'option list renvoie les noms des regles echouees, ce qui permet de dire
  // au client ce qui manque au lieu d'un simple "mot de passe trop faible".
  const echecs = schema.validate(password, { list: true });

  if (echecs.length > 0) {
    return res.status(400).json({
      message: 'Le mot de passe ne respecte pas les regles de securite',
      manquant: echecs.map((regle) => REGLES_LISIBLES[regle] || regle),
    });
  }

  return next();
};
