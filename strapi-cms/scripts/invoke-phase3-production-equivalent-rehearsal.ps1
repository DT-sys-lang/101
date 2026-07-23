[CmdletBinding()]
param(
  [string]$Database = 'industrial_cms_v5_locale_phase3_20260712_rehearsal1',

  [string]$Backup = 'D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211\database\industrial_cms_pre_strapi_v5.dump',

  [string]$Snapshot = 'D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211\source-snapshot\strapi-cms',

  [string]$Workspace = 'D:\DeliveryOptimization\phase3-v4-v5-rehearsal',

  [string]$HostName = '127.0.0.1',

  [ValidateRange(1, 65535)]
  [int]$Port = 55432,

  [ValidateRange(1, 65535)]
  [int]$StrapiPort = 1340,

  [ValidateRange(1, 65535)]
  [int]$V4StrapiPort = 1341,

  [ValidateRange(1, 65535)]
  [int]$V426StrapiPort = 1342,

  [switch]$SkipUpgradeTool,

  [switch]$KeepWorkspace
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$protectedDatabases = @('industrial_cms', 'industrial_cms_v5_trial', 'industrial_cms_v5_locale_20260712_phase2_rehearsal2')
if ($Database -in $protectedDatabases -or $Database -notmatch '^industrial_cms_v5_locale_phase3_[a-z0-9_]+$') {
  throw "Refusing database '$Database'. Choose a new industrial_cms_v5_locale_phase3_* database."
}

$uniqueStrapiPortCount = @(@($StrapiPort, $V4StrapiPort, $V426StrapiPort) | Select-Object -Unique).Count
if ($uniqueStrapiPortCount -ne 3) {
  throw 'StrapiPort, V4StrapiPort, and V426StrapiPort must be different.'
}

$node = 'C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe'
$nodeRoot = Split-Path -Parent $node
$npmCli = Join-Path $nodeRoot 'node_modules\npm\bin\npm-cli.js'
$npxCli = Join-Path $nodeRoot 'node_modules\npm\bin\npx-cli.js'
$pgBin = 'C:\Users\51352263344\postgresql\postgresql-16.14-2\pgsql\bin'
$psql = Join-Path $pgBin 'psql.exe'
$createdb = Join-Path $pgBin 'createdb.exe'
$pgRestore = Join-Path $pgBin 'pg_restore.exe'
$cmsRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $cmsRoot
$restoreScript = Join-Path $PSScriptRoot 'restore-locale-trial.ps1'
$equivalenceVerifier = Join-Path $PSScriptRoot 'verify-phase3-production-equivalence.mjs'
$localeVerifier = Join-Path $PSScriptRoot 'verify-business-locale-trial.mjs'

foreach ($path in @($node, $npmCli, $npxCli, $psql, $createdb, $pgRestore, $Backup, $Snapshot, $restoreScript, $equivalenceVerifier, $localeVerifier)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required path is missing: $path"
  }
}

if ((& $node --version) -ne 'v20.20.2') {
  throw 'Node 20.20.2 is required for this rehearsal.'
}

function Assert-PortAvailable([int]$CandidatePort, [string]$Label) {
  $listener = Get-NetTCPConnection -LocalPort $CandidatePort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($listener) {
    throw "$Label port $CandidatePort is already in use by process $($listener.OwningProcess)."
  }
}

function Wait-ForHttp200([string]$Url, [string]$Label) {
  $deadline = (Get-Date).AddMinutes(3)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5
      if ($response.StatusCode -eq 200) {
        return
      }
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  throw "$Label did not become healthy at $Url."
}

function Stop-IsolatedProcess($Process) {
  if ($null -ne $Process -and -not $Process.HasExited) {
    Stop-Process -Id $Process.Id -Force
    $Process.WaitForExit()
  }
}

function Set-IsolatedStrapiEnvironment([int]$ApplicationPort) {
  # An inherited connection string must never override the disposable database binding.
  $env:DATABASE_URL = ''
  $env:DATABASE_SSL = 'false'
  $env:NODE_ENV = 'production'
  $env:HOST = '127.0.0.1'
  $env:PORT = "$ApplicationPort"
  $env:PUBLIC_URL = "http://127.0.0.1:$ApplicationPort"
  $env:DATABASE_HOST = $HostName
  $env:DATABASE_PORT = "$Port"
  $env:DATABASE_NAME = $Database
  $env:DATABASE_USERNAME = 'strapi'
  $env:DATABASE_PASSWORD = $env:PGPASSWORD
  $env:STRAPI_CORS_ORIGINS = 'http://127.0.0.1:3002,http://127.0.0.1:3109'
}

