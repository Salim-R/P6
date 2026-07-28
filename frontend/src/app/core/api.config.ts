/** Base de l'API. Centralisée ici plutôt que répétée dans chaque service. */
export const API_URL = 'http://localhost:3000/api';

/**
 * Compte de démonstration proposé sur l'écran de connexion.
 * Ces identifiants sont publics par choix : ils servent à essayer les
 * fonctions protégées sans créer de compte. Le compte doit être créé une fois
 * en base après le déploiement.
 */
export const DEMO_ACCOUNT = {
  email: 'demo@piiquante.fr',
  password: 'Demo1234',
} as const;
