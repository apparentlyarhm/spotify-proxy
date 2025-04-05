// app.js
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const { getTopItems } = require("./spotify");

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
      type = "tracks", // 'tracks' or 'artists'
      time_range = "short_term", // 'short_term', 'medium_term', 'long_term'
      limit = 10, // default: 10
      offset = 0, // default: 0
    } = req.query;

    const data = await getTopItems(type, time_range, limit, offset);
    res.json(data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: "Failed to fetch Spotify data" });
  }
});

app.listen(PORT, () =>
  console.log(`Proxy server running on http://localhost:${PORT}`)
);
