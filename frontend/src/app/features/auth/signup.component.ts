import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';

import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-signup',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="wrapper">
      <div class="card panel">
        <h1>Créer un compte</h1>
        <p class="subtitle">Quelques secondes suffisent.</p>

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
            @if (emailInvalid()) {
              <span class="hint">Adresse e-mail invalide.</span>
            }
          </div>

          <div class="field">
            <label class="label" for="password">Mot de passe</label>
            <input
              id="password"
              class="input"
              type="password"
              autocomplete="new-password"
              formControlName="password"
            />
            <span class="hint">
              8 caractères minimum, avec une majuscule, une minuscule et 2 chiffres.
            </span>
          </div>

          @if (error()) {
            <p class="alert-danger">{{ error() }}</p>
          }

          <button class="btn btn-primary btn-block submit" type="submit" [disabled]="pending()">
            @if (pending()) {
              Création…
            } @else {
              Créer mon compte
            }
          </button>
        </form>

        <p class="switch">
          Déjà inscrit ?
          <a routerLink="/login">Se connecter</a>
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

    .hint {
      font-size: var(--text-xs);
      color: var(--text-subtle);
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
export class SignupComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    // La règle exacte est appliquée côté serveur ; on garde ici une longueur
    // minimale pour éviter un aller-retour inutile.
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  protected readonly pending = signal(false);
  protected readonly error = signal('');

  protected emailInvalid(): boolean {
    const control = this.form.controls.email;
    return control.touched && control.invalid;
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    this.pending.set(true);
    this.error.set('');

    const { email, password } = this.form.getRawValue();

    // Inscription puis connexion enchaînées : l'utilisateur arrive directement
    // sur le catalogue.
    this.auth
      .signup(email, password)
      .pipe(switchMap(() => this.auth.login(email, password)))
      .subscribe({
        next: () => void this.router.navigate(['/sauces']),
        error: (error: HttpErrorResponse) => {
          this.pending.set(false);
          this.error.set(error.error?.message ?? 'Création impossible. Réessayez.');
        },
      });
  }
}
