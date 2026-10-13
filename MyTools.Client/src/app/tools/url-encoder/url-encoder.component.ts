import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-url-encoder',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './url-encoder.component.html',
  styleUrl: './url-encoder.component.scss',
})
export class UrlEncoderComponent {
  input = '';
  output = '';
  mode: 'encode' | 'decode' = 'encode';
  scope: 'component' | 'full' = 'component';
  errorMessage = '';

  convert(): void {
    this.errorMessage = '';
    this.output = '';
    if (!this.input) return;

    try {
      if (this.mode === 'encode') {
        this.output = this.scope === 'component'
          ? encodeURIComponent(this.input)
          : encodeURI(this.input);
      } else {
        this.output = this.scope === 'component'
          ? decodeURIComponent(this.input)
          : decodeURI(this.input);
      }
    } catch (e: any) {
      this.errorMessage = `Error: ${e.message}`;
    }
  }

  swap(): void {
    const temp = this.input;
    this.input = this.output;
    this.output = temp;
    this.mode = this.mode === 'encode' ? 'decode' : 'encode';
    this.errorMessage = '';
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
