# Developer Tools Expansion - Requirements

## Status: COMPLETE ✅

## Overview
Expand the MyTools web application with additional developer utility tools organized by category. Each tool is a standalone Angular component with its own route, following the pattern of lazy-loaded standalone components.

## Architecture Decisions
- Client-side where possible (no server dependency for most tools)
- Server-side (ASP.NET Core with Roslyn) only for C# code parsing
- Each tool is a folder under `src/app/tools/` with component .ts, .html, .scss
- Lazy-loaded routes in `app.routes.ts`
- Category-based navigation with hover dropdowns
- Home page organized with category sections and tool cards
- Matrix dark theme (default) with light theme toggle, persisted to localStorage
- Global styles handle theming via CSS custom properties on `:root`

---

## Category: Data & Database (4 tools) ✅

### REQ-DB-1: SQL Formatter / Minifier ✅
- Pretty-print or compress SQL with T-SQL dialect awareness
- Mode toggle between format and minify
- Options: keyword case (upper/lower/preserve), indent size (2/4/8)
- Custom tokenizer handles strings, comments, bracket identifiers, operators

### REQ-DB-2: Connection String Builder ✅
- Providers: SQL Server, PostgreSQL, MySQL, SQLite
- Dynamic form fields per provider with sensible defaults
- Build mode: fill fields → generate connection string
- Parse mode: paste connection string → see parsed key-value table
- SQL Server supports Windows Auth (hides user/password fields)

### REQ-DB-3: Data Generator ✅
- Manual schema mode: add/remove columns with name, type, nullable
- CREATE TABLE mode: paste SQL DDL, auto-parse into schema
- Output formats: JSON array or INSERT statements
- Smart data generation based on column names (emails, names, phones, cities, etc.)
- Configurable row count (1-1000)

### REQ-DB-4: GUID Generator ✅
- Formats: registry, braces, hyphens, digits only, base64
- Case: uppercase or lowercase
- Quantity: 1-100
- Copy individual or copy all
- Cryptographically random (crypto.getRandomValues)

---

## Category: Security / Encoding (5 tools) ✅

### REQ-SEC-1: Hash Generator ✅
- Algorithms: MD5, SHA-1, SHA-256, SHA-384, SHA-512
- HMAC mode with configurable secret key
- Output formats: hex lowercase, hex uppercase, base64
- Uses Web Crypto API (MD5 uses custom implementation since not in Web Crypto)

### REQ-SEC-2: JWT Decoder ✅
- Decodes header, payload, signature from dot-separated JWT
- Expiration status: expired (red), valid with time remaining (green), no exp claim (info)
- Standard claims highlighted: iss, sub, aud, exp, iat, nbf, jti
- Base64url decoding with proper padding handling

### REQ-SEC-3: URL Encoder/Decoder ✅
- Toggle: encode vs decode
- Scope: encodeURIComponent (default) vs encodeURI
- Swap button to flip direction
- Button-triggered conversion

### REQ-SEC-4: Password/Secret Generator ✅
- Length: 8-128 (default 20)
- Character sets: uppercase, lowercase, digits, symbols (each toggleable)
- Custom symbol set input
- Quantity: 1-20 (default 5)
- Strength indicator per password (Weak/Fair/Good/Strong)
- Copy individual or copy all
- Cryptographically random (crypto.getRandomValues)

### Base64 (existing) ✅
- Encode/decode toggle
- Live swap button
- Error handling for invalid Base64

---

## Category: Web / API (6 tools) ✅

### REQ-WEB-1: HTTP Header Parser ✅
- Paste raw headers (key: value per line)
- Parse into structured table
- Category badges: Security, CORS, Cache, Content, Auth
- Skips non-header lines (like HTTP/1.1 200 OK)

### REQ-WEB-2: Regex Tester ✅
- Pattern input with flag checkboxes (g, i, m, s)
- Test string textarea
- Match results: value, position (line:column), capture groups
- Match count
- Error display for invalid regex

### REQ-WEB-3: Cron Expression Builder ✅
- Manual expression input
- 5-field (standard) vs 6-field (with seconds) toggle
- Field reference showing valid ranges
- Calculates next 5 scheduled run times
- Supports: wildcards, ranges, steps, lists

### REQ-WEB-4: Color Converter ✅
- Input: hex, rgb(), hsl() — auto-detected
- Output: all three formats simultaneously
- Visual color swatch
- Native HTML color picker that syncs
- Copy buttons per format

### Type Converter (existing, expanded) ✅
- Source/target format dropdowns with valid-pair filtering
- Formats: JSON, C#, TypeScript, YAML, CSV, Query String, XML
- C# parsing via server-side Roslyn
- All other conversions client-side
- Swap button, root class name option, test values option

