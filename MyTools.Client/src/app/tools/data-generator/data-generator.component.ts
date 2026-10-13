import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataGeneratorService, ColumnDef } from './data-generator.service';

@Component({
  selector: 'app-data-generator',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-generator.component.html',
  styleUrl: './data-generator.component.scss',
})
export class DataGeneratorComponent {
  private service = inject(DataGeneratorService);

  mode: 'manual' | 'sql' = 'manual';
  outputFormat: 'json' | 'insert' = 'json';
  tableName = 'MyTable';
  rowCount = 10;
  columns: ColumnDef[] = [
    { name: 'Id', type: 'int', nullable: false },
    { name: 'Name', type: 'varchar', nullable: false },
    { name: 'Email', type: 'varchar', nullable: true },
  ];
  sqlInput = '';
  output = '';
  errorMessage = '';

  typeOptions = [
    'int', 'bigint', 'smallint', 'tinyint',
    'varchar', 'nvarchar', 'char', 'text',
    'decimal', 'float', 'money',
    'bit',
    'datetime', 'date', 'datetime2',
    'uniqueidentifier',
  ];

  addColumn(): void {
    this.columns.push({ name: '', type: 'varchar', nullable: true });
  }

  removeColumn(index: number): void {
    this.columns.splice(index, 1);
  }

  generate(): void {
    this.errorMessage = '';
    this.output = '';

    try {
      let cols = this.columns;
      let table = this.tableName;

      if (this.mode === 'sql') {
        if (!this.sqlInput.trim()) {
          this.errorMessage = 'Paste a CREATE TABLE statement.';
          return;
        }
        const parsed = this.service.parseCreateTable(this.sqlInput);
        cols = parsed.columns;
        table = parsed.tableName;
        this.columns = cols;
        this.tableName = table;
      }

      if (cols.length === 0 || cols.some(c => !c.name.trim())) {
        this.errorMessage = 'All columns must have a name.';
        return;
      }

      if (this.outputFormat === 'json') {
        this.output = this.service.generateJson(cols, this.rowCount);
      } else {
        this.output = this.service.generateInserts(cols, this.rowCount, table);
      }
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
  }

  clear(): void {
    this.output = '';
    this.errorMessage = '';
  }
}