$environmentNames = @('NODE_ENV', 'HOST', 'PORT', 'PUBLIC_URL', 'DATABASE_HOST', 'DATABASE_PORT', 'DATABASE_NAME', 'DATABASE_USERNAME', 'DATABASE_PASSWORD', 'DATABASE_URL', 'DATABASE_SSL', 'STRAPI_CORS_ORIGINS', 'NPM_CONFIG_LEGACY_PEER_DEPS')
$previousEnvironment = @{}
foreach ($name in $environmentNames) {
  $previousEnvironment[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}
$previousPath = $env:PATH
$env:PATH = "$nodeRoot;$env:PATH"

$envFile = Join-Path $cmsRoot '.env'
$passwordLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_PASSWORD=' } | Select-Object -First 1
if (-not $passwordLine) {
  throw "DATABASE_PASSWORD is missing from $envFile"
}
$env:PGPASSWORD = $passwordLine.Substring('DATABASE_PASSWORD='.Length).Trim('"').Trim("'")

$exists = & $psql -X -w -h $HostName -p $Port -U postgres -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '$Database'"
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to inspect isolated PostgreSQL as postgres.'
}
if ($exists -eq '1') {
  throw "Refusing to overwrite existing database '$Database'."
}

if (Test-Path -LiteralPath $Workspace) {
  throw "Refusing to overwrite existing rehearsal workspace '$Workspace'."
}

Assert-PortAvailable $StrapiPort 'Isolated v5 Strapi'
Assert-PortAvailable $V4StrapiPort 'Isolated v4 Strapi 4.25.20'
Assert-PortAvailable $V426StrapiPort 'Isolated v4 Strapi 4.26.2'

$reportDirectory = Join-Path $workspaceRoot 'tmp\strapi-v5-locale'
New-Item -ItemType Directory -Path $reportDirectory -Force | Out-Null
$report = Join-Path $reportDirectory "$Database-phase3-rehearsal.json"
$v5StartLog = Join-Path $reportDirectory "$Database-v5-$StrapiPort.out.log"
$v5ErrorLog = Join-Path $reportDirectory "$Database-v5-$StrapiPort.err.log"
$v4StartLog = Join-Path $reportDirectory "$Database-v4-4.25.20-$V4StrapiPort.out.log"
$v4ErrorLog = Join-Path $reportDirectory "$Database-v4-4.25.20-$V4StrapiPort.err.log"
$v426StartLog = Join-Path $reportDirectory "$Database-v4-4.26.2-$V426StrapiPort.out.log"
$v426ErrorLog = Join-Path $reportDirectory "$Database-v4-4.26.2-$V426StrapiPort.err.log"
$v4Process = $null
$v426Process = $null
$v5Process = $null
$succeeded = $false

