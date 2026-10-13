import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ColorResult {
  hex: string;
  rgb: string;
  hsl: string;
}

@Component({
  selector: 'app-color-converter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './color-converter.component.html',
  styleUrl: './color-converter.component.scss',
})
export class ColorConverterComponent {
  colorInput = '';
  pickerColor = '#4a90d9';
  errorMessage = '';
  result: ColorResult | null = null;

  convert(): void {
    this.errorMessage = '';
    this.result = null;

    const input = this.colorInput.trim();
    if (!input) {
      this.errorMessage = 'Please enter a color value.';
      return;
    }

    try {
      const rgb = this.parseColor(input);
      this.result = this.buildResult(rgb);
      this.pickerColor = this.result.hex;
    } catch {
      this.errorMessage = 'Invalid color format. Supported: #hex, rgb(...), hsl(...)';
    }
  }

  onPickerChange(): void {
    this.errorMessage = '';
    try {
      const rgb = this.parseColor(this.pickerColor);
      this.result = this.buildResult(rgb);
      this.colorInput = this.pickerColor;
    } catch {
      // Picker should always produce valid hex
    }
  }

  get swatchColor(): string {
    return this.result?.hex ?? 'transparent';
  }

  clear(): void {
    this.colorInput = '';
    this.result = null;
    this.errorMessage = '';
    this.pickerColor = '#4a90d9';
  }

  copyValue(value: string): void {
    navigator.clipboard.writeText(value);
  }

  private parseColor(input: string): { r: number; g: number; b: number } {
    // Try hex
    const hexMatch = input.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (hexMatch) {
      let hex = hexMatch[1];
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      };
    }

    // Try rgb(r, g, b)
    const rgbMatch = input.match(/^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
    if (rgbMatch) {
      const r = parseInt(rgbMatch[1], 10);
      const g = parseInt(rgbMatch[2], 10);
      const b = parseInt(rgbMatch[3], 10);
      if (r > 255 || g > 255 || b > 255) throw new Error('RGB values must be 0-255');
      return { r, g, b };
    }

    // Try hsl(h, s%, l%)
    const hslMatch = input.match(/^hsl\(\s*(\d{1,3})\s*,\s*(\d{1,3})%?\s*,\s*(\d{1,3})%?\s*\)$/i);
    if (hslMatch) {
      const h = parseInt(hslMatch[1], 10);
      const s = parseInt(hslMatch[2], 10) / 100;
      const l = parseInt(hslMatch[3], 10) / 100;
      return this.hslToRgb(h, s, l);
    }

    throw new Error('Unsupported format');
  }

  private buildResult(rgb: { r: number; g: number; b: number }): ColorResult {
    const hex = '#' + [rgb.r, rgb.g, rgb.b]
      .map(c => c.toString(16).padStart(2, '0'))
      .join('');

    const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);

    return {
      hex: hex,
      rgb: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      hsl: `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`,
    };
  }

  private rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const l = (max + min) / 2;
    let h = 0;
    let s = 0;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    h = h / 360;

    if (s === 0) {
      const val = Math.round(l * 255);
      return { r: val, g: val, b: val };
    }

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
    };
  }
}
