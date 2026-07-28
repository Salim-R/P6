import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { Sauce } from '../../core/sauce.model';
import { SaucesService } from '../../core/sauces.service';
import { HeatGaugeComponent } from './heat-gauge.component';

@Component({
  selector: 'app-sauce-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HeatGaugeComponent],
  template: `
    <header class="page-head">
      <div>
        <h1>Les sauces</h1>
        <p class="count">
          @if (sauces().length) {
            {{ sauces().length }} référence{{ sauces().length > 1 ? 's' : '' }} au catalogue
          }
        </p>
      </div>
      @if (auth.isAuthenticated()) {
        <a class="btn btn-primary" routerLink="/sauces/nouvelle">Ajouter une sauce</a>
      } @else {
        <a class="btn btn-ghost" routerLink="/login">Se connecter pour contribuer</a>
      }
    </header>

    @if (loading()) {
      <div class="spinner" role="status" aria-label="Chargement"></div>
    } @else if (error()) {
      <p class="alert-danger">{{ error() }}</p>
    } @else if (sauces().length === 0) {
      <div class="card empty">
        <p class="empty-title">Le catalogue est vide</p>
        @if (auth.isAuthenticated()) {
          <p class="empty-text">Ajoutez la première sauce pour lancer les votes.</p>
          <a class="btn btn-primary" routerLink="/sauces/nouvelle">Ajouter une sauce</a>
        } @else {
          <p class="empty-text">Connectez-vous pour publier la première sauce.</p>
          <a class="btn btn-primary" routerLink="/login">Se connecter</a>
        }
      </div>
    } @else {
      <ul class="grid">
        @for (sauce of sauces(); track sauce._id) {
          <li>
            <a class="card tile" [routerLink]="['/sauces', sauce._id]">
              <div class="thumb">
                <img [src]="sauce.imageUrl" [alt]="sauce.name" loading="lazy" />
              </div>
              <div class="body">
                <h2>{{ sauce.name }}</h2>
                <p class="maker">{{ sauce.manufacturer }}</p>
                <app-heat-gauge [heat]="sauce.heat" />
                <div class="votes">
                  <span class="up">▲ {{ sauce.likes }}</span>
                  <span class="down">▼ {{ sauce.dislikes }}</span>
                </div>
              </div>
            </a>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .page-head {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    h1 {
      font-size: var(--text-3xl);
    }

    .count {
      margin-top: var(--space-1);
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    .grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(15rem, 1fr));
      gap: var(--space-5);
    }

    .tile {
      display: block;
      overflow: hidden;
      transition:
        transform var(--transition),
        border-color var(--transition),
        box-shadow var(--transition);

      &:hover {
        transform: translateY(-2px);
        border-color: var(--border-strong);
        box-shadow: var(--shadow);
      }
    }

    .thumb {
      aspect-ratio: 4 / 3;
      background: var(--bg-hover);

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .body {
      padding: var(--space-4);
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    h2 {
      font-size: var(--text-base);
    }

    .maker {
      color: var(--text-subtle);
      font-size: var(--text-xs);
    }

    .votes {
      display: flex;
      gap: var(--space-4);
      font-size: var(--text-xs);
      font-variant-numeric: tabular-nums;
    }

    .up {
      color: var(--success);
    }

    .down {
      color: var(--danger);
    }

    .empty {
      padding: var(--space-10) var(--space-6);
      text-align: center;
    }

    .empty-title {
      font-size: var(--text-lg);
      font-weight: 600;
    }

    .empty-text {
      margin: var(--space-2) 0 var(--space-5);
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    @media (max-width: 640px) {
      .page-head {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `,
})
export class SauceListComponent implements OnInit {
  private readonly sauces_ = inject(SaucesService);
  protected readonly auth = inject(AuthService);

  protected readonly sauces = signal<Sauce[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal('');

  ngOnInit(): void {
    this.sauces_.list().subscribe({
      next: (sauces) => {
        this.sauces.set(sauces);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'Impossible de charger le catalogue.');
      },
    });
  }
}
