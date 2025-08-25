// app.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getTopItems, getNowPlaying, getTopPlaylistItems } = require("./spotify");
const { getGithubData } = require("./github");
const steam = require("./steam")

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 6656;

app.use((req, res, next) => {
  const origin = req.get("Origin") || "Unknown origin";
  console.log(`[Origin] ${origin}`);
  next();
});

app.use(cors());

// I am not expecting any traffic so this seems reasonsable enough
const limiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later.",
  },
});

app.use(limiter);

app.get("/ping", async (req, res) => {
  try {
    return res
      .status(200)
      .json({ message: "works!", agentString:"node-express" })

  } catch (err) {
    return res
      .status(500)
  }
})

app.get("/top", async (req, res) => {
  try {
    const {
      type = "tracks", // only 'tracks' is allowed for now
      time_range = "short_term",
      limit = 10,
      offset = 0,
      full = "false",
    } = req.query;

    if (type !== "tracks") {
      return res
        .status(400)
        .json({ error: "Only 'tracks' type is supported at the moment." });
    }

    const fullBool = full === "true";

    const data = await getTopItems(
      type,
      time_range,
      Number(limit),
      Number(offset),
      fullBool
    );

    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch top tracks" });
  }
});

/**
 * Fetches the currently playing track info
 */
app.get("/now", async (req, res) => {
  try {
    const { full = "false" } = req.query;

    const fullBool = full === "true";
    const data = await getNowPlaying(fullBool);
    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch now playing" });
  }
});

/**
 * Fetches the latest 5 playlist items. The order is reverse here, so the latest one is last.
 */

// this api is not exposed yet

// app.get("/my-playlist/items", async (req, res) => {
// try{
//   const { full = "false" } = req.query;

//   const fullBool = full === "true";

//   const data =await getTopPlaylistItems(fullBool);
//   res.json(data);
//   } catch (err) {
//     console.error(err.response?.data || err.message);
//     res.status(500).json({ error: "Failed to fetch playlist" });
//   }
// });

app.get("/github/activity", async (req, res) => {
  try {
    const data = await getGithubData();
    res.json(data)

  } catch (err) {
    console.error(err.response?.data || err.message)
    res.status(500).json({ error: "Failed to fetch GH activity!" });
  }

})

app.get("/steam", async (req, res) => {
  const { type } = req.query;

  // Basic check for parameter existence
  if (!type) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Missing required "type" query parameter.'
    });
  }

  try {

    const data = await steam.getData(type);

    res.status(200).json(data);

  } catch (error) {
    if (error instanceof steam.InvalidSteamRequestTypeError) {
      return res.status(400).json({
        error: 'Bad Request',
        message: error.message
      });
    }

    console.error(`[Express] Error processing /steam?type=${type}:`, error.message);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve data from the Steam service.'
    });
  }
})

app.listen(PORT, () =>
  console.log(`Proxy server running on http://localhost:${PORT}`)
);