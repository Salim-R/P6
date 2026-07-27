const mongoose = require('mongoose');

const REQUIRED_VARS = ['DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'DB_CLUSTER'];

/**
 * Connexion a MongoDB Atlas.
 * Les variables manquantes sont signalees au demarrage plutot qu'au premier
 * appel a la base : on evite une erreur cryptique en pleine requete.
 */
module.exports = async function connectDatabase() {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missing.join(', ')}. ` +
        'Voir le fichier .env.example.'
    );
  }

  const { DB_USERNAME, DB_PASSWORD, DB_NAME, DB_CLUSTER } = process.env;
  const uri =
    `mongodb+srv://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASSWORD)}` +
    `@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`;

  try {
    await mongoose.connect(uri);
    console.log('Connexion a MongoDB reussie');
  } catch (error) {
    console.error('Connexion a MongoDB echouee :', error.message);
    throw error;
  }
};
