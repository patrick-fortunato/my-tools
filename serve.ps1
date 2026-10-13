# Build Angular and serve everything from the .NET backend
param(
    [switch]$Watch,
    [switch]$Dev
)

$ErrorActionPreference = "Stop"
$repoRoot = $PSScriptRoot

# Dev mode: start .NET backend + Angular dev server with hot reload
if ($Dev) {
    Write-Host "Starting .NET backend..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "dotnet run --project `"$repoRoot\MyTools.Api`""

    Write-Host "Starting Angular dev server with hot reload..." -ForegroundColor Cyan
    Write-Host "App available at: http://localhost:4200" -ForegroundColor Green
    Write-Host "(API proxied to .NET on port 5000)" -ForegroundColor Gray
    Push-Location "$repoRoot\MyTools.Client"
    ng serve
    Pop-Location
    return
}

Write-Host "Building Angular client..." -ForegroundColor Cyan
Push-Location "$repoRoot\MyTools.Client"
npx ng build --configuration production
if ($LASTEXITCODE -ne 0) { Pop-Location; throw "Angular build failed." }
Pop-Location

# Copy Angular output to .NET wwwroot
$distPath = "$repoRoot\MyTools.Client\dist\MyTools.Client\browser"
if (-not (Test-Path $distPath)) {
    # Fallback for older Angular CLI output structure
    $distPath = "$repoRoot\MyTools.Client\dist\MyTools.Client"
}

$wwwroot = "$repoRoot\MyTools.Api\wwwroot"
if (Test-Path $wwwroot) { Remove-Item -Recurse -Force $wwwroot }
Copy-Item -Recurse $distPath $wwwroot

Write-Host "Angular build copied to wwwroot." -ForegroundColor Green
Write-Host ""

if ($Watch) {
    Write-Host "Starting .NET server with watch..." -ForegroundColor Cyan
    dotnet watch --project "$repoRoot\MyTools.Api"
} else {
    Write-Host "Starting .NET server..." -ForegroundColor Cyan
    dotnet run --project "$repoRoot\MyTools.Api"
}
