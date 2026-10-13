import { Component, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ConverterService, Format, FORMATS, FormatOption } from './converter.service';

@Component({
  selector: 'app-json-csharp',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './json-csharp.component.html',
  styleUrl: './json-csharp.component.scss',
})
export class JsonCsharpComponent {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private converter = inject(ConverterService);
  private destroyRef = inject(DestroyRef);

  input = '';
  output = '';
  sourceFormat: Format = 'json';
  targetFormat: Format = 'csharp';
  rootClassName = 'Root';
  includeTestValues = false;
  errorMessage = '';
  isProcessing = false;

  formats: FormatOption[] = FORMATS;

  get sourceFormats(): FormatOption[] {
    return this.formats.filter(f => f.canBeSource);
  }

  get targetFormats(): FormatOption[] {
    const valid = this.converter.getValidTargets(this.sourceFormat);
    return this.formats.filter(f => valid.includes(f.key));
  }

  get showRootClassName(): boolean {
    return ['csharp', 'typescript', 'xml'].includes(this.targetFormat);
  }

  get showTestValues(): boolean {
    return this.sourceFormat === 'csharp' && this.targetFormat === 'json';
  }

  onSourceChange(): void {
    const validTargets = this.converter.getValidTargets(this.sourceFormat);
    if (!validTargets.includes(this.targetFormat)) {
      this.targetFormat = validTargets[0] ?? 'json';
    }
  }

  convert(): void {
    this.errorMessage = '';
    this.output = '';

    if (!this.input.trim()) return;

    // C# as source requires server-side parsing
    if (this.sourceFormat === 'csharp') {
      this.convertFromCSharp();
      return;
    }

    try {
      const intermediate = this.converter.parseSource(this.input, this.sourceFormat);

      if (this.targetFormat === 'csharp') {
        this.output = this.converter.convertToTarget(intermediate, 'csharp', this.rootClassName);
      } else {
        this.output = this.converter.convertToTarget(intermediate, this.targetFormat, this.rootClassName);
      }
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }

  private convertFromCSharp(): void {
    this.isProcessing = true;
    this.http
      .post<{ result?: any; error?: string }>('/api/tools/csharp-to-json', {
        csharpCode: this.input,
        includeTestValues: this.includeTestValues,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.error) {
            this.errorMessage = response.error;
          } else if (response.result) {
            try {
              if (this.targetFormat === 'json') {
                this.output = JSON.stringify(response.result, null, 2);
              } else {
                this.output = this.converter.convertToTarget(
                  response.result,
                  this.targetFormat,
                  this.rootClassName
                );
              }
            } catch (e: any) {
              this.errorMessage = e.message;
            }
          }
          this.isProcessing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          if (err.status === 400 && err.error?.error) {
            this.errorMessage = err.error.error;
          } else if (err.status === 0) {
            this.errorMessage = 'Failed to connect to the server. Is the API running?';
          } else {
            this.errorMessage = `Server error (${err.status}): ${err.error?.error || 'An unexpected error occurred.'}`;
          }
          this.isProcessing = false;
          this.cdr.detectChanges();
        },
      });
  }

  swap(): void {
    // Only swap if the output format can be a source
    const outputFormat = this.targetFormat;
    const outputFormatOption = this.formats.find(f => f.key === outputFormat);
    if (!outputFormatOption?.canBeSource) return;

    const temp = this.input;
    this.input = this.output;
    this.output = temp;

    const tempFormat = this.sourceFormat;
    this.sourceFormat = this.targetFormat;
    this.targetFormat = tempFormat;
    this.errorMessage = '';

    // Validate the new target is valid for the new source
    this.onSourceChange();
  }

  get canSwap(): boolean {
    const targetOption = this.formats.find(f => f.key === this.targetFormat);
    return targetOption?.canBeSource ?? false;
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
