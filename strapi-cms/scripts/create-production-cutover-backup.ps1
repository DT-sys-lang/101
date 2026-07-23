[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-zA-Z0-9_]+$')]
  [string]$Database,

  [Parameter(Mandatory = $true)]
  [ValidatePattern('^[a-zA-Z0-9_]+$')]
  [string]$Superuser,

  [string]$HostName = '127.0.0.1',

  [ValidateRange(1, 65535)]
  [int]$Port = 5432,

  [string]$BackupRoot = 'D:\DeliveryOptimization\strapi-v5-backups',

  [string]$PgBin = 'C:\Users\51352263344\postgresql\postgresql-16.14-2\pgsql\bin',

  [switch]$AllowProductionDatabase
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ($Database -eq 'industrial_cms' -and -not $AllowProductionDatabase) {
  throw "Refusing production database '$Database' without -AllowProductionDatabase."
}

$pgDump = Join-Path $PgBin 'pg_dump.exe'
$pgDumpAll = Join-Path $PgBin 'pg_dumpall.exe'
$pgRestore = Join-Path $PgBin 'pg_restore.exe'
$psql = Join-Path $PgBin 'psql.exe'

foreach ($path in @($pgDump, $pgDumpAll, $pgRestore, $psql)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required PostgreSQL executable is missing: $path"
  }
}

if (-not (Test-Path -LiteralPath $BackupRoot)) {
  New-Item -ItemType Directory -Path $BackupRoot -Force | Out-Null
}

$preflight = & $psql -X -w -h $HostName -p $Port -U $Superuser -d $Database -v ON_ERROR_STOP=1 -Atqc @'
SELECT json_build_object(
  'database', current_database(),
  'user', current_user,
  'superuser', (SELECT rolsuper FROM pg_roles WHERE rolname = current_user),
  'serverVersion', current_setting('server_version'),
  'applicationDatabaseOwner', (SELECT pg_get_userbyid(datdba) FROM pg_database WHERE datname = current_database()),
  'roleCount', (SELECT count(*) FROM pg_roles),
  'loginRoleCount', (SELECT count(*) FROM pg_roles WHERE rolcanlogin),
  'customTablespaceCount', (SELECT count(*) FROM pg_tablespace WHERE spcname NOT IN ('pg_default', 'pg_global')),
  'extensions', (SELECT coalesce(json_agg(json_build_object('name', extname, 'version', extversion) ORDER BY extname), '[]'::json) FROM pg_extension)
)::text;
'@
if ($LASTEXITCODE -ne 0) {
  throw 'PostgreSQL superuser preflight query failed. Provide credentials through a protected PGPASSFILE, pgpass.conf, or secret manager integration.'
}

$preflightObject = $preflight | ConvertFrom-Json
if (-not $preflightObject.superuser) {
  throw "Role '$($preflightObject.user)' is not a PostgreSQL superuser. Refusing to create an incomplete production backup."
}

if ($preflightObject.database -ne $Database) {
  throw "Connected database '$($preflightObject.database)' does not match requested database '$Database'."
}

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outputDirectory = Join-Path $BackupRoot "$Database-production-cutover-$timestamp"
if (Test-Path -LiteralPath $outputDirectory) {
  throw "Refusing to overwrite existing backup directory '$outputDirectory'."
}

New-Item -ItemType Directory -Path $outputDirectory -Force | Out-Null

$customDump = Join-Path $outputDirectory "$Database.dump"
$plainDump = Join-Path $outputDirectory "$Database.sql"
$globalsDump = Join-Path $outputDirectory 'postgres-globals.sql'
$globalsAudit = Join-Path $outputDirectory 'global-objects-audit.json'
$dumpList = Join-Path $outputDirectory "$Database.dump.list"
$extensionManifest = Join-Path $outputDirectory 'extensions.json'
$checksumFile = Join-Path $outputDirectory 'SHA256SUMS.txt'
$manifestFile = Join-Path $outputDirectory 'backup-manifest.json'
$restoreInstructions = Join-Path $outputDirectory 'RESTORE.md'

