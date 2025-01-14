const express = require("express");
const router = express.Router();
const axios = require("axios");
const ejs = require("ejs");

async function getDefaultTracks() {
  const defaultTrackIds = [
    "2967020181",
    "1987726237",
    "626123",
    "770637812",
    "136341550",
    "3137127971",
  ];

  try {
    const trackPromises = defaultTrackIds.map((id) =>
      axios.get(`https://api.deezer.com/track/${id}`)
    );
    const responses = await Promise.all(trackPromises);

    return responses.map((response) => response.data);
  } catch (error) {
    console.error("Error fetching default tracks:", error);
    return [];
  }
}

router.get("/", async (req, res) => {
  const { q, page = 1, limit = 25 } = req.query;
  const isAjax = req.headers["x-requested-with"] === "XMLHttpRequest";

  try {
    const { results, meta } = await fetchSearchResults(q, page, limit);

    if (isAjax) {
      const [resultsHtml, paginationHtml] = await Promise.all([
        ejs.renderFile("src/views/partials/results.ejs", {
          results,
          demo: !q,
          getStatus: null,
        }),
        ejs.renderFile("src/views/partials/pagination.ejs", { meta }),
      ]);

      return res.json({
        success: true,
        html: { results: resultsHtml, pagination: paginationHtml },
        data: { results, meta },
      });
    }

    return res.render("search", {
      title: "Search",
      results,
      meta,
      searchQuery: q,
      demo: !q,
    });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch and/or render results.",
    });
  }
});

async function fetchSearchResults(q, page, limit) {
  if (!q) {
    const defaultTracks = await getDefaultTracks();
    return {
      results: defaultTracks,
      meta: {
        page: 1,
        totalPages: 1,
        total: defaultTracks.length,
      },
    };
  }

  const response = await axios.get(`https://api.deezer.com/search`, {
    params: {
      q,
      limit,
      index: (page - 1) * limit,
    },
  });

  return {
    results: response.data.data,
    meta: {
      total: response.data.total,
      page: Number(page),
      totalPages: Math.ceil(response.data.total / limit),
    },
  };
}

router.post("/render-partials", async (req, res) => {
  try {
    const [resultsHtml, paginationHtml] = await Promise.all([
      ejs.renderFile("src/views/partials/results.ejs", {
        results: req.body.results,
        demo: false,
        getStatus: null,
      }),
      ejs.renderFile("src/views/partials/pagination.ejs", {
        meta: req.body.meta,
      }),
    ]);

    res.json({
      success: true,
      html: {
        results: resultsHtml,
        pagination: paginationHtml,
      },
    });
  } catch (error) {
    console.error("Template rendering error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to render templates",
    });
  }
});

module.exports = router;
