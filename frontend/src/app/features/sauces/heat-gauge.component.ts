import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Jauge de force, réutilisée dans la liste et le détail.
 * `input()` remplace le décorateur @Input : la valeur est un signal, donc les
 * dérivées se recalculent automatiquement.
 */
@Component({
  selector: 'app-heat-gauge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="gauge" role="img" [attr.aria-label]="'Force ' + heat() + ' sur 10'">
      <div class="track">
        <div class="fill" [style.width.%]="percent()"></div>
      </div>
      <span class="value">{{ heat() }}/10</span>
    </div>
  `,
  styles: `
    .gauge {
      display: flex;
      align-items: center;
      gap: var(--space-3);
    }

    .track {
      flex: 1;
      height: 0.375rem;
      background: var(--bg-hover);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .fill {
      height: 100%;
      border-radius: var(--radius-full);
      background: linear-gradient(90deg, #fbbf24, var(--accent) 60%, #dc2626);
      transition: width var(--transition);
    }

    .value {
      color: var(--text-subtle);
      font-size: var(--text-xs);
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
  `,
})
export class HeatGaugeComponent {
  readonly heat = input.required<number>();

  protected readonly percent = computed(() => {
    const clamped = Math.min(10, Math.max(1, this.heat()));
    return clamped * 10;
  });
}
