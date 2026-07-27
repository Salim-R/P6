import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { HeaderComponent } from './layout/header.component';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <app-header />
    <main class="main">
      <router-outlet />
    </main>
  `,
  styles: `
    .main {
      max-width: 1120px;
      margin: 0 auto;
      padding: var(--space-8) var(--space-5) var(--space-10);
    }
  `,
})
export class App {}
