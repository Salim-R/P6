const mongoose = require('mongoose');

const sauceSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    manufacturer: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    mainPepper: { type: String, required: true, trim: true },
    imageUrl: { type: String, required: true },
    heat: { type: Number, required: true, min: 1, max: 10 },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
    // Les identifiants des votants sont conserves pour savoir qui a vote quoi.
    //
    // Un tableau ne garantit rien par lui-meme : l'unicite du vote vient de
    // rateSauce, qui retire l'utilisateur des deux listes avant d'appliquer
    // son choix, puis recalcule les compteurs depuis leur longueur. C'est donc
    // une garantie applicative, pas une contrainte de la base : deux ecritures
    // concurrentes sur le meme document pourraient la contourner. Un modele
    // relationnel reglerait cela par une cle primaire composite.
    usersLiked: { type: [String], default: [] },
    usersDisliked: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sauce', sauceSchema);
