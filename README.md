# My Tools

A personal developer utilities web application built with Angular 21 and ASP.NET Core (.NET 10). Features 20 tools organized across 4 categories, with a Matrix-inspired dark theme and light theme toggle.

## Tech Stack

- **Frontend**: Angular 21, TypeScript, SCSS
- **Backend**: ASP.NET Core (.NET 10), Minimal APIs, Roslyn (for C# parsing)
- **Architecture**: Angular SPA served by .NET in production; separate dev servers for development

## Tools

### Data & Database
| Tool | Description |
|------|-------------|
| SQL Formatter | Format and minify SQL with T-SQL keyword awareness |
| Connection String Builder | Build and parse connection strings for SQL Server, PostgreSQL, MySQL, SQLite |
| Data Generator | Generate realistic test data from manual schema or CREATE TABLE statements |
| GUID Generator | Bulk generate GUIDs in multiple formats (registry, braces, hyphens, digits, base64) |

### Security / Encoding
| Tool | Description |
|------|-------------|
| Base64 | Encode and decode Base64 strings |
| URL Encoder/Decoder | Encode/decode with encodeURI or encodeURIComponent |
| Hash Generator | Generate MD5, SHA-1, SHA-256, SHA-384, SHA-512, and HMAC hashes |
| JWT Decoder | Decode JWTs, display claims, check expiration status |
| Password Generator | Configurable secure password generation with strength indicator |

### Web / API
| Tool | Description |
|------|-------------|
| Type Converter | Convert between JSON, C#, TypeScript, YAML, CSV, XML, and Query Strings |
| JSON Utilities | Validate, format, minify, sort, flatten, unflatten, remove nulls, JSONPath query, tree view, schema generation, compare, stats, stringify/parse |
| Regex Tester | Test patterns with flag toggles, highlighted matches, and capture groups |
| HTTP Header Parser | Parse raw headers into annotated table with category badges |
| Cron Builder | Build cron expressions with next-run-time preview |
| Color Converter | Convert between hex, RGB, and HSL with visual picker |

### Text / Formatting
| Tool | Description |
|------|-------------|
| Diff Tool | Side-by-side text comparison with LCS-based diff highlighting |
| String Case Converter | Convert between camelCase, PascalCase, snake_case, kebab-case, and more |
| Lorem Ipsum Generator | Generate placeholder paragraphs, sentences, or words |
| Markdown Preview | Live Markdown rendering with terminal-style code blocks |
| HTML ↔ Markdown | Convert between HTML and Markdown with live preview |

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js 22+](https://nodejs.org/)
- Angular CLI (`npm install -g @angular/cli`)

## Getting Started

```
git clone <repo-url>
cd my-tools
```

### Install dependencies

```
cd MyTools.Client
npm install
cd ..
```

### Run (Development with hot reload)

```
.\serve.ps1 -Dev
```

This starts the .NET backend (port 5000) and Angular dev server (port 4200) with hot module replacement. Open `http://localhost:4200`.

### Run (Production build)

```
.\serve.ps1
```

Builds Angular, copies to wwwroot, serves everything from .NET on `http://localhost:5000`.

### Run with .NET hot reload

```
.\serve.ps1 -Watch
```

Same as production build, but with `dotnet watch` for C# changes.

## Run with Docker

The app runs as a single container: the .NET backend serves the pre-built Angular client from `wwwroot`, so there is one process, one port, no database, and no external services.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Linux containers mode, the default on Windows 11)

You do **not** need the .NET SDK, Node.js, or the Angular CLI installed locally — the image builds everything inside the container.

### Build and run with Docker Compose (recommended)

```
docker compose up --build
```

Open `http://localhost:8080`. Stop with `Ctrl+C`, or run detached with `docker compose up --build -d` and stop later with `docker compose down`.

To use a different host port, change the left side of the mapping in `compose.yaml` (e.g. `"9000:8080"`).

### Build and run with plain Docker

```
docker build -t mytools:latest .
docker run --rm -p 8080:8080 mytools:latest
```

### How the image is built

The `Dockerfile` is multi-stage:

- **Build stage** (`mcr.microsoft.com/dotnet/sdk:10.0` + Node.js 22): runs `dotnet publish`, which triggers the `BuildAngularClient` MSBuild target (`npm install` + `ng build`) and syncs the Angular output into `wwwroot`. A single publish builds both halves.
- **Runtime stage** (`mcr.microsoft.com/dotnet/aspnet:10.0`): copies only the publish output. The final image contains no SDK and no Node (~400 MB).

Inside the container Kestrel listens on port **8080** (`ASPNETCORE_HTTP_PORTS=8080`), not 5000. The `.dockerignore` excludes `node_modules`, `bin`, `obj`, `dist`, and `wwwroot` so the client is always rebuilt fresh and the build stays reproducible.

