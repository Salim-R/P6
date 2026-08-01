require('dotenv').config();

const path = require('path');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');

const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

// app.js ne fait que decrire l'application Express.
// La connexion a la base et le demarrage du serveur sont dans server.js,
// ce qui permet de tester l'app sans ouvrir de connexion reseau.
const app = express();

// Derriere un hebergeur, l'adresse reelle du client arrive dans
// X-Forwarded-For. Sans cette option, la limitation de debit voit toutes les
// requetes venir du proxy et compte donc tous les visiteurs comme un seul.
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors());
app.use(express.json());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Les images uploadees sont servies en statique.
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);

// Route inconnue.
app.use((req, res) => {
  res.status(404).json({ message: 'Route introuvable' });
});

// Gestionnaire d'erreurs central : toute erreur passee a next() arrive ici.
// Express identifie ce middleware par sa signature a quatre arguments, le
// parametre next doit donc rester present meme s'il n'est pas utilise.
app.use((error, req, res, next) => {
  const status = error.status || 500;

  if (status === 500) {
    console.error(error);
  }

  res.status(status).json({
    message: status === 500 ? 'Erreur serveur' : error.message,
  });
});

module.exports = app;
