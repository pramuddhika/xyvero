# scripts/setup-signing.ps1
# Requires Administrator privileges to import to Trusted Root Certification Authorities store

$certName = "xyvero-dev-signing"
$pfxFile = Join-Path $PSScriptRoot "dev-signing-cert.pfx"
$passwordStr = "xyvero123"
$password = ConvertTo-SecureString $passwordStr -AsPlainText -Force

Write-Host "Checking if developer certificate already exists..." -ForegroundColor Cyan

# Create self-signed certificate
Write-Host "Creating self-signed code signing certificate..." -ForegroundColor Cyan
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=$certName" -KeyUsage DigitalSignature -FriendlyName "Xyvero Dev Signing Certificate" -CertStoreLocation "Cert:\CurrentUser\My"

# Export as PFX
Write-Host "Exporting certificate to $pfxFile..." -ForegroundColor Cyan
Export-PfxCertificate -Cert $cert -FilePath $pfxFile -Password $password

# Trust the certificate locally by importing to Trusted Root Certification Authorities
# This requires Administrator privileges!
Write-Host "Attempting to trust the certificate locally (Requires Administrator Privileges)..." -ForegroundColor Cyan
try {
    Import-Certificate -FilePath $pfxFile -CertStoreLocation "Cert:\LocalMachine\Root" -ErrorAction Stop
    Write-Host "Success! The certificate has been successfully added to LocalMachine\Root (Trusted Root Certification Authorities)." -ForegroundColor Green
    Write-Host "This local machine will now trust installers signed by this certificate without SmartScreen warnings!" -ForegroundColor Green
} catch {
    Write-Warning "Could not import certificate into Trusted Root store (requires Admin permission). Run this script as Administrator to do this."
}

# Instructions
Write-Host ""
Write-Host "==========================================================================" -ForegroundColor Yellow
Write-Host "To sign your installer using electron-builder, set these environment variables:" -ForegroundColor Yellow
Write-Host "PowerShell:" -ForegroundColor Cyan
Write-Host "  `$env:CSC_LINK = `"$pfxFile`"" -ForegroundColor Green
Write-Host "  `$env:CSC_KEY_PASSWORD = `"$passwordStr`"" -ForegroundColor Green
Write-Host "CMD:" -ForegroundColor Cyan
Write-Host "  set CSC_LINK=$pfxFile" -ForegroundColor Green
Write-Host "  set CSC_KEY_PASSWORD=$passwordStr" -ForegroundColor Green
Write-Host "==========================================================================" -ForegroundColor Yellow
