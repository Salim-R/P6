# Piiquante - client Angular 20

Interface du catalogue de sauces : consultation, publication, modification et
votes. Elle consomme l'API du dossier parent.

## Lancer le projet

L'API doit tourner sur `http://localhost:3000` (voir le README à la racine).

```bash
npm install
npm start
```

L'application est servie sur http://localhost:4200

## Stack

- Angular 20, composants **standalone** (plus de NgModule)
- **Signals** pour l'état local et la session
- Nouveau flux de contrôle `@if` / `@for` dans les templates
- Formulaires réactifs **typés** (`NonNullableFormBuilder`)
- `ChangeDetectionStrategy.OnPush` sur tous les composants
- SCSS avec variables CSS, thème clair et sombre
- Aucune librairie de composants : tout le style est écrit à la main

## Structure

```
src/app/
  core/                services, garde, intercepteur, modèles
  layout/              en-tête
  features/auth/       connexion, inscription
  features/sauces/     liste, détail, formulaire, jauge de force
  app.routes.ts        routes en lazy loading
  app.config.ts        providers (routeur, HTTP, intercepteur)
```

## Accès

Le catalogue et le détail d'une sauce sont **consultables sans compte**. Publier,
modifier, supprimer et voter demandent une connexion.

Un compte de démonstration est proposé directement sur l'écran de connexion,
avec un bouton de remplissage automatique :

```
demo@piiquante.fr · Demo1234
```

## Choix techniques

**Chargement différé par route.** Chaque écran est un chunk séparé
(`loadComponent`) : le bundle initial ne contient que la coquille et l'écran
demandé.

**Session dans un signal.** `AuthService` expose `isAuthenticated` et `userId`
en signaux calculés. Les composants les lisent directement, sans souscription à
gérer ni risque de fuite mémoire. La session est conservée en `sessionStorage`
pour survivre à un rechargement de page.

**Intercepteur fonctionnel.** Il ajoute le jeton quand il existe et déconnecte
l'utilisateur si l'API répond 401.

**Garde fonctionnelle.** Elle mémorise la page demandée dans un paramètre
`redirect` et y ramène après connexion.

**Votes.** L'API renvoie les compteurs à jour après chaque vote : l'état local
est reconstruit depuis sa réponse, sans recharger la liste.

**Thème.** Un `effect` synchronise la classe sur `<html>` et le stockage local.
Au premier chargement, la préférence système est respectée.

## Scripts

| Commande | Effet |
|---|---|
| `npm start` | serveur de développement |
| `npm run build` | build de production |
| `npm test` | tests unitaires (Karma) |
