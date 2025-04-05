# spotify-proxy

idk bro i hate my life- below guide was written by gpt i am very lazy
if u want scripts for bash literally just ask chatgpt bro this guide is mainly for me, because i tend to forget things

# Fetching Spotify Refresh Token via PowerShell (refresh.ps1)

This script helps you perform a one-time OAuth 2.0 Authorization Code exchange with Spotify to get your refresh token, which can then be reused to generate new access tokens without user interaction.

## 🔧 Prerequisites

- PowerShell installed (Windows/macOS/Linux)

- A .env file in the same directory as refresh.ps1, containing the following:

```
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
```

## 🚀 Steps to Get Your Refresh Token

### 1. Set up a Spotify App

- Go to Spotify Developer Dashboard

- Create an app, give it some gay ass name

- Set a redirect URI, e.g.:

`http://localhost:8888/callback`

Add this to your app settings.

### 2. Authorize via Browser

Construct the following URL (replace YOUR_CLIENT_ID and your redirect URI):

`https://accounts.spotify.com/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=http://localhost:8888/callback&scope=user-top-read
`

Open it in your browser;
Log in and authorize the app

You'll be redirected to:

`http://localhost:8888/callback?code=AUTH_CODE`

Copy the code part from the URL — this is your authorization code.

### 3. Update the Script

Open refresh.ps1 and set the following values:

```
$redirectUri = "http://localhost:8888/callback"    # Your registered redirect URI
$authCode = "code-you-got-from-step-2" # Paste the auth code here
```

Leave the rest of the script unchanged.

### 4. Run the Script

```bash
.\refresh.ps1
```

You’ll get an output like this:

```
access_token : BQD...
token_type : Bearer
expires_in : 3600
refresh_token: AQB...
scope : user-top-read
```

## ✅ Final Step

Copy the refresh_token and add it to your .env:

```
SPOTIFY_REFRESH_TOKEN=your_refresh_token_here
```

You’re now ready to use this in your app for automatic token refreshing! 🟢
