import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type GuidFormat = 'registry' | 'braces' | 'hyphens' | 'digits' | 'base64';
type GuidCase = 'lower' | 'upper';

@Component({
  selector: 'app-guid-generator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './guid-generator.component.html',
  styleUrl: './guid-generator.component.scss',
})
export class GuidGeneratorComponent {
  quantity = 1;
  format: GuidFormat = 'hyphens';
  guidCase: GuidCase = 'lower';
  guids: string[] = [];

  formatOptions: { key: GuidFormat; label: string; example: string }[] = [
    { key: 'registry', label: 'Registry', example: '{xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx}' },
    { key: 'braces', label: 'Braces', example: '{xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx}' },
    { key: 'hyphens', label: 'Hyphens', example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
    { key: 'digits', label: 'Digits Only', example: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' },
    { key: 'base64', label: 'Base64', example: '(22 chars)' },
  ];

  generate(): void {
    this.guids = [];
    for (let i = 0; i < this.quantity; i++) {
      this.guids.push(this.createGuid());
    }
  }

  copyOne(guid: string): void {
    navigator.clipboard.writeText(guid);
  }

  copyAll(): void {
    navigator.clipboard.writeText(this.guids.join('\n'));
  }

  clear(): void {
    this.guids = [];
  }

  getExample(): string {
    const opt = this.formatOptions.find(o => o.key === this.format);
    return opt?.example ?? '';
  }

  private createGuid(): string {
    // Generate a v4 UUID using crypto API
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version (4) and variant (10xx) bits
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    if (this.format === 'base64') {
      return this.toBase64(bytes);
    }

    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return this.applyFormat(hex);
  }

  private applyFormat(hex: string): string {
    let result: string;

    switch (this.format) {
      case 'registry':
        result = `{${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}}`;
        break;
      case 'braces':
        result = `{${hex}}`;
        break;
      case 'hyphens':
        result = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
        break;
      case 'digits':
        result = hex;
        break;
      default:
        result = hex;
    }

    return this.guidCase === 'upper' ? result.toUpperCase() : result.toLowerCase();
  }

  private toBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary).replace(/=+$/, '');
  }
}
