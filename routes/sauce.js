const express = require('express');

const auth = require('../middleware/auth');
const upload = require('../middleware/multer-config');
const sauceCtrl = require('../controllers/sauce');

const router = express.Router();

// Lecture publique : un visiteur peut parcourir le catalogue sans compte.
// Auparavant tout etait protege, y compris les GET : personne ne pouvait voir
// quoi que ce soit sans s'inscrire.
router.get('/', sauceCtrl.getAllSauces);
router.get('/:id', sauceCtrl.getOneSauce);

// Contribuer exige en revanche un jeton valide.
router.post('/', auth, upload, sauceCtrl.createSauce);
router.put('/:id', auth, upload, sauceCtrl.modifySauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.rateSauce);

module.exports = router;
