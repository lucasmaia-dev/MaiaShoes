param([Parameter(Mandatory = $true)][string]$ZipPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Drawing
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskImageDir = Join-Path $taskRoot 'frontend\public\products'
$taskDataDir = Join-Path $taskRoot 'frontend\src\data'
New-Item -ItemType Directory -Path $taskImageDir, $taskDataDir -Force | Out-Null
$taskZip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path -LiteralPath $ZipPath).Path)
try {
  $taskPhotos = @($taskZip.Entries | Where-Object { $_.Name -match '\.(jpe?g|png|webp)$' } | Sort-Object FullName)
  $taskManifest = @()
  $taskIndex = 0
  foreach ($taskPhoto in $taskPhotos) {
    if ($taskPhoto.Length -gt 20MB) { throw 'Imagem maior que o limite de importação.' }
    $taskIndex++
    $taskNumber = '{0:D3}' -f $taskIndex
    $taskExtension = [System.IO.Path]::GetExtension($taskPhoto.Name).ToLowerInvariant()
    $taskFilename = "foto-$taskNumber$taskExtension"
    # Usamos nomes próprios: os caminhos internos do ZIP nunca viram destinos.
    $taskTarget = Join-Path $taskImageDir $taskFilename
    if (Test-Path -LiteralPath $taskTarget) { throw "O arquivo $taskFilename já existe; preservado." }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($taskPhoto, $taskTarget, $false)
    $taskImage = [System.Drawing.Image]::FromFile($taskTarget)
    try {
      $taskManifest += [ordered]@{ id = $taskNumber; label = "Foto $taskNumber"; url = "/products/$taskFilename"; originalName = $taskPhoto.Name; width = $taskImage.Width; height = $taskImage.Height }
    } finally { $taskImage.Dispose() }
  }
  $taskManifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $taskDataDir 'product-images.json') -Encoding utf8
  $taskPaths = @($taskManifest | ForEach-Object { $_.url }) | ConvertTo-Json -Compress
  "// Gerado por scripts/import-product-photos.ps1 a partir das fotos importadas.`nexport const PRODUCT_IMAGE_PATHS: readonly string[] = $taskPaths;" | Set-Content -LiteralPath (Join-Path $taskRoot 'backend\src\products\product-images.ts') -Encoding utf8
  $taskVideos = @($taskZip.Entries | Where-Object { $_.Name -match '\.mp4$' }).Count
  Write-Output "$($taskManifest.Count) fotos importadas sem alterações. $taskVideos vídeos mantidos no ZIP."
} finally { $taskZip.Dispose() }
