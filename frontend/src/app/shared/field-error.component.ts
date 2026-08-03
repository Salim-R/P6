import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AbstractControl } from '@angular/forms';

/**
 * Message d'erreur d'un champ de formulaire.
 *
 * Les trois formulaires appelaient `markAllAsTouched()` sans rien afficher :
 * un envoi incomplet ne produisait aucun retour, et le bouton paraissait
 * simplement inerte. Ce composant referme cet angle mort en un seul endroit.
 *
 * `role="alert"` fait annoncer le message dès son apparition plutôt qu'au
 * retour du curseur dans le champ. Son identifiant est repris par
 * `aria-describedby` sur le champ, ce qui relie les deux pour un lecteur
 * d'écran.
 */
@Component({
  selector: 'app-field-error',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (visible) {
      <p class="field-error" [id]="id()" role="alert">{{ message() }}</p>
    }
  `,
  styles: `
    .field-error {
      margin-top: var(--space-2);
      color: #dc2626;
      font-size: var(--text-xs);
    }
  `,
})
export class FieldErrorComponent {
  readonly control = input.required<AbstractControl>();
  readonly id = input.required<string>();
  readonly message = input('Ce champ est requis.');

  /**
   * Le message n'apparaît qu'une fois le champ visité, ou le formulaire envoyé.
   * Signaler une erreur sur un champ auquel on n'a pas encore touché est
   * hostile.
   */
  protected get visible(): boolean {
    const control = this.control();
    return control.invalid && (control.touched || control.dirty);
  }
}
