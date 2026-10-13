import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { marked } from 'marked';
import TurndownService from 'turndown';

type ConversionMode = 'html-to-md' | 'md-to-html';

@Component({
  selector: 'app-html-markdown',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './html-markdown.component.html',
  styleUrl: './html-markdown.component.scss',
})
export class HtmlMarkdownComponent {
  mode: ConversionMode = 'html-to-md';
  input = '';
  output = '';
  errorMessage = '';
  showPreview = false;

  private turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
  });

  get modeLabel(): string {
    return this.mode === 'html-to-md' ? 'HTML → Markdown' : 'Markdown → HTML';
  }

  get inputLabel(): string {
    return this.mode === 'html-to-md' ? 'HTML' : 'Markdown';
  }

  get outputLabel(): string {
    return this.mode === 'html-to-md' ? 'Markdown' : 'HTML';
  }

  get inputPlaceholder(): string {
    return this.mode === 'html-to-md'
      ? 'Paste HTML here...'
      : 'Paste Markdown here...';
  }

  /** Rendered preview of the input side */
  get inputPreviewHtml(): string {
    if (!this.input.trim()) return '';
    try {
      if (this.mode === 'html-to-md') {
        // Input is HTML — render directly
        return this.input;
      } else {
        // Input is Markdown — render as HTML
        return marked.parse(this.input, { async: false }) as string;
      }
    } catch {
      return '<em>Preview unavailable</em>';
    }
  }

  /** Rendered preview of the output side */
  get outputPreviewHtml(): string {
    if (!this.output.trim()) return '';
    try {
      if (this.mode === 'html-to-md') {
        // Output is Markdown — render as HTML
        return marked.parse(this.output, { async: false }) as string;
      } else {
        // Output is HTML — render directly
        return this.output;
      }
    } catch {
      return '<em>Preview unavailable</em>';
    }
  }

  toggleMode(): void {
    this.mode = this.mode === 'html-to-md' ? 'md-to-html' : 'html-to-md';
    this.errorMessage = '';
  }

  convert(): void {
    this.errorMessage = '';
    this.output = '';

    if (!this.input.trim()) return;

    try {
      if (this.mode === 'html-to-md') {
        this.output = this.turndown.turndown(this.input);
      } else {
        this.output = marked.parse(this.input, { async: false }) as string;
      }
    } catch (e: any) {
      this.errorMessage = e.message || 'Conversion failed';
    }
  }

  swap(): void {
    const temp = this.input;
    this.input = this.output;
    this.output = temp;
    this.mode = this.mode === 'html-to-md' ? 'md-to-html' : 'html-to-md';
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
