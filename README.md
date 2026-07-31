# API de notation de sauces

API REST Node.js / Express / MongoDB : comptes utilisateurs, catalogue de
sauces avec images, et système de votes limité à une voix par personne.

Le projet vient d'un exercice de ma formation (OpenClassrooms, 2022). Je l'ai
repris en 2026 pour le remettre à niveau : correction de bugs, dont deux failles
d'autorisation, mise à jour des dépendances, réécriture de la logique de vote et
mise en place de tests. Le front-end fourni avec l'énoncé (Angular 13) a été
entièrement reconstruit en **Angular 20**.

- **API** : ce dossier - Node.js, Express, MongoDB
- **Client** : [`frontend/`](./frontend) - Angular 20, voir son README

## Stack

- Node.js 20+, Express 4
- MongoDB avec Mongoose 8
- Authentification JWT, mots de passe hachés avec bcrypt
- Jest et Supertest pour les tests, ESLint pour le lint

## Architecture

```
config/       connexion à la base
routes/       définition des endpoints
controllers/  logique métier
models/       schémas Mongoose
middleware/   authentification, validation, upload
tests/        tests unitaires et d'intégration
```

## Sécurité

- Mots de passe hachés avec bcrypt (10 tours) avant enregistrement
- Jetons JWT valides 24 h, vérifiés par un middleware sur toutes les routes
  `/api/sauces`
- Adresses e-mail stockées sous forme d'empreinte HMAC-SHA256 avec clé secrète.
  C'est une empreinte, pas un chiffrement : elle n'est pas réversible, ce qui
  suffit puisqu'on n'a besoin que de retrouver un compte à la connexion
- Politique de mot de passe imposée côté serveur, avec retour au client des
  règles non respectées
- Connexion et inscription renvoient le même message d'erreur pour un compte
  inexistant et un mot de passe faux, afin de ne pas révéler quelles adresses
  sont enregistrées
- En-têtes HTTP durcis via Helmet
- Upload restreint aux images jpg, png et webp, limité à 2 Mo, avec noms de
  fichiers assainis
- Secrets sortis du code dans un `.env`, vérifiés au démarrage

## Ce que la reprise de 2026 a corrigé

**Deux failles d'autorisation**

- La modification d'une sauce comparait `sauce.userId` avec lui-même : la
  condition était toujours vraie, donc n'importe quel compte authentifié pouvait
  modifier la sauce d'un autre. Le contrôle se fait maintenant contre l'identité
  du jeton.
- La mise à jour recopiait le corps de la requête sans filtrage, ce qui
  permettait de se déclarer propriétaire d'une sauce ou de falsifier les
  compteurs de votes. Ces champs sont désormais retirés côté serveur.

**Le système de votes, réécrit**

L'ancienne version n'attendait pas ses appels à la base, ne répondait pas du
tout dans certains cas (la requête restait en attente jusqu'au timeout) et
pouvait envoyer deux réponses pour un même appel. Elle se fiait également à
l'identifiant transmis dans le corps de la requête, donc à une identité fournie
par le client.

Les compteurs sont maintenant recalculés depuis la longueur des tableaux de
votants au lieu d'être incrémentés : l'opération devient idempotente et un
compteur désynchronisé se corrige de lui-même au vote suivant.

**Autres corrections**

- Deux blocs `catch` référençaient une variable inexistante : la réponse
  d'erreur levait elle-même une exception
- Le port par défaut était `process.env.PORT || process.env.PORT`, donc
  `undefined` sans variable d'environnement
- Le middleware d'authentification renvoyait `new Error(...)` dans du JSON, ce
  qui arrive côté client comme un objet vide
- Le message d'erreur du validateur de mot de passe était mal construit et
  affichait `[object Object]`
- Un corps de requête sans e-mail faisait tomber le serveur en 500
- Les fichiers d'un type non prévu étaient enregistrés avec une extension
  `undefined`

**Modernisation**

- Mongoose 6 → 8, jsonwebtoken 8 → 9, bcrypt 5 → 6, Helmet 5 → 8,
  multer 1 → 2, crypto-js → 4.2 (correctif de sécurité)
- `mongoose-unique-validator` retiré, non maintenu et incompatible avec
  Mongoose 8 : les conflits d'unicité sont traités via le code d'erreur 11000
- CORS géré par le paquet `cors` au lieu d'en-têtes écrits à la main
- Gestionnaire d'erreurs central et réponse 404 en JSON
- Connexion à la base déplacée dans `server.js`, ce qui rend l'app testable
  sans ouvrir de connexion réseau
- Nommage repris (`getAllThing`, `stuffCtrl`, `likeFicheUser` étaient des restes
  du tutoriel)

## Le client, reconstruit en Angular 20

Le front-end fourni avec l'énoncé était en Angular 13 (fin de support, plus
aucun correctif de sécurité). Plutôt qu'enchaîner sept montées de version, je
l'ai reconstruit sur des bases actuelles : l'application ne comptait que six
écrans, la réécriture était plus rapide et plus propre qu'une migration.

