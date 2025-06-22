// app.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getTopItems, getNowPlaying, getTopPlaylistItems } = require("./spotify");

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


app.get("/my-playlist/items", async (req, res) => {
try{
  const { full = "false" } = req.query;

  const fullBool = full === "true";

  const data =await getTopPlaylistItems(fullBool);
  res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch playlist" });
  }
});

app.listen(PORT, () =>
  console.log(`Proxy server running on http://localhost:${PORT}`)
);
