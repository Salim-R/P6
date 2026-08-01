const express = require('express');

const controlEmail = require('../middleware/controlEmail');
const checkPassword = require('../middleware/password');
const { authLimiter } = require('../middleware/rate-limit');
const userCtrl = require('../controllers/user');

const router = express.Router();

// L'e-mail et la robustesse du mot de passe sont valides avant d'atteindre
// le controleur. La limitation de debit vient en premier : refuser une
// tentative de trop ne doit pas couter une lecture en base.
router.post('/signup', authLimiter, controlEmail, checkPassword, userCtrl.signup);
router.post('/login', authLimiter, userCtrl.login);

module.exports = router;
