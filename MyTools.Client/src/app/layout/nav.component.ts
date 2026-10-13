import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService, Theme } from '../services/theme.service';

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.scss',
})
export class NavComponent {
  themeService = inject(ThemeService);
  openCategory: string | null = null;
  showThemeMenu = false;

  get themeIcon(): string {
    switch (this.themeService.currentTheme()) {
      case 'matrix': return '🖥️';
      case 'spring': return '🌸';
      case 'summer': return '🌊';
      case 'autumn': return '🍂';
      case 'winter': return '❄️';
      case 'light': return '☀️';
    }
  }

  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
    this.showThemeMenu = false;
  }
}
