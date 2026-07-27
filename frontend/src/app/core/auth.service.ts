import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

import { API_URL } from './api.config';

interface LoginResponse {
  userId: string;
  token: string;
}

const STORAGE_KEY = 'piiquante.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  /**
   * La session est un signal : les composants s'y abonnent sans souscription
   * manuelle et sans risque de fuite. L'ancienne version exposait un
   * BehaviorSubject, ce qui obligeait chaque composant à gérer son pipe.
   */
  private readonly session = signal<LoginResponse | null>(this.restore());

  readonly isAuthenticated = computed(() => this.session() !== null);
  readonly userId = computed(() => this.session()?.userId ?? '');

  get token(): string {
    return this.session()?.token ?? '';
  }

  signup(email: string, password: string) {
    return this.http.post<{ message: string }>(`${API_URL}/auth/signup`, { email, password });
  }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/auth/login`, { email, password }).pipe(
      tap((response) => {
        this.session.set(response);
        // La session survit à un rechargement de page : sans cela, l'ancienne
        // version déconnectait l'utilisateur à chaque F5.
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(response));
      }),
    );
  }

  logout(): void {
    this.session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    void this.router.navigate(['/login']);
  }

  private restore(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}
