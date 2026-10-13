import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface CaseResult {
  label: string;
  value: string;
}

@Component({
  selector: 'app-string-case',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './string-case.component.html',
  styleUrl: './string-case.component.scss',
})
export class StringCaseComponent {
  input = '';
  results: CaseResult[] = [];

  convert(): void {
    if (!this.input.trim()) return;

    const lines = this.input.split('\n').filter(l => l.trim());
    const converted = lines.map(line => this.convertLine(line.trim()));

    // If single line, show results for that line; if multiple, join with newline per case
    if (converted.length === 1) {
      this.results = converted[0];
    } else {
      const caseLabels = converted[0].map(r => r.label);
      this.results = caseLabels.map((label, idx) => ({
        label,
        value: converted.map(lineResults => lineResults[idx].value).join('\n'),
      }));
    }
  }

  clear(): void {
    this.input = '';
    this.results = [];
  }

  copyValue(value: string): void {
    navigator.clipboard.writeText(value);
  }

  private convertLine(input: string): CaseResult[] {
    const tokens = this.tokenize(input);

    return [
      { label: 'camelCase', value: this.toCamelCase(tokens) },
      { label: 'PascalCase', value: this.toPascalCase(tokens) },
      { label: 'snake_case', value: this.toSnakeCase(tokens) },
      { label: 'SCREAMING_SNAKE_CASE', value: this.toScreamingSnakeCase(tokens) },
      { label: 'kebab-case', value: this.toKebabCase(tokens) },
      { label: 'Title Case', value: this.toTitleCase(tokens) },
      { label: 'UPPERCASE', value: tokens.join(' ').toUpperCase() },
      { label: 'lowercase', value: tokens.join(' ').toLowerCase() },
    ];
  }

  private tokenize(input: string): string[] {
    // Split on camelCase boundaries, spaces, underscores, hyphens
    return input
      // Insert split point before uppercase letter following a lowercase letter
      .replace(/([a-z])([A-Z])/g, '$1\0$2')
      // Insert split point before uppercase letter followed by lowercase (for sequences like "XMLParser")
      .replace(/([A-Z]+)([A-Z][a-z])/g, '$1\0$2')
      // Split on separators and the null character
      .split(/[\0\s_\-]+/)
      .filter(t => t.length > 0)
      .map(t => t.toLowerCase());
  }

  private toCamelCase(tokens: string[]): string {
    return tokens
      .map((t, i) => (i === 0 ? t : t.charAt(0).toUpperCase() + t.slice(1)))
      .join('');
  }

  private toPascalCase(tokens: string[]): string {
    return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join('');
  }

  private toSnakeCase(tokens: string[]): string {
    return tokens.join('_');
  }

  private toScreamingSnakeCase(tokens: string[]): string {
    return tokens.map(t => t.toUpperCase()).join('_');
  }

  private toKebabCase(tokens: string[]): string {
    return tokens.join('-');
  }

  private toTitleCase(tokens: string[]): string {
    return tokens.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' ');
  }
}
