import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { FieldErrorComponent } from '../../shared/field-error.component';
import { DEMO_ACCOUNT } from '../../core/api.config';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldErrorComponent],
  template: `
    <section class="wrapper">
      <div class="card panel">
        <h1>Connexion</h1>
        <p class="subtitle">Donnez votre avis et publiez vos sauces.</p>

        <div class="demo">
          <p class="demo-title">Compte de démonstration</p>
          <p class="demo-creds">{{ DEMO.email }} · {{ DEMO.password }}</p>
          <button type="button" class="demo-fill" (click)="useDemo()">
            Remplir automatiquement
          </button>
        </div>

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
              [attr.aria-invalid]="form.controls.email.invalid && form.controls.email.touched ? true : null"
              [attr.aria-describedby]="form.controls.email.invalid && form.controls.email.touched ? 'erreur-email' : null"
            />
            <app-field-error
              [control]="form.controls.email"
              id="erreur-email"
              message="Renseignez votre adresse e-mail."
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
              [attr.aria-invalid]="form.controls.password.invalid && form.controls.password.touched ? true : null"
              [attr.aria-describedby]="form.controls.password.invalid && form.controls.password.touched ? 'erreur-password' : null"
            />
            <app-field-error
              [control]="form.controls.password"
              id="erreur-password"
              message="Renseignez votre mot de passe."
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

    .demo {
      margin-bottom: var(--space-6);
      padding: var(--space-4);
      background: var(--accent-soft);
      border: 1px dashed var(--accent);
      border-radius: var(--radius);
    }

    .demo-title {
      font-size: var(--text-xs);
      font-weight: 650;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--accent);
    }

    .demo-creds {
      margin-top: var(--space-1);
      font-size: var(--text-sm);
      color: var(--text-muted);
      word-break: break-all;
    }

    .demo-fill {
      margin-top: var(--space-3);
      padding: 0;
      background: none;
      border: none;
      color: var(--accent);
      font-family: inherit;
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
      text-decoration: underline;
      text-underline-offset: 3px;
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

  /**
   * Compte de démonstration, volontairement public : il permet d'essayer les
   * fonctions protégées sans créer de compte. Il doit être créé une fois en
   * base après le déploiement (voir le README).
   */
  protected readonly DEMO = DEMO_ACCOUNT;

  protected useDemo(): void {
    this.form.setValue({ email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
  }

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
