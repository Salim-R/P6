# API de notation de sauces — projet OpenClassrooms (P6)

API REST développée pendant ma formation de développeur web (OpenClassrooms,
projet 6 « Piiquante »). L'exercice consistait à construire le back-end d'une
application de notation de sauces piquantes, avec un accent particulier sur la
sécurité de l'authentification et des données.

Le front-end (dossier `frontend/`, en Angular) était fourni par l'école. Mon
travail porte sur l'API.

## Stack

- Node.js et Express
- MongoDB avec Mongoose
- Architecture MVC : `routes/`, `controllers/`, `models/`, `middleware/`

## Ce que j'ai mis en place

**Authentification**

- Mots de passe hachés avec bcrypt avant enregistrement
- Jetons JWT signés, valides 24h, vérifiés par un middleware `auth` sur
  l'ensemble des routes sauces
- Adresses e-mail hachées avec HMAC-SHA256 (crypto-js) et une clé en variable
  d'environnement : la base ne contient aucun e-mail en clair, la comparaison
  à la connexion se fait sur le hash

**Validation et durcissement**

- Politique de mot de passe imposée côté serveur (`middleware/password.js`)
- Contrôle du format des e-mails (`middleware/controlEmail.js`) et unicité en
  base via mongoose-unique-validator
- En-têtes HTTP sécurisés avec Helmet
- Secrets sortis du code dans un `.env` (dotenv)
- Upload limité aux images jpg, jpeg et png par un dictionnaire de types MIME,
  fichiers renommés avec un horodatage (multer)

**Fonctionnel**

- CRUD complet sur les sauces
- Likes et dislikes avec une règle d'un seul vote par utilisateur : les
  identifiants sont stockés dans `usersLiked` / `usersDisliked` et vérifiés
  avant chaque incrément
- Journalisation des requêtes avec morgan

## Endpoints

Toutes les routes `/api/sauces` exigent un JWT valide.

```
POST   /api/auth/signup       création de compte
POST   /api/auth/login        connexion, renvoie un JWT (24h)

GET    /api/sauces            liste des sauces
GET    /api/sauces/:id        détail d'une sauce
POST   /api/sauces            création, avec image
PUT    /api/sauces/:id        modification, image optionnelle
DELETE /api/sauces/:id        suppression
POST   /api/sauces/:id/like   like (1), dislike (-1) ou annulation (0)
```

## Lancer le projet

```bash
git clone https://github.com/Salim-R/Next-Shop.git
cd Next-Shop
npm install
npm start
```

Un fichier `.env` est nécessaire à la racine :

```
DB_USERNAME=...
DB_PASSWORD=...
DB_NAME=...
JWT_KEY_TOKEN=...
CRYPTOJS_EMAIL=...
```

L'API démarre sur http://localhost:3000

---

Réalisé par Salim Rhamoumi — développeur web
[salimrhamoumi.com](https://www.salimrhamoumi.com/)
