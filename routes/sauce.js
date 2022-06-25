const express = require('express');
const router = express.Router();
const multer = require('../middleware/multer-config');
const auth = require('../middleware/auth');

const stuffCtrl = require('../controllers/sauce');


// Les différentes routes avec les middlewares de gestion d'images et d'auth

router.get('/', auth, stuffCtrl.getAllThing);
router.post('/', auth, multer, stuffCtrl.createThing);
router.get('/:id', auth, stuffCtrl.getOneThing);
router.put('/:id', auth, multer, stuffCtrl.modifyThing);
router.delete('/:id', auth, stuffCtrl.deleteThing);
router.post("/:id/like", auth, stuffCtrl.likeFicheUser);

module.exports = router;