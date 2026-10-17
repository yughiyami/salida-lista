param(
    [string]$Serial = 'emulator-5554',
    [string]$Adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
)

# Safety: these helpers never toggle connectivity on a physical phone.
if ($Serial -notmatch '^emulator-\d+$') {
    throw 'Este ensayo está limitado a un emulador; no modifica la red de un teléfono físico.'
}
if (-not (Test-Path -LiteralPath $Adb)) { throw 'No se encontró adb.' }
$Evidence = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..\docs\evidence\android-2026-10-16'))
New-Item -ItemType Directory -Path $Evidence -Force | Out-Null

function Invoke-AppAdb {
    & $Adb -s $Serial @args
    if ($LASTEXITCODE -ne 0) { throw "Falló adb: $args" }
}

function Get-AppUi {
    Invoke-AppAdb shell uiautomator dump /sdcard/salida-lista-ui.xml | Out-Null
    $xmlText = (Invoke-AppAdb shell cat /sdcard/salida-lista-ui.xml) -join "`n"
    [xml]$xml = $xmlText
    return $xml
}

function Show-AppUi {
    $xml = Get-AppUi
    $xml.SelectNodes('//node') |
        Where-Object { $_.text -or $_.'content-desc' } |
        Select-Object text, 'content-desc', checked, clickable, bounds
}

function Tap-AppText([string]$Text) {
    $xml = Get-AppUi
    $node = $xml.SelectNodes('//node') | Where-Object { $_.text -eq $Text -or $_.'content-desc' -eq $Text } | Select-Object -First 1
    if (-not $node) { throw "Control no visible: $Text" }
    if ($node.bounds -notmatch '\[(\d+),(\d+)\]\[(\d+),(\d+)\]') { throw 'Bounds no válidos.' }
    if ([int]$Matches[3] -le [int]$Matches[1] -or [int]$Matches[4] -le [int]$Matches[2]) {
        throw "Control fuera del área visible; desplaza la pantalla: $Text"
    }
    $x = [int]( ([int]$Matches[1] + [int]$Matches[3]) / 2 )
    $y = [int]( ([int]$Matches[2] + [int]$Matches[4]) / 2 )
    Invoke-AppAdb shell input tap $x $y
}

function Save-AppEvidence([string]$Name) {
    if ($Name -notmatch '^[a-z0-9-]+$') { throw 'Nombre de evidencia no válido.' }
    $xml = Get-AppUi
    $xml.Save((Join-Path $Evidence "$Name.xml"))
    Invoke-AppAdb shell screencap -p /sdcard/salida-lista-evidence.png
    Invoke-AppAdb pull /sdcard/salida-lista-evidence.png (Join-Path $Evidence "$Name.png") | Out-Null
    Write-Output (Join-Path $Evidence "$Name.png")
}

function Restart-SalidaLista {
    Invoke-AppAdb shell am force-stop com.salidalista.mobile
    Invoke-AppAdb shell am start -n com.salidalista.mobile/.MainActivity
}