## Project Structure

```
my-tools/
├── MyTools.slnx
├── README.md
├── serve.ps1                        # Build and serve script
├── nuget.config                     # NuGet source configuration
├── Dockerfile                       # Multi-stage build (SDK+Node -> ASP.NET runtime)
├── .dockerignore                    # Keeps the Docker build context lean/reproducible
├── compose.yaml                     # Single-service Docker Compose (port 8080)
├── MyTools.Api/                     # ASP.NET Core backend
│   ├── MyTools.Api.csproj           # Includes BuildAngularClient target (ng build → wwwroot)
│   ├── Program.cs                   # App setup, middleware, SPA hosting, CORS
│   ├── Controllers/
│   │   ├── HealthController.cs      # GET /api/health
│   │   └── ToolsController.cs       # POST /api/tools/csharp-to-json
│   ├── Services/
│   │   ├── ICSharpToJsonService.cs  # Service interface
│   │   └── CSharpToJsonService.cs   # Roslyn-based C# → JSON converter (thread-safe, stateless)
│   ├── Models/
│   │   ├── CSharpToJsonRequest.cs   # Request model with validation
│   │   └── CSharpToJsonResponse.cs  # Response model
│   └── Properties/
│       └── launchSettings.json      # Dev server config (port 5000)
├── MyTools.Client/                  # Angular 21 frontend
│   ├── angular.json
│   ├── package.json
│   ├── proxy.conf.json              # Dev proxy: /api → .NET backend
│   ├── public/
│   │   ├── favicon.ico
│   │   └── background/              # Per-theme fixed background images
│   │       ├── matrix.jpg
│   │       ├── light.jpg
│   │       ├── autumn.jpg
│   │       ├── winter.jpg
│   │       ├── sping.jpg
│   │       └── summer.jpg
│   ├── src/
│   │   ├── styles.scss              # Global styles, theme variables
│   │   ├── main.ts                  # App bootstrap
│   │   └── app/
│   │       ├── app.ts              # Root component (nav + router-outlet)
│   │       ├── app.routes.ts       # Lazy-loaded routes for all tools
│   │       ├── app.config.ts       # App providers (router, HTTP)
│   │       ├── shared/
│   │       │   └── tool-registry.ts # Shared tool category definitions
│   │       ├── services/
│   │       │   └── theme.service.ts # Theme selector with localStorage persistence
│   │       ├── layout/
│   │       │   └── nav.component.* # Category dropdown navigation
│   │       ├── home/
│   │       │   └── home.component.* # Category-grouped tool grid
│   │       └── tools/
│   │           ├── base64/
│   │           ├── json-csharp/     # Type Converter + converter.service
│   │           ├── json-utils/      # JSON Utilities + json-utils.service
│   │           ├── guid-generator/
│   │           ├── sql-formatter/   # + sql-formatter.service
│   │           ├── connection-string/
│   │           ├── data-generator/  # + data-generator.service
│   │           ├── url-encoder/
│   │           ├── hash-generator/
│   │           ├── jwt-decoder/
│   │           ├── password-generator/
│   │           ├── regex-tester/
│   │           ├── http-headers/
│   │           ├── cron-builder/
│   │           ├── color-converter/
│   │           ├── diff-tool/
│   │           ├── string-case/
│   │           ├── lorem-generator/
│   │           ├── markdown-preview/
│   │           └── html-markdown/
└── .kiro/
    └── specs/developer-tools-expansion/
        ├── requirements.md
        ├── design.md
        └── tasks.md
```

## Themes

The app ships with six themes:

- **🖥️ Matrix** (default): Dark green-on-black terminal aesthetic, monospace font, neon green accents
- **🌸 Spring**: Pink/magenta accents on deep plum-dark background, soft rose text
- **🌊 Summer**: Warm golden/amber accents on dark earth tones, sun-warm text
- **🍂 Autumn**: Burnt orange accents on dark brown background, warm tan text
- **❄️ Winter**: Icy blue accents on midnight navy background, cool blue-white text
- **☀️ Light**: Clean white background, blue accents, system fonts

Toggle via the dropdown icon in the top-right corner of the nav bar. Preference is persisted to localStorage.

### Themed Fixed Backgrounds

Each theme renders a fixed, full-viewport photographic background that stays in place while content scrolls. Images live in `MyTools.Client/public/background/` and are served from the site root at `/background/<name>.jpg`. Each theme's `body::before` layer composites a dark gradient overlay on top of its image (via the `--bg-image` custom property in `styles.scss`) so foreground text stays legible.

