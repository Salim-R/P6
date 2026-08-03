import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';
import { Sauce, Vote } from '../../core/sauce.model';
import { SaucesService } from '../../core/sauces.service';
import { HeatGaugeComponent } from './heat-gauge.component';

@Component({
  selector: 'app-sauce-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, HeatGaugeComponent],
  template: `
    @if (loading()) {
      <div class="spinner" role="status" aria-label="Chargement"></div>
    } @else if (error()) {
      <p class="alert-danger">{{ error() }}</p>
      <a class="btn btn-ghost back" routerLink="/sauces">Retour au catalogue</a>
    } @else if (sauce(); as item) {
      <a class="back-link" routerLink="/sauces">← Retour au catalogue</a>

      <article class="layout">
        <div class="card visual">
          <img [src]="item.imageUrl" [alt]="item.name" />
        </div>

        <div class="details">
          <p class="maker">{{ item.manufacturer }}</p>
          <h1>{{ item.name }}</h1>

          <div class="gauge-row">
            <app-heat-gauge [heat]="item.heat" />
          </div>

          <div class="pepper">
            <span class="tag">Piment principal · {{ item.mainPepper }}</span>
          </div>

          <p class="description">{{ item.description }}</p>

          <div class="vote-row">
            <button
              type="button"
              class="vote"
              [class.active]="myVote() === 1"
              [disabled]="voting() || !isLogged()"
              (click)="cast(1)"
            >
              ▲ J'aime
              <span class="n">{{ item.likes }}</span>
            </button>

            <button
              type="button"
              class="vote down"
              [class.active]="myVote() === -1"
              [disabled]="voting() || !isLogged()"
              (click)="cast(-1)"
            >
              ▼ Je n'aime pas
              <span class="n">{{ item.dislikes }}</span>
            </button>
          </div>

          @if (voteError()) {
            <p class="vote-hint vote-error" role="alert">{{ voteError() }}</p>
          }

          @if (!isLogged()) {
            <p class="vote-hint">
              <a routerLink="/login">Connectez-vous</a> pour donner votre avis.
            </p>
          }

          @if (isOwner()) {
            <div class="owner-actions">
              <a class="btn btn-ghost" [routerLink]="['/sauces', item._id, 'modifier']">Modifier</a>
              <button type="button" class="btn btn-danger" (click)="remove()">Supprimer</button>
            </div>
          }
        </div>
      </article>
    }
  `,
  styles: `
    .back-link {
      display: inline-block;
      margin-bottom: var(--space-5);
      color: var(--text-muted);
      font-size: var(--text-sm);

      &:hover {
        color: var(--text);
      }
    }

    .layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
      gap: var(--space-8);
      align-items: start;
    }

    .visual {
      overflow: hidden;

      img {
        width: 100%;
        aspect-ratio: 1;
        object-fit: cover;
      }
    }

    .maker {
      color: var(--text-subtle);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    h1 {
      margin-top: var(--space-2);
      font-size: var(--text-3xl);
    }

    .gauge-row {
      max-width: 18rem;
      margin-top: var(--space-5);
    }

    .pepper {
      margin-top: var(--space-4);
    }

    .tag {
      display: inline-block;
      padding: var(--space-1) var(--space-3);
      background: var(--accent-soft);
      color: var(--accent);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 550;
    }

    .description {
      margin-top: var(--space-5);
      color: var(--text-muted);
      white-space: pre-line;
    }

    .vote-row {
      display: flex;
      gap: var(--space-3);
      margin-top: var(--space-6);
    }

    .vote {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-3) var(--space-4);
      background: transparent;
      color: var(--text-muted);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius);
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 550;
      cursor: pointer;
      transition:
        color var(--transition),
        border-color var(--transition),
        background var(--transition);

      &:hover:not(:disabled) {
        color: var(--success);
        border-color: var(--success);
      }

      &.active {
        color: var(--success);
        border-color: var(--success);
        background: rgba(18, 183, 106, 0.1);
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .vote.down {
      &:hover:not(:disabled),
      &.active {
        color: var(--danger);
        border-color: var(--danger);
      }

      &.active {
        background: var(--danger-soft);
      }
    }

    .n {
      font-variant-numeric: tabular-nums;
    }

    .vote-error {
      color: #dc2626;
    }

    .vote-hint {
      margin-top: var(--space-3);
      font-size: var(--text-sm);
      color: var(--text-subtle);

      a {
        color: var(--accent);
        font-weight: 550;

        &:hover {
          text-decoration: underline;
        }
      }
    }

    .owner-actions {
      display: flex;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-6);
      border-top: 1px solid var(--border);
    }

    .back {
      margin-top: var(--space-4);
    }

    @media (max-width: 820px) {
      .layout {
        grid-template-columns: 1fr;
        gap: var(--space-6);
      }
    }
  `,
})
export class SauceDetailComponent implements OnInit {
  /** Fourni par le routeur grâce à withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly sauces = inject(SaucesService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly sauce = signal<Sauce | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal('');
  protected readonly voting = signal(false);
  protected readonly voteError = signal('');

  protected readonly isLogged = this.auth.isAuthenticated;

  protected readonly isOwner = computed(
    () => this.isLogged() && this.sauce()?.userId === this.auth.userId(),
  );

  /** Vote de l'utilisateur courant, déduit des tableaux renvoyés par l'API. */
  protected readonly myVote = computed<Vote>(() => {
    const item = this.sauce();
    const me = this.auth.userId();
    if (!item) return 0;
    if (item.usersLiked.includes(me)) return 1;
    if (item.usersDisliked.includes(me)) return -1;
    return 0;
  });

  ngOnInit(): void {
    this.sauces.byId(this.id()).subscribe({
      next: (sauce) => {
        this.sauce.set(sauce);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'Sauce introuvable.');
      },
    });
  }

  /** Cliquer sur son vote actuel l'annule. */
  protected cast(value: Vote): void {
    const item = this.sauce();
    if (!item || this.voting() || !this.isLogged()) return;

    const next: Vote = this.myVote() === value ? 0 : value;
    this.voting.set(true);

    this.sauces.vote(item._id, next).subscribe({
      next: ({ likes, dislikes }) => {
        const me = this.auth.userId();
        // On reconstruit l'état local à partir des compteurs renvoyés par
        // l'API, sans réinterroger le serveur.
        this.sauce.set({
          ...item,
          likes,
          dislikes,
          usersLiked: next === 1 ? [...new Set([...item.usersLiked, me])] : item.usersLiked.filter((u) => u !== me),
          usersDisliked:
            next === -1 ? [...new Set([...item.usersDisliked, me])] : item.usersDisliked.filter((u) => u !== me),
        });
        this.voting.set(false);
        this.voteError.set('');
      },
      // Un échec silencieux laisserait croire que le vote est passé : le bouton
      // redevient cliquable, les compteurs n'ont pas bougé, et rien ne dit
      // pourquoi. Le message est placé près des boutons plutôt que dans
      // `error`, qui remplace toute la page par un état d'erreur.
      error: (error: HttpErrorResponse) => {
        this.voting.set(false);
        this.voteError.set(error.error?.message ?? "Votre vote n'a pas pu être enregistré.");
      },
    });
  }

  protected remove(): void {
    const item = this.sauce();
    if (!item || !window.confirm(`Supprimer « ${item.name} » ?`)) return;

    this.sauces.remove(item._id).subscribe({
      next: () => void this.router.navigate(['/sauces']),
      error: (error: HttpErrorResponse) =>
        this.error.set(error.error?.message ?? 'Suppression impossible.'),
    });
  }
}
