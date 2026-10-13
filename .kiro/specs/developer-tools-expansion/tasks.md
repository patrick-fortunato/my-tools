# Developer Tools Expansion - Tasks

## Status: ALL COMPLETE ✅

## Phase 1: Data & Database ✅
- [x] 1. GUID Generator
- [x] 2. SQL Formatter / Minifier
- [x] 3. Connection String Builder
- [x] 4. Data Generator

## Phase 2: Security / Encoding ✅
- [x] 5. URL Encoder/Decoder
- [x] 6. Hash Generator
- [x] 7. JWT Decoder
- [x] 8. Password/Secret Generator

## Phase 3: Web / API ✅
- [x] 9. Regex Tester
- [x] 10. HTTP Header Parser
- [x] 11. Cron Expression Builder
- [x] 12. Color Converter

## Phase 4: Text / Formatting ✅
- [x] 13. Diff Tool
- [x] 14. String Case Converter
- [x] 15. Lorem Ipsum Generator
- [x] 16. Markdown Preview
- [x] 17. HTML ↔ Markdown Converter

## Phase 5: Infrastructure ✅
- [x] 18. Category-Based Navigation (hover dropdowns)
- [x] 19. Home Page Categories (grouped tool cards)
- [x] 20. Matrix/Light/Spring/Summer/Autumn/Winter Theme System (dropdown selector + localStorage persistence)

## Phase 6: Containerization (Docker) ✅
- [x] 21. Multi-stage `Dockerfile` (.NET 10 SDK + Node.js 22 build → ASP.NET 10 runtime)
- [x] 22. `.dockerignore` excluding build outputs and node_modules for reproducible builds
- [x] 23. `compose.yaml` single-service definition (port 8080)
- [x] 24. Verified: image builds, container serves health endpoint, SPA, and C#→JSON API

## Post-Phase Refinements ✅
- [x] JSON Utilities: Added stringify/parse operations
- [x] HTML↔MD: Added live preview for both sides
- [x] Markdown Preview: Terminal-style code blocks (dark bg, green text, title bar)
- [x] Theme: Fixed button text contrast (dark text on bright green active buttons)
- [x] Theme: Fixed inactive element readability (brighter muted text)
- [x] Theme: Per-theme fixed full-viewport photographic backgrounds (images in `public/background/`, rendered on a `position: fixed` `body::before` pseudo-element with a dark gradient overlay) — one themed image per theme
- [x] Theme: Fixed background not painting in Chromium — removed redundant `background-attachment: fixed` from the fixed-positioned `body::before` (the fixed element is already viewport-pinned)
- [x] Build: Added `BuildAngularClient` MSBuild target to `MyTools.Api.csproj` so Visual Studio runs `ng build` and syncs output to `wwwroot` on every build (fixes stale `wwwroot` serving an old client without the background images)
- [x] serve.ps1: Added -Dev flag for hot reload development
- [x] Moved endpoints from minimal API to Controllers
- [x] Added ICSharpToJsonService interface
- [x] Added Spring, Summer, Winter themes + dropdown selector
- [x] Code quality fixes:
  - [x] Thread-safety: Refactored CSharpToJsonService to use local ConversionContext (no mutable instance state)
  - [x] Input validation: Added [Required] and [StringLength(100000)] to CSharpToJsonRequest
  - [x] Proper HTTP status codes: 400 for bad input, 500 for unexpected errors
  - [x] Error logging: Added ILogger<ToolsController> with appropriate log levels
  - [x] Specific exception handling: InvalidOperationException, ArgumentException caught separately
  - [x] CancellationToken propagation on controller action
  - [x] ProducesResponseType attributes for OpenAPI documentation
  - [x] Base64 Unicode support: TextEncoder/TextDecoder instead of btoa/atob
  - [x] Subscription cleanup: takeUntilDestroyed() in json-csharp component
  - [x] Dead code removal: Removed unused cycle() method from ThemeService
  - [x] Model separation: Request and Response in separate files
  - [x] Shared tool registry: Single source of truth for tool metadata
  - [x] Accessibility: aria-label on theme buttons, nav element, theme toggle
  - [x] Static readonly array for GenericCollectionPatterns (no per-call allocation)
