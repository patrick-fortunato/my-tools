import { Injectable, signal } from '@angular/core';

export type Theme = 'matrix' | 'light' | 'autumn' | 'winter' | 'summer' | 'spring';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly STORAGE_KEY = 'mytools-theme';
  currentTheme = signal<Theme>(this.loadTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    this.applyTheme(theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  }

  private static readonly validThemes: Theme[] = ['matrix', 'spring', 'summer', 'autumn', 'winter', 'light'];

  private loadTheme(): Theme {
    const stored = localStorage.getItem(this.STORAGE_KEY) as Theme | null;
    if (stored && ThemeService.validThemes.includes(stored)) return stored;
    return 'matrix';
  }

  private applyTheme(theme: Theme): void {
    if (theme === 'matrix') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }
}
