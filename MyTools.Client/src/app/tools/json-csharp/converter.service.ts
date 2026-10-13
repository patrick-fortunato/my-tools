import { Injectable } from '@angular/core';
import * as yaml from 'js-yaml';

export type Format = 'json' | 'csharp' | 'typescript' | 'yaml' | 'csv' | 'querystring' | 'xml';

export interface FormatOption {
  key: Format;
  label: string;
  canBeSource: boolean;
}

export const FORMATS: FormatOption[] = [
  { key: 'json', label: 'JSON', canBeSource: true },
  { key: 'csharp', label: 'C# Classes', canBeSource: true },
  { key: 'typescript', label: 'TypeScript', canBeSource: false },
  { key: 'yaml', label: 'YAML', canBeSource: true },
  { key: 'csv', label: 'CSV', canBeSource: true },
  { key: 'querystring', label: 'Query String', canBeSource: true },
  { key: 'xml', label: 'XML', canBeSource: true },
];

@Injectable({ providedIn: 'root' })
export class ConverterService {

  getValidTargets(source: Format): Format[] {
    if (source === 'typescript') return [];

    const allTargets: Format[] = ['json', 'csharp', 'typescript', 'yaml', 'csv', 'querystring', 'xml'];
    return allTargets.filter(t => {
      if (t === source) return false;
      // CSV and querystring targets only from sources that produce data (not type-only)
      return true;
    });
  }

  // Parse any source format to a JS object (except C# which needs the server)
  parseSource(input: string, source: Format): any {
    switch (source) {
      case 'json':
        return JSON.parse(input);
      case 'yaml':
        return yaml.load(input);
      case 'csv':
        return this.parseCsv(input);
      case 'querystring':
        return this.parseQueryString(input);
      case 'xml':
        return this.parseXml(input);
      default:
        throw new Error(`Cannot parse ${source} client-side.`);
    }
  }

  // Convert a JS object to any target format (except C# which is handled separately)
  convertToTarget(obj: any, target: Format, rootClassName = 'Root'): string {
    switch (target) {
      case 'json':
        return JSON.stringify(obj, null, 2);
      case 'typescript':
        return this.toTypeScript(obj, rootClassName);
      case 'yaml':
        return yaml.dump(obj, { indent: 2, lineWidth: 120 });
      case 'csv':
        return this.toCsv(obj);
      case 'querystring':
        return this.toQueryString(obj);
      case 'xml':
        return this.toXml(obj, rootClassName);
      case 'csharp':
        return this.toCSharp(obj, rootClassName);
      default:
        throw new Error(`Unsupported target: ${target}`);
    }
  }

  // --- C# generation (JSON → C#) ---

