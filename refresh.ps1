# Load environment variables from .env
$envFile = ".env"
Get-Content $envFile | ForEach-Object {
    if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value)
    }
}

# Read env vars
$clientId = $env:SPOTIFY_CLIENT_ID
$clientSecret = $env:SPOTIFY_CLIENT_SECRET
$redirectUri = "your-callback-url"
$authCode = "code-which-u-got"

$headers = @{
    Authorization = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("$clientId`:$clientSecret"))
    "Content-Type" = "application/x-www-form-urlencoded"
}

$body = @{
    grant_type = "authorization_code"
    code = $authCode
    redirect_uri = $redirectUri
}

$response = Invoke-RestMethod -Method Post -Uri "https://accounts.spotify.com/api/token" -Headers $headers -Body $body

$response | Format-List