try {
  & $pgDump -w -h $HostName -p $Port -U $Superuser -d $Database --format=custom --file=$customDump
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump custom backup failed for '$Database'."
  }

  & $pgDump -w -h $HostName -p $Port -U $Superuser -d $Database --format=plain --file=$plainDump
  if ($LASTEXITCODE -ne 0) {
    throw "pg_dump plain SQL backup failed for '$Database'."
  }

  # Global objects require a cluster superuser. This file can contain role password hashes; protect it as a secret backup artifact.
  & $pgDumpAll -w -h $HostName -p $Port -U $Superuser --globals-only --file=$globalsDump
  if ($LASTEXITCODE -ne 0) {
    throw 'pg_dumpall --globals-only failed. The backup is not complete enough for a cutover window.'
  }

  $globalsText = Get-Content -LiteralPath $globalsDump -Raw -Encoding utf8
  $globalsSummary = [ordered]@{
    generatedAt = (Get-Date).ToUniversalTime().ToString('o')
    dumpBytes = (Get-Item -LiteralPath $globalsDump).Length
    createRoleStatements = ([regex]::Matches($globalsText, '(?m)^CREATE ROLE ')).Count
    alterRoleStatements = ([regex]::Matches($globalsText, '(?m)^ALTER ROLE ')).Count
    roleMembershipGrantStatements = ([regex]::Matches($globalsText, '(?m)^GRANT .+ TO ')).Count
    createTablespaceStatements = ([regex]::Matches($globalsText, '(?m)^CREATE TABLESPACE ')).Count
    expectedRoleCount = [int]$preflightObject.roleCount
    expectedLoginRoleCount = [int]$preflightObject.loginRoleCount
    expectedCustomTablespaceCount = [int]$preflightObject.customTablespaceCount
    rolePasswordHashesMayBePresent = $true
  }
  if ($globalsSummary.createRoleStatements -lt 1) {
    throw 'postgres-globals.sql contains no CREATE ROLE statements. Refusing an incomplete global-object backup.'
  }
  if ($globalsSummary.createTablespaceStatements -lt $globalsSummary.expectedCustomTablespaceCount) {
    throw 'postgres-globals.sql does not contain every expected custom tablespace. Refusing an incomplete global-object backup.'
  }
  $globalsSummary | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $globalsAudit -Encoding utf8

  & $pgRestore -l $customDump | Set-Content -LiteralPath $dumpList -Encoding utf8
  if ($LASTEXITCODE -ne 0) {
    throw 'pg_restore -l failed for the newly created custom dump.'
  }

  $preflight | Set-Content -LiteralPath $extensionManifest -Encoding utf8

  $filesToHash = @($customDump, $plainDump, $globalsDump, $globalsAudit, $dumpList, $extensionManifest)
  $hashRows = foreach ($file in $filesToHash) {
    $hash = Get-FileHash -Algorithm SHA256 -LiteralPath $file
    "{0} *{1}" -f $hash.Hash.ToLowerInvariant(), (Split-Path -Leaf $file)
  }
  $hashRows | Set-Content -LiteralPath $checksumFile -Encoding ascii

  $manifest = [ordered]@{
    createdAt = (Get-Date).ToUniversalTime().ToString('o')
    database = $Database
    host = $HostName
    port = $Port
    executedBy = $preflightObject.user
    serverVersion = $preflightObject.serverVersion
    applicationDatabaseOwner = $preflightObject.applicationDatabaseOwner
    superuserVerified = [bool]$preflightObject.superuser
    extensions = $preflightObject.extensions
    globalObjects = $globalsSummary
    files = @(
      (Split-Path -Leaf $customDump),
      (Split-Path -Leaf $plainDump),
      (Split-Path -Leaf $globalsDump),
      (Split-Path -Leaf $globalsAudit),
      (Split-Path -Leaf $dumpList),
      (Split-Path -Leaf $extensionManifest),
      (Split-Path -Leaf $checksumFile)
    )
    restoreOrder = @(
      'Verify SHA256SUMS.txt before restore.',
      'DBA reviews global-objects-audit.json and postgres-globals.sql in a protected location.',
      'On a clean replacement cluster only, restore postgres-globals.sql with a PostgreSQL superuser.',
      'Create a new target database; never restore over industrial_cms.',
      'Restore the custom dump with pg_restore into that new target database.',
      'Validate extensions, ownership, application startup, and row counts before any traffic change.'
    )
  }
  $manifest | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $manifestFile -Encoding utf8

  @"
