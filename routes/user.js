const express = require('express');
const router = express.Router();
const password = require("../middleware/password");
const controlEmail = require("../middleware/controlEmail");
const userCtrl = require('../controllers/user');

// Les différentes routes avec les middlewares de controle d'email et password avec validator et password-validator
router.post('/signup', controlEmail, password, userCtrl.signup);
router.post('/login', userCtrl.login);

module.exports = router;