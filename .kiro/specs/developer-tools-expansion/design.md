# Developer Tools Expansion - Design

## Status: COMPLETE ✅

## Project Structure

```
MyTools.Client/src/app/
├── services/
│   └── theme.service.ts             # Theme toggle (Matrix/Light) with localStorage persistence
├── tools/
│   ├── base64/                      # Base64 encoder/decoder
│   ├── json-csharp/                 # Type Converter (JSON, C#, TS, YAML, CSV, XML, QS)
│   │   ├── json-csharp.component.*  
│   │   └── converter.service.ts     # All conversion logic
│   ├── json-utils/                  # JSON Utilities (14 operations)
│   │   ├── json-utils.component.*   
│   │   └── json-utils.service.ts    # All JSON operations
│   ├── sql-formatter/               # SQL format/minify
│   │   ├── sql-formatter.component.*
│   │   └── sql-formatter.service.ts # SQL tokenizer and formatter
│   ├── connection-string/           # Connection string builder/parser
│   ├── data-generator/              # Test data generation
│   │   ├── data-generator.component.*
│   │   └── data-generator.service.ts # Schema parsing, data generation
│   ├── guid-generator/              # GUID generation
│   ├── url-encoder/                 # URL encode/decode
│   ├── hash-generator/              # Cryptographic hashing
│   ├── jwt-decoder/                 # JWT decode and inspect
│   ├── password-generator/          # Secure password generation
│   ├── regex-tester/                # Regex pattern testing
│   ├── http-headers/                # HTTP header parsing
│   ├── cron-builder/                # Cron expression builder
│   ├── color-converter/             # Color format conversion
│   ├── diff-tool/                   # Text diff comparison
│   ├── string-case/                 # Case conversion
│   ├── lorem-generator/             # Placeholder text
│   ├── markdown-preview/            # Markdown rendering
│   └── html-markdown/               # HTML ↔ Markdown conversion
├── home/
│   └── home.component.*             # Category-grouped tool grid
└── layout/
    └── nav.component.*              # Category dropdown navigation + theme toggle
```

## Routing Pattern

All tools use lazy-loaded standalone components:
```typescript
{ path: 'tools/<slug>', loadComponent: () => import('./tools/<folder>/<component>').then(m => m.<Component>) }
```

## Theme System

Six themes implemented via CSS custom properties:
- `:root` defines Matrix theme variables (default)
- `[data-theme="spring"]` — Pink/magenta on deep plum
- `[data-theme="summer"]` — Golden/amber on dark earth
- `[data-theme="autumn"]` — Burnt orange on dark brown
- `[data-theme="winter"]` — Icy blue on midnight navy
- `[data-theme="light"]` — Classic white/blue

`ThemeService` manages state with a `setTheme()` method and localStorage persistence.
Nav component has a hover dropdown with icons for each theme.
Global button contrast rules ensure readability per theme (dark text on bright buttons for Matrix/Winter/Spring/Summer, white text for Light/Autumn).

### Themed Fixed Backgrounds

Each theme supplies a fixed, full-viewport photographic background rendered on a single `body::before` pseudo-element in `styles.scss`:
- The pseudo-element is `position: fixed; inset: 0; z-index: -1; pointer-events: none`, so it covers the viewport behind all content and never intercepts input.
- `background-size: cover` makes the image fill the viewport. Because the pseudo-element is itself `position: fixed`, it is already pinned to the viewport and stays stationary while the page scrolls — `background-attachment: fixed` is intentionally NOT used, since that combination (fixed attachment on a fixed-positioned element) fails to paint in Chromium.
- The image is injected per theme via the `--bg-image` custom property, set on `:root` (Matrix) and each `[data-theme="..."]` block. Switching themes swaps the background with no extra DOM or component logic.
- Each `--bg-image` layers a dark `linear-gradient(...)` overlay above the `url('/background/<name>.jpg')` so foreground text remains legible over the photo.
- Images are stored in `public/background/` (configured as Angular `assets` input), so they are copied to the build output and served from the site root at `/background/<name>.jpg`. Files: `matrix.jpg`, `light.jpg`, `autumn.jpg`, `winter.jpg`, `sping.jpg`, `summer.jpg`.

## Server-Side Architecture

