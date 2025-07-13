// spotify.js
const axios = require("axios");
require("dotenv").config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REFRESH_TOKEN, SPOTIFY_PLAYLIST_ID } =
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
console.log("[ENV] SPOTIFY_PLAYLIST_ID length:", SPOTIFY_PLAYLIST_ID?.length);

if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET || !SPOTIFY_REFRESH_TOKEN || !SPOTIFY_PLAYLIST_ID) {
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
  offset = 0,
  full = false
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

    // Will use it if i want to add more stuff in the future..
    if (full) {
      return res.data;
    }

    // Otherwise this filteration will help us save costs on data transfer
    const filteredItems = res.data.items.map((track) => {
      const image300 =
        track.album.images.find(
          (img) => img.height === 300 && img.width === 300
        ) || track.album.images[0];

      return {
        name: track.name,
        artists: track.artists.map((artist) => ({ name: artist.name })),
        album: {
          name: track.album.name,
          images: [image300],
        },
      };
    });

    return { items: filteredItems };
  } catch (err) {
    console.error(
      "[Spotify] Failed to fetch top items:",
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getNowPlaying(full = false) {
  console.log(`[Spotify] Fetching top now playing..`);

  try {
    const token = await getAccessToken();

    const res = await axios.get(`https://api.spotify.com/v1/me/player`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log("[Spotify] Now playing fetched successfully");

    const data = res.data;

    if (full) {
      return data;
    }
    // same thing here-- will help us with data transfer costs
    const fil = {
      progress_ms: data.progress_ms,
      is_playing: data.is_playing,
      device: {
        name: data.device.name,
      },
      item: {
        album: {
          images: [data.item.album.images[0]],
        },
        artists: data.item.artists.map((artist) => ({
          name: artist.name,
          id: artist.id,
          external_urls: {
            spotify: artist.external_urls.spotify,
          },
        })),
        name: data.item.name,
        duration_ms: data.item.duration_ms,
        external_urls: data.item.external_urls,
      },
    };
    return fil;
  } catch (err) {
    console.error(
      "[Spotify] Failed to fetch playback state:",
      err.response?.data || err.message
    );
    throw err;
  }
}

async function getTopPlaylistItems(
  full = false,
) {
  // We are going to keep the limit and offset not exposed for now. Since we need the last 5 items, we can't give choice to the api consumer.

  // We start by getting the access token.
  const token = await getAccessToken();

  // First thing we need is the number of items in the playlist.
  try {
    const countRes = await axios.get(
      `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          offset: 0, // We don't need to offset since we are only interested in the total count
          limit: 1, // We can set limit to 1 since we are only interested
        },
      }
    );
    const totalItems = countRes.data.total;
    console.log(
      `[Spotify] Fetching latest 5 playlist items for playlist ${SPOTIFY_PLAYLIST_ID} | total items: ${totalItems}`
    );
      
    // Now we can fetch the last 5 items
    const res = await axios.get(
      `https://api.spotify.com/v1/playlists/${SPOTIFY_PLAYLIST_ID}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          fields: full ? "" : "total,items(added_at,track(external_urls,duration_ms,name, artists(name), album(name, images)))", // This reduces the data size, although it doesnt really matter since we are only fetching 5 items
          limit: 5,
          offset: Math.max(0, totalItems - 5), // Get the last 5 items
        },
      }
    );
    console.log("[Spotify] Top 5 playlist items fetched successfully");
    return res.data // since we set the fields params based on full, we can return the res directly.

  } catch (err) {
    console.error(
      "[Spotify] Failed to fetch playlist item count:",
      err.response?.data || err.message
    );
    throw err;
  }};

  module.exports = {
    getTopItems,
    getNowPlaying,
    getTopPlaylistItems,
  };
