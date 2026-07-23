[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^industrial_cms_v5_locale_[a-z0-9_]+$')]
  [string]$Database,

  [string]$Backup = 'D:\DeliveryOptimization\strapi-v5-backups\101-20260712-143211\database\industrial_cms_pre_strapi_v5.dump',

  [string]$HostName = '127.0.0.1',

  [int]$Port = 55432,

  [string]$ReportPath,

  [switch]$SkipMigration
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$forbiddenDatabases = @('industrial_cms', 'industrial_cms_v5_trial')
if ($Database -in $forbiddenDatabases) {
  throw "Refusing protected database '$Database'."
}

$pgBin = 'C:\Users\51352263344\postgresql\postgresql-16.14-2\pgsql\bin'
$node = 'C:\Users\51352263344\nodejs\node-v20.20.2-win-x64\node.exe'
$createdb = Join-Path $pgBin 'createdb.exe'
$pgRestore = Join-Path $pgBin 'pg_restore.exe'
$psql = Join-Path $pgBin 'psql.exe'
$cmsRoot = Split-Path -Parent $PSScriptRoot
$workspaceRoot = Split-Path -Parent $cmsRoot
$migrationScript = Join-Path $PSScriptRoot 'migrate-business-locale-to-content-locale.mjs'
$schemaPaths = @(
  (Join-Path $cmsRoot 'src\api\document-asset\content-types\document-asset\schema.json'),
  (Join-Path $cmsRoot 'src\api\product-manual\content-types\product-manual\schema.json'),
  (Join-Path $cmsRoot 'src\api\intent-phrase\content-types\intent-phrase\schema.json'),
  (Join-Path $cmsRoot 'dist\src\api\document-asset\content-types\document-asset\schema.json'),
  (Join-Path $cmsRoot 'dist\src\api\product-manual\content-types\product-manual\schema.json'),
  (Join-Path $cmsRoot 'dist\src\api\intent-phrase\content-types\intent-phrase\schema.json')
)

foreach ($path in @($createdb, $pgRestore, $psql, $node, $Backup, $migrationScript)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required path is missing: $path"
  }
}

foreach ($schemaPath in $schemaPaths) {
  if (-not (Test-Path -LiteralPath $schemaPath)) {
    throw "Runtime schema is missing: $schemaPath. Build Strapi with Node 20 and run scripts/copy-strapi-json.mjs before restoring a locale trial."
  }

  $schema = Get-Content -Raw -LiteralPath $schemaPath | ConvertFrom-Json
  $attributes = $schema.attributes.PSObject.Properties
  if (-not $attributes['contentLocale'] -or $attributes['locale']) {
    throw "Runtime schema '$schemaPath' must define contentLocale and must not define the legacy business locale field."
  }
}

if (-not $ReportPath) {
  $ReportPath = Join-Path $workspaceRoot "tmp\strapi-v5-locale\$Database-rename-report.json"
}

$envFile = Join-Path $cmsRoot '.env'
$passwordLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_PASSWORD=' } | Select-Object -First 1
if (-not $passwordLine) {
  throw "DATABASE_PASSWORD is missing from $envFile"
}

$env:PGPASSWORD = $passwordLine.Substring('DATABASE_PASSWORD='.Length)

$exists = & $psql -X -w -h $HostName -p $Port -U postgres -d postgres -Atqc "SELECT 1 FROM pg_database WHERE datname = '$Database'"
if ($LASTEXITCODE -ne 0) {
  throw 'Unable to inspect the isolated PostgreSQL instance as postgres.'
}

if ($exists -eq '1') {
  throw "Refusing to overwrite existing database '$Database'. Choose a new locale trial database name."
}

try {
  & $createdb -w -h $HostName -p $Port -U postgres -O strapi $Database
  if ($LASTEXITCODE -ne 0) {
    throw "createdb failed for '$Database'."
  }

  & $pgRestore -w -h $HostName -p $Port -U strapi -d $Database --no-owner --no-privileges --exit-on-error $Backup
  if ($LASTEXITCODE -ne 0) {
    throw "pg_restore failed for '$Database'."
  }

  & $psql -X -w -h $HostName -p $Port -U strapi -d $Database -v ON_ERROR_STOP=1 -Atqc "SELECT current_database(), current_user, count(*) FROM document_assets"
  if ($LASTEXITCODE -ne 0) {
    throw "Restored database '$Database' did not pass the document_assets readiness check."
  }

  if (-not $SkipMigration) {
    & $node $migrationScript --database $Database --host $HostName --port $Port --apply --report $ReportPath
    if ($LASTEXITCODE -ne 0) {
      throw "Business locale migration failed for '$Database'. The newly created trial database is retained for diagnosis."
    }
  }
} finally {
  Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}

[PSCustomObject]@{
  database = $Database
  host = $HostName
  port = $Port
  backup = $Backup
  businessLocaleMigration = -not $SkipMigration
  report = if ($SkipMigration) { $null } else { $ReportPath }
} | ConvertTo-Json