Controller-based API with attribute routing:
- `HealthController` (`GET /api/health`) — simple health check
- `ToolsController` (`POST /api/tools/csharp-to-json`) — Accepts C# code, returns parsed JSON object
- Services use interface-based DI: `ICSharpToJsonService` → `CSharpToJsonService`
- Uses Roslyn `CSharpSyntaxTree.ParseText()` for proper syntax parsing
- Handles: classes, properties, `[JsonPropertyName]` attributes, nested types, collections
- Returns raw object (not stringified) for efficient client-side consumption
- `Program.cs` handles middleware pipeline: CORS, static files, controllers, SPA fallback
- `MyTools.Api.csproj` has a `BuildAngularClient` MSBuild target (`BeforeTargets="Build"`) that runs `ng build` and copies `dist/MyTools.Client/browser` into `wwwroot`. This keeps Visual Studio (which serves `wwwroot` but never invokes `ng build`) in sync with the client on every build. Guarded by `Condition="'$(BuildSpa)' != 'false'"` so C#-only builds can skip it via `/p:BuildSpa=false`.

## Containerization (Docker)

The app ships as a single Linux container built from a multi-stage `Dockerfile` at the repo root:

1. **Build stage** — `mcr.microsoft.com/dotnet/sdk:10.0` with Node.js 22 added via the NodeSource apt repo. Node is required because the `BuildAngularClient` MSBuild target runs `npm install` + `ng build` during `dotnet publish`. Layer order is tuned for caching: copy `nuget.config` + csproj and `dotnet restore`, then copy `MyTools.Client/package*.json` and `npm install`, then copy the rest and `dotnet publish -c Release`. A single publish produces the .NET app and the Angular client (synced into `wwwroot`).
2. **Runtime stage** — `mcr.microsoft.com/dotnet/aspnet:10.0`, copies only `/app/publish`. No SDK and no Node in the final image (~400 MB). Entrypoint is `dotnet MyTools.Api.dll`.

Supporting files:
- `.dockerignore` — excludes `bin`, `obj`, `dist`, `node_modules`, `wwwroot`, `.vs`, `.vscode`, `.git`, `.kiro`, and the Docker files themselves. Excluding `wwwroot`/`dist` forces a clean client rebuild inside the image, keeping builds reproducible and the context small.
- `compose.yaml` — one `mytools` service, `build.context: .`, maps `8080:8080`, `ASPNETCORE_ENVIRONMENT=Production`, `restart: unless-stopped`.

Port note: containerized ASP.NET Core listens on **8080** (set via `ASPNETCORE_HTTP_PORTS`), unlike local dev on 5000/4200. No application code changes were needed — `Program.cs` already serves static files plus an `index.html` SPA fallback, which is exactly what the container runs. The C#→JSON Roslyn endpoint works unchanged in the container.

Verification: `docker build` succeeds; running the image returns 200 on `GET /api/health`, serves the Angular SPA on `GET /`, and returns a correct parse result from `POST /api/tools/csharp-to-json`.

## Client-Side Libraries

| Library | Used By | Purpose |
|---------|---------|---------|
| js-yaml | Type Converter | YAML parse/serialize |
| marked | Markdown Preview, HTML↔MD | Markdown → HTML |
| turndown | HTML↔MD Converter | HTML → Markdown |

## Key Design Decisions

1. **Button-triggered operations** (not keystroke) for tools that involve conversion — avoids unnecessary API calls and heavy computation on every character
2. **ChangeDetectorRef** used in components with HTTP calls to force UI updates after async responses
3. **DomSanitizer.bypassSecurityTrustHtml** for Markdown preview to allow custom terminal-block HTML
4. **Global styles** for innerHTML-rendered content (Angular view encapsulation doesn't reach into [innerHTML])
5. **ViewEncapsulation.None** avoided in final implementation — global styles are more reliable for dynamic content
6. **Thread-safe services** — `CSharpToJsonService` uses a local `ConversionContext` object per call instead of mutable instance state, making it safe as a Singleton under concurrent requests
7. **Input validation** — API models use `[Required]` and `[StringLength]` attributes to prevent unbounded payloads
8. **Proper HTTP status codes** — Controller returns 400 for invalid input, 500 for unexpected errors (not 200 with error in body)
9. **Structured error handling** — Specific exception types caught separately with appropriate logging; unexpected exceptions propagated to global handler
10. **Subscription cleanup** — HTTP subscriptions use `takeUntilDestroyed()` to prevent memory leaks on component destruction
11. **Unicode Base64** — Uses `TextEncoder`/`TextDecoder` for full Unicode support instead of `btoa`/`atob` which only handle Latin1
12. **Shared tool registry** — `tool-registry.ts` is the single source of truth for tool metadata, used by both home page and navigation
13. **Accessibility** — Theme buttons include `aria-label`, nav has `aria-label`, interactive elements use semantic `<button>` elements
