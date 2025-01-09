const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/:id", async (req, res) => {
  const itemId = req.params.id;

  try {
    const response = await axios.get(`https://api.deezer.com/track/${itemId}`);

    return res.render("track", {
      title: `${response.data.title} - Soundscapes`,
      item: response.data,
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
