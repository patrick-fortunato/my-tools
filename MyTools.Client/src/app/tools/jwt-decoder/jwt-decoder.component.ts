import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface DecodedJwt {
  header: any;
  payload: any;
  signature: string;
  isExpired: boolean;
  expiresAt?: Date;
  issuedAt?: Date;
  timeRemaining?: string;
}

@Component({
  selector: 'app-jwt-decoder',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './jwt-decoder.component.html',
  styleUrl: './jwt-decoder.component.scss',
})
export class JwtDecoderComponent {
  input = '';
  decoded: DecodedJwt | null = null;
  errorMessage = '';

  decode(): void {
    this.errorMessage = '';
    this.decoded = null;
    if (!this.input.trim()) return;

    try {
      const parts = this.input.trim().split('.');
      if (parts.length !== 3) {
        this.errorMessage = 'Invalid JWT format. Expected 3 dot-separated parts (header.payload.signature).';
        return;
      }

      const header = JSON.parse(this.base64UrlDecode(parts[0]));
      const payload = JSON.parse(this.base64UrlDecode(parts[1]));
      const signature = parts[2];

      let isExpired = false;
      let expiresAt: Date | undefined;
      let issuedAt: Date | undefined;
      let timeRemaining: string | undefined;

      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000);
        isExpired = expiresAt.getTime() < Date.now();
        if (!isExpired) {
          const diff = expiresAt.getTime() - Date.now();
          timeRemaining = this.formatDuration(diff);
        }
      }

      if (payload.iat) {
        issuedAt = new Date(payload.iat * 1000);
      }

      this.decoded = { header, payload, signature, isExpired, expiresAt, issuedAt, timeRemaining };
    } catch (e: any) {
      this.errorMessage = `Failed to decode JWT: ${e.message}`;
    }
  }

  clear(): void {
    this.input = '';
    this.decoded = null;
    this.errorMessage = '';
  }

  formatJson(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  get standardClaims(): { key: string; label: string; value: string }[] {
    if (!this.decoded) return [];
    const p = this.decoded.payload;
    const claims: { key: string; label: string; value: string }[] = [];
    if (p.iss) claims.push({ key: 'iss', label: 'Issuer', value: p.iss });
    if (p.sub) claims.push({ key: 'sub', label: 'Subject', value: p.sub });
    if (p.aud) claims.push({ key: 'aud', label: 'Audience', value: Array.isArray(p.aud) ? p.aud.join(', ') : p.aud });
    if (p.exp) claims.push({ key: 'exp', label: 'Expires', value: new Date(p.exp * 1000).toISOString() });
    if (p.iat) claims.push({ key: 'iat', label: 'Issued At', value: new Date(p.iat * 1000).toISOString() });
    if (p.nbf) claims.push({ key: 'nbf', label: 'Not Before', value: new Date(p.nbf * 1000).toISOString() });
    if (p.jti) claims.push({ key: 'jti', label: 'JWT ID', value: p.jti });
    return claims;
  }

  private base64UrlDecode(str: string): string {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    return atob(base64);
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }
}
