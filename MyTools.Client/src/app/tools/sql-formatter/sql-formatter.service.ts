import { Injectable } from '@angular/core';

export interface SqlFormatOptions {
  keywordCase: 'upper' | 'lower' | 'preserve';
  indentSize: number;
}

const KEYWORDS_MAJOR = [
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN',
  'FULL JOIN', 'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
  'ON', 'AND', 'OR', 'ORDER BY', 'GROUP BY', 'HAVING', 'LIMIT', 'OFFSET',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM', 'CREATE TABLE',
  'ALTER TABLE', 'DROP TABLE', 'CREATE INDEX', 'DROP INDEX',
  'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
  'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'BEGIN', 'COMMIT', 'ROLLBACK',
  'DECLARE', 'EXEC', 'EXECUTE',
  'IF', 'ELSE IF', 'WHILE', 'RETURN',
  'TOP', 'DISTINCT', 'INTO', 'AS',
  'WITH', 'OVER', 'PARTITION BY',
  'EXISTS', 'NOT EXISTS', 'IN', 'NOT IN', 'BETWEEN', 'LIKE',
  'IS NULL', 'IS NOT NULL',
  'ASC', 'DESC', 'NOLOCK', 'WITH (NOLOCK)',
];

const KEYWORDS_ALL = [
  ...KEYWORDS_MAJOR,
  'INT', 'VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT',
  'BIT', 'BIGINT', 'SMALLINT', 'TINYINT', 'FLOAT', 'DECIMAL', 'NUMERIC', 'REAL',
  'DATE', 'DATETIME', 'DATETIME2', 'DATETIMEOFFSET', 'TIME', 'TIMESTAMP',
  'UNIQUEIDENTIFIER', 'VARBINARY', 'IMAGE', 'XML',
  'NULL', 'NOT NULL', 'DEFAULT', 'PRIMARY KEY', 'FOREIGN KEY', 'REFERENCES',
  'IDENTITY', 'CONSTRAINT', 'INDEX', 'UNIQUE', 'CLUSTERED', 'NONCLUSTERED',
  'GO', 'USE', 'DATABASE',
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'ISNULL', 'CAST', 'CONVERT',
  'GETDATE', 'NEWID', 'LEN', 'SUBSTRING', 'REPLACE', 'LTRIM', 'RTRIM', 'TRIM',
  'LEFT', 'RIGHT', 'UPPER', 'LOWER', 'CHARINDEX', 'STUFF', 'FORMAT',
  'ROW_NUMBER', 'RANK', 'DENSE_RANK', 'NTILE',
];

// Keywords that start a new line at indent level 0
const NEWLINE_BEFORE = new Set([
  'SELECT', 'FROM', 'WHERE', 'ORDER BY', 'GROUP BY', 'HAVING',
  'LIMIT', 'OFFSET', 'UNION', 'UNION ALL', 'EXCEPT', 'INTERSECT',
  'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE FROM',
  'CREATE TABLE', 'ALTER TABLE', 'DROP TABLE',
  'JOIN', 'INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN',
  'CROSS JOIN', 'LEFT OUTER JOIN', 'RIGHT OUTER JOIN', 'FULL OUTER JOIN',
  'WITH',
]);

// Keywords that start a new line indented
const NEWLINE_INDENTED = new Set([
  'AND', 'OR', 'ON', 'WHEN', 'THEN', 'ELSE',
]);

@Injectable({ providedIn: 'root' })
export class SqlFormatterService {

