import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-preview',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './markdown-preview.component.html',
  styleUrl: './markdown-preview.component.scss',
})
export class MarkdownPreviewComponent {
  input = '';
  renderedHtml: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  preview(): void {
    if (!this.input.trim()) {
      this.renderedHtml = '';
      return;
    }
    let html = marked.parse(this.input, { async: false }) as string;

    // Wrap <pre><code> blocks in a terminal-styled container
    html = html.replace(
      /<pre><code(.*?)>([\s\S]*?)<\/code><\/pre>/g,
      `<div class="terminal-block"><div class="terminal-header"><span class="terminal-dots">● ● ●</span><span class="terminal-title">Terminal</span></div><pre><code$1>$2</code></pre></div>`
    );

    this.renderedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  clear(): void {
    this.input = '';
    this.renderedHtml = '';
  }
}
