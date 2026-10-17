# Verifies an APK without installing it, contacting a device, or extracting ZIP entries.
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$ApkPath,
    [string]$SdkPath = (Join-Path $env:LOCALAPPDATA 'Android\Sdk'),
    [string]$JavaHome = $env:JAVA_HOME,
    [string]$OutputDir,
    [ValidateNotNullOrEmpty()]
    [string]$ExpectedVersionName = '1.0.1',
    [ValidatePattern('^[1-9][0-9]*$')]
    [string]$ExpectedVersionCode = '2'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Fail before creating evidence when there is no input APK.
if (-not (Test-Path -LiteralPath $ApkPath -PathType Leaf)) {
    throw "APK not found: $ApkPath"
}
$resolvedApk = (Resolve-Path -LiteralPath $ApkPath).ProviderPath
if ([IO.Path]::GetExtension($resolvedApk) -ine '.apk') {
    throw 'ApkPath must identify an .apk file.'
}
if ([string]::IsNullOrWhiteSpace($OutputDir)) {
    $OutputDir = Join-Path (Split-Path -Parent $resolvedApk) 'verification'
}
# Unique run folders preserve previous evidence; only verification outputs are written.
$runName = 'run-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssfffZ') + '-' + [Guid]::NewGuid().ToString('N').Substring(0, 8)
$runDir = Join-Path ([IO.Path]::GetFullPath($OutputDir)) $runName
[void][IO.Directory]::CreateDirectory($runDir)
$checks = [Collections.Generic.List[object]]::new()
$evidence = [ordered]@{
    schemaVersion = 1
    checkedAtUtc = [DateTime]::UtcNow.ToString('o')
    scope = 'Static APK verification only; no device or GPS test'
    apkFileName = [IO.Path]::GetFileName($resolvedApk)
    sizeBytes = (Get-Item -LiteralPath $resolvedApk).Length
    sha256 = (Get-FileHash -LiteralPath $resolvedApk -Algorithm SHA256).Hash.ToLowerInvariant()
    expected = @{ packageName = 'com.salidalista.mobile'; versionName = $ExpectedVersionName; versionCode = $ExpectedVersionCode; abis = @('arm64-v8a', 'x86_64') }
    metadata = $null
    abis = @()
    nativeLibraries = @()
    embeddedBundle = $null
    tools = @{ buildTools = '37.0.0'; javaMajorRequired = 21 }
    checks = $checks
    passed = $false
    apkStructureVerified = $false
    runtimeGpsVerified = $false
    deviceRuntimeTested = $false
    logs = @('java-version.log', 'apksigner.log', 'aapt-badging.log')
    error = $null
}

function Add-Check([string]$Name, [bool]$Passed, [string]$Detail) {
    $checks.Add([pscustomobject]@{ name = $Name; passed = $Passed; detail = $Detail })
}

function Invoke-LoggedTool([string]$Tool, [string[]]$ToolArguments, [string]$LogName) {
    # PowerShell passes each argument independently; no string-built cmd /c command.
    $previousPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $lines = @(& $Tool @ToolArguments 2>&1 | ForEach-Object { $_.ToString() })
        $code = $LASTEXITCODE
    }
    finally { $ErrorActionPreference = $previousPreference }
    $lines | Set-Content -LiteralPath (Join-Path $runDir $LogName) -Encoding UTF8
    return [pscustomobject]@{ exitCode = $code; lines = $lines }
}

