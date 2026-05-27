# Run this script: right-click -> Run with PowerShell
# Or in Cursor terminal: .\push-to-github.ps1

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "=== Push GF Proposal to GitHub ===" -ForegroundColor Cyan
Write-Host ""

git remote remove origin 2>$null
git remote add origin https://github.com/ibrvhiim8/gf-proposal-.git

Write-Host "Remote:" -ForegroundColor Gray
git remote -v
Write-Host ""

$commit = git log -1 --oneline 2>$null
if (-not $commit) {
    Write-Host "Creating first commit..." -ForegroundColor Yellow
    git add -A
    git -c user.name="ibrvhiim8" -c user.email="ibrvhiim8@users.noreply.github.com" commit -m "Initial commit: romantic proposal site"
}

Write-Host "Pushing to GitHub (sign in if a window opens)..." -ForegroundColor Yellow
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "SUCCESS! Open:" -ForegroundColor Green
    Write-Host "  https://github.com/ibrvhiim8/gf-proposal-" -ForegroundColor White
    Write-Host ""
    Write-Host "Then in Vercel click Redeploy." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Push failed. Use the backup method in UPLOAD-TO-GITHUB.txt" -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to close"
