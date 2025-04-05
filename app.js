// app.js
const express = require("express");
const cors = require("cors");
const { getTopItems } = require("./spotify");

require("dotenv").config();

const app = express();
app.use(cors()); // allow frontend access

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Proxy server running on http://localhost:${PORT}`)
);
