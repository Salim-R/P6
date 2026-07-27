const mongoose = require('mongoose');

// Le champ email contient un hash HMAC-SHA256, jamais l'adresse en clair.
// L'unicite est assuree par l'index MongoDB : le plugin
// mongoose-unique-validator a ete retire, il n'est plus maintenu et n'est pas
// compatible avec Mongoose 8. Le conflit est traite dans le controleur via le
// code d'erreur 11000.
const userSchema = mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
