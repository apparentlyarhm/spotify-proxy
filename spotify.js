// spotify.js
const axios = require("axios");
require("dotenv").config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN } =
  process.env;

console.log("[ENV] SPOTIFY_CLIENT_ID length:", SPOTIFY_CLIENT_ID?.length);
console.log(
  "[ENV] SPOTIFY_CLIENT_SECRET length:",
  SPOTIFY_CLIENT_SECRET?.length
);
console.log(
  "[ENV] SPOTIFY_REFRESH_TOKEN length:",
  SPOTIFY_REFRESH_TOKEN?.length
);

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN) {
  console.warn(
    "[ENV]   One or more required Spotify environment variables are missing!"
  );
}

let accessToken = null;
let accessTokenExpiresAt = 0;

async function getAccessToken() {
  const now = Date.now();

  console.log("[Spotify] Checking access token validity...");

  if (accessToken && now < accessTokenExpiresAt) {
    console.log("[Spotify] Using cached access token");
    return accessToken;
  }

  console.log("[Spotify] Refreshing access token...");

  const authHeader = Buffer.from(
    `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const params = new URLSearchParams();
  params.append("grant_type", "refresh_token");
  params.append("refresh_token", SPOTIFY_REFRESH_TOKEN);

  try {
    const res = await axios.post(
      "https://accounts.spotify.com/api/token",
      params,
      {
        headers: {
          Authorization: `Basic ${authHeader}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    accessToken = res.data.access_token;
    accessTokenExpiresAt = now + res.data.expires_in * 1000 - 5000;

    console.log(
      "[Spotify] New access token obtained. Expires in:",
      res.data.expires_in,
      "seconds"
    );

    return accessToken;
  } catch (err) {
    console.error(
      "[Spotify] Failed to refresh token:",
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getTopItems(
  type = "tracks",
  time_range = "short_term",
  limit = 10,
  offset = 0
) {
  console.log(
    `[Spotify] Fetching top ${type} | time_range=${time_range}, limit=${limit}, offset=${offset}`
  );

  try {
    const token = await getAccessToken();

    const res = await axios.get(`https://api.spotify.com/v1/me/top/${type}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        time_range,
        limit,
        offset,
      },
    });

    console.log("[Spotify] Top items fetched successfully");
    return res.data;
  } catch (err) {
    console.error(
      "[Spotify] Failed to fetch top items:",
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getNowPlaying() {
  console.log(`[Spotify] Fetching top now playing..`);

  try {
    const token = await getAccessToken();

    const res = await axios.get(`https://api.spotify.com/v1/me/player`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[Spotify] Now playing fetched successfully");
    return res.data;
  } catch (err) {
    console.error(
      "[Spotify] Failed to fetch playback state:",
      err.response?.data || err.message
    );
    throw err;
  }
}

module.exports = {
  getTopItems,
  getNowPlaying,
};
