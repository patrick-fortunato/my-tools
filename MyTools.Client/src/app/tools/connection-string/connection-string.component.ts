import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface ProviderField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  default?: string;
  options?: string[];
  placeholder?: string;
}

interface Provider {
  key: string;
  label: string;
  fields: ProviderField[];
  template: string; // Template with {fieldKey} placeholders
}

@Component({
  selector: 'app-connection-string',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './connection-string.component.html',
  styleUrl: './connection-string.component.scss',
})
export class ConnectionStringComponent {
  mode: 'build' | 'parse' = 'build';
  selectedProvider = 'sqlserver';
  fieldValues: Record<string, string> = {};
  output = '';
  parseInput = '';
  parsedFields: { key: string; value: string }[] = [];
  errorMessage = '';

  providers: Provider[] = [
    {
      key: 'sqlserver',
      label: 'SQL Server',
      fields: [
        { key: 'server', label: 'Server', type: 'text', placeholder: 'localhost\\SQLEXPRESS' },
        { key: 'database', label: 'Database', type: 'text', placeholder: 'MyDatabase' },
        { key: 'auth', label: 'Authentication', type: 'select', options: ['SQL Server', 'Windows (Trusted)'], default: 'SQL Server' },
        { key: 'user', label: 'User ID', type: 'text', placeholder: 'sa' },
        { key: 'password', label: 'Password', type: 'text', placeholder: '' },
        { key: 'encrypt', label: 'Encrypt', type: 'select', options: ['True', 'False', 'Optional'], default: 'True' },
        { key: 'trustCert', label: 'Trust Server Certificate', type: 'select', options: ['True', 'False'], default: 'False' },
        { key: 'timeout', label: 'Connection Timeout', type: 'text', default: '30', placeholder: '30' },
        { key: 'appName', label: 'Application Name', type: 'text', placeholder: '' },
      ],
      template: '',
    },
    {
      key: 'postgresql',
      label: 'PostgreSQL',
      fields: [
        { key: 'host', label: 'Host', type: 'text', placeholder: 'localhost' },
        { key: 'port', label: 'Port', type: 'text', default: '5432', placeholder: '5432' },
        { key: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
        { key: 'user', label: 'Username', type: 'text', placeholder: 'postgres' },
        { key: 'password', label: 'Password', type: 'text', placeholder: '' },
        { key: 'sslmode', label: 'SSL Mode', type: 'select', options: ['Prefer', 'Require', 'Disable'], default: 'Prefer' },
        { key: 'timeout', label: 'Timeout', type: 'text', default: '15', placeholder: '15' },
      ],
      template: '',
    },
    {
      key: 'mysql',
      label: 'MySQL',
      fields: [
        { key: 'server', label: 'Server', type: 'text', placeholder: 'localhost' },
        { key: 'port', label: 'Port', type: 'text', default: '3306', placeholder: '3306' },
        { key: 'database', label: 'Database', type: 'text', placeholder: 'mydb' },
        { key: 'user', label: 'User', type: 'text', placeholder: 'root' },
        { key: 'password', label: 'Password', type: 'text', placeholder: '' },
        { key: 'sslmode', label: 'SSL Mode', type: 'select', options: ['None', 'Preferred', 'Required'], default: 'Preferred' },
      ],
      template: '',
    },
    {
      key: 'sqlite',
      label: 'SQLite',
      fields: [
        { key: 'datasource', label: 'Data Source', type: 'text', placeholder: 'C:\\data\\mydb.db' },
        { key: 'mode', label: 'Mode', type: 'select', options: ['ReadWriteCreate', 'ReadWrite', 'ReadOnly', 'Memory'], default: 'ReadWriteCreate' },
        { key: 'cache', label: 'Cache', type: 'select', options: ['Default', 'Shared', 'Private'], default: 'Default' },
        { key: 'password', label: 'Password', type: 'text', placeholder: '(optional)' },
      ],
      template: '',
    },
  ];

  get currentProvider(): Provider {
    return this.providers.find(p => p.key === this.selectedProvider) ?? this.providers[0];
  }

  get visibleFields(): ProviderField[] {
    const provider = this.currentProvider;
    if (provider.key === 'sqlserver') {
      const auth = this.fieldValues['auth'] ?? 'SQL Server';
      if (auth === 'Windows (Trusted)') {
        return provider.fields.filter(f => !['user', 'password'].includes(f.key));
      }
    }
    return provider.fields;
  }

  onProviderChange(): void {
    this.fieldValues = {};
    this.output = '';
    this.errorMessage = '';
    // Set defaults
    for (const field of this.currentProvider.fields) {
      if (field.default) {
        this.fieldValues[field.key] = field.default;
      }
    }
  }

  build(): void {
    this.errorMessage = '';
    this.output = '';

    const provider = this.currentProvider;
    let result = '';

    switch (provider.key) {
      case 'sqlserver':
        result = this.buildSqlServer();
        break;
      case 'postgresql':
        result = this.buildPostgresql();
        break;
      case 'mysql':
        result = this.buildMySql();
        break;
      case 'sqlite':
        result = this.buildSqlite();
        break;
    }

    this.output = result;
  }

  parse(): void {
    this.errorMessage = '';
    this.parsedFields = [];

    if (!this.parseInput.trim()) return;

    try {
      // Generic key=value; parser
      const parts = this.parseInput.split(';').filter(p => p.trim());
      for (const part of parts) {
        const eqIndex = part.indexOf('=');
        if (eqIndex > 0) {
          this.parsedFields.push({
            key: part.substring(0, eqIndex).trim(),
            value: part.substring(eqIndex + 1).trim(),
          });
        }
      }
      if (this.parsedFields.length === 0) {
        this.errorMessage = 'Could not parse connection string. Expected key=value pairs separated by semicolons.';
      }
    } catch (e: any) {
      this.errorMessage = e.message;
    }
  }

  copyOutput(): void {
    navigator.clipboard.writeText(this.output);
  }

  clear(): void {
    this.fieldValues = {};
    this.output = '';
    this.parseInput = '';
    this.parsedFields = [];
    this.errorMessage = '';
  }

  private buildSqlServer(): string {
    const parts: string[] = [];
    const v = this.fieldValues;

    if (v['server']) parts.push(`Server=${v['server']}`);
    if (v['database']) parts.push(`Database=${v['database']}`);

    if (v['auth'] === 'Windows (Trusted)') {
      parts.push('Trusted_Connection=True');
    } else {
      if (v['user']) parts.push(`User Id=${v['user']}`);
      if (v['password']) parts.push(`Password=${v['password']}`);
    }

    if (v['encrypt'] && v['encrypt'] !== 'True') parts.push(`Encrypt=${v['encrypt']}`);
    else if (v['encrypt'] === 'True') parts.push('Encrypt=True');

    if (v['trustCert'] === 'True') parts.push('TrustServerCertificate=True');
    if (v['timeout'] && v['timeout'] !== '30') parts.push(`Connection Timeout=${v['timeout']}`);
    if (v['appName']) parts.push(`Application Name=${v['appName']}`);

    return parts.join(';') + ';';
  }

  private buildPostgresql(): string {
    const parts: string[] = [];
    const v = this.fieldValues;

    if (v['host']) parts.push(`Host=${v['host']}`);
    if (v['port'] && v['port'] !== '5432') parts.push(`Port=${v['port']}`);
    if (v['database']) parts.push(`Database=${v['database']}`);
    if (v['user']) parts.push(`Username=${v['user']}`);
    if (v['password']) parts.push(`Password=${v['password']}`);
    if (v['sslmode'] && v['sslmode'] !== 'Prefer') parts.push(`SSL Mode=${v['sslmode']}`);
    if (v['timeout'] && v['timeout'] !== '15') parts.push(`Timeout=${v['timeout']}`);

    return parts.join(';') + ';';
  }

  private buildMySql(): string {
    const parts: string[] = [];
    const v = this.fieldValues;

    if (v['server']) parts.push(`Server=${v['server']}`);
    if (v['port'] && v['port'] !== '3306') parts.push(`Port=${v['port']}`);
    if (v['database']) parts.push(`Database=${v['database']}`);
    if (v['user']) parts.push(`Uid=${v['user']}`);
    if (v['password']) parts.push(`Pwd=${v['password']}`);
    if (v['sslmode'] && v['sslmode'] !== 'Preferred') parts.push(`SslMode=${v['sslmode']}`);

    return parts.join(';') + ';';
  }

  private buildSqlite(): string {
    const parts: string[] = [];
    const v = this.fieldValues;

    if (v['datasource']) parts.push(`Data Source=${v['datasource']}`);
    if (v['mode'] && v['mode'] !== 'ReadWriteCreate') parts.push(`Mode=${v['mode']}`);
    if (v['cache'] && v['cache'] !== 'Default') parts.push(`Cache=${v['cache']}`);
    if (v['password']) parts.push(`Password=${v['password']}`);

    return parts.join(';') + ';';
  }
}
