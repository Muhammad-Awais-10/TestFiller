$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$root = Split-Path -Parent $PSScriptRoot
$manifestPath = Join-Path $root 'manifest.json'
if (-not (Test-Path -LiteralPath $manifestPath)) { throw "manifest.json not found at $manifestPath" }

$manifest = Get-Content -LiteralPath $manifestPath -Raw | ConvertFrom-Json
$version = [string]$manifest.version
if ([string]::IsNullOrWhiteSpace($version)) { throw 'manifest.json version is missing.' }
if ([string]::IsNullOrWhiteSpace([string]$manifest.name)) { throw 'manifest.json name is missing.' }

$packageDir = Join-Path $root 'package'
if (-not (Test-Path -LiteralPath $packageDir)) { throw "package directory not found at $packageDir" }

$zipName = "TestFiller-v$version.zip"
$zipPath = Join-Path $packageDir $zipName
$staging = Join-Path ([System.IO.Path]::GetTempPath()) ("testfiller-package-" + [guid]::NewGuid().ToString('N'))
$extract = Join-Path ([System.IO.Path]::GetTempPath()) ("testfiller-verify-" + [guid]::NewGuid().ToString('N'))

function CleanupPaths {
  foreach ($path in @($staging, $extract)) {
    if (Test-Path -LiteralPath $path) { Remove-Item -LiteralPath $path -Recurse -Force }
  }
}

function Add-ZipEntry {
  param(
    [System.IO.Compression.ZipArchive]$Archive,
    [string]$SourcePath,
    [string]$EntryName
  )
  $normalized = $EntryName -replace '\\', '/'
  if ($normalized -match '\\') { throw "Backslash entry name blocked: $EntryName" }
  if (Test-Path -LiteralPath $SourcePath -PathType Leaf) {
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($Archive, $SourcePath, $normalized, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
    return
  }
  $entry = $Archive.CreateEntry($normalized)
  $stream = $entry.Open()
  try {
    $stream.Dispose()
  } finally {
    $stream.Dispose()
  }
}

try {
  New-Item -ItemType Directory -Path $staging | Out-Null
  New-Item -ItemType Directory -Path $extract | Out-Null

  Copy-Item -LiteralPath $manifestPath -Destination (Join-Path $staging 'manifest.json')
  Copy-Item -LiteralPath (Join-Path $root 'assets') -Destination (Join-Path $staging 'assets') -Recurse
  Copy-Item -LiteralPath (Join-Path $root 'src') -Destination (Join-Path $staging 'src') -Recurse

  if (Test-Path -LiteralPath $zipPath) { Remove-Item -LiteralPath $zipPath -Force }
  $archive = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    Add-ZipEntry -Archive $archive -SourcePath (Join-Path $staging 'manifest.json') -EntryName 'manifest.json'
    Get-ChildItem -LiteralPath (Join-Path $staging 'assets') -Recurse -File | ForEach-Object {
      $relative = $_.FullName.Substring($staging.Length + 1).Replace([System.IO.Path]::DirectorySeparatorChar, '/')
      Add-ZipEntry -Archive $archive -SourcePath $_.FullName -EntryName $relative
    }
    Get-ChildItem -LiteralPath (Join-Path $staging 'src') -Recurse -File | ForEach-Object {
      $relative = $_.FullName.Substring($staging.Length + 1).Replace([System.IO.Path]::DirectorySeparatorChar, '/')
      Add-ZipEntry -Archive $archive -SourcePath $_.FullName -EntryName $relative
    }
  } finally {
    $archive.Dispose()
  }

  if (-not (Test-Path -LiteralPath $zipPath)) { throw "Failed to create $zipPath" }

  $zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $zipPath))
  try {
    $entries = @($zip.Entries)
    if ($entries.Count -eq 0) { throw 'ZIP is empty.' }
    foreach ($entry in $entries) {
      if ($entry.FullName.Contains('\')) { throw "Backslash entry found: $($entry.FullName)" }
      if ($entry.FullName.StartsWith('/')) { throw "Absolute entry path found: $($entry.FullName)" }
      if ($entry.FullName -match '(^|/)(\.git|\.claude|tests|package)(/|$)' -or $entry.FullName -in @('README.md', 'design.md') -or $entry.FullName.EndsWith('.zip')) { throw "Blocked content found in ZIP: $($entry.FullName)" }
    }
    if (-not ($entries.FullName -contains 'manifest.json')) { throw 'manifest.json is not at the ZIP root.' }
    if ($entries | Where-Object { $_.FullName -match '^[^/]+/manifest\.json$' }) { throw 'ZIP contains an extra wrapping folder.' }

    $extractedManifest = Join-Path $extract 'manifest.json'
    [System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, $extract)
    if (-not (Test-Path -LiteralPath $extractedManifest)) { throw 'manifest.json is not at the ZIP root.' }

    $manifestText = Get-Content -LiteralPath $extractedManifest -Raw
    if ($manifestText -notmatch ('"name"\s*:\s*"' + [regex]::Escape([string]$manifest.name) + '"')) { throw 'Packaged manifest name is incorrect.' }
    if ($manifestText -notmatch ('"version"\s*:\s*"' + [regex]::Escape($version) + '"')) { throw 'Packaged manifest version is incorrect.' }
    if ($manifestText -notmatch '"manifest_version"\s*:\s*3') { throw 'Packaged manifest version is incorrect.' }

    $expectedFiles = @(
      'manifest.json',
      'assets/icon-16.png',
      'assets/icon-32.png',
      'assets/icon-48.png',
      'assets/icon-128.png',
      'assets/icon.png',
      'assets/logo.png',
      'src/background/service-worker.js',
      'src/content/content-script.js',
      'src/shared/constants.js',
      'src/shared/generator.js',
      'src/shared/storage.js',
      'src/ui/history.css',
      'src/ui/history.html',
      'src/ui/history.js',
      'src/ui/options.css',
      'src/ui/options.html',
      'src/ui/options.js',
      'src/ui/popup.css',
      'src/ui/popup.html',
      'src/ui/popup.js'
    )

    foreach ($relative in $expectedFiles) {
      $source = Join-Path $root $relative
      $packed = Join-Path $extract $relative
      if (-not (Test-Path -LiteralPath $packed)) { throw "Missing packaged file: $relative" }
      if (-not (Test-Path -LiteralPath $source)) { throw "Missing source file: $relative" }
      if ((Get-FileHash -Algorithm SHA256 -LiteralPath $source).Hash -ne (Get-FileHash -Algorithm SHA256 -LiteralPath $packed).Hash) { throw "Stale packaged file: $relative" }
    }

    $jsFiles = @(
      'src/background/service-worker.js',
      'src/content/content-script.js',
      'src/shared/constants.js',
      'src/shared/generator.js',
      'src/shared/storage.js',
      'src/ui/history.js',
      'src/ui/options.js',
      'src/ui/popup.js'
    )
    foreach ($js in $jsFiles) { node --check (Join-Path $extract $js) }

    $branding = Get-ChildItem -LiteralPath $extract -Recurse -File | Select-String -Pattern 'Plover Filler|plover-filler' -SimpleMatch -ErrorAction SilentlyContinue
    if ($branding) { throw 'Outdated visible branding found in extracted release.' }
  } finally {
    $zip.Dispose()
  }

  Write-Output $zipPath
} catch {
  CleanupPaths
  throw
} finally {
  CleanupPaths
}