  format(sql: string, options: SqlFormatOptions): string {
    const tokens = this.tokenize(sql);
    const lines: string[] = [];
    let currentLine = '';
    let indentLevel = 0;
    const indent = ' '.repeat(options.indentSize);

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const upperToken = token.toUpperCase().trim();

      // Check for multi-word keywords
      const twoWord = i < tokens.length - 1
        ? (token + ' ' + tokens[i + 1]).toUpperCase().trim()
        : '';
      const threeWord = i < tokens.length - 2
        ? (token + ' ' + tokens[i + 1] + ' ' + tokens[i + 2]).toUpperCase().trim()
        : '';

      let matchedKeyword = '';
      if (NEWLINE_BEFORE.has(threeWord)) {
        matchedKeyword = threeWord;
      } else if (NEWLINE_BEFORE.has(twoWord)) {
        matchedKeyword = twoWord;
      } else if (NEWLINE_BEFORE.has(upperToken)) {
        matchedKeyword = upperToken;
      }

      if (matchedKeyword && NEWLINE_BEFORE.has(matchedKeyword)) {
        // Push current line and start new one
        if (currentLine.trim()) {
          lines.push(indent.repeat(indentLevel) + currentLine.trim());
        }
        currentLine = this.applyCase(matchedKeyword, token, options.keywordCase) + ' ';

        // Skip consumed tokens for multi-word keywords
        const wordCount = matchedKeyword.split(' ').length;
        i += wordCount - 1;
        continue;
      }

      // Check indented keywords
      let matchedIndented = '';
      if (NEWLINE_INDENTED.has(twoWord)) {
        matchedIndented = twoWord;
      } else if (NEWLINE_INDENTED.has(upperToken)) {
        matchedIndented = upperToken;
      }

      if (matchedIndented && NEWLINE_INDENTED.has(matchedIndented)) {
        if (currentLine.trim()) {
          lines.push(indent.repeat(indentLevel) + currentLine.trim());
        }
        currentLine = this.applyCase(matchedIndented, token, options.keywordCase) + ' ';
        const wordCount = matchedIndented.split(' ').length;
        i += wordCount - 1;
        indentLevel = 1;
        continue;
      }

      // Handle parentheses
      if (token === '(') {
        currentLine += token;
        indentLevel++;
      } else if (token === ')') {
        indentLevel = Math.max(0, indentLevel - 1);
        currentLine += token;
      } else if (token === ',') {
        currentLine += token;
        lines.push(indent.repeat(indentLevel) + currentLine.trim());
        currentLine = '';
      } else if (token === ';') {
        currentLine += token;
        lines.push(indent.repeat(indentLevel) + currentLine.trim());
        lines.push('');
        currentLine = '';
        indentLevel = 0;
      } else {
        // Apply keyword casing
        const formatted = this.isKeyword(upperToken)
          ? this.applyCase(upperToken, token, options.keywordCase)
          : token;
        currentLine += formatted + ' ';
      }
    }

    if (currentLine.trim()) {
      lines.push(indent.repeat(indentLevel) + currentLine.trim());
    }

    return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  minify(sql: string): string {
    // Remove comments
    let result = sql.replace(/--.*$/gm, '');
    result = result.replace(/\/\*[\s\S]*?\*\//g, '');
    // Collapse whitespace
    result = result.replace(/\s+/g, ' ');
    return result.trim();
  }

  private tokenize(sql: string): string[] {
    const tokens: string[] = [];
    let i = 0;

    while (i < sql.length) {
      // Skip whitespace
      if (/\s/.test(sql[i])) {
        i++;
        continue;
      }

      // Single-line comment
      if (sql[i] === '-' && sql[i + 1] === '-') {
        let comment = '';
        while (i < sql.length && sql[i] !== '\n') {
          comment += sql[i++];
        }
        tokens.push(comment);
        continue;
      }

      // Multi-line comment
      if (sql[i] === '/' && sql[i + 1] === '*') {
        let comment = '';
        while (i < sql.length && !(sql[i] === '*' && sql[i + 1] === '/')) {
          comment += sql[i++];
        }
        comment += '*/';
        i += 2;
        tokens.push(comment);
        continue;
      }

      // String literal
      if (sql[i] === "'" || sql[i] === '"') {
        const quote = sql[i];
        let str = quote;
        i++;
        while (i < sql.length) {
          if (sql[i] === quote) {
            str += sql[i++];
            if (sql[i] === quote) {
              str += sql[i++]; // escaped quote
            } else {
              break;
            }
          } else {
            str += sql[i++];
          }
        }
        tokens.push(str);
        continue;
      }

      // Bracket-quoted identifier
      if (sql[i] === '[') {
        let ident = '';
        while (i < sql.length && sql[i] !== ']') {
          ident += sql[i++];
        }
        if (i < sql.length) ident += sql[i++]; // closing ]
        tokens.push(ident);
        continue;
      }

      // Special characters
      if ('(),;'.includes(sql[i])) {
        tokens.push(sql[i]);
        i++;
        continue;
      }

      // Operators
      if ('<>=!'.includes(sql[i])) {
        let op = sql[i++];
        if (i < sql.length && '=<>'.includes(sql[i])) {
          op += sql[i++];
        }
        tokens.push(op);
        continue;
      }

      // Word/number
      let word = '';
      while (i < sql.length && !/[\s(),;'"<>=!\[\]]/.test(sql[i])) {
        word += sql[i++];
      }
      if (word) tokens.push(word);
    }

    return tokens;
  }

  private isKeyword(upper: string): boolean {
    return KEYWORDS_ALL.some(k => k === upper);
  }

  private applyCase(keyword: string, original: string, caseOption: string): string {
    switch (caseOption) {
      case 'upper': return keyword.toUpperCase();
      case 'lower': return keyword.toLowerCase();
      default: return original;
    }
  }
}
