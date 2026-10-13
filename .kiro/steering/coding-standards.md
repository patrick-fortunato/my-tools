# Coding Standards — MyTools Project

These rules apply to all code changes in this project. Follow them without exception.

## .NET Backend (MyTools.Api)

### Architecture
- All endpoints go in Controllers (not minimal API in Program.cs)
- Controllers use `[ApiController]` and `[Route("api/[controller]")]`
- Program.cs is for middleware pipeline only — no business logic or endpoint definitions

### Services
- Every service must have an interface (e.g., `ICSharpToJsonService`)
- Controllers depend on interfaces, never concrete implementations
- DI registration uses `AddSingleton<IService, Service>()` or `AddScoped<IService, Service>()`
- Services must be thread-safe if registered as Singleton — no mutable instance state. Use local context objects passed through methods if state is needed per-call.

### Models
- One class per file
- Request models must have `[Required]` and `[StringLength]` validation attributes on string properties
- Response models are separate from request models

### Controllers
- Inject `ILogger<TController>` and log all exceptions
- Accept `CancellationToken` on async or long-running actions
- Use `[ProducesResponseType]` attributes on actions for OpenAPI documentation
- Return appropriate HTTP status codes: 400 for validation/user errors, 500 for unexpected errors
- Catch specific exception types (`InvalidOperationException`, `ArgumentException`) — never a bare `catch (Exception)` that swallows everything silently
- Unexpected exceptions should be logged at Error level then return 500

### Error Handling
- Never return 200 OK with an error message in the body as the only failure signal
- Always log before returning an error response
- Do not expose internal exception details to clients in production — return a generic message for 500s

## Angular Frontend (MyTools.Client)

### Components
- All components are standalone with explicit `imports` arrays
- Use lazy-loaded routes for every tool component
- Each tool lives in its own folder under `src/app/tools/<tool-name>/`

### HTTP Calls
- Use `takeUntilDestroyed(destroyRef)` on all HTTP subscriptions to prevent memory leaks
- Handle HTTP errors by status code: differentiate 400 (user error with message) from 0 (network failure) from 500 (server error)
- Inject `DestroyRef` alongside `HttpClient` in any component making HTTP calls

### Change Detection
- Use `ChangeDetectorRef.detectChanges()` after async HTTP callbacks if the view doesn't update
- Prefer signals for new reactive state where possible

### Encoding / Data Handling
- Never use raw `btoa()`/`atob()` for user-facing encoding — use `TextEncoder`/`TextDecoder` for full Unicode support
- Use `DomSanitizer.bypassSecurityTrustHtml()` when rendering trusted dynamic HTML via `[innerHTML]`

### Services
- Use `@Injectable({ providedIn: 'root' })` for stateless services
- Extract reusable logic into services — don't put heavy algorithms inline in components

### Shared Code
- Tool metadata (names, descriptions, routes, icons, categories) lives in `src/app/shared/tool-registry.ts`
- Both the home page and navigation consume this single source of truth
- Do not duplicate tool lists across components

### Accessibility
- All interactive buttons must have either visible text content or an `aria-label`
- Navigation landmarks use `aria-label` (e.g., `<nav aria-label="Main navigation">`)
- Emoji-only buttons require `aria-label` describing their function
- Error messages use `role="alert"` for screen reader announcement

## Styling / Theming

### Theme System
- All colors use CSS custom properties defined in `styles.scss`
- `:root` defines the default theme (Matrix)
- Additional themes use `[data-theme="name"]` selectors
- Never hardcode colors in component SCSS — always reference `var(--variable-name)`
- Active/primary buttons must have explicit contrast rules per theme (dark text on bright backgrounds, white text where needed)
- Styles that need to reach into `[innerHTML]` content go in global `styles.scss`, not component SCSS

### Component SCSS
- Use consistent class names: `.tool-container`, `.options-bar`, `.btn-primary`, `.btn-secondary`, `.btn-sm`, `.error-message`, `.toolbar`
- `.tool-container` max-width: 900px for most tools, 1100px for tools with side-by-side panels
- Monospace font: `'Cascadia Code', 'Fira Code', monospace`

## Documentation

- Every code change must update: `README.md`, `.kiro/specs/developer-tools-expansion/requirements.md`, `design.md`, and `tasks.md`
- Do not wait to be asked — update documentation as part of every change