  private toCSharp(obj: any, rootClassName: string): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Input must be a JSON object (not an array or primitive).');
    }
    const classes: string[] = [];
    this.generateCSharpClass(rootClassName, obj, classes);
    return classes.join('\n\n');
  }

  private generateCSharpClass(className: string, obj: any, classes: string[]): void {
    const lines: string[] = [];
    lines.push('using System.Text.Json.Serialization;');
    lines.push('');
    lines.push(`public class ${className}`);
    lines.push('{');

    const entries = Object.entries(obj);
    for (let i = 0; i < entries.length; i++) {
      const [key, value] = entries[i];
      const pascalKey = this.toPascalCase(key);
      const typeInfo = this.inferCSharpType(key, value, classes);

      if (key !== pascalKey) {
        lines.push(`    [JsonPropertyName("${key}")]`);
      }
      lines.push(`    public ${typeInfo} ${pascalKey} { get; set; }`);
      if (i < entries.length - 1) lines.push('');
    }

    lines.push('}');
    classes.unshift(lines.join('\n'));
  }

  private inferCSharpType(key: string, value: any, classes: string[]): string {
    if (value === null || value === undefined) return 'string?';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'List<object>';
      return `List<${this.inferCSharpType(key, value[0], classes)}>`;
    }
    switch (typeof value) {
      case 'string':
        if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/.test(value) && !isNaN(Date.parse(value))) return 'DateTime';
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return 'Guid';
        return 'string';
      case 'number':
        return Number.isInteger(value) ? 'int' : 'double';
      case 'boolean':
        return 'bool';
      case 'object': {
        const nestedName = this.toPascalCase(key);
        this.generateCSharpClass(nestedName, value, classes);
        return nestedName;
      }
      default:
        return 'object';
    }
  }

  // --- TypeScript generation ---

  private toTypeScript(obj: any, rootName: string): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Input must be an object to generate TypeScript interfaces.');
    }
    const interfaces: string[] = [];
    this.generateTsInterface(rootName, obj, interfaces);
    return interfaces.join('\n\n');
  }

  private generateTsInterface(name: string, obj: any, interfaces: string[]): void {
    const lines: string[] = [];
    lines.push(`export interface ${name} {`);

    for (const [key, value] of Object.entries(obj)) {
      const tsType = this.inferTsType(key, value, interfaces);
      lines.push(`  ${key}: ${tsType};`);
    }

    lines.push('}');
    interfaces.unshift(lines.join('\n'));
  }

  private inferTsType(key: string, value: any, interfaces: string[]): string {
    if (value === null || value === undefined) return 'any';
    if (Array.isArray(value)) {
      if (value.length === 0) return 'any[]';
      return `${this.inferTsType(key, value[0], interfaces)}[]`;
    }
    switch (typeof value) {
      case 'string': return 'string';
      case 'number': return 'number';
      case 'boolean': return 'boolean';
      case 'object': {
        const nestedName = this.toPascalCase(key);
        this.generateTsInterface(nestedName, value, interfaces);
        return nestedName;
      }
      default: return 'any';
    }
  }

  // --- CSV ---

  private toCsv(obj: any): string {
    const rows = Array.isArray(obj) ? obj : [obj];
    if (rows.length === 0) return '';

    // Verify all items are flat objects
    for (const row of rows) {
      if (typeof row !== 'object' || row === null || Array.isArray(row)) {
        throw new Error('CSV output requires an array of flat objects.');
      }
      for (const val of Object.values(row)) {
        if (typeof val === 'object' && val !== null) {
          throw new Error('CSV output requires flat objects (no nested objects or arrays). Consider flattening first.');
        }
      }
    }

    const headers = Object.keys(rows[0]);
    const lines: string[] = [headers.map(h => this.csvEscape(h)).join(',')];

    for (const row of rows) {
      const values = headers.map(h => this.csvEscape(String(row[h] ?? '')));
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  private parseCsv(input: string): any[] {
    const lines = input.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one data row.');

    const headers = this.csvParseLine(lines[0]);
    const result: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.csvParseLine(lines[i]);
      const obj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        const val = values[idx] ?? '';
        // Try to parse numbers and booleans
        if (val === 'true') obj[h] = true;
        else if (val === 'false') obj[h] = false;
        else if (val !== '' && !isNaN(Number(val))) obj[h] = Number(val);
        else obj[h] = val;
      });
      result.push(obj);
    }

    return result;
  }

  private csvParseLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  }

  private csvEscape(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // --- Query String ---

  private toQueryString(obj: any): string {
    if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
      throw new Error('Query string output requires a flat object.');
    }
    for (const val of Object.values(obj)) {
      if (typeof val === 'object' && val !== null) {
        throw new Error('Query string output requires a flat object (no nested objects or arrays).');
      }
    }
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(obj)) {
      params.set(key, String(value ?? ''));
    }
    return params.toString();
  }

  private parseQueryString(input: string): Record<string, any> {
    const cleaned = input.startsWith('?') ? input.substring(1) : input;
    const params = new URLSearchParams(cleaned);
    const result: Record<string, any> = {};

    params.forEach((value, key) => {
      if (value === 'true') result[key] = true;
      else if (value === 'false') result[key] = false;
      else if (value !== '' && !isNaN(Number(value))) result[key] = Number(value);
      else result[key] = value;
    });

    return result;
  }

  // --- XML ---

  private toXml(obj: any, rootName: string): string {
    const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>'];
    this.objectToXmlLines(obj, rootName, lines, 0);
    return lines.join('\n');
  }

  private objectToXmlLines(obj: any, tagName: string, lines: string[], indent: number): void {
    const pad = '  '.repeat(indent);

    if (obj === null || obj === undefined) {
      lines.push(`${pad}<${tagName} />`);
      return;
    }

    if (Array.isArray(obj)) {
      lines.push(`${pad}<${tagName}>`);
      for (const item of obj) {
        this.objectToXmlLines(item, 'item', lines, indent + 1);
      }
      lines.push(`${pad}</${tagName}>`);
      return;
    }

    if (typeof obj === 'object') {
      lines.push(`${pad}<${tagName}>`);
      for (const [key, value] of Object.entries(obj)) {
        const safeKey = this.xmlSafeTag(key);
        this.objectToXmlLines(value, safeKey, lines, indent + 1);
      }
      lines.push(`${pad}</${tagName}>`);
      return;
    }

    lines.push(`${pad}<${tagName}>${this.xmlEscape(String(obj))}</${tagName}>`);
  }

  private parseXml(input: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/xml');

    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      throw new Error('Invalid XML: ' + parseError.textContent);
    }

    return this.xmlNodeToObject(doc.documentElement);
  }

  private xmlNodeToObject(node: Element): any {
    const children = Array.from(node.children);

    if (children.length === 0) {
      // Leaf node — return text content
      const text = node.textContent ?? '';
      if (text === '') return null;
      if (text === 'true') return true;
      if (text === 'false') return false;
      if (!isNaN(Number(text)) && text.trim() !== '') return Number(text);
      return text;
    }

    // Check if all children have the same tag name (array-like)
    const tagNames = children.map(c => c.tagName);
    const allSameTag = tagNames.every(t => t === tagNames[0]) && tagNames.length > 1;

    if (allSameTag) {
      return children.map(c => this.xmlNodeToObject(c));
    }

    // Object
    const result: Record<string, any> = {};
    for (const child of children) {
      const key = child.tagName;
      if (result[key] !== undefined) {
        // Duplicate keys → treat as array
        if (!Array.isArray(result[key])) {
          result[key] = [result[key]];
        }
        result[key].push(this.xmlNodeToObject(child));
      } else {
        result[key] = this.xmlNodeToObject(child);
      }
    }
    return result;
  }

  private xmlSafeTag(name: string): string {
    // XML tag names can't start with numbers or contain certain chars
    let safe = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    if (/^[^a-zA-Z_]/.test(safe)) safe = '_' + safe;
    return safe;
  }

  private xmlEscape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // --- Helpers ---

  private toPascalCase(str: string): string {
    return str
      .replace(/[-_](.)/g, (_, c) => c.toUpperCase())
      .replace(/^(.)/, (_, c) => c.toUpperCase());
  }
}
