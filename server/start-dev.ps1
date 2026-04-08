[CmdletBinding()]
param(
  [switch]$SkipMigrate,
  [switch]$WithSeed,
  [switch]$SkipApi
)

$ErrorActionPreference = 'Stop'

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pgRoot = Join-Path $scriptDir '.local-postgres'
$pgData = Join-Path $pgRoot 'data'
$pgLog = Join-Path $pgRoot 'postgres.log'
$pgBin = Join-Path $env:ProgramFiles 'PostgreSQL\16\bin'

$initdb = Join-Path $pgBin 'initdb.exe'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$psql = Join-Path $pgBin 'psql.exe'
$createdb = Join-Path $pgBin 'createdb.exe'

function Assert-Executable([string]$path) {
  if (!(Test-Path -LiteralPath $path)) {
    throw "Missing executable: $path"
  }
}

function Run-Or-Throw([string]$file, [string[]]$args) {
  & $file @args
  if ($LASTEXITCODE -ne 0) {
    $joinedArgs = $args -join ' '
    throw "Command failed: $file $joinedArgs"
  }
}

Push-Location $scriptDir
try {
  Assert-Executable $initdb
  Assert-Executable $pgCtl
  Assert-Executable $psql
  Assert-Executable $createdb

  if (!(Test-Path -LiteralPath $pgRoot)) {
    New-Item -ItemType Directory -Path $pgRoot | Out-Null
  }

  if (!(Test-Path -LiteralPath $pgData)) {
    Write-Host 'Initializing local PostgreSQL cluster (.local-postgres/data)...'
    Run-Or-Throw $initdb @('-D', $pgData, '-U', 'postgres', '--auth-host=trust', '--auth-local=trust', '-E', 'UTF8')
  }

  $isListening = (Test-NetConnection -ComputerName 'localhost' -Port 5433 -WarningAction SilentlyContinue).TcpTestSucceeded
  if (-not $isListening) {
    Write-Host 'Starting local PostgreSQL on port 5433...'
    Run-Or-Throw $pgCtl @('-D', $pgData, '-l', $pgLog, '-o', '-p 5433', '-w', 'start')
  } else {
    Write-Host 'PostgreSQL already listening on port 5433. Reusing it.'
  }

  $dbExists = (& $psql -h 'localhost' -p '5433' -U 'postgres' -d 'postgres' -tAc "SELECT 1 FROM pg_database WHERE datname='alocars'").Trim()
  if ($LASTEXITCODE -ne 0) {
    throw 'Cannot query PostgreSQL on localhost:5433.'
  }

  if ($dbExists -ne '1') {
    Write-Host 'Creating database alocars...'
    Run-Or-Throw $createdb @('-h', 'localhost', '-p', '5433', '-U', 'postgres', 'alocars')
  }

  $env:DATABASE_URL = 'postgresql://postgres@localhost:5433/alocars'
  Write-Host 'DATABASE_URL set to postgresql://postgres@localhost:5433/alocars'

  $apiListener = Get-NetTCPConnection -LocalPort 3001 -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1
  $apiAlreadyRunning = $null -ne $apiListener

  if (-not $SkipMigrate) {
    Write-Host 'Running Prisma migrations...'
    $migrateArgs = @('prisma', 'migrate', 'dev')
    if ($apiAlreadyRunning) {
      Write-Host 'API already running on port 3001. Using --skip-generate to avoid Prisma engine lock.'
      $migrateArgs += '--skip-generate'
    }

    & npx @migrateArgs
    if ($LASTEXITCODE -ne 0) {
      throw 'Prisma migrate failed.'
    }
  }

  if ($WithSeed) {
    Write-Host 'Seeding database...'
    & npm run db:seed
    if ($LASTEXITCODE -ne 0) {
      throw 'Database seed failed.'
    }
  }

  if ($SkipApi) {
    Write-Host 'SkipApi enabled. Local DB is ready and migrations are applied.'
  } else {
    if ($apiAlreadyRunning) {
      Write-Host 'API already running on port 3001. Skipping npm run dev.'
      return
    }

    Write-Host 'Starting backend API (npm run dev)...'
    & npm run dev
  }
}
finally {
  Pop-Location
}
