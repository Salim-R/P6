const jwt = require('jsonwebtoken');

/**
 * Verifie le jeton JWT presente dans l'en-tete Authorization et expose
 * l'identifiant de l'utilisateur sur req.auth.
 *
 * L'identite vient uniquement du jeton : le corps de la requete n'est jamais
 * une source de confiance pour savoir qui agit.
 */
module.exports = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Jeton manquant' });
  }

  const token = header.split(' ')[1];

  try {
    const { userId } = jwt.verify(token, process.env.JWT_KEY_TOKEN);
    req.auth = { userId };
    return next();
  } catch (error) {
    // jwt.verify distingue le jeton expire du jeton invalide : l'action a mener
    // n'est pas la meme cote client.
    const message =
      error.name === 'TokenExpiredError' ? 'Jeton expire' : 'Jeton invalide';

    return res.status(401).json({ message });
  }
};
