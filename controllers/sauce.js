const fs = require("fs");
const Sauce = require('../models/Sauce');

exports.createThing = (req, res, next) => {

  // lecture de l'objet sauce en requête

  const sauceObject = JSON.parse(req.body.sauce);

  // Vérification des champs de formulaire (non vide)

  if (
    sauceObject.name === "" ||
    sauceObject.manufacturer === "" ||
    sauceObject.description === "" ||
    sauceObject.mainPepper === "" ||
    sauceObject.heat === ""
  ) {
    return res.status(400).json({ message: "Form is not well completed" });
  }

  // Vérification des champs de formulaire (type)

  if (
    typeof sauceObject.name !== "string" ||
    typeof sauceObject.manufacturer !== "string" ||
    typeof sauceObject.description !== "string" ||
    typeof sauceObject.mainPepper !== "string" ||
    typeof sauceObject.heat !== "number"
  ) {
    return res.status(400).json({ message: "Form is not well completed" });
  }

  // Construction de l'objet sauce avec image

  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename
      }`,
  });

  // Sauvegarde de l'objet sauce en BDD

  sauce.save()
    .then(() => res.status(201).json({ message: "Item saved !" }))
    .catch((error) => res.status(400).json({ error }));
};

exports.getAllThing = (req, res, next) => {
  Sauce.find()
    .then(things => res.status(200).json(things))
    .catch(error => res.status(400).json({ error }));
};
exports.getOneThing = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => res.status(200).json(sauce))
    .catch(error => res.status(404).json({ error }));
};

exports.modifyThing = (req, res, next) => {
  const thingObject = req.file ?
    {
      ...JSON.parse(req.body.sauce),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
  Sauce.updateOne({ _id: req.params.id }, { ...thingObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet modifié !' }))
    .catch(error => res.status(400).json({ error }));
};

exports.deleteThing = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      const filename = sauce.imageUrl.split('/images/')[1];
      fs.unlink(`images/${filename}`, () => {
        Sauce.deleteOne({ _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet supprimé !' }))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};



exports.likeFicheUser = (req, res, next) => {

  //like = 0 (like = 0 neutre)
  Sauce.findOne({ _id: req.params.id })
    .then((things) => {
      //si le userliked est false et si like ===1

      switch (req.body.likes) {
        case 1:

          if (!things.usersLiked.includes(req.body.userId && req.body.likes === 1)) {
            Sauce.uptadeOne(
              { _id: req.params.id },
              {
                $inc: { likes: +1 },
                $push: { usersLiked: req.body.userId },
              }
            )
              .then(() => res.status(201).json({ message: "stuffCtrl like +1" }))
              .catch((error) => res.status(404).json({ error }));
          }
          // mise a jour objet BDD
          break;

        case -1:

          if (!things.usersDisliked.includes(req.body.userId) && req.body.likes === -1) {
            // like = -1 (dislike)
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { dislikes: +1 },
                $push: (usersDisliked / Request.BODY.userId)
              }
            )
              .then(() => {
                res.status(201).json({ message: "likeFicheUser dislike +1" })
              })
              .catch(() => res.status(404).json({ error }));
          }

          //like = 1 (like +1)
          //like = 0 (dislikes = 0)

          break;

        case 0:
          //like = 0 aprs un -1 oe le met a 0 pas de vte on enleve le dislike
          if (things.usersLiked.includes(req.body.userId)) {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { likes: -1 },
                $pull: { usersLiked: req.body.userId },
              }
            )
              .then(() => res.status(201).json({ message: "likedFicheUser like 0" }))
              .catch(() => res.status(404).json({ error }));
          } if (things.usersDisliked.includes(req.body.userId) && req.body.likes === 0) {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { dislikes: -1 },
                $pull: { usersDisliked: req.body.userId },
              }
            )
              .then(() => res.status(201).json({ message: "likedFicheUser like 0" }))
              .catch(() => res.status(404).json({ error }));
          }
      }
    })
};