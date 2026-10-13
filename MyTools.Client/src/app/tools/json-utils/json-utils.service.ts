import { Injectable } from '@angular/core';

export interface JsonStats {
  keyCount: number;
  maxDepth: number;
  sizeBytes: number;
  types: Record<string, number>;
  arrayCount: number;
  objectCount: number;
}

export interface TreeNode {
  key: string;
  value: any;
  type: string;
  children?: TreeNode[];
  expanded?: boolean;
}

export interface DiffResult {
  left: DiffLine[];
  right: DiffLine[];
}

export interface DiffLine {
  text: string;
  type: 'same' | 'added' | 'removed' | 'changed';
}

@Injectable({ providedIn: 'root' })
export class JsonUtilsService {

  validate(input: string): { valid: boolean; error?: string } {
    try {
      JSON.parse(input);
      return { valid: true };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  format(input: string, indent = 2): string {
    return JSON.stringify(JSON.parse(input), null, indent);
  }

  minify(input: string): string {
    return JSON.stringify(JSON.parse(input));
  }

  stringify(input: string): string {
    // Takes a JSON object/value and returns it as an escaped JSON string literal
    const parsed = JSON.parse(input); // Validate it's valid JSON first
    return JSON.stringify(JSON.stringify(parsed));
  }

  parseStringified(input: string): string {
    // Takes a stringified/escaped JSON string and parses it back to formatted JSON
    // Handle common cases: input might be wrapped in quotes or might be raw escaped content
    let toParse = input.trim();

    // If it starts and ends with quotes, it's a JSON string literal
    if ((toParse.startsWith('"') && toParse.endsWith('"')) ||
        (toParse.startsWith("'") && toParse.endsWith("'"))) {
      // Parse the outer string to unescape it
      try {
        toParse = JSON.parse(toParse);
      } catch {
        // If that fails, strip quotes and manually unescape
        toParse = toParse.slice(1, -1)
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r');
      }
    } else {
      // Try unescaping common escape sequences for raw pasted escaped content
      toParse = toParse
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\r/g, '\r');
    }

    // Now parse the inner JSON and format it
    const obj = JSON.parse(toParse);
    return JSON.stringify(obj, null, 2);
  }

  sortKeys(input: string): string {
    const obj = JSON.parse(input);
    const sorted = this.sortRecursive(obj);
    return JSON.stringify(sorted, null, 2);
  }

  flatten(input: string, delimiter = '.'): string {
    const obj = JSON.parse(input);
    const result = this.flattenObject(obj, '', delimiter);
    return JSON.stringify(result, null, 2);
  }

  unflatten(input: string, delimiter = '.'): string {
    const obj = JSON.parse(input);
    const result = this.unflattenObject(obj, delimiter);
    return JSON.stringify(result, null, 2);
  }

  removeNulls(input: string): string {
    const obj = JSON.parse(input);
    const cleaned = this.stripNulls(obj);
    return JSON.stringify(cleaned, null, 2);
  }

  query(input: string, path: string): string {
    const obj = JSON.parse(input);
    const result = this.evaluateJsonPath(obj, path);
    return JSON.stringify(result, null, 2);
  }

  buildTree(input: string): TreeNode[] {
    const obj = JSON.parse(input);
    return this.objectToTree(obj, 'root');
  }

  generateSchema(input: string): string {
    const obj = JSON.parse(input);
    const schema = this.inferSchema(obj);
    return JSON.stringify(schema, null, 2);
  }

  compare(leftInput: string, rightInput: string): DiffResult {
    const leftLines = this.format(leftInput).split('\n');
    const rightLines = this.format(rightInput).split('\n');
    return this.computeDiff(leftLines, rightLines);
  }

  getStats(input: string): JsonStats {
    const obj = JSON.parse(input);
    const raw = input;
    const types: Record<string, number> = {};
    let keyCount = 0;
    let arrayCount = 0;
    let objectCount = 0;

    const countTypes = (val: any) => {
      if (val === null) {
        types['null'] = (types['null'] || 0) + 1;
      } else if (Array.isArray(val)) {
        arrayCount++;
        types['array'] = (types['array'] || 0) + 1;
        val.forEach(countTypes);
      } else if (typeof val === 'object') {
        objectCount++;
        types['object'] = (types['object'] || 0) + 1;
        Object.keys(val).forEach(k => {
          keyCount++;
          countTypes(val[k]);
        });
      } else {
        const t = typeof val;
        types[t] = (types[t] || 0) + 1;
      }
    };

    countTypes(obj);

    return {
      keyCount,
      maxDepth: this.getDepth(obj),
      sizeBytes: new TextEncoder().encode(raw).length,
      types,
      arrayCount,
      objectCount,
    };
  }

  // --- Private helpers ---

  private sortRecursive(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortRecursive(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const sorted: Record<string, any> = {};
      Object.keys(obj).sort((a, b) => a.localeCompare(b)).forEach(key => {
        sorted[key] = this.sortRecursive(obj[key]);
      });
      return sorted;
    }
    return obj;
  }

  private flattenObject(obj: any, prefix: string, delimiter: string): Record<string, any> {
    const result: Record<string, any> = {};

    for (const key of Object.keys(obj)) {
      const newKey = prefix ? `${prefix}${delimiter}${key}` : key;
      const value = obj[key];

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(result, this.flattenObject(value, newKey, delimiter));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item !== null && typeof item === 'object') {
            Object.assign(result, this.flattenObject(item, `${newKey}[${index}]`, delimiter));
          } else {
            result[`${newKey}[${index}]`] = item;
          }
        });
      } else {
        result[newKey] = value;
      }
    }

    return result;
  }

  private unflattenObject(obj: Record<string, any>, delimiter: string): any {
    const result: any = {};

    for (const key of Object.keys(obj)) {
      const parts = key.split(delimiter).reduce<string[]>((acc, part) => {
        // Handle array notation: key[0] -> key, 0
        const arrayMatch = part.match(/^(.+?)\[(\d+)\]$/);
        if (arrayMatch) {
          acc.push(arrayMatch[1], arrayMatch[2]);
        } else {
          acc.push(part);
        }
        return acc;
      }, []);

      let current = result;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        const nextPart = parts[i + 1];
        const isNextArray = /^\d+$/.test(nextPart);

        if (current[part] === undefined) {
          current[part] = isNextArray ? [] : {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = obj[key];
    }

    return result;
  }

  private stripNulls(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => this.stripNulls(item)).filter(item => item !== null && item !== undefined);
    }
    if (obj !== null && typeof obj === 'object') {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === null || value === undefined || value === '') continue;
        const cleaned = this.stripNulls(value);
        if (cleaned !== null && cleaned !== undefined && cleaned !== '') {
          result[key] = cleaned;
        }
      }
      return Object.keys(result).length > 0 ? result : null;
    }
    return obj;
  }

  private evaluateJsonPath(obj: any, path: string): any {
    // Simple JSONPath implementation: supports $.key.key, [index], [*]
    let expression = path.trim();
    if (expression.startsWith('$')) {
      expression = expression.substring(1);
    }
    if (expression.startsWith('.')) {
      expression = expression.substring(1);
    }

    const tokens = this.tokenizePath(expression);
    let current: any = obj;

    for (const token of tokens) {
      if (current === undefined || current === null) return undefined;

      if (token === '*') {
        if (Array.isArray(current)) {
          return current;
        } else if (typeof current === 'object') {
          return Object.values(current);
        }
        return undefined;
      }

      const indexMatch = token.match(/^\[(\d+)\]$/);
      if (indexMatch) {
        current = current[parseInt(indexMatch[1], 10)];
      } else if (token.startsWith('[') && token.endsWith(']')) {
        const inner = token.slice(1, -1);
        if (inner === '*') {
          if (Array.isArray(current)) return current;
          return Object.values(current);
        }
        current = current[parseInt(inner, 10)];
      } else {
        current = current[token];
      }
    }

    return current;
  }

  private tokenizePath(expression: string): string[] {
    const tokens: string[] = [];
    let current = '';

    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (char === '.') {
        if (current) tokens.push(current);
        current = '';
      } else if (char === '[') {
        if (current) tokens.push(current);
        current = '[';
      } else if (char === ']') {
        current += ']';
        tokens.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  private objectToTree(obj: any, key: string): TreeNode[] {
    if (Array.isArray(obj)) {
      return [{
        key,
        value: `Array(${obj.length})`,
        type: 'array',
        expanded: true,
        children: obj.map((item, i) => this.objectToTree(item, `[${i}]`)).flat(),
      }];
    }
    if (obj !== null && typeof obj === 'object') {
      return [{
        key,
        value: `Object {${Object.keys(obj).length}}`,
        type: 'object',
        expanded: true,
        children: Object.entries(obj).map(([k, v]) => this.objectToTree(v, k)).flat(),
      }];
    }
    return [{
      key,
      value: obj,
      type: obj === null ? 'null' : typeof obj,
      expanded: false,
    }];
  }

  private inferSchema(obj: any, depth = 0): any {
    if (obj === null) return { type: 'null' };
    if (Array.isArray(obj)) {
      const schema: any = { type: 'array' };
      if (obj.length > 0) {
        schema.items = this.inferSchema(obj[0], depth + 1);
      }
      return schema;
    }
    if (typeof obj === 'object') {
      const schema: any = {
        type: 'object',
        properties: {} as Record<string, any>,
        required: Object.keys(obj),
      };
      for (const [key, value] of Object.entries(obj)) {
        schema.properties[key] = this.inferSchema(value, depth + 1);
      }
      return depth === 0
        ? { $schema: 'https://json-schema.org/draft/2020-12/schema', ...schema }
        : schema;
    }
    if (typeof obj === 'number') {
      return Number.isInteger(obj) ? { type: 'integer' } : { type: 'number' };
    }
    return { type: typeof obj };
  }

  private computeDiff(leftLines: string[], rightLines: string[]): DiffResult {
    const left: DiffLine[] = [];
    const right: DiffLine[] = [];

    const maxLen = Math.max(leftLines.length, rightLines.length);
    for (let i = 0; i < maxLen; i++) {
      const l = leftLines[i];
      const r = rightLines[i];

      if (l === undefined) {
        left.push({ text: '', type: 'same' });
        right.push({ text: r, type: 'added' });
      } else if (r === undefined) {
        left.push({ text: l, type: 'removed' });
        right.push({ text: '', type: 'same' });
      } else if (l === r) {
        left.push({ text: l, type: 'same' });
        right.push({ text: r, type: 'same' });
      } else {
        left.push({ text: l, type: 'changed' });
        right.push({ text: r, type: 'changed' });
      }
    }

    return { left, right };
  }

  private getDepth(obj: any, current = 0): number {
    if (obj === null || typeof obj !== 'object') return current;
    if (Array.isArray(obj)) {
      return Math.max(current + 1, ...obj.map(item => this.getDepth(item, current + 1)));
    }
    const depths = Object.values(obj).map(v => this.getDepth(v, current + 1));
    return Math.max(current + 1, ...depths);
  }
}
