# spotify-proxy

This guide provides instructions for setting up and using a Spotify refresh token script and deploying a Spotify proxy application. It is tailored for personal use but can be adapted for others.

# Fetching Spotify Refresh Token via PowerShell (`refresh.ps1`)

This script performs a one-time OAuth 2.0 Authorization Code exchange with Spotify to obtain a refresh token. The refresh token can be reused to generate new access tokens without requiring user interaction.

## 🔧 Prerequisites

- PowerShell installed (Windows/macOS/Linux)
- A `.env` file in the same directory as `refresh.ps1`, containing:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## 🚀 Steps to Obtain Your Refresh Token

### 1. Set Up a Spotify App

- Visit the [Spotify Developer Dashboard](https://developer.spotify.com).
- Create a new app and give it a descriptive name.
- Set a redirect URI, e.g., `http://localhost:8888/callback`, and add it to your app settings.

### 2. Authorize via Browser

- Construct the following URL (replace `YOUR_CLIENT_ID` and `YOUR_REDIRECT_URI` with your app's details):

```
https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=user-top-read
```

- Open the URL in your browser, log in, and authorize the app.
- After authorization, you'll be redirected to a URL like:

```
http://localhost:8888/callback?code=AUTH_CODE
```

- Copy the `AUTH_CODE` from the URL — this is your authorization code.

### 3. Update the Script

- Open `refresh.ps1` and update the following variables:

```powershell
$redirectUri = "http://localhost:8888/callback"    # Your registered redirect URI
$authCode = "AUTH_CODE_FROM_STEP_2"               # Paste the authorization code here
```

- Leave the rest of the script unchanged.

### 4. Run the Script

- Execute the script:

```powershell
.\refresh.ps1
```

- The output will include your `refresh_token`:

```
access_token : BQD...
token_type : Bearer
expires_in : 3600
refresh_token: AQB...
scope : user-top-read
```

## ✅ Final Step

- Copy the `refresh_token` and add it to your `.env` file:

```
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

You’re now ready to use this token in your app for automatic token refreshing!

---

# Deploying the Spotify Proxy Application on GCP

If you plan to deploy this application on Google Cloud Platform (GCP), follow these steps for continuous deployment.

## Prerequisites

- Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and initialize it using `gcloud init`.
- Set up a Docker image and push it to GCP Artifact Registry.

### Environment Variables

Create a `.env` file with the following variables:

```
GCP_REPOSITORY=your-repository-name
GCP_REGION=your-region (e.g., asia-south2)
IMAGE_NAME=spotify-proxy
GCP_PROJECT_ID=your-project-id
```

Combine these with the Spotify-related variables from earlier to create a complete `.env.example` file.

### Initial Setup Scripts

Two PowerShell scripts are provided for:

1. Pushing the initial Docker image to Artifact Registry.
2. Generating a service account for deployment.

Run these scripts to complete the setup.

### Deploying on Cloud Run

- Use the GCP Console to deploy the application on Cloud Run.
- Use the Docker image from Artifact Registry.
- Add the Spotify-related environment variables (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`) in the Cloud Run environment settings.

Once deployed, your application will respond to API calls. For GitHub Actions, add all variables from `.env` to your repository secrets to enable automated deployments.

> [!NOTE]
> I may or may not streamline the setup at a later point of time, but more script = bad so just follow the on-screen instructions for GCP

<hr>

## This is ported to [Go](https://github.com/apparentlyarhm/app-proxy-go/) now.
