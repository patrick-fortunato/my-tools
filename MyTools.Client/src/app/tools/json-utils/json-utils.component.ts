import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JsonUtilsService, TreeNode, DiffResult, JsonStats } from './json-utils.service';

type Operation =
  | 'validate'
  | 'format'
  | 'minify'
  | 'sortKeys'
  | 'flatten'
  | 'unflatten'
  | 'removeNulls'
  | 'query'
  | 'tree'
  | 'schema'
  | 'compare'
  | 'stats'
  | 'stringify'
  | 'parse';

@Component({
  selector: 'app-json-utils',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './json-utils.component.html',
  styleUrl: './json-utils.component.scss',
})
export class JsonUtilsComponent {
  private service = inject(JsonUtilsService);

  input = '';
  input2 = ''; // For compare mode
  output = '';
  operation: Operation = 'format';
  queryPath = '$.';
  errorMessage = '';

  // Results for special views
  treeData: TreeNode[] = [];
  diffResult: DiffResult | null = null;
  stats: JsonStats | null = null;
  validationResult: { valid: boolean; error?: string } | null = null;

  operations: { key: Operation; label: string }[] = [
    { key: 'validate', label: 'Validate' },
    { key: 'format', label: 'Format' },
    { key: 'minify', label: 'Minify' },
    { key: 'stringify', label: 'Stringify' },
    { key: 'parse', label: 'Parse' },
    { key: 'sortKeys', label: 'Sort Keys' },
    { key: 'flatten', label: 'Flatten' },
    { key: 'unflatten', label: 'Unflatten' },
    { key: 'removeNulls', label: 'Remove Nulls' },
    { key: 'query', label: 'JSONPath' },
    { key: 'tree', label: 'Tree View' },
    { key: 'schema', label: 'Schema' },
    { key: 'compare', label: 'Compare' },
    { key: 'stats', label: 'Stats' },
  ];

  get showTextOutput(): boolean {
    return !['tree', 'compare', 'stats', 'validate'].includes(this.operation);
  }

  execute(): void {
    this.errorMessage = '';
    this.output = '';
    this.treeData = [];
    this.diffResult = null;
    this.stats = null;
    this.validationResult = null;

    if (!this.input.trim()) return;

    try {
      switch (this.operation) {
        case 'validate':
          this.validationResult = this.service.validate(this.input);
          break;
        case 'format':
          this.output = this.service.format(this.input);
          break;
        case 'minify':
          this.output = this.service.minify(this.input);
          break;
        case 'sortKeys':
          this.output = this.service.sortKeys(this.input);
          break;
        case 'flatten':
          this.output = this.service.flatten(this.input);
          break;
        case 'unflatten':
          this.output = this.service.unflatten(this.input);
          break;
        case 'removeNulls':
          this.output = this.service.removeNulls(this.input);
          break;
        case 'query':
          this.output = this.service.query(this.input, this.queryPath);
          break;
        case 'tree':
          this.treeData = this.service.buildTree(this.input);
          break;
        case 'schema':
          this.output = this.service.generateSchema(this.input);
          break;
        case 'compare':
          if (!this.input2.trim()) {
            this.errorMessage = 'Paste JSON in both panels to compare.';
            return;
          }
          this.diffResult = this.service.compare(this.input, this.input2);
          break;
        case 'stats':
          this.stats = this.service.getStats(this.input);
          break;
        case 'stringify':
          this.output = this.service.stringify(this.input);
          break;
        case 'parse':
          this.output = this.service.parseStringified(this.input);
          break;
      }
    } catch (e: any) {
      this.errorMessage = `Invalid JSON: ${e.message}`;
    }
  }

  clear(): void {
    this.input = '';
    this.input2 = '';
    this.output = '';
    this.errorMessage = '';
    this.treeData = [];
    this.diffResult = null;
    this.stats = null;
    this.validationResult = null;
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
  }

  toggleNode(node: TreeNode): void {
    node.expanded = !node.expanded;
  }

  formatValue(value: any): string {
    if (value === null) return 'null';
    if (typeof value === 'string') return `"${value}"`;
    return String(value);
  }
}
