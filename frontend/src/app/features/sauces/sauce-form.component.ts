import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { SaucePayload } from '../../core/sauce.model';
import { SaucesService } from '../../core/sauces.service';

@Component({
  selector: 'app-sauce-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <a class="back-link" routerLink="/sauces">← Retour au catalogue</a>

    <h1>{{ isEdit() ? 'Modifier la sauce' : 'Nouvelle sauce' }}</h1>

    @if (loading()) {
      <div class="spinner" role="status" aria-label="Chargement"></div>
    } @else {
      <form class="card panel" [formGroup]="form" (ngSubmit)="submit()">
        <div class="row">
          <div class="field">
            <label class="label" for="name">Nom</label>
            <input id="name" class="input" type="text" formControlName="name" />
          </div>

          <div class="field">
            <label class="label" for="manufacturer">Fabricant</label>
            <input id="manufacturer" class="input" type="text" formControlName="manufacturer" />
          </div>
        </div>

        <div class="field">
          <label class="label" for="description">Description</label>
          <textarea id="description" class="input" rows="4" formControlName="description"></textarea>
        </div>

        <div class="row">
          <div class="field">
            <label class="label" for="mainPepper">Piment principal</label>
            <input id="mainPepper" class="input" type="text" formControlName="mainPepper" />
          </div>

          <div class="field">
            <label class="label" for="heat">Force · {{ form.controls.heat.value }}/10</label>
            <input
              id="heat"
              class="range"
              type="range"
              min="1"
              max="10"
              step="1"
              formControlName="heat"
            />
          </div>
        </div>

        <div class="field">
          <span class="label">Photo</span>
          <div class="upload">
            <input
              #fileInput
              class="file"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              (change)="pickFile($event)"
            />
            <button type="button" class="btn btn-ghost" (click)="fileInput.click()">
              Choisir une image
            </button>
            @if (preview()) {
              <img class="preview" [src]="preview()" alt="Aperçu de l'image choisie" />
            }
          </div>
          <span class="hint">JPG, PNG ou WebP, 2 Mo maximum.</span>
        </div>

        @if (error()) {
          <p class="alert-danger">{{ error() }}</p>
        }

        <div class="actions">
          <a class="btn btn-ghost" routerLink="/sauces">Annuler</a>
          <button class="btn btn-primary" type="submit" [disabled]="pending()">
            @if (pending()) {
              Enregistrement…
            } @else {
              {{ isEdit() ? 'Enregistrer' : 'Publier la sauce' }}
            }
          </button>
        </div>
      </form>
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

    h1 {
      font-size: var(--text-2xl);
      margin-bottom: var(--space-6);
    }

    .panel {
      max-width: 44rem;
      padding: var(--space-6);
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-5);
    }

    .range {
      width: 100%;
      accent-color: var(--accent);
    }

    .file {
      display: none;
    }

    .upload {
      display: flex;
      align-items: center;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .preview {
      width: 4.5rem;
      height: 4.5rem;
      object-fit: cover;
      border: 1px solid var(--border);
      border-radius: var(--radius);
    }

    .hint {
      font-size: var(--text-xs);
      color: var(--text-subtle);
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
      margin-top: var(--space-6);
      padding-top: var(--space-5);
      border-top: 1px solid var(--border);
    }

    @media (max-width: 640px) {
      .row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class SauceFormComponent implements OnInit {
  /** Présent uniquement sur la route de modification. */
  readonly id = input<string>();

  private readonly sauces = inject(SaucesService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly form = this.fb.group({
    name: ['', Validators.required],
    manufacturer: ['', Validators.required],
    description: ['', Validators.required],
    mainPepper: ['', Validators.required],
    heat: [5, Validators.required],
  });

  protected readonly loading = signal(false);
  protected readonly pending = signal(false);
  protected readonly error = signal('');
  protected readonly preview = signal('');

  private file: File | null = null;

  protected isEdit(): boolean {
    return !!this.id();
  }

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;

    this.loading.set(true);
    this.sauces.byId(id).subscribe({
      next: (sauce) => {
        this.form.patchValue({
          name: sauce.name,
          manufacturer: sauce.manufacturer,
          description: sauce.description,
          mainPepper: sauce.mainPepper,
          heat: sauce.heat,
        });
        this.preview.set(sauce.imageUrl);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(error.error?.message ?? 'Sauce introuvable.');
      },
    });
  }

  protected pickFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.file = file;

    // URL.createObjectURL est plus léger qu'un FileReader et suffit pour un
    // aperçu local.
    const previous = this.preview();
    if (previous.startsWith('blob:')) {
      URL.revokeObjectURL(previous);
    }
    this.preview.set(URL.createObjectURL(file));
  }

  protected submit(): void {
    if (this.form.invalid || this.pending()) {
      this.form.markAllAsTouched();
      return;
    }

    // Une image est obligatoire à la création, optionnelle en modification.
    if (!this.isEdit() && !this.file) {
      this.error.set('Une image est requise.');
      return;
    }

    this.pending.set(true);
    this.error.set('');

    const payload = this.form.getRawValue() as SaucePayload;
    const id = this.id();

    const request = id
      ? this.sauces.update(id, payload, this.file ?? undefined)
      : this.sauces.create(payload, this.file as File);

    request.subscribe({
      next: () => void this.router.navigate(['/sauces']),
      error: (error: HttpErrorResponse) => {
        this.pending.set(false);
        this.error.set(error.error?.message ?? 'Enregistrement impossible.');
      },
    });
  }
}
