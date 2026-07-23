[CmdletBinding()]
param(
  [string]$StrapiBaseUrl,

  [string]$FrontendBaseUrl,

  [string[]]$AllowedCorsOrigin = @(),

  [string]$UnapprovedCorsOrigin = 'https://unapproved.example.invalid',

  [string]$EvidenceDirectory,

  [switch]$RunExternalChecks
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$workspaceRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$defaultEvidenceRoot = Join-Path $workspaceRoot 'tmp\strapi-v5-production-evidence'
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'

if ([string]::IsNullOrWhiteSpace($EvidenceDirectory)) {
  $EvidenceDirectory = Join-Path $defaultEvidenceRoot "phase4-infrastructure-$timestamp"
}

$resolvedWorkspaceRoot = [IO.Path]::GetFullPath($workspaceRoot)
$resolvedEvidenceDirectory = [IO.Path]::GetFullPath($EvidenceDirectory)
$workspacePrefix = $resolvedWorkspaceRoot.TrimEnd([IO.Path]::DirectorySeparatorChar, [IO.Path]::AltDirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar

if (-not $resolvedEvidenceDirectory.StartsWith($workspacePrefix, [StringComparison]::OrdinalIgnoreCase)) {
  throw "EvidenceDirectory must remain inside the workspace: $resolvedWorkspaceRoot"
}

New-Item -ItemType Directory -Path $resolvedEvidenceDirectory -Force | Out-Null

function ConvertTo-ApprovedHttpsUrl {
  param(
    [string]$Value,
    [string]$Label
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $null
  }

  $uri = $null
  if (-not [Uri]::TryCreate($Value.Trim(), [UriKind]::Absolute, [ref]$uri)) {
    throw "$Label must be an absolute HTTPS URL."
  }

  if ($uri.Scheme -ne 'https' -or -not [string]::IsNullOrWhiteSpace($uri.UserInfo) -or $uri.Query -or $uri.Fragment) {
    throw "$Label must be HTTPS and must not contain credentials, a query string, or a fragment."
  }

  return $uri.AbsoluteUri.TrimEnd('/')
}

function Get-ConfigText {
  param([string]$RelativePath)

  $path = Join-Path $workspaceRoot $RelativePath
  if (-not (Test-Path -LiteralPath $path)) {
    return ''
  }

  return Get-Content -LiteralPath $path -Raw -Encoding utf8
}

function Test-TextContains {
  param(
    [string]$Text,
    [string]$Value
  )

  return $Text.IndexOf($Value, [StringComparison]::OrdinalIgnoreCase) -ge 0
}

function Get-SafeHeaderValue {
  param(
    [object]$Response,
    [string]$HeaderName
  )

  if ($null -eq $Response) {
    return $null
  }

  try {
    $value = $Response.Headers[$HeaderName]
    if ($null -ne $value) {
      return [string]$value
    }
  } catch {
    return $null
  }

  return $null
}

function Invoke-ReadOnlyProbe {
  param(
    [string]$Name,
    [string]$Uri,
    [ValidateSet('GET', 'OPTIONS')]
    [string]$Method = 'GET',
    [hashtable]$Headers = @(),
    [int[]]$ExpectedStatus = @(),
    [string]$ExpectedCorsOrigin
  )

  $result = [ordered]@{
    name = $Name
    method = $Method
    uri = $Uri
    expectedStatuses = $ExpectedStatus
    expectedCorsOrigin = $ExpectedCorsOrigin
    statusCode = $null
    result = 'not-run'
    responseHeaders = [ordered]@{}
    errorType = $null
  }

  $requestParameters = @{
    Uri = $Uri
    Method = $Method
    Headers = $Headers
    UseBasicParsing = $true
    ErrorAction = 'Stop'
  }


  $response = $null
  try {
    $response = Invoke-WebRequest @requestParameters
  } catch {
    if ($null -ne $_.Exception.Response) {
      $response = $_.Exception.Response
    } else {
      $result.errorType = $_.Exception.GetType().FullName
      return [pscustomobject]$result
    }
  }

  $result.statusCode = [int]$response.StatusCode
  $result.responseHeaders = [ordered]@{
    accessControlAllowOrigin = Get-SafeHeaderValue -Response $response -HeaderName 'Access-Control-Allow-Origin'
    accessControlAllowMethods = Get-SafeHeaderValue -Response $response -HeaderName 'Access-Control-Allow-Methods'
    accessControlAllowHeaders = Get-SafeHeaderValue -Response $response -HeaderName 'Access-Control-Allow-Headers'
    strictTransportSecurity = Get-SafeHeaderValue -Response $response -HeaderName 'Strict-Transport-Security'
    cacheControl = Get-SafeHeaderValue -Response $response -HeaderName 'Cache-Control'
    contentSecurityPolicy = Get-SafeHeaderValue -Response $response -HeaderName 'Content-Security-Policy'
    xContentTypeOptions = Get-SafeHeaderValue -Response $response -HeaderName 'X-Content-Type-Options'
  }

  $statusMatches = $true
  if ($ExpectedStatus.Count -gt 0) {
    $statusMatches = $ExpectedStatus -contains $result.statusCode
  }

  $corsMatches = $true
  if ($ExpectedCorsOrigin) {
    $corsMatches = $result.responseHeaders.accessControlAllowOrigin -eq $ExpectedCorsOrigin
  }

  $result.result = if ($statusMatches -and $corsMatches) { 'passed' } else { 'failed' }
  return [pscustomobject]$result
}

$strapiUrl = ConvertTo-ApprovedHttpsUrl -Value $StrapiBaseUrl -Label 'StrapiBaseUrl'
$frontendUrl = ConvertTo-ApprovedHttpsUrl -Value $FrontendBaseUrl -Label 'FrontendBaseUrl'
$unapprovedOrigin = ConvertTo-ApprovedHttpsUrl -Value $UnapprovedCorsOrigin -Label 'UnapprovedCorsOrigin'
$approvedOrigins = @(
  $AllowedCorsOrigin |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    ForEach-Object { ConvertTo-ApprovedHttpsUrl -Value $_ -Label 'AllowedCorsOrigin' } |
    Sort-Object -Unique
)

if ($RunExternalChecks -and (-not $strapiUrl -or -not $frontendUrl)) {
  throw 'RunExternalChecks requires both StrapiBaseUrl and FrontendBaseUrl.'
}

$strapiPackage = Get-Content -LiteralPath (Join-Path $workspaceRoot 'strapi-cms\package.json') -Raw -Encoding utf8 | ConvertFrom-Json
$strapiAdminConfig = Get-ConfigText -RelativePath 'strapi-cms\config\admin.js'
$strapiMiddlewareConfig = Get-ConfigText -RelativePath 'strapi-cms\config\middlewares.js'
$strapiServerConfig = Get-ConfigText -RelativePath 'strapi-cms\config\server.js'
$strapiExampleEnv = Get-ConfigText -RelativePath 'strapi-cms\.env.example'
$ciWorkflow = Get-ConfigText -RelativePath '.github\workflows\ci.yml'
$dependencies = @($strapiPackage.dependencies.PSObject.Properties.Name)
$deploymentDescriptorPaths = @(
  '.railway', '.vercel', '.netlify', '.docker', 'infra', 'infrastructure', 'deploy', 'deployment',
  'ops', 'k8s', 'helm', 'terraform', 'docker-compose.yml', 'docker-compose.yaml', 'compose.yml',
  'compose.yaml', 'Dockerfile', 'Caddyfile', 'vercel.json', 'railway.toml', 'render.yaml', 'fly.toml',
  'Procfile', 'nginx.conf'
)

$localConfiguration = [ordered]@{
  strapiVersion = $strapiPackage.dependencies.'@strapi/strapi'
  nodeEngine = $strapiPackage.engines.node
  nodeVersionFile = (Get-Content -LiteralPath (Join-Path $workspaceRoot 'strapi-cms\.node-version') -Raw -Encoding utf8).Trim()
  encryptionKeyConfigPresent = Test-TextContains -Text $strapiAdminConfig -Value "encryptionKey: env('ENCRYPTION_KEY')"
  corsAllowListConfigPresent = (Test-TextContains -Text $strapiMiddlewareConfig -Value 'STRAPI_CORS_ORIGINS') -and (Test-TextContains -Text $strapiMiddlewareConfig -Value "'strapi::cors'")
  publicUrlConfigPresent = Test-TextContains -Text $strapiServerConfig -Value "url: env('PUBLIC_URL'"
  productionEnvTemplateHasRequiredKeys = @('NODE_ENV', 'PUBLIC_URL', 'ENCRYPTION_KEY', 'DATABASE_SSL', 'STRAPI_CORS_ORIGINS', 'INTERNAL_CMS_FACTS_TOKEN') | ForEach-Object {
    [pscustomobject]@{ key = $_; present = Test-TextContains -Text $strapiExampleEnv -Value "$_=" }
  }
  objectStorageUploadProviderConfigured = @($dependencies | Where-Object { $_ -like '@strapi/provider-upload-*' }).Count -gt 0
  deploymentDescriptorsFound = @($deploymentDescriptorPaths | Where-Object { Test-Path -LiteralPath (Join-Path $workspaceRoot $_) })
  ciHasStrapiNode20Gate = (Test-TextContains -Text $ciWorkflow -Value 'node-version: 20') -and (Test-TextContains -Text $ciWorkflow -Value 'strapi-cms')
  ciHasDeploymentStep = (Test-TextContains -Text $ciWorkflow -Value 'railway') -or (Test-TextContains -Text $ciWorkflow -Value 'vercel') -or (Test-TextContains -Text $ciWorkflow -Value 'deploy')
}

$probes = @()
if ($RunExternalChecks) {
  $probes += Invoke-ReadOnlyProbe -Name 'strapi-admin-https' -Uri "$strapiUrl/admin" -ExpectedStatus 200
  $probes += Invoke-ReadOnlyProbe -Name 'strapi-facts-rejects-missing-token' -Uri "$strapiUrl/internal/cms/facts" -ExpectedStatus 401,403

  foreach ($origin in $approvedOrigins) {
    $probes += Invoke-ReadOnlyProbe `
      -Name "strapi-cors-allows-$([Uri]$origin).Host" `
      -Uri "$strapiUrl/internal/cms/facts" `
      -Method 'OPTIONS' `
      -Headers @{ Origin = $origin; 'Access-Control-Request-Method' = 'GET'; 'Access-Control-Request-Headers' = 'Authorization' } `
      -ExpectedStatus 204 `
      -ExpectedCorsOrigin $origin
  }

  $probes += Invoke-ReadOnlyProbe `
    -Name 'strapi-cors-rejects-unapproved-origin' `
    -Uri "$strapiUrl/internal/cms/facts" `
    -Method 'OPTIONS' `
    -Headers @{ Origin = $unapprovedOrigin; 'Access-Control-Request-Method' = 'GET'; 'Access-Control-Request-Headers' = 'Authorization' } `
    -ExpectedStatus 200,204

  $unapprovedProbe = $probes[$probes.Count - 1]
  if ($unapprovedProbe.responseHeaders.accessControlAllowOrigin) {
    $unapprovedProbe.result = 'failed'
  }

  $probes += Invoke-ReadOnlyProbe -Name 'frontend-cms-status-https' -Uri "$frontendUrl/api/cms/status" -ExpectedStatus 200
  $probes += Invoke-ReadOnlyProbe -Name 'frontend-sitemap-https' -Uri "$frontendUrl/sitemap.xml" -ExpectedStatus 200
}

$externalSummary = if ($RunExternalChecks) {
  [ordered]@{
    executed = $true
    passed = @($probes | Where-Object { $_.result -eq 'passed' }).Count
    failed = @($probes | Where-Object { $_.result -eq 'failed' }).Count
    inconclusive = @($probes | Where-Object { $_.result -eq 'not-run' }).Count
    overall = if (@($probes | Where-Object { $_.result -ne 'passed' }).Count -eq 0) { 'passed' } else { 'failed-or-inconclusive' }
  }
} else {
  [ordered]@{
    executed = $false
    overall = 'not-run'
    reason = 'RunExternalChecks was not supplied. No network request was made.'
  }
}

$report = [ordered]@{
  schemaVersion = 'strapi-v5-phase4-infrastructure-evidence-v1'
  generatedAt = (Get-Date).ToUniversalTime().ToString('o')
  executionMode = if ($RunExternalChecks) { 'external-read-only' } else { 'local-audit-only' }
  scope = 'Production readiness evidence collection only. It does not deploy, mutate DNS, write to PostgreSQL, rotate credentials, or stop v4.'
  inputs = [ordered]@{
    strapiBaseUrl = $strapiUrl
    frontendBaseUrl = $frontendUrl
    allowedCorsOrigins = $approvedOrigins
    unapprovedCorsOrigin = $unapprovedOrigin
  }
  localConfiguration = $localConfiguration
  externalChecks = $externalSummary
  probes = $probes
  requiredManualEvidence = @(
    'Deployment service identifiers and release artifact digest from the production-equivalent environment.',
    'DBA superuser backup manifest, global-object audit, checksum verification, and controlled retention location reference.',
    'Object storage and CDN upload/read/delete/restore/invalidation evidence.',
    'TLS certificate, reverse-proxy X-Forwarded-*, request-size, timeout, rate-limit, and cache-policy evidence.',
    'Secret-manager injection, RBAC/MFA, token rotation/revocation, audit-log, monitoring, and alert-routing evidence.',
    'Signed webhook delivery, retry/alerting, durable deduplication, preview expiry/noindex, CI or acceptance-device browser, and business acceptance evidence.'
  )
  productionCutoverAuthorized = $false
}

$reportPath = Join-Path $resolvedEvidenceDirectory 'phase4-infrastructure-evidence.json'
$report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $reportPath -Encoding utf8

[pscustomobject]@{
  reportPath = $reportPath
  executionMode = $report.executionMode
  externalCheckOverall = $externalSummary.overall
  productionCutoverAuthorized = $false
} | ConvertTo-Json
