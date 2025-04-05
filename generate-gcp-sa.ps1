param (
    [string]$projectId,
    [string]$serviceAccountName = "github-deployer",
    [string]$keyFilePath = "./gcp-key.json"
)

function Check-EmptyVars {
    param ([string[]]$vars)
    foreach ($var in $vars) {
        if ([string]::IsNullOrWhiteSpace((Get-Variable -Name $var -ValueOnly))) {
            Write-Host " '$var' is required and not provided!" -ForegroundColor Red
            exit 1
        }
    }
}

Check-EmptyVars @("projectId")

$saEmail = "${serviceAccountName}@${projectId}.iam.gserviceaccount.com"

Write-Host "Checking if service account exists..." -ForegroundColor Cyan
$exists = gcloud iam service-accounts list --project=${projectId} --format="value(email)" | Where-Object { $_ -eq $saEmail }

if (-not $exists) {
    Write-Host "Creating service account '$serviceAccountName'..."
    gcloud iam service-accounts create $serviceAccountName --project ${projectId} `
        --display-name="GitHub Actions Deployer"
} else {
    Write-Host "Service account already exists: $saEmail"
}

Write-Host "`Assigning IAM roles..." -ForegroundColor Cyan

$roles = @(
    "roles/run.admin",
    "roles/artifactregistry.writer",
    "roles/iam.serviceAccountUser"
)

foreach ($role in $roles) {
    gcloud projects add-iam-policy-binding $projectId `
        --member="serviceAccount:${saEmail}" `
        --role=$role `
        --quiet
}

Write-Host "`Generating service account key..." -ForegroundColor Cyan
gcloud iam service-accounts keys create $keyFilePath `
    --iam-account=${saEmail} `
    --project=${projectId} `
    --quiet

if (Test-Path $keyFilePath) {
    Write-Host " Key file saved to: $keyFilePath" -ForegroundColor Green
    Write-Host " Copy the contents of this file and add it to your GitHub repo as a secret named 'GCP_SA_KEY'"
    Write-Host " GitHub → Settings → Secrets and Variables → Actions → New repository secret"
    Write-Host " After adding it, you can delete the file with: Remove-Item $keyFilePath`n"
} else {
    Write-Host "Failed to generate key file!" -ForegroundColor Red
    exit 1
}
