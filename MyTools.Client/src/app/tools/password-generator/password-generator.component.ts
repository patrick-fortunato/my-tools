import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './password-generator.component.html',
  styleUrl: './password-generator.component.scss',
})
export class PasswordGeneratorComponent {
  length = 20;
  quantity = 5;
  uppercase = true;
  lowercase = true;
  digits = true;
  symbols = true;
  customSymbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  passwords: string[] = [];

  generate(): void {
    this.passwords = [];
    const charset = this.buildCharset();
    if (!charset) return;

    for (let i = 0; i < this.quantity; i++) {
      this.passwords.push(this.generateOne(charset));
    }
  }

  getStrength(password: string): { label: string; class: string; percent: number } {
    let score = 0;
    if (password.length >= 12) score++;
    if (password.length >= 20) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    if (score <= 2) return { label: 'Weak', class: 'weak', percent: 25 };
    if (score <= 3) return { label: 'Fair', class: 'fair', percent: 50 };
    if (score <= 4) return { label: 'Good', class: 'good', percent: 75 };
    return { label: 'Strong', class: 'strong', percent: 100 };
  }

  copyOne(pw: string): void {
    navigator.clipboard.writeText(pw);
  }

  copyAll(): void {
    navigator.clipboard.writeText(this.passwords.join('\n'));
  }

  clear(): void {
    this.passwords = [];
  }

  private buildCharset(): string {
    let charset = '';
    if (this.uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (this.lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (this.digits) charset += '0123456789';
    if (this.symbols) charset += this.customSymbols;
    return charset;
  }

  private generateOne(charset: string): string {
    const array = new Uint32Array(this.length);
    crypto.getRandomValues(array);
    return Array.from(array).map(n => charset[n % charset.length]).join('');
  }
}
