const fs = require("fs");
const Sauce = require('../models/Sauce');

// création d'une sauce
exports.createThing = (req, res, next) => {

  // lecture de l'objet sauce en requête
  const sauceObject = JSON.parse(req.body.sauce);
  // suppression du champ_userId de la requête envoyée par le client(rien ne l’empêcherait de nous passer le userId d’une autre personne). 
  delete sauceObject._id;
  delete sauceObject._userId;
  // Construction de l'objet sauce avec image

  const sauce = new Sauce({
    ...sauceObject,
    likes: 0,
    dislikes: 0,
    imageUrl: `${req.protocol}://${req.get("host")}/images/${req.file.filename
      }`,
  });

  // Sauvegarde de l'objet sauce dans la BDD

  sauce.save()
    .then(() => res.status(201).json({ message: "Item saved !" }))
    .catch((error) => res.status(400).json({ error }));
};
// Affichage de toutes les sauces

//méthode ECMASCRIPT 2015
// exports.getAllThing = (req, res, next) => {
//   Sauce.find()
//     .then(things => res.status(200).json(things))
//     .catch(error => res.status(400).json({ error }));
// }; 

//méthode ECMASCRIPT 2017
exports.getAllThing = async (req, res, next) => {
  try {
    const sauce = await Sauce.find();
    res.status(200).json(sauce)
  } catch (err) {
    res.status(500).json({ error });
  }
};

// Affichage d'une seul sauce
//méthode ECMASCRIPT 2015
// exports.getOneThing = (req, res, next) => {
//   Sauce.findOne({ _id: req.params.id })
//     .then(sauce => res.status(200).json(sauce))
//     .catch(error => res.status(404).json({ error }));
// };
//méthode ECMASCRIPT 2017
exports.getOneThing = async (req, res, next) => {
  try {
    const sauce = await Sauce.findById({ _id: req.params.id }).exec();
    res.status(200).json(sauce)
  } catch (err) {
    res.status(500).json({ error });
  }
};
// Modification d'une sauce
exports.modifyThing = (req, res, next) => {

  Sauce.findOne({ _id: req.params.id })
    .then((sauce) => {
      if (sauce.userId === sauce.userId) {

        if (req.file) {
          Sauce
            .findOne({ _id: req.params.id })
            .then((sauce) => {
              console.log(sauce);

              //récup du nom de la photo a supprimmer
              const filename = sauce.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, (error) => {
                if (error) throw error;
              })
            })
            .catch(error => res.status(404).json({ error }));
        } else {
          console.log("FALSE");
        }
        // l'objet qui va etre maj dans la bdd

        const sauceObject = req.file ? {
          ...JSON.parse(req.body.sauce),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body }; //<= sinon

        //modification qui seront envoyé dans la bdd
        Sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
          .then(() => res.status(200).json({ message: 'Objet modifié!', contenu: sauceObject, }))
          .catch(error => res.status(404).json({ error }));
      } else {
        console.log("UserId différent de userId dans l'objet non-autorisé")
      }

    })
    .catch(error => res.status(403).json({ error }));
}



//Suppression d'une sauce
exports.deleteThing = (req, res, next) => {
  Sauce.findOne({ _id: req.params.id })
    .then(sauce => {
      if (sauce.userId != req.auth.userId) {
        res.status(401).json({ message: 'Not authorized' });
      } else {
        const filename = sauce.imageUrl.split('/images/')[1];
        fs.unlink(`images/${filename}`, () => {
          Sauce.deleteOne({ _id: req.params.id })
            .then(() => { res.status(200).json({ message: 'Objet supprimé !' }) })
            .catch(error => res.status(401).json({ error }));
        });
      }
    })
    .catch(error => {
      res.status(500).json({ error });
    });
};

// Gestion like / Dislike
exports.likeFicheUser = async (req, res, next) => {
  const sauce = await Sauce.findById(req.params.id);
  Sauce.findOne({ _id: req.params.id })
  try {
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
  }
  catch (err) {
    res.status(400).json({ err });
  }
};
