const mongoose = require('mongoose');

const REQUIRED_VARS = ['DB_USERNAME', 'DB_PASSWORD', 'DB_NAME', 'DB_CLUSTER'];

/**
 * Construit l'URI de connexion.
 *
 * Deux modes :
 * 1. MONGODB_URI fournie -> elle est utilisee telle quelle. Utile quand le
 *    reseau ne resout pas les enregistrements DNS SRV (erreur querySrv
 *    EREFUSED) : Atlas propose alors une chaine classique mongodb:// listant
 *    les hotes du replica set.
 * 2. Sinon, l'URI est assemblee depuis les variables separees, chacune etant
 *    verifiee au demarrage.
 */
function buildUri() {
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }

  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Variables d'environnement manquantes : ${missing.join(', ')}. ` +
        'Renseignez-les ou fournissez MONGODB_URI. Voir le fichier .env.example.'
    );
  }

  const { DB_USERNAME, DB_PASSWORD, DB_NAME, DB_CLUSTER } = process.env;

  return (
    `mongodb+srv://${encodeURIComponent(DB_USERNAME)}:${encodeURIComponent(DB_PASSWORD)}` +
    `@${DB_CLUSTER}/${DB_NAME}?retryWrites=true&w=majority`
  );
}

module.exports = async function connectDatabase() {
  const uri = buildUri();

  try {
    await mongoose.connect(uri, { dbName: process.env.DB_NAME });
    console.log('Connexion a MongoDB reussie');
  } catch (error) {
    console.error('Connexion a MongoDB echouee :', error.message);

    if (error.message.includes('querySrv')) {
      console.error(
        "Piste : votre reseau ne resout pas les enregistrements DNS SRV. " +
          "Sur Atlas, desactivez 'SRV Connection String' pour obtenir une chaine " +
          'mongodb:// classique, et placez-la dans MONGODB_URI.'
      );
    }

    throw error;
  }
};
