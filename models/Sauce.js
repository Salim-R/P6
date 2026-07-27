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
    // Les identifiants des votants sont conserves pour garantir un seul vote
    // par utilisateur.
    usersLiked: { type: [String], default: [] },
    usersDisliked: { type: [String], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sauce', sauceSchema);
