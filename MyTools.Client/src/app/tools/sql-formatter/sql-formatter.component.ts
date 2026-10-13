import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SqlFormatterService } from './sql-formatter.service';

@Component({
  selector: 'app-sql-formatter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './sql-formatter.component.html',
  styleUrl: './sql-formatter.component.scss',
})
export class SqlFormatterComponent {
  private service = inject(SqlFormatterService);

  input = '';
  output = '';
  mode: 'format' | 'minify' = 'format';
  keywordCase: 'upper' | 'lower' | 'preserve' = 'upper';
  indentSize = 4;
  errorMessage = '';

  execute(): void {
    this.errorMessage = '';
    this.output = '';
    if (!this.input.trim()) return;

    try {
      if (this.mode === 'format') {
        this.output = this.service.format(this.input, {
          keywordCase: this.keywordCase,
          indentSize: this.indentSize,
        });
      } else {
        this.output = this.service.minify(this.input);
      }
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }

  clear(): void {
    this.input = '';
    this.output = '';
    this.errorMessage = '';
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
  }
}
