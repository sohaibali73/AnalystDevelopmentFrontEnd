$paths = @('src/components/studio','src/page-components/studio')
$replacements = @(
  @{ Find = "'#0A0A0B'"; Replace = 'T.bg' },
  @{ Find = "'#0a0a0b'"; Replace = 'T.bg' },
  @{ Find = "'#0D0D10'"; Replace = 'T.bgCard' },
  @{ Find = "'#0C0C0E'"; Replace = 'T.bgChat' },
  @{ Find = "'#111114'"; Replace = 'T.bgRaised' }
)

Get-ChildItem -Path $paths -Recurse -Include *.tsx,*.ts | ForEach-Object {
  $f = $_.FullName
  $c = Get-Content -Raw -LiteralPath $f
  $orig = $c
  foreach ($r in $replacements) {
    $c = $c.Replace($r.Find, $r.Replace)
  }
  if ($c -ne $orig) {
    Set-Content -LiteralPath $f -Value $c -NoNewline
    Write-Output "Updated: $f"
  }
}