- Composants **standalone**, plus aucun NgModule
- **Signals** pour la session et l'état local, à la place des BehaviorSubject
- Nouveau flux de contrôle `@if` / `@for`
- Formulaires réactifs **typés**, sans assertions non nulles
- Garde et intercepteur **fonctionnels** (le style classe est déprécié)
- Chargement différé par route
- `OnPush` sur tous les composants
- Thème clair et sombre, style écrit à la main, sans librairie de composants

**Effet sur le bundle initial : 3,87 Mo → 287 Ko** (81 Ko transférés), chaque
écran étant désormais un chunk chargé à la demande.

Détail des choix dans le [README du client](./frontend).

## Endpoints

La **lecture est publique** : un visiteur peut parcourir le catalogue sans
compte. Contribuer exige un en-tête `Authorization: Bearer <jwt>`.

| Méthode | Route | Accès | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | public | Création de compte |
| POST | `/api/auth/login` | public | Connexion, renvoie un JWT valable 24 h |
| GET | `/api/sauces` | **public** | Liste des sauces |
| GET | `/api/sauces/:id` | **public** | Détail d'une sauce |
| POST | `/api/sauces` | authentifié | Création, avec image |
| PUT | `/api/sauces/:id` | propriétaire | Modification |
| DELETE | `/api/sauces/:id` | propriétaire | Suppression |
| POST | `/api/sauces/:id/like` | authentifié | Vote : `1`, `-1` ou `0` pour annuler |

*Toutes les routes étaient protégées à l'origine, y compris les lectures :
personne ne pouvait rien voir sans créer un compte au préalable.*

## Installation

```bash
git clone https://github.com/Salim-R/Next-Shop.git
cd Next-Shop
npm install
cp .env.example .env   # puis renseigner les valeurs
npm run dev
```

L'API démarre sur http://localhost:3000. Les variables d'environnement sont
vérifiées au lancement : si l'une manque, le serveur s'arrête en indiquant
laquelle.

## Scripts

| Commande | Effet |
|---|---|
| `npm run dev` | démarrage avec rechargement automatique |
| `npm start` | démarrage en production |
| `npm test` | tests Jest |
| `npm run lint` | ESLint |

## Remplir la base

Une base vide donne un catalogue vide. Un script crée le compte de
démonstration et un catalogue de huit sauces :

```bash
npm run seed
```

```
npm run seed -- --reset   # vide d'abord les sauces du compte de démo
```

Le script est idempotent : le relancer n'ajoute pas de doublons.

## Compte de démonstration

Il est créé par `npm run seed`, et proposé directement sur l'écran de connexion
du client avec un bouton de remplissage automatique :

```
demo@piiquante.fr · Demo1234
```

## Tests

15 tests couvrent le middleware d'authentification (jeton manquant, mal formé,
invalide, expiré), l'accès public en lecture, la validation des e-mails et des
mots de passe, et la réponse 404. Ils tournent sans base de données.

```bash
npm test
```

---

Réalisé par Salim Rhamoumi - développeur web full-stack JavaScript
[salimrhamoumi.com](https://www.salimrhamoumi.com/)
