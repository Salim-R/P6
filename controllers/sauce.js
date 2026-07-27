const fs = require('fs/promises');
const path = require('path');
const Sauce = require('../models/Sauce');

/** Construit l'URL publique d'une image uploadee. */
const buildImageUrl = (req, filename) =>
  `${req.protocol}://${req.get('host')}/images/${filename}`;

/**
 * Supprime le fichier image associe a une sauce.
 * Un fichier deja absent n'est pas une erreur : le but est qu'il ne soit plus la.
 */
const removeImage = async (imageUrl) => {
  if (!imageUrl) return;

  const filename = imageUrl.split('/images/')[1];
  if (!filename) return;

  try {
    await fs.unlink(path.join('images', path.basename(filename)));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error("Suppression de l'image impossible :", error.message);
    }
  }
};

/** POST /api/sauces */
exports.createSauce = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Une image est requise' });
    }

    let sauceObject;
    try {
      sauceObject = JSON.parse(req.body.sauce);
    } catch {
      await removeImage(buildImageUrl(req, req.file.filename));
      return res.status(400).json({ message: 'Champ sauce invalide (JSON attendu)' });
    }

    // Le client ne choisit ni l'identifiant de la sauce ni son proprietaire :
    // l'auteur vient du jeton verifie par le middleware auth.
    delete sauceObject._id;
    delete sauceObject._userId;
    delete sauceObject.userId;

    const sauce = new Sauce({
      ...sauceObject,
      userId: req.auth.userId,
      likes: 0,
      dislikes: 0,
      usersLiked: [],
      usersDisliked: [],
      imageUrl: buildImageUrl(req, req.file.filename),
    });

    await sauce.save();
    return res.status(201).json({ message: 'Sauce enregistree', sauce });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};

/** GET /api/sauces */
exports.getAllSauces = async (req, res, next) => {
  try {
    const sauces = await Sauce.find();
    return res.status(200).json(sauces);
  } catch (error) {
    // Le bloc catch renvoyait une variable "error" inexistante (le parametre
    // s'appelait "err") : la reponse d'erreur levait elle-meme une exception.
    return next(error);
  }
};

/** GET /api/sauces/:id */
exports.getOneSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findById(req.params.id);

    if (!sauce) {
      return res.status(404).json({ message: 'Sauce introuvable' });
    }
    return res.status(200).json(sauce);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    return next(error);
  }
};

/** PUT /api/sauces/:id */
exports.modifySauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findById(req.params.id);

    if (!sauce) {
      return res.status(404).json({ message: 'Sauce introuvable' });
    }

    // Le controle d'origine comparait sauce.userId avec lui-meme : la condition
    // etait toujours vraie et n'importe quel compte authentifie pouvait
    // modifier la sauce d'un autre.
    if (sauce.userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Modification non autorisee' });
    }

    let donnees;
    if (req.file) {
      try {
        donnees = JSON.parse(req.body.sauce);
      } catch {
        return res.status(400).json({ message: 'Champ sauce invalide (JSON attendu)' });
      }
      donnees.imageUrl = buildImageUrl(req, req.file.filename);
    } else {
      donnees = { ...req.body };
    }

    // Ces champs ne sont jamais modifiables par le client, sinon il pourrait
    // se declarer proprietaire d'une sauce ou falsifier les compteurs.
    delete donnees._id;
    delete donnees._userId;
    delete donnees.userId;
    delete donnees.likes;
    delete donnees.dislikes;
    delete donnees.usersLiked;
    delete donnees.usersDisliked;

    const ancienneImage = sauce.imageUrl;

    await Sauce.updateOne({ _id: req.params.id }, { $set: donnees });

    // L'ancienne image n'est supprimee qu'apres une mise a jour reussie, pour
    // ne pas perdre le fichier si l'ecriture echoue.
    if (req.file) {
      await removeImage(ancienneImage);
    }

    return res.status(200).json({ message: 'Sauce modifiee' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    return next(error);
  }
};

/** DELETE /api/sauces/:id */
exports.deleteSauce = async (req, res, next) => {
  try {
    const sauce = await Sauce.findById(req.params.id);

    if (!sauce) {
      return res.status(404).json({ message: 'Sauce introuvable' });
    }

    if (sauce.userId !== req.auth.userId) {
      return res.status(403).json({ message: 'Suppression non autorisee' });
    }

    await Sauce.deleteOne({ _id: req.params.id });
    await removeImage(sauce.imageUrl);

    return res.status(200).json({ message: 'Sauce supprimee' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    return next(error);
  }
};

/**
 * POST /api/sauces/:id/like
 * like = 1 (j'aime), -1 (je n'aime pas), 0 (j'annule mon vote)
 *
 * Reecriture complete : la version d'origine n'attendait pas ses updateOne,
 * ne repondait pas du tout dans certains cas (requete en attente jusqu'au
 * timeout) et pouvait envoyer deux reponses pour un meme appel. Elle se fiait
 * aussi a req.body.userId, donc a une identite fournie par le client.
 *
 * Les compteurs sont recalcules depuis la longueur des tableaux plutot
 * qu'incrementes : l'operation devient idempotente et un compteur desynchronise
 * se corrige de lui-meme au vote suivant.
 */
exports.rateSauce = async (req, res, next) => {
  try {
    const { like } = req.body;

    if (![1, 0, -1].includes(like)) {
      return res.status(400).json({ message: 'La valeur like doit etre 1, 0 ou -1' });
    }

    const sauce = await Sauce.findById(req.params.id);

    if (!sauce) {
      return res.status(404).json({ message: 'Sauce introuvable' });
    }

    const { userId } = req.auth;

    // On repart d'un etat sans vote de cet utilisateur, puis on applique le
    // vote demande. Un changement d'avis est ainsi gere sans cas particulier.
    const usersLiked = sauce.usersLiked.filter((id) => id !== userId);
    const usersDisliked = sauce.usersDisliked.filter((id) => id !== userId);

    if (like === 1) {
      usersLiked.push(userId);
    } else if (like === -1) {
      usersDisliked.push(userId);
    }

    await Sauce.updateOne(
      { _id: req.params.id },
      {
        $set: {
          usersLiked,
          usersDisliked,
          likes: usersLiked.length,
          dislikes: usersDisliked.length,
        },
      }
    );

    return res.status(200).json({
      message: 'Vote enregistre',
      likes: usersLiked.length,
      dislikes: usersDisliked.length,
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Identifiant invalide' });
    }
    return next(error);
  }
};
