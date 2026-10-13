export interface Tool {
  name: string;
  description: string;
  route: string;
  icon: string;
}

export interface ToolCategory {
  name: string;
  tools: Tool[];
}

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    name: 'Data & Database',
    tools: [
      { name: 'SQL Formatter', description: 'Format and minify SQL with T-SQL awareness', route: '/tools/sql-formatter', icon: '🗃️' },
      { name: 'Connection Strings', description: 'Build and parse database connection strings', route: '/tools/connection-string', icon: '🔗' },
      { name: 'Data Generator', description: 'Generate realistic test data from schema definitions', route: '/tools/data-generator', icon: '🏭' },
      { name: 'GUID Generator', description: 'Generate GUIDs in multiple formats', route: '/tools/guid-generator', icon: '🆔' },
    ],
  },
  {
    name: 'Security / Encoding',
    tools: [
      { name: 'Base64', description: 'Encode and decode Base64 strings', route: '/tools/base64', icon: '🔤' },
      { name: 'URL Encoder', description: 'Encode and decode URL strings', route: '/tools/url-encoder', icon: '🌐' },
      { name: 'Hash Generator', description: 'Generate MD5, SHA1, SHA256, SHA512, and HMAC hashes', route: '/tools/hash-generator', icon: '#️⃣' },
      { name: 'JWT Decoder', description: 'Decode and inspect JSON Web Tokens', route: '/tools/jwt-decoder', icon: '🔐' },
      { name: 'Password Generator', description: 'Generate secure passwords with configurable options', route: '/tools/password-generator', icon: '🔑' },
    ],
  },
  {
    name: 'Web / API',
    tools: [
      { name: 'Type Converter', description: 'Convert between JSON, C#, TypeScript, YAML, CSV, XML, and Query Strings', route: '/tools/json-csharp', icon: '🔄' },
      { name: 'JSON Utilities', description: 'Validate, format, compare, query, and transform JSON', route: '/tools/json-utils', icon: '🔧' },
      { name: 'Regex Tester', description: 'Test regex patterns with live matching and capture groups', route: '/tools/regex-tester', icon: '🔍' },
      { name: 'HTTP Headers', description: 'Parse and annotate HTTP headers', route: '/tools/http-headers', icon: '📡' },
      { name: 'Cron Builder', description: 'Build cron expressions and preview next run times', route: '/tools/cron-builder', icon: '⏰' },
      { name: 'Color Converter', description: 'Convert between hex, RGB, and HSL color formats', route: '/tools/color-converter', icon: '🎨' },
    ],
  },
  {
    name: 'Text / Formatting',
    tools: [
      { name: 'Diff Tool', description: 'Compare two text blocks side-by-side', route: '/tools/diff-tool', icon: '📝' },
      { name: 'String Case', description: 'Convert between camelCase, PascalCase, snake_case, and more', route: '/tools/string-case', icon: '🔠' },
      { name: 'Lorem Ipsum', description: 'Generate placeholder text', route: '/tools/lorem-generator', icon: '📄' },
      { name: 'Markdown Preview', description: 'Preview rendered Markdown with GFM support', route: '/tools/markdown-preview', icon: '📋' },
      { name: 'HTML ↔ Markdown', description: 'Convert between HTML and Markdown', route: '/tools/html-markdown', icon: '🔃' },
    ],
  },
];
