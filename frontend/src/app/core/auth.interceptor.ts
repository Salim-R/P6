import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';

/**
 * Intercepteur fonctionnel (le style classe est déprécié depuis Angular 15).
 *
 * Ajoute le jeton aux requêtes API et déconnecte l'utilisateur si l'API répond
 * 401 : l'ancienne version envoyait un en-tête « Bearer  » vide même sans
 * session, et laissait l'utilisateur sur une page vide en cas de jeton expiré.
 */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const token = auth.token;

  const authorized = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && auth.isAuthenticated()) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};
