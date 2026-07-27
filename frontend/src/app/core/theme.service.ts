import { Injectable, effect, signal } from '@angular/core';

type Theme = 'dark' | 'light';
const STORAGE_KEY = 'piiquante.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initial());

  constructor() {
    // L'effect synchronise la classe sur <html> et le stockage à chaque
    // changement : aucun appel manuel à faire depuis les composants.
    effect(() => {
      const theme = this.theme();
      document.documentElement.classList.toggle('light', theme === 'light');
      localStorage.setItem(STORAGE_KEY, theme);
    });
  }

  toggle(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  private initial(): Theme {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // À défaut de choix enregistré, on suit la préférence du système.
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
}
