import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ParsedHeader {
  key: string;
  value: string;
  category: string | null;
}

const HEADER_CATEGORIES: Record<string, string> = {
  'content-type': 'Content',
  'content-security-policy': 'Security',
  'authorization': 'Auth',
  'cache-control': 'Cache',
  'x-frame-options': 'Security',
  'x-content-type-options': 'Security',
  'strict-transport-security': 'Security',
  'access-control-allow-origin': 'CORS',
  'access-control-allow-methods': 'CORS',
  'set-cookie': 'Auth',
  'www-authenticate': 'Auth',
  'x-xss-protection': 'Security',
};

@Component({
  selector: 'app-http-headers',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './http-headers.component.html',
  styleUrl: './http-headers.component.scss',
})
export class HttpHeadersComponent {
  rawHeaders = '';
  parsedHeaders: ParsedHeader[] = [];
  errorMessage = '';

  parse(): void {
    this.errorMessage = '';
    this.parsedHeaders = [];

    if (!this.rawHeaders.trim()) {
      this.errorMessage = 'Please paste HTTP headers to parse.';
      return;
    }

    const lines = this.rawHeaders.split('\n').filter(line => line.trim());
    const results: ParsedHeader[] = [];

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) {
        // Skip lines that don't have a colon (e.g. HTTP/1.1 200 OK)
        continue;
      }

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      if (!key) continue;

      const category = HEADER_CATEGORIES[key.toLowerCase()] ?? null;
      results.push({ key, value, category });
    }

    if (results.length === 0) {
      this.errorMessage = 'No valid headers found. Expected format: "Key: Value" (one per line).';
      return;
    }

    this.parsedHeaders = results;
  }

  getCategoryClass(category: string): string {
    return `badge badge-${category.toLowerCase()}`;
  }

  clear(): void {
    this.rawHeaders = '';
    this.parsedHeaders = [];
    this.errorMessage = '';
  }
}
