const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/:id", async (req, res) => {
  const itemId = req.params.id;

  try {
    const trackResponse = await axios.get(
      `https://api.deezer.com/track/${itemId}`
    );
    const albumResponse = await axios.get(
      `https://api.deezer.com/album/${trackResponse.data.album.id}`
    );

    return res.render("track", {
      title: `${trackResponse.data.title} - Soundscapes`,
      item: trackResponse.data,
      album: albumResponse.data,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch track.",
    });
  }
});

module.exports = router;
