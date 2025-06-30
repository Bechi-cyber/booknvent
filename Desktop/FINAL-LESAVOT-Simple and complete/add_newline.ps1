$content = Get-Content -Path "THESIS.md" -Raw
$content = $content + "`n"
Set-Content -Path "THESIS.md" -Value $content -NoNewline
