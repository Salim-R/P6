import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService } from '../core/auth.service';
import { ThemeService } from '../core/theme.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="header">
      <div class="inner">
        <a class="brand" routerLink="/sauces">
          <span class="mark">🌶</span>
          <span class="name">Piiquante</span>
        </a>

        @if (auth.isAuthenticated()) {
          <nav class="nav">
            <a routerLink="/sauces" routerLinkActive="active">Les sauces</a>
            <a routerLink="/sauces/nouvelle" routerLinkActive="active">Ajouter</a>
          </nav>
        }

        <div class="actions">
          <button
            type="button"
            class="icon-btn"
            (click)="theme.toggle()"
            [attr.aria-label]="theme.theme() === 'dark' ? 'Passer en clair' : 'Passer en sombre'"
          >
            {{ theme.theme() === 'dark' ? '☀' : '☾' }}
          </button>

          @if (auth.isAuthenticated()) {
            <button type="button" class="btn btn-ghost" (click)="auth.logout()">Déconnexion</button>
          } @else {
            <a class="btn btn-ghost" routerLink="/login">Connexion</a>
            <a class="btn btn-primary" routerLink="/signup">Inscription</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: `
    .header {
      position: sticky;
      top: 0;
      z-index: 10;
      background: color-mix(in srgb, var(--bg) 85%, transparent);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }

    .inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: var(--space-4) var(--space-5);
      display: flex;
      align-items: center;
      gap: var(--space-6);
    }

    .brand {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      font-weight: 700;
      font-size: var(--text-lg);
      letter-spacing: -0.02em;
    }

    .mark {
      font-size: 1.25em;
      line-height: 1;
    }

    .nav {
      display: flex;
      gap: var(--space-5);
      font-size: var(--text-sm);
      font-weight: 550;

      a {
        color: var(--text-muted);
        padding: var(--space-1) 0;
        border-bottom: 2px solid transparent;
        transition:
          color var(--transition),
          border-color var(--transition);

        &:hover {
          color: var(--text);
        }
      }

      .active {
        color: var(--text);
        border-bottom-color: var(--accent);
      }
    }

    .actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .icon-btn {
      width: 2.25rem;
      height: 2.25rem;
      display: grid;
      place-items: center;
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      font-size: var(--text-base);
      cursor: pointer;
      transition:
        background var(--transition),
        color var(--transition);

      &:hover {
        background: var(--bg-hover);
        color: var(--text);
      }
    }

    @media (max-width: 640px) {
      .inner {
        gap: var(--space-4);
      }

      .nav {
        display: none;
      }
    }
  `,
})
export class HeaderComponent {
  protected readonly auth = inject(AuthService);
  protected readonly theme = inject(ThemeService);
}
