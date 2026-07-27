import { Routes } from '@angular/router';

import { authGuard } from './core/auth.guard';

/**
 * Toutes les pages sont chargées en lazy loading via loadComponent : le bundle
 * initial ne contient que le nécessaire, chaque écran est téléchargé à la
 * demande.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'Connexion · Piiquante',
    loadComponent: () => import('./features/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    title: 'Inscription · Piiquante',
    loadComponent: () => import('./features/auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'sauces',
    title: 'Les sauces · Piiquante',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sauces/sauce-list.component').then((m) => m.SauceListComponent),
  },
  {
    path: 'sauces/nouvelle',
    title: 'Nouvelle sauce · Piiquante',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sauces/sauce-form.component').then((m) => m.SauceFormComponent),
  },
  {
    path: 'sauces/:id',
    title: 'Détail · Piiquante',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sauces/sauce-detail.component').then((m) => m.SauceDetailComponent),
  },
  {
    path: 'sauces/:id/modifier',
    title: 'Modifier · Piiquante',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/sauces/sauce-form.component').then((m) => m.SauceFormComponent),
  },
  { path: '', pathMatch: 'full', redirectTo: 'sauces' },
  { path: '**', redirectTo: 'sauces' },
];