### JSON Utilities (existing, expanded) ✅
- Operations: validate, format, minify, stringify, parse, sort keys, flatten, unflatten, remove nulls, JSONPath query, tree view, schema generation, compare, stats
- Button-triggered execution
- Special views: tree (collapsible), diff (side-by-side), stats (grid), validation (pass/fail)

---

## Category: Text / Formatting (5 tools) ✅

### REQ-TXT-1: Diff Tool ✅
- Two input panels (left/right)
- LCS-based diff algorithm
- Side-by-side output with colored lines: green (added), red (removed), yellow (changed)
- Line numbers

### REQ-TXT-2: String Case Converter ✅
- Input: single string or one per line (batch)
- Outputs all 8 variants: camelCase, PascalCase, snake_case, SCREAMING_SNAKE, kebab-case, Title Case, UPPER, lower
- Tokenizes by camelCase boundaries, spaces, underscores, hyphens
- Copy per result

### REQ-TXT-3: Lorem Ipsum Generator ✅
- Type: paragraphs, sentences, or words
- Configurable count (1-50)
- 30-sentence corpus
- Copy output

### REQ-TXT-4: Markdown Preview ✅
- Input textarea + rendered preview panel
- Uses `marked` library for Markdown → HTML
- Terminal-style code blocks (dark background, green text, title bar)
- Styled: headings, tables, blockquotes, lists, links, images, hr
- Uses DomSanitizer.bypassSecurityTrustHtml for custom HTML rendering

### REQ-TXT-5: HTML ↔ Markdown Converter ✅
- Toggle direction: HTML → Markdown, Markdown → HTML
- Uses `marked` for MD → HTML, `turndown` for HTML → MD
- Show Preview toggle: renders both input and output as they would display
- Swap button, copy, clear

---

## Infrastructure ✅

### REQ-INFRA-1: Category-Based Navigation ✅
- Hover-activated dropdown menus per category
- 4 categories: Data & DB, Security, Web / API, Text

### REQ-INFRA-2: Home Page Categories ✅
- Category sections with headers
- Tool cards grouped within each section

### REQ-INFRA-4: Docker Containerization ✅
- Single-container deployment: the .NET backend serves the pre-built Angular client from `wwwroot` (one process, one port, no database, no external services)
- Multi-stage `Dockerfile`:
  - Build stage uses the .NET 10 SDK image with Node.js 22 installed, so a single `dotnet publish` triggers the `BuildAngularClient` target (`npm install` + `ng build`) and produces both the .NET app and the Angular client
  - Runtime stage uses the ASP.NET 10 runtime image and copies only the publish output (no SDK, no Node; final image ~400 MB)
- Container listens on port 8080 (`ASPNETCORE_HTTP_PORTS=8080`), mapped to host 8080
- `.dockerignore` excludes `node_modules`, `bin`, `obj`, `dist`, and `wwwroot` so the client is rebuilt fresh and the build context stays reproducible
- `compose.yaml` provides a single `mytools` service for `docker compose up --build`
- Builds and runs under Docker Desktop on Windows 11 (Linux containers)
- No application code changes required — the existing production hosting model (static files + SPA fallback) is already container-friendly

### REQ-INFRA-3: Theme System ✅
- Six themes: Matrix (default), Spring, Summer, Autumn, Winter, Light
- Dropdown selector in nav bar (hover to open, click to select)
- Persisted to localStorage
- Implemented via CSS custom properties on :root / [data-theme="..."]
- Global button contrast rules per theme for readability
- Icons: 🖥️ Matrix, 🌸 Spring, 🌊 Summer, 🍂 Autumn, ❄️ Winter, ☀️ Light
- Each theme has a fixed, full-viewport photographic background rendered on `body::before` behind all content
  - Images stored in `public/background/` and served from `/background/<name>.jpg` (matrix, light, autumn, winter, sping, summer)
  - Each theme's `--bg-image` composites a dark gradient overlay over its photo so foreground text stays legible
  - Uses `background-size: cover`; the layer is a `position: fixed` pseudo-element (`inset: 0`) so the image fills the viewport and stays put while the page scrolls (no `background-attachment: fixed`, which fails to paint on a fixed-positioned element in Chromium)

---

## Dependencies

### npm (client-side)
- `js-yaml` — YAML parsing/serialization (Type Converter)
- `marked` — Markdown → HTML (Markdown Preview, HTML↔MD)
- `turndown` — HTML → Markdown (HTML↔MD Converter)
- `@types/js-yaml`, `@types/turndown` — TypeScript definitions

### NuGet (server-side)
- `Microsoft.CodeAnalysis.CSharp` (5.6.0) — Roslyn syntax parsing for C# → JSON
- `Microsoft.AspNetCore.OpenApi` (10.0.8) — OpenAPI support
