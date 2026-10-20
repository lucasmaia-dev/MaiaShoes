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
  if ($taskPhotos.Count -gt 500) { throw 'O lote excede 500 fotos.' }
  $taskManifestPath = Join-Path $taskDataDir 'product-images.json'
  $taskManifest = [System.Collections.Generic.List[object]]::new()
  $taskHashes = @{}
  $taskIndex = 0
  if (Test-Path -LiteralPath $taskManifestPath) {
    foreach ($taskPrevious in @(Get-Content -LiteralPath $taskManifestPath -Raw -Encoding utf8 | ConvertFrom-Json)) {
      $taskPreviousPath = Join-Path $taskImageDir ([System.IO.Path]::GetFileName($taskPrevious.url))
      if (!(Test-Path -LiteralPath $taskPreviousPath)) { throw "Foto anterior ausente: $($taskPrevious.url)" }
      $taskHash = (Get-FileHash -LiteralPath $taskPreviousPath -Algorithm SHA256).Hash.ToLowerInvariant()
      if ($taskPrevious.PSObject.Properties['sha256']) { $taskPrevious.sha256 = $taskHash }
      else { $taskPrevious | Add-Member -NotePropertyName sha256 -NotePropertyValue $taskHash }
      $taskHashes[$taskHash] = $true
      $taskManifest.Add($taskPrevious)
      $taskIndex = [Math]::Max($taskIndex, [int]$taskPrevious.id)
    }
  }
  $taskImported = 0
  $taskRepeated = 0
  foreach ($taskPhoto in $taskPhotos) {
    if ($taskPhoto.Length -gt 20MB) { throw 'Imagem maior que o limite de importação.' }
    $taskStream = $taskPhoto.Open()
    $taskMemory = [System.IO.MemoryStream]::new()
    try { $taskStream.CopyTo($taskMemory) } finally { $taskStream.Dispose() }
    try {
      $taskBytes = $taskMemory.ToArray()
      $taskSha = [System.Security.Cryptography.SHA256]::Create()
      try { $taskHash = ([BitConverter]::ToString($taskSha.ComputeHash($taskBytes))).Replace('-', '').ToLowerInvariant() } finally { $taskSha.Dispose() }
      if ($taskHashes.ContainsKey($taskHash)) { $taskRepeated++; continue }
      $taskMemory.Position = 0
      $taskImage = [System.Drawing.Image]::FromStream($taskMemory)
      try { $taskWidth = $taskImage.Width; $taskHeight = $taskImage.Height } finally { $taskImage.Dispose() }
    } finally { $taskMemory.Dispose() }
    $taskIndex++
    $taskNumber = '{0:D3}' -f $taskIndex
    $taskExtension = [System.IO.Path]::GetExtension($taskPhoto.Name).ToLowerInvariant()
    $taskFilename = "foto-$taskNumber$taskExtension"
    # Usamos nomes próprios: os caminhos internos do ZIP nunca viram destinos.
    $taskTarget = Join-Path $taskImageDir $taskFilename
    if (Test-Path -LiteralPath $taskTarget) { throw "O arquivo $taskFilename já existe; preservado." }
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($taskPhoto, $taskTarget, $false)
    $taskManifest.Add([ordered]@{ id = $taskNumber; label = "Foto $taskNumber"; url = "/products/$taskFilename"; originalName = $taskPhoto.Name; width = $taskWidth; height = $taskHeight; sha256 = $taskHash; source = [System.IO.Path]::GetFileName($ZipPath) })
    $taskHashes[$taskHash] = $true
    $taskImported++
  }
  $taskManifest | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath $taskManifestPath -Encoding utf8
  $taskPaths = @($taskManifest | ForEach-Object { $_.url }) | ConvertTo-Json -Compress
  "// Gerado por scripts/import-product-photos.ps1 a partir das fotos importadas.`nexport const PRODUCT_IMAGE_PATHS: readonly string[] = $taskPaths;" | Set-Content -LiteralPath (Join-Path $taskRoot 'backend\src\products\product-images.ts') -Encoding utf8
  $taskVideos = @($taskZip.Entries | Where-Object { $_.Name -match '\.mp4$' }).Count
  Write-Output "$taskImported fotos novas, $taskRepeated arquivos idênticos ignorados. $($taskManifest.Count) fotos no acervo. $taskVideos vídeos mantidos no ZIP."
} finally { $taskZip.Dispose() }
