import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavComponent } from './layout/nav.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavComponent],
  template: `
    <app-nav />
    <main>
      <router-outlet />
    </main>
  `,
  styles: `
    main {
      min-height: calc(100vh - 56px);
    }
  `,
})
export class AppComponent {}
