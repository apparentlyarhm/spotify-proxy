# This is mostly for first time setup, which we won't need to do many times.

function Check-EmptyVars {
    param (
        [string[]]$vars
    )
    foreach ($var in $vars) {
        if ([string]::IsNullOrWhiteSpace((Get-Variable -Name $var -ValueOnly))) {
            Write-Host "ERROR: Environment variable '$var' is missing or empty!" -ForegroundColor Red
            exit 1
        }
    }
}

# Validate tools
if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Google Cloud CLI (gcloud) is not installed. Please install it and try again." -ForegroundColor Red
    exit 1
}

docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Get-Content .env | ForEach-Object {
    if ($_ -match "^(.*)=(.*)$") {
        $envName = $matches[1].Trim()
        $envValue = $matches[2].Trim()
        [System.Environment]::SetEnvironmentVariable($envName, $envValue, "Process")
    }
}

# Read from env
$projectId = $env:GCP_PROJECT_ID
$region = $env:GCP_REGION
$imageName = $env:IMAGE_NAME
$repository = $env:GCP_REPOSITORY
$imageTag = "latest"
$artifactRegistryRepo = "${region}-docker.pkg.dev/${projectId}/${repository}/${imageName}"

Check-EmptyVars @(
    "projectId", 
    "region",
    "imageName", 
    "repository"
)


Write-Host "Building Docker image..."
docker build -t "${imageName}:latest" .

Write-Host "`Tagging image for registry: ${artifactRegistryRepo}:latest"
docker tag "${imageName}:${imageTag}" "${artifactRegistryRepo}:latest"

Write-Host "`Configuring Docker authentication for GCP Artifact Registry..."
gcloud auth configure-docker "${region}-docker.pkg.dev" --quiet

Write-Host "`Pushing image to Artifact Registry..."
docker push "${artifactRegistryRepo}:latest"

Write-Host "`Image pushed successfully to ${artifactRegistryRepo}:latest"