try {
  # Restore validation is explicit: the source dump first lands in a new v4-compatible database.
  & $createdb -w -h $HostName -p $Port -U postgres -O strapi $Database
  if ($LASTEXITCODE -ne 0) { throw "createdb failed for '$Database'." }

  & $pgRestore -w -h $HostName -p $Port -U strapi -d $Database --no-owner --no-privileges --exit-on-error $Backup
  if ($LASTEXITCODE -ne 0) { throw "pg_restore failed for '$Database'." }

  $v4Baseline = & $psql -X -w -h $HostName -p $Port -U strapi -d $Database -v ON_ERROR_STOP=1 -Atqc "SELECT json_build_object('database',current_database(),'productFacts',(SELECT count(*) FROM product_facts),'categoryFacts',(SELECT count(*) FROM category_facts),'blogPosts',(SELECT count(*) FROM blog_posts),'caseStudies',(SELECT count(*) FROM case_studies),'documentAssets',(SELECT count(*) FROM document_assets),'productManuals',(SELECT count(*) FROM product_manuals),'intentPhrases',(SELECT count(*) FROM intent_phrases));"
  if ($LASTEXITCODE -ne 0) { throw 'The restored v4 baseline did not pass content table readiness checks.' }

  Copy-Item -LiteralPath $Snapshot -Destination $Workspace -Recurse
  $workEnv = Join-Path $Workspace '.env'
  Copy-Item -LiteralPath $envFile -Destination $workEnv -Force
  (Get-Content -Raw -LiteralPath $workEnv).
    Replace('DATABASE_PORT=5432', "DATABASE_PORT=$Port").
    Replace('DATABASE_NAME=industrial_cms', "DATABASE_NAME=$Database") |
    Set-Content -LiteralPath $workEnv -Encoding utf8

  Push-Location $Workspace
  try {
    # Validate the restored v4 source snapshot before applying either upgrade step.
    & $node $npmCli ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed in the isolated v4 snapshot workspace.' }

    $v4Version = & $node -p "require('./node_modules/@strapi/strapi/package.json').version"
    if ($v4Version -ne '4.25.20') { throw "Expected isolated snapshot Strapi 4.25.20; received $v4Version." }

    & $node .\node_modules\@strapi\strapi\bin\strapi.js build
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v4 build failed in the isolated snapshot workspace.' }
    & $node .\scripts\copy-strapi-json.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v4 JSON schema copy failed in the isolated snapshot workspace.' }
    Set-IsolatedStrapiEnvironment $V4StrapiPort
    $v4Process = Start-Process -FilePath $node -ArgumentList '.\node_modules\@strapi\strapi\bin\strapi.js', 'start' -WorkingDirectory $Workspace -RedirectStandardOutput $v4StartLog -RedirectStandardError $v4ErrorLog -PassThru -WindowStyle Hidden
    Wait-ForHttp200 "http://127.0.0.1:$V4StrapiPort/admin" 'Isolated v4 4.25.20 admin'
    Stop-IsolatedProcess $v4Process
    $v4Process = $null

    if (-not $SkipUpgradeTool) {
      # Invoke the official tool with Node 20 and a Node 20-first PATH for all child npm processes.
      & $node $npxCli --yes '@strapi/upgrade@5.50.1' to 4.26.2 --yes
      if ($LASTEXITCODE -ne 0) { throw 'Strapi v4 upgrade to 4.26.2 failed in the isolated workspace.' }
    } else {
      (Get-Content -Raw package.json).Replace('4.25.20', '4.26.2') | Set-Content -LiteralPath package.json -Encoding utf8
      & $node $npmCli install
      if ($LASTEXITCODE -ne 0) { throw 'Explicit 4.26.2 dependency install failed in the isolated workspace.' }
    }

    $v426Version = & $node -p "require('./node_modules/@strapi/strapi/package.json').version"
    if ($v426Version -ne '4.26.2') { throw "Expected Strapi 4.26.2 before major upgrade; received $v426Version." }

    & $node .\node_modules\@strapi\strapi\bin\strapi.js build
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v4.26.2 build failed in the isolated workspace.' }
    & $node .\scripts\copy-strapi-json.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v4.26.2 JSON schema copy failed in the isolated workspace.' }
    Set-IsolatedStrapiEnvironment $V426StrapiPort
    $v426Process = Start-Process -FilePath $node -ArgumentList '.\node_modules\@strapi\strapi\bin\strapi.js', 'start' -WorkingDirectory $Workspace -RedirectStandardOutput $v426StartLog -RedirectStandardError $v426ErrorLog -PassThru -WindowStyle Hidden
    Wait-ForHttp200 "http://127.0.0.1:$V426StrapiPort/admin" 'Isolated v4 4.26.2 admin'
    Stop-IsolatedProcess $v426Process
    $v426Process = $null

    # The official tool receives the temporary npm peer-resolution setting only in this disposable workspace.
    $env:NPM_CONFIG_LEGACY_PEER_DEPS = 'true'
    & $node $npxCli --yes '@strapi/upgrade@5.50.1' to 5.50.1 --yes
    if ($LASTEXITCODE -ne 0) { throw 'Strapi upgrade to v5.50.1 failed in the isolated workspace.' }

    $officialV5Version = & $node -p "require('./node_modules/@strapi/strapi/package.json').version"
    if ($officialV5Version -ne '5.50.1') { throw "Expected official upgrade to reach Strapi 5.50.1; received $officialV5Version." }

    # The current locale-safe application changes are overlaid only in this disposable workspace.
    Copy-Item -LiteralPath (Join-Path $cmsRoot 'package.json') -Destination (Join-Path $Workspace 'package.json') -Force
    Copy-Item -LiteralPath (Join-Path $cmsRoot 'package-lock.json') -Destination (Join-Path $Workspace 'package-lock.json') -Force
    Copy-Item -Path (Join-Path $cmsRoot 'config\*') -Destination (Join-Path $Workspace 'config') -Recurse -Force
    Copy-Item -Path (Join-Path $cmsRoot 'src\*') -Destination (Join-Path $Workspace 'src') -Recurse -Force
    Copy-Item -Path (Join-Path $cmsRoot 'scripts\*') -Destination (Join-Path $Workspace 'scripts') -Recurse -Force

    & $node $npmCli ci
    if ($LASTEXITCODE -ne 0) { throw 'npm ci failed after applying the proven v5.50.1 isolated artifact set.' }

    $v5Version = & $node -p "require('./node_modules/@strapi/strapi/package.json').version"
    if ($v5Version -ne '5.50.1') { throw "Expected Strapi 5.50.1; received $v5Version." }

    & $node .\node_modules\@strapi\strapi\bin\strapi.js build
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v5 build failed in the isolated workspace.' }
    & $node .\scripts\copy-strapi-json.mjs
    if ($LASTEXITCODE -ne 0) { throw 'Strapi v5 JSON schema copy failed in the isolated workspace.' }
  } finally {
    Pop-Location
  }

  # The business locale migration must be completed before Strapi v5 first touches the restored database.
  & $node (Join-Path $Workspace 'scripts\migrate-business-locale-to-content-locale.mjs') --database $Database --host $HostName --port $Port --apply --report (Join-Path $reportDirectory "$Database-rename-report.json")
  if ($LASTEXITCODE -ne 0) { throw 'Locale to contentLocale migration failed in the isolated rehearsal database.' }

  Set-IsolatedStrapiEnvironment $StrapiPort
  $v5Process = Start-Process -FilePath $node -ArgumentList '.\node_modules\@strapi\strapi\bin\strapi.js', 'start' -WorkingDirectory $Workspace -RedirectStandardOutput $v5StartLog -RedirectStandardError $v5ErrorLog -PassThru -WindowStyle Hidden
  Wait-ForHttp200 "http://127.0.0.1:$StrapiPort/admin" 'Isolated v5 admin'

  & $node (Join-Path $Workspace 'scripts\verify-business-locale-trial.mjs') --target-database $Database --target-port $Port --report (Join-Path $reportDirectory "$Database-database-verification.json")
  if ($LASTEXITCODE -ne 0) { throw 'Locale database verifier failed.' }

  & $node $equivalenceVerifier --target-database $Database --target-port $Port --report (Join-Path $reportDirectory "$Database-phase3-equivalence.json")
  if ($LASTEXITCODE -ne 0) { throw 'Phase 3 production-equivalence verifier failed.' }

  [PSCustomObject]@{
    database = $Database
    databasePort = $Port
    v4Baseline = ($v4Baseline | ConvertFrom-Json)
    v4Version = '4.25.20'
    intermediateVersion = '4.26.2'
    v5Version = '5.50.1'
    node = (& $node --version)
    v4AdminUrl = "http://127.0.0.1:$V4StrapiPort/admin"
    v426AdminUrl = "http://127.0.0.1:$V426StrapiPort/admin"
    adminUrl = "http://127.0.0.1:$StrapiPort/admin"
    v5ProcessId = $v5Process.Id
    corsOrigins = $env:STRAPI_CORS_ORIGINS
    workspace = $Workspace
    reports = @(
      (Join-Path $reportDirectory "$Database-rename-report.json"),
      (Join-Path $reportDirectory "$Database-database-verification.json"),
      (Join-Path $reportDirectory "$Database-phase3-equivalence.json")
    )
    status = 'passed'
  } | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $report -Encoding utf8

  Get-Content -Raw -LiteralPath $report
  $succeeded = $true
} finally {
  Stop-IsolatedProcess $v4Process
  Stop-IsolatedProcess $v426Process
  if (-not $succeeded) {
    Stop-IsolatedProcess $v5Process
  }
  foreach ($name in $environmentNames) {
    [Environment]::SetEnvironmentVariable($name, $previousEnvironment[$name], 'Process')
  }
  $env:PATH = $previousPath
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
