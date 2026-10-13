import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface RegexMatch {
  value: string;
  index: number;
  line: number;
  column: number;
  groups: { name: string; value: string }[];
}

@Component({
  selector: 'app-regex-tester',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './regex-tester.component.html',
  styleUrl: './regex-tester.component.scss',
})
export class RegexTesterComponent {
  pattern = '';
  testString = '';
  errorMessage = '';

  flagGlobal = true;
  flagIgnoreCase = false;
  flagMultiline = false;
  flagDotAll = false;

  matches: RegexMatch[] = [];
  matchCount = 0;

  get flags(): string {
    let f = '';
    if (this.flagGlobal) f += 'g';
    if (this.flagIgnoreCase) f += 'i';
    if (this.flagMultiline) f += 'm';
    if (this.flagDotAll) f += 's';
    return f;
  }

  execute(): void {
    this.errorMessage = '';
    this.matches = [];
    this.matchCount = 0;

    if (!this.pattern) {
      this.errorMessage = 'Please enter a regex pattern.';
      return;
    }

    let regex: RegExp;
    try {
      regex = new RegExp(this.pattern, this.flags);
    } catch (e: any) {
      this.errorMessage = `Invalid regex: ${e.message}`;
      return;
    }

    if (!this.testString) {
      return;
    }

    const results: RegexMatch[] = [];
    let match: RegExpExecArray | null;

    // If global flag is set, find all matches
    if (regex.global) {
      while ((match = regex.exec(this.testString)) !== null) {
        results.push(this.buildMatch(match));
        // Prevent infinite loops on zero-length matches
        if (match[0].length === 0) {
          regex.lastIndex++;
        }
      }
    } else {
      match = regex.exec(this.testString);
      if (match) {
        results.push(this.buildMatch(match));
      }
    }

    this.matches = results;
    this.matchCount = results.length;
  }

  private buildMatch(match: RegExpExecArray): RegexMatch {
    const { line, column } = this.getLineAndColumn(match.index);
    const groups: { name: string; value: string }[] = [];

    // Numbered capture groups (skip index 0 which is the full match)
    for (let i = 1; i < match.length; i++) {
      groups.push({ name: `Group ${i}`, value: match[i] ?? '' });
    }

    // Named capture groups
    if (match.groups) {
      for (const [name, value] of Object.entries(match.groups)) {
        groups.push({ name, value: value ?? '' });
      }
    }

    return {
      value: match[0],
      index: match.index,
      line,
      column,
      groups,
    };
  }

  private getLineAndColumn(index: number): { line: number; column: number } {
    const before = this.testString.substring(0, index);
    const lines = before.split('\n');
    return {
      line: lines.length,
      column: (lines[lines.length - 1]?.length ?? 0) + 1,
    };
  }

  clear(): void {
    this.pattern = '';
    this.testString = '';
    this.errorMessage = '';
    this.matches = [];
    this.matchCount = 0;
  }
}
