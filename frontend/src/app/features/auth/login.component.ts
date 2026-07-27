import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="wrapper">
      <div class="card panel">
        <h1>Connexion</h1>
        <p class="subtitle">Accédez au catalogue et donnez votre avis.</p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="field">
            <label class="label" for="email">Adresse e-mail</label>
            <input
              id="email"
              class="input"
              type="email"
              autocomplete="email"
              placeholder="vous@exemple.fr"
              formControlName="email"
            />
          </div>

          <div class="field">
            <label class="label" for="password">Mot de passe</label>
            <input
              id="password"
              class="input"
              type="password"
              autocomplete="current-password"
              formControlName="password"
            />
          </div>

          @if (error()) {
            <p class="alert-danger">{{ error() }}</p>
          }

          <button class="btn btn-primary btn-block submit" type="submit" [disabled]="pending()">
            @if (pending()) {
              Connexion…
            } @else {
              Se connecter
            }
          </button>
        </form>

        <p class="switch">
          Pas encore de compte ?
          <a routerLink="/signup">Créer un compte</a>
        </p>
      </div>
    </section>
  `,
  styles: `
    .wrapper {
      display: grid;
      place-items: center;
      padding-block: var(--space-6);
    }

    .panel {
      width: 100%;
      max-width: 26rem;
      padding: var(--space-6);
    }

    h1 {
      font-size: var(--text-2xl);
    }

    .subtitle {
      margin-top: var(--space-2);
      margin-bottom: var(--space-6);
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    .submit {
      margin-top: var(--space-5);
    }

    .switch {
      margin-top: var(--space-5);
      text-align: center;
      font-size: var(--text-sm);
      color: var(--text-muted);

      a {
        color: var(--accent);
        font-weight: 550;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  /**
   * NonNullableFormBuilder évite les types `string | null` partout : les formes
   * typées introduites en Angular 14 rendaient l'ancienne version pleine
   * d'assertions non nulles.
   */
  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly pending = signal(false);
  protected readonly error = signal('');

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        // La page demandée avant la redirection est reprise si elle existe.
        const redirect = new URLSearchParams(window.location.search).get('redirect');
        void this.router.navigateByUrl(redirect ?? '/sauces');
      },
      error: (error: HttpErrorResponse) => {
        this.pending.set(false);
        this.error.set(error.error?.message ?? 'Connexion impossible. Réessayez.');
      },
    });
  }
}
