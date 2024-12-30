const express = require("express");
const router = express.Router();
const axios = require("axios");

router.get("/", (req, res) => {
  res.render("search", { title: "[search]", currentPath: "/search" });
});

router.get("/api/search", async (req, res) => {
  const { q = "", limit = 25 } = req.query;

  //   try {
  const response = await axios.get(`https://api.deezer.com/search`, {
    params: {
      q: q,
      limit: limit,
    },
  });
  res.json({
    success: true,
    results: response.data.data,
  });
  //   } catch (error) {
  //     console.error("Deezer API Error:", error);
  //     res.status(500).json({
  //       success: false,
  //       error: "Failed to fetch results from Deezer",
  //     });
  //   }
});

module.exports = router;