# PostgreSQL Cutover Backup Restore

This backup was created with a PostgreSQL superuser. It contains a custom dump, a plain SQL dump, a complete global-object dump, a non-secret global-object audit, a custom-dump table of contents, extension metadata, and SHA-256 checksums.

## Safety

- The `postgres-globals.sql` file can include role password hashes. Keep the entire backup directory encrypted and access-controlled; never paste its content into tickets or logs.
- Verify checksums before every restore attempt.
- Do not restore into `industrial_cms` or another active database.
- Restore global objects only after the DBA reviews their role and tablespace effects.
- Use global-object restore only on a clean replacement cluster. Do not replay it into a shared or running production cluster where roles already exist.
- Run all restore commands as a PostgreSQL superuser or a role with the required create-role, create-database, ownership, and extension privileges.

## Verify SHA-256

```powershell
`$backupDirectory = Split-Path -Parent `$MyInvocation.MyCommand.Path
Get-Content -LiteralPath (Join-Path `$backupDirectory 'SHA256SUMS.txt') | ForEach-Object {
  if (`$_ -notmatch '^(?<hash>[0-9a-f]{64}) \*(?<file>.+)$') { throw "Invalid SHA256SUMS entry: `$_" }
  `$actual = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path `$backupDirectory `$matches.file)).Hash.ToLowerInvariant()
  if (`$actual -ne `$matches.hash) { throw "Checksum mismatch for `$(`$matches.file)" }
}
```

## Full Restore To A Clean Replacement Cluster

```powershell
`$env:PGPASSFILE = '<protected-pgpass-file-from-secret-manager>'
`$backupDirectory = '<protected-backup-directory>'
`$targetDatabase = 'industrial_cms_v5_restore_validation_YYYYMMDD_HHMMSS'
if (`$targetDatabase -eq 'industrial_cms') { throw 'Refusing to restore over industrial_cms.' }

# DBA review must happen before this command. Restore globals before creating a database that depends on those roles.
& '<pg-bin>\psql.exe' -X -w -h <host> -p <port> -U <superuser> -d postgres -v ON_ERROR_STOP=1 -f (Join-Path `$backupDirectory 'postgres-globals.sql')
& '<pg-bin>\createdb.exe' -w -h <host> -p <port> -U <superuser> -O <application-owner> `$targetDatabase
& '<pg-bin>\pg_restore.exe' -w -h <host> -p <port> -U <superuser> -d `$targetDatabase --exit-on-error --verbose (Join-Path `$backupDirectory '$Database.dump')
```

## Restore To A New Validation Database On The Same Cluster

Do not replay `postgres-globals.sql` on the same cluster. First compare the existing roles, memberships, tablespaces, ownership, and extension versions with `backup-manifest.json` and `global-objects-audit.json`; then create a new, uniquely named validation database and restore only the custom dump.

After either path, confirm the extension list in `extensions.json`, application-role ownership and privileges, row-count parity, Strapi startup, and the phase-3 equivalence verifier before any traffic change.
"@ | Set-Content -LiteralPath $restoreInstructions -Encoding utf8
} catch {
  throw
}

[PSCustomObject]@{
  outputDirectory = $outputDirectory
  database = $Database
  superuserVerified = $true
  customDump = $customDump
  plainDump = $plainDump
  globalsDump = $globalsDump
  globalsAudit = $globalsAudit
  checksumFile = $checksumFile
  manifest = $manifestFile
} | ConvertTo-Json
