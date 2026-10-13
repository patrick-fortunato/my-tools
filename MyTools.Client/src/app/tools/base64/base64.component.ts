import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-base64',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './base64.component.html',
  styleUrl: './base64.component.scss',
})
export class Base64Component {
  input = '';
  output = '';
  mode: 'encode' | 'decode' = 'encode';
  errorMessage = '';

  convert(): void {
    this.errorMessage = '';
    try {
      if (this.mode === 'encode') {
        this.output = this.encodeBase64(this.input);
      } else {
        this.output = this.decodeBase64(this.input);
      }
    } catch {
      this.errorMessage =
        this.mode === 'decode'
          ? 'Invalid Base64 input. Check for incorrect characters or padding.'
          : 'Encoding failed.';
      this.output = '';
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

  /** Encode string to Base64 with full Unicode support */
  private encodeBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  /** Decode Base64 to string with full Unicode support */
  private decodeBase64(base64: string): string {
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
}