$oldJavaHome = $env:JAVA_HOME
try {
    if ([string]::IsNullOrWhiteSpace($JavaHome)) {
        throw 'Set JAVA_HOME to a JDK 21 directory or pass -JavaHome explicitly.'
    }
    $java = Join-Path $JavaHome 'bin\java.exe'
    $signer = Join-Path $SdkPath 'build-tools\37.0.0\apksigner.bat'
    $aapt = Join-Path $SdkPath 'build-tools\37.0.0\aapt.exe'
    foreach ($tool in @($java, $signer, $aapt)) {
        if (-not (Test-Path -LiteralPath $tool -PathType Leaf)) { throw "Required tool missing: $tool" }
    }
    $env:JAVA_HOME = $JavaHome
    $javaResult = Invoke-LoggedTool $java @('-version') 'java-version.log'
    $isJdk21 = ($javaResult.exitCode -eq 0) -and (($javaResult.lines -join "`n") -match 'version\s+"21(?:\.|"|-)')
    Add-Check 'jdk21' $isJdk21 "java -version exit=$($javaResult.exitCode)"
    if (-not $isJdk21) { throw 'JDK 21 verification failed; see java-version.log.' }

    $signature = Invoke-LoggedTool $signer @('verify', '--verbose', '--print-certs', $resolvedApk) 'apksigner.log'
    Add-Check 'signature' ($signature.exitCode -eq 0) "apksigner verify exit=$($signature.exitCode); public certificate details in log"

    $badging = Invoke-LoggedTool $aapt @('dump', 'badging', $resolvedApk) 'aapt-badging.log'
    Add-Check 'aaptExit' ($badging.exitCode -eq 0) "aapt dump badging exit=$($badging.exitCode)"
    $packageLine = @($badging.lines | Where-Object { $_ -match '^package:' }) | Select-Object -First 1
    $metadataValid = $false
    if ($null -ne $packageLine -and $packageLine -match "name='([^']+)'\s+versionCode='([^']+)'\s+versionName='([^']+)'") {
        $metadata = [ordered]@{ packageName = $Matches[1]; versionCode = $Matches[2]; versionName = $Matches[3] }
        $evidence.metadata = $metadata
        $metadataValid = ($metadata.packageName -ceq 'com.salidalista.mobile') -and ($metadata.versionName -ceq $ExpectedVersionName) -and ($metadata.versionCode -ceq $ExpectedVersionCode)
    }
    Add-Check 'expectedMetadata' $metadataValid "Expected com.salidalista.mobile / versionName $ExpectedVersionName / versionCode $ExpectedVersionCode"

    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive = [IO.Compression.ZipFile]::OpenRead($resolvedApk)
    try {
        # ZIP entry names are case-sensitive even on a Windows host. Group-Object's
        # default comparer incorrectly conflates valid resources such as _Y/_y.
        $entryNames = [Collections.Generic.HashSet[string]]::new([StringComparer]::Ordinal)
        $duplicates = [Collections.Generic.List[string]]::new()
        foreach ($entry in $archive.Entries) {
            if (-not $entryNames.Add($entry.FullName)) { $duplicates.Add($entry.FullName) }
        }
        Add-Check 'uniqueZipEntries' ($duplicates.Count -eq 0) "Exact duplicate entry names=$($duplicates.Count) (ordinal, case-sensitive)"

        $libraries = @($archive.Entries | Where-Object { $_.FullName -match '^lib/([^/]+)/([^/]+\.so)$' } | ForEach-Object {
            [void]($_.FullName -match '^lib/([^/]+)/([^/]+\.so)$')
            [pscustomobject]@{ abi = $Matches[1]; file = $Matches[2]; sizeBytes = $_.Length }
        })
        $evidence.nativeLibraries = $libraries
        $evidence.abis = @($libraries | ForEach-Object { $_.abi } | Sort-Object -Unique)
        foreach ($abi in @('arm64-v8a', 'x86_64')) {
            Add-Check "abi:$abi" ($evidence.abis -contains $abi) "Required native ABI $abi"
            foreach ($lib in @('libreactnative.so', 'libappmodules.so', 'libmaplibre.so', 'libexpo-sqlite.so', 'libreanimated.so', 'libworklets.so')) {
                $found = @($libraries | Where-Object { $_.abi -ceq $abi -and $_.file -ceq $lib -and $_.sizeBytes -gt 0 })
                Add-Check "library:$abi/$lib" ($found.Count -eq 1) 'Required nonempty native core library'
            }
            $hermes = @($libraries | Where-Object { $_.abi -ceq $abi -and $_.file -cin @('libhermesvm.so', 'libhermes.so') -and $_.sizeBytes -gt 0 })
            Add-Check "hermes:$abi" ($hermes.Count -ge 1) 'Nonempty libhermesvm.so (current RN) or libhermes.so (older naming)'
        }
        # Optional modules must not be present for one required ABI but absent for the other.
        foreach ($lib in @('libreanimated.so', 'libworklets.so', 'libmaplibre.so', 'libmaplibre-native.so')) {
            if (@($libraries | Where-Object { $_.file -ceq $lib }).Count -gt 0) {
                foreach ($abi in @('arm64-v8a', 'x86_64')) {
                    $found = @($libraries | Where-Object { $_.abi -ceq $abi -and $_.file -ceq $lib -and $_.sizeBytes -gt 0 })
                    Add-Check "moduleParity:$abi/$lib" ($found.Count -eq 1) 'Optional module found in APK must cover both required ABIs'
                }
            }
        }
        $bundles = @($archive.Entries | Where-Object { $_.FullName -ceq 'assets/index.android.bundle' })
        $bundleBytes = 0
        if ($bundles.Count -eq 1) { $bundleBytes = $bundles[0].Length }
        $evidence.embeddedBundle = @{ entry = 'assets/index.android.bundle'; count = $bundles.Count; sizeBytes = $bundleBytes }
        Add-Check 'embeddedJsBundle' (($bundles.Count -eq 1) -and ($bundleBytes -gt 0)) 'Nonempty embedded JS/Hermes bundle; no Metro required for bundle delivery'
    }
    finally { $archive.Dispose() }
    $evidence.passed = ($checks.Count -gt 0) -and (@($checks | Where-Object { -not $_.passed }).Count -eq 0)
    $evidence.apkStructureVerified = $evidence.passed
}
catch {
    $evidence.error = $_.Exception.Message
    Add-Check 'verificationCompleted' $false $_.Exception.Message
    $evidence.passed = $false
}
finally {
    $env:JAVA_HOME = $oldJavaHome
    $evidence | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath (Join-Path $runDir 'evidence.json') -Encoding UTF8
}

Write-Output "Evidence: $(Join-Path $runDir 'evidence.json')"
if (-not $evidence.passed) {
    Write-Output 'FAILED: one or more static APK checks failed. This is not device validation.'
    exit 1
}
Write-Output 'PASSED: static APK checks only. Device runtime, offline persistence and real GPS remain separate tests.'
exit 0
