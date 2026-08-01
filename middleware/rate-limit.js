const rateLimit = require('express-rate-limit');

/**
 * Limitation de debit sur l'authentification.
 *
 * Sans elle, rien n'empeche d'essayer des mots de passe en boucle : le reste
 * du travail sur la securite ne sert a rien si l'adresse de connexion accepte
 * dix mille tentatives par minute.
 *
 * Le plafond se regle par AUTH_RATE_LIMIT, et la valeur 0 desactive la
 * protection. Les defauts different selon l'environnement pour une raison
 * pratique : la suite de tests cree plusieurs comptes et atteindrait autrement
 * la limite, faisant echouer des tests pour une raison etrangere a ce qu'ils
 * verifient. Relever le plafond hors production garde la protection en place
 * plutot que de l'effacer.
 */
const PLAFONDS_PAR_DEFAUT = { production: 20, test: 0 };

const plafondDeclare = Number.parseInt(process.env.AUTH_RATE_LIMIT, 10);

const plafond = Number.isNaN(plafondDeclare)
  ? (PLAFONDS_PAR_DEFAUT[process.env.NODE_ENV] ?? 500)
  : plafondDeclare;

module.exports.plafond = plafond;

module.exports.authLimiter =
  plafond > 0
    ? rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: plafond,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        message: { message: 'Trop de tentatives. Reessayez dans quelques minutes.' },
      })
    : // Un middleware neutre plutot qu'une condition dans les routes : celles-ci
      // decrivent alors toujours la meme chaine, quel que soit l'environnement.
      (req, res, next) => next();
