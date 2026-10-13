import { Injectable } from '@angular/core';

export interface ColumnDef {
  name: string;
  type: string;
  nullable: boolean;
}

const FIRST_NAMES = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Christopher', 'Karen'];
const LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];
const CITIES = ['Portland', 'Seattle', 'Denver', 'Austin', 'Chicago', 'Phoenix', 'San Diego', 'Dallas', 'Orlando', 'Nashville'];
const STATES = ['OR', 'WA', 'CO', 'TX', 'IL', 'AZ', 'CA', 'FL', 'TN', 'NY'];
const STREETS = ['Main St', 'Oak Ave', 'Elm Blvd', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Birch Way', 'Walnut St', 'Cherry Ct', 'Spruce Pl'];
const DOMAINS = ['example.com', 'test.org', 'sample.net', 'demo.io', 'mock.dev'];
const COMPANIES = ['Acme Corp', 'Globex Inc', 'Initech', 'Hooli', 'Pied Piper', 'Dunder Mifflin', 'Wayne Enterprises', 'Stark Industries', 'Umbrella Corp', 'Cyberdyne Systems'];

@Injectable({ providedIn: 'root' })
export class DataGeneratorService {

  generateJson(columns: ColumnDef[], rowCount: number): string {
    const rows = this.generateRows(columns, rowCount);
    return JSON.stringify(rows, null, 2);
  }

  generateInserts(columns: ColumnDef[], rowCount: number, tableName: string): string {
    const rows = this.generateRows(columns, rowCount);
    const colNames = columns.map(c => `[${c.name}]`).join(', ');
    const lines: string[] = [];

    for (const row of rows) {
      const values = columns.map(c => this.sqlValue(row[c.name], c.type));
      lines.push(`INSERT INTO [${tableName}] (${colNames}) VALUES (${values.join(', ')});`);
    }

    return lines.join('\n');
  }

  parseCreateTable(sql: string): { tableName: string; columns: ColumnDef[] } {
    const tableMatch = sql.match(/CREATE\s+TABLE\s+(?:\[?(\w+)\]?\.?)?\[?(\w+)\]?/i);
    if (!tableMatch) throw new Error('Could not parse CREATE TABLE statement.');

    const tableName = tableMatch[2];
    const columns: ColumnDef[] = [];

    // Extract content between parentheses
    const parenMatch = sql.match(/\(([^)]+(?:\([^)]*\))?[^)]*)\)/s);
    if (!parenMatch) throw new Error('Could not find column definitions.');

    const body = parenMatch[1];
    const colLines = body.split(',').map(l => l.trim()).filter(l => l && !l.match(/^\s*(PRIMARY|FOREIGN|CONSTRAINT|INDEX|UNIQUE)/i));

    for (const line of colLines) {
      const colMatch = line.match(/^\[?(\w+)\]?\s+(\w+(?:\([^)]*\))?)/i);
      if (colMatch) {
        columns.push({
          name: colMatch[1],
          type: this.normalizeType(colMatch[2]),
          nullable: !line.toUpperCase().includes('NOT NULL'),
        });
      }
    }

    return { tableName, columns };
  }

  private generateRows(columns: ColumnDef[], rowCount: number): Record<string, any>[] {
    const rows: Record<string, any>[] = [];
    for (let i = 0; i < rowCount; i++) {
      const row: Record<string, any> = {};
      for (const col of columns) {
        row[col.name] = this.generateValue(col, i);
      }
      rows.push(row);
    }
    return rows;
  }

  private generateValue(col: ColumnDef, index: number): any {
    const nameLower = col.name.toLowerCase();
    const type = col.type.toLowerCase();

    // Smart generation based on column name
    if (nameLower.includes('id') && (type.includes('int') || type.includes('uniqueidentifier'))) {
      if (type.includes('uniqueidentifier') || nameLower === 'guid') {
        return this.randomGuid();
      }
      return index + 1;
    }

    if (nameLower.includes('email')) return this.randomEmail(index);
    if (nameLower.includes('firstname') || nameLower === 'first_name') return this.pick(FIRST_NAMES);
    if (nameLower.includes('lastname') || nameLower === 'last_name') return this.pick(LAST_NAMES);
    if (nameLower.includes('name') && !nameLower.includes('table') && !nameLower.includes('col')) return `${this.pick(FIRST_NAMES)} ${this.pick(LAST_NAMES)}`;
    if (nameLower.includes('phone')) return this.randomPhone();
    if (nameLower.includes('city')) return this.pick(CITIES);
    if (nameLower.includes('state')) return this.pick(STATES);
    if (nameLower.includes('zip') || nameLower.includes('postal')) return String(this.randomInt(10000, 99999));
    if (nameLower.includes('street') || nameLower.includes('address')) return `${this.randomInt(100, 9999)} ${this.pick(STREETS)}`;
    if (nameLower.includes('country')) return 'US';
    if (nameLower.includes('company') || nameLower.includes('organization')) return this.pick(COMPANIES);
    if (nameLower.includes('url') || nameLower.includes('website')) return `https://www.${this.pick(DOMAINS)}/${index + 1}`;
    if (nameLower.includes('description') || nameLower.includes('notes')) return `Sample description ${index + 1}`;
    if (nameLower.includes('title')) return `Title ${index + 1}`;
    if (nameLower.includes('active') || nameLower.includes('enabled') || nameLower.includes('is_')) return Math.random() > 0.3;
    if (nameLower.includes('created') || nameLower.includes('updated') || nameLower.includes('date')) return this.randomDate();
    if (nameLower.includes('amount') || nameLower.includes('price') || nameLower.includes('cost')) return +(Math.random() * 1000).toFixed(2);
    if (nameLower.includes('quantity') || nameLower.includes('count') || nameLower.includes('age')) return this.randomInt(1, 100);

    // Fall back to type-based generation
    return this.generateByType(type, index);
  }

  private generateByType(type: string, index: number): any {
    if (type.includes('int') || type.includes('bigint') || type.includes('smallint') || type.includes('tinyint')) {
      return this.randomInt(1, 1000);
    }
    if (type.includes('decimal') || type.includes('numeric') || type.includes('float') || type.includes('real') || type.includes('money')) {
      return +(Math.random() * 1000).toFixed(2);
    }
    if (type.includes('bit') || type.includes('bool')) {
      return Math.random() > 0.5;
    }
    if (type.includes('date') || type.includes('time')) {
      return this.randomDate();
    }
    if (type.includes('uniqueidentifier') || type.includes('guid')) {
      return this.randomGuid();
    }
    // Default: string
    return `value_${index + 1}`;
  }

  private sqlValue(value: any, type: string): string {
    if (value === null) return 'NULL';
    if (typeof value === 'boolean') return value ? '1' : '0';
    if (typeof value === 'number') return String(value);
    if (type.toLowerCase().includes('uniqueidentifier')) return `'${value}'`;
    return `'${String(value).replace(/'/g, "''")}'`;
  }

  private normalizeType(type: string): string {
    return type.replace(/\(.+\)/, '').trim().toLowerCase();
  }

  private pick<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomEmail(index: number): string {
    const first = this.pick(FIRST_NAMES).toLowerCase();
    const last = this.pick(LAST_NAMES).toLowerCase();
    return `${first}.${last}${index > 0 ? index : ''}@${this.pick(DOMAINS)}`;
  }

  private randomPhone(): string {
    return `(${this.randomInt(200, 999)}) ${this.randomInt(200, 999)}-${this.randomInt(1000, 9999)}`;
  }

  private randomDate(): string {
    const start = new Date(2020, 0, 1).getTime();
    const end = new Date(2025, 11, 31).getTime();
    const d = new Date(start + Math.random() * (end - start));
    return d.toISOString().split('T')[0];
  }

  private randomGuid(): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
}
