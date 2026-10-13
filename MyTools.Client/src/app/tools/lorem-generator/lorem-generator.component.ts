import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type GenerateType = 'paragraphs' | 'sentences' | 'words';

@Component({
  selector: 'app-lorem-generator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './lorem-generator.component.html',
  styleUrl: './lorem-generator.component.scss',
})
export class LoremGeneratorComponent {
  generateType: GenerateType = 'paragraphs';
  count = 3;
  output = '';

  private readonly corpus: string[] = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
    'Curabitur pretium tincidunt lacus, nulla gravida orci a odio.',
    'Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris.',
    'Integer in mauris eu nibh euismod gravida.',
    'Duis ac tellus et risus vulputate vehicula.',
    'Donec lobortis risus a elit, etiam sed pede mollis, mauris blandit penibus, sed non quam.',
    'Proin vel arcu leo, tempus scelerisque sagittis.',
    'Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.',
    'Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante.',
    'Donec eu libero sit amet quam egestas semper, aenean ultricies mi vitae est.',
    'Mauris placerat eleifend leo, quisque sit amet est et sapien ullamcorper pharetra.',
    'Vivamus fermentum semper porta, nunc diam velit, adipiscing ut tristique vitae, sagittis vel odio.',
    'Maecenas malesuada elit lectus felis, malesuada ultricies.',
    'Curabitur et ligula, ut molestie lectus erat.',
    'Praesent blandit dolor sed nunc vestibulum accumsan.',
    'Quisque ligula eros ullamcorper quis, lacinia quis facilisis sed sapien.',
    'Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh.',
    'Ut fermentum massa justo sit amet risus, etiam porta sem malesuada magna mollis euismod.',
    'Aenean lacinia bibendum nulla sed consectetur, praesent commodo cursus magna.',
    'Vel scelerisque nisl consectetur et, cras mattis consectetur purus sit amet fermentum.',
    'Sed posuere consectetur est at lobortis, donec id elit non mi porta gravida at eget metus.',
    'Maecenas sed diam eget risus varius blandit sit amet non magna.',
    'Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
    'Morbi leo risus, porta ac consectetur ac, vestibulum at eros.',
    'Nullam quis risus eget urna mollis ornare vel eu leo.',
    'Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.',
  ];

  generate(): void {
    switch (this.generateType) {
      case 'paragraphs':
        this.output = this.generateParagraphs(this.count);
        break;
      case 'sentences':
        this.output = this.generateSentences(this.count);
        break;
      case 'words':
        this.output = this.generateWords(this.count);
        break;
    }
  }

  clear(): void {
    this.output = '';
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
  }

  private generateParagraphs(count: number): string {
    const paragraphs: string[] = [];
    for (let i = 0; i < count; i++) {
      const sentenceCount = 4 + Math.floor(Math.random() * 4); // 4-7 sentences per paragraph
      const sentences: string[] = [];
      for (let j = 0; j < sentenceCount; j++) {
        const idx = (i * sentenceCount + j) % this.corpus.length;
        sentences.push(this.corpus[idx]);
      }
      paragraphs.push(sentences.join(' '));
    }
    return paragraphs.join('\n\n');
  }

  private generateSentences(count: number): string {
    const sentences: string[] = [];
    for (let i = 0; i < count; i++) {
      sentences.push(this.corpus[i % this.corpus.length]);
    }
    return sentences.join(' ');
  }

  private generateWords(count: number): string {
    const allWords = this.corpus.join(' ').split(/\s+/);
    const words: string[] = [];
    for (let i = 0; i < count; i++) {
      words.push(allWords[i % allWords.length]);
    }
    // Capitalize first word, add period at end
    if (words.length > 0) {
      words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
    }
    return words.join(' ').replace(/[.,]$/, '') + '.';
  }
}
