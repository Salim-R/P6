const passValid = require("password-validator");

//creation du shema
const passwordShema = new passValid();

// le shema que dois respecter le mdp
passwordShema
    .is().min(5)                                    // Minimum length 8
    .is().max(100)                                  // Maximum length 100
    .has().uppercase()                              // Must have uppercase letters
    .has().lowercase()                              // Must have lowercase letters
    .has().digits(2)                                // Must have at least 2 digits
    .has().not().spaces()                           // Should not have spaces
    .is().not().oneOf(['Passw0rd', 'Password123']); // Blacklist these values

module.exports = (req, res, next) => {
    if (passwordShema.validate(req.body.password)) {
        next()
    } else {
        return res.status(400).json({ error: `le mot de passe n'est pas assez fort ${passwordShema.validate, { list: true }};` })
    }
}