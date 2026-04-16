$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$mavenHome = Join-Path $projectRoot ".tools/apache-maven-3.9.9"
$localRepo = Join-Path $projectRoot ".m2repo"
$jarPath = Join-Path $PSScriptRoot "target/smart-campus-backend-0.0.1-SNAPSHOT.jar"
$mavenCommand = Get-Command mvn -ErrorAction SilentlyContinue

Write-Host "Building backend..."

if ($mavenCommand) {
    & $mavenCommand.Source "package" "-DskipTests"
} else {
    if (-not (Test-Path $mavenHome)) {
        throw "Maven was not found on PATH and local Maven runtime was not found at $mavenHome"
    }

    $mavenClasspath = @(
        Join-Path $mavenHome "boot/plexus-classworlds-2.8.0.jar"
    ) + (Get-ChildItem (Join-Path $mavenHome "lib/*.jar") | ForEach-Object { $_.FullName })

    java "-Dmaven.home=$mavenHome" `
        "-Dmaven.multiModuleProjectDirectory=$projectRoot" `
        -cp ($mavenClasspath -join ";") `
        org.apache.maven.cli.MavenCli `
        "-Dmaven.repo.local=$localRepo" `
        package `
        -DskipTests
}

if ($LASTEXITCODE -ne 0) {
    throw "Backend build failed."
}

Write-Host "Starting backend on http://127.0.0.1:8080 ..."
java -jar $jarPath
