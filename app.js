const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet');

const sauceRoutes = require('./routes/sauce');
const userRoutes = require('./routes/user');

// impotation pour utilisation des variables d'environements

const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
  throw result.error
}
console.log(result.parsed);
// connexion a MongoAtlas
mongoose.connect(`mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.pbtvn.mongodb.net/?retryWrites=true&w=majority`,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});
app.use(express.json());
app.use('/images', express.static(path.join(__dirname, 'images')));


app.use(helmet({ crossOriginResourcePolicy: { policy: "same-site" } }));

app.use('/api/auth', userRoutes);
app.use('/api/sauces', sauceRoutes);



module.exports = app;