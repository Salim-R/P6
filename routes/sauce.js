const express = require('express');

const auth = require('../middleware/auth');
const upload = require('../middleware/multer-config');
const sauceCtrl = require('../controllers/sauce');

const router = express.Router();

// Toutes les routes sauces exigent un jeton valide.
router.get('/', auth, sauceCtrl.getAllSauces);
router.post('/', auth, upload, sauceCtrl.createSauce);
router.get('/:id', auth, sauceCtrl.getOneSauce);
router.put('/:id', auth, upload, sauceCtrl.modifySauce);
router.delete('/:id', auth, sauceCtrl.deleteSauce);
router.post('/:id/like', auth, sauceCtrl.rateSauce);

module.exports = router;