| Theme | Image |
|-------|-------|
| 🖥️ Matrix (default) | `/background/matrix.jpg` |
| ☀️ Light | `/background/light.jpg` |
| 🍂 Autumn | `/background/autumn.jpg` |
| ❄️ Winter | `/background/winter.jpg` |
| 🌸 Spring | `/background/sping.jpg` |
| 🌊 Summer | `/background/summer.jpg` |

The layer sits behind all content (`z-index: -1`, `pointer-events: none`) and uses `background-size: cover`. It is a `position: fixed` pseudo-element pinned to the viewport (`inset: 0`), so it stays put while the page scrolls without needing `background-attachment: fixed` (that combination fails to paint in Chromium). To change a background, replace the corresponding file in `public/background/` (keep the same filename) or update the `url(...)` in the theme's `--bg-image`.

### Theme Color Specifications

| Variable | Matrix | Spring | Summer | Autumn | Winter | Light |
|----------|--------|--------|--------|--------|--------|-------|
| `--primary-color` | `#00ff41` | `#e0599e` | `#f0a030` | `#cc5500` | `#5ba8d9` | `#4a90d9` |
| `--primary-hover` | `#00cc33` | `#c94d8a` | `#d89028` | `#b34700` | `#4a95c4` | `#3a7bc8` |
| `--border-color` | `#1a3a1a` | `#3d1a2a` | `#3d3010` | `#3d2b1a` | `#1a2a3d` | `#dee2e6` |
| `--surface-color` | `#0a1a0a` | `#1a0a12` | `#1a1408` | `#1a1008` | `#0a1520` | `#f8f9fa` |
| `--hover-color` | `#0d2b0d` | `#2a0d1a` | `#2a200d` | `#2a1a0d` | `#0d1f30` | `#e9ecef` |
| `--input-bg` | `#0a0f0a` | `#140810` | `#141005` | `#140c05` | `#060f18` | `#ffffff` |
| `--readonly-bg` | `#0a1a0a` | `#1a0a12` | `#1a1408` | `#1a1008` | `#0a1520` | `#f8f9fa` |
| `--text-color` | `#c0ffc0` | `#f8d0e8` | `#f8ecd0` | `#f0d9b5` | `#d0e8f8` | `#212529` |
| `--text-muted` | `#88bb88` | `#a06888` | `#a89060` | `#a08060` | `#6a8aa8` | `#6c757d` |
| `--bg-color` | `#050a05` | `#0f050a` | `#0f0c05` | `#0f0a05` | `#040a10` | `#ffffff` |
| `--nav-bg` | `#0a1a0a` | `#1a0a12` | `#1a1408` | `#1a1008` | `#0a1520` | `#f8f9fa` |
| `--error-color` | `#ff4444` | `#ff5555` | `#ff6644` | `#ff6644` | `#ff6688` | `#c62828` |
| `--success-color` | `#00ff41` | `#55dd88` | `#88cc44` | `#88cc44` | `#55cccc` | `#2e7d32` |

### Button Contrast Rules
- **Matrix**: Dark text (`#000`) on bright green active buttons
- **Spring, Summer, Winter**: Dark text (`#000`) on bright accent active buttons
- **Autumn**: White text (`#fff`) on burnt orange active buttons
- **Light**: White text (`#fff`) on blue active buttons

## API Endpoints

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| GET | `/api/health` | HealthController | Health check |
| POST | `/api/tools/csharp-to-json` | ToolsController | Parse C# classes to JSON (Roslyn) |

## Adding a New Tool

1. Create a folder under `MyTools.Client/src/app/tools/<tool-name>/`
2. Add component files: `.component.ts`, `.component.html`, `.component.scss`
3. Add a lazy-loaded route in `app.routes.ts`
4. Add the tool to the appropriate category in `home.component.ts`
5. Add a nav link in the corresponding dropdown in `nav.component.html`

## Running from Visual Studio

Visual Studio runs the `MyTools.Api` project and serves the Angular app from `MyTools.Api/wwwroot`; it does not run `ng build` on its own. To keep `wwwroot` in sync, `MyTools.Api.csproj` has a `BuildAngularClient` MSBuild target that runs `ng build` and copies the output into `wwwroot` on every build. So pressing Run/F5 in Visual Studio rebuilds the client automatically.

- The first build (or any client change) is slower because it runs `ng build`.
- To skip the client build when you only changed C#: `dotnet build /p:BuildSpa=false`.
- `npm install` runs automatically only when `MyTools.Client/node_modules` is missing.
- After a client change, hard refresh the browser (Ctrl+F5) to bypass the cached hashed stylesheet.

## Notes

- Most tools run entirely client-side (no server dependency)
- C# parsing (Type Converter, C# → JSON) uses Roslyn on the .NET backend
- The `nuget.config` at the root restricts NuGet to nuget.org (avoids auth issues with other configured sources)
- Angular proxy config routes `/api/*` to the .NET backend during development
