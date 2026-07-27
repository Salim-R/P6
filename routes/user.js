const express = require('express');

const controlEmail = require('../middleware/controlEmail');
const checkPassword = require('../middleware/password');
const userCtrl = require('../controllers/user');

const router = express.Router();

// L'e-mail et la robustesse du mot de passe sont valides avant d'atteindre
// le controleur.
router.post('/signup', controlEmail, checkPassword, userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;
