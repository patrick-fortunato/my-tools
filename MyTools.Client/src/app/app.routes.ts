import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
  },
  {
    path: 'tools/base64',
    loadComponent: () => import('./tools/base64/base64.component').then(m => m.Base64Component),
  },
  {
    path: 'tools/json-csharp',
    loadComponent: () => import('./tools/json-csharp/json-csharp.component').then(m => m.JsonCsharpComponent),
  },
  {
    path: 'tools/json-utils',
    loadComponent: () => import('./tools/json-utils/json-utils.component').then(m => m.JsonUtilsComponent),
  },
  {
    path: 'tools/guid-generator',
    loadComponent: () => import('./tools/guid-generator/guid-generator.component').then(m => m.GuidGeneratorComponent),
  },
  {
    path: 'tools/sql-formatter',
    loadComponent: () => import('./tools/sql-formatter/sql-formatter.component').then(m => m.SqlFormatterComponent),
  },
  {
    path: 'tools/connection-string',
    loadComponent: () => import('./tools/connection-string/connection-string.component').then(m => m.ConnectionStringComponent),
  },
  {
    path: 'tools/data-generator',
    loadComponent: () => import('./tools/data-generator/data-generator.component').then(m => m.DataGeneratorComponent),
  },
  {
    path: 'tools/url-encoder',
    loadComponent: () => import('./tools/url-encoder/url-encoder.component').then(m => m.UrlEncoderComponent),
  },
  {
    path: 'tools/hash-generator',
    loadComponent: () => import('./tools/hash-generator/hash-generator.component').then(m => m.HashGeneratorComponent),
  },
  {
    path: 'tools/jwt-decoder',
    loadComponent: () => import('./tools/jwt-decoder/jwt-decoder.component').then(m => m.JwtDecoderComponent),
  },
  {
    path: 'tools/password-generator',
    loadComponent: () => import('./tools/password-generator/password-generator.component').then(m => m.PasswordGeneratorComponent),
  },
  {
    path: 'tools/regex-tester',
    loadComponent: () => import('./tools/regex-tester/regex-tester.component').then(m => m.RegexTesterComponent),
  },
  {
    path: 'tools/http-headers',
    loadComponent: () => import('./tools/http-headers/http-headers.component').then(m => m.HttpHeadersComponent),
  },
  {
    path: 'tools/cron-builder',
    loadComponent: () => import('./tools/cron-builder/cron-builder.component').then(m => m.CronBuilderComponent),
  },
  {
    path: 'tools/color-converter',
    loadComponent: () => import('./tools/color-converter/color-converter.component').then(m => m.ColorConverterComponent),
  },
  {
    path: 'tools/diff-tool',
    loadComponent: () => import('./tools/diff-tool/diff-tool.component').then(m => m.DiffToolComponent),
  },
  {
    path: 'tools/string-case',
    loadComponent: () => import('./tools/string-case/string-case.component').then(m => m.StringCaseComponent),
  },
  {
    path: 'tools/lorem-generator',
    loadComponent: () => import('./tools/lorem-generator/lorem-generator.component').then(m => m.LoremGeneratorComponent),
  },
  {
    path: 'tools/markdown-preview',
    loadComponent: () => import('./tools/markdown-preview/markdown-preview.component').then(m => m.MarkdownPreviewComponent),
  },
  {
    path: 'tools/html-markdown',
    loadComponent: () => import('./tools/html-markdown/html-markdown.component').then(m => m.HtmlMarkdownComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
