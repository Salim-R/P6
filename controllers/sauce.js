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

  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      //like =1 (like = +1)

      //mise en place d'un switch case()
      switch (req.body.like) {

        case 1:
          //si le userliked est false et si like ===1
          if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {

            Sauce.updateOne(
              { _id: req.params.id },
              {
                $push: { usersLiked: req.body.userId },
                $inc: { likes: +1 }

              }
            )
              .then(() => res.status(201).json({ message: "usersLiked like +1" }))
              .catch((error) => res.status(400).json({ error }));

          }
          break;

        case -1:
          // like = -1 (dislike = +1)
          if (!sauce.usersDisliked.includes(req.body.userId) && req.body.like === -1) {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { dislikes: +1 },
                $push: { usersDisliked: req.body.userId }


              }
            )
              .then(() => res.status(201).json({ message: "usersLiked like 0" }))
              .catch((error) => res.status(400).json({ error }));
          }
          break;

        case 0:
          //like = 0 (likes = 0 pas de vote)
          if (sauce.usersLiked.includes(req.body.userId)) {

            Sauce.updateOne(
              { _id: req.params.id },
              {
                $pull: { usersLiked: req.body.userId },
                $inc: { likes: -1 }

              }
            )
              .then(() => res.status(201).json({ message: "usersLiked like 0" }))
              .catch((error) => res.status(400).json({ error }));

          }


          // like a 0 apres un like -1
          if (sauce.usersDisliked.includes(req.body.userId)) {
            Sauce.updateOne(
              { _id: req.params.id },
              {
                $inc: { dislikes: -1 },
                $pull: { usersDisliked: req.body.userId }
              }
            )
              .then(() => res.status(201).json({ message: "usersLiked like 0" }))
              .catch((error) => res.status(400).json({ error }));
          }
          break;
      };
    })
};
