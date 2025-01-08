const express = require("express");
const router = express.Router();
const axios = require("axios");
const ejs = require("ejs");

function getDefaultTracks() {
  // Deliberately handpicked demo songs from Deezer to provide varied results.
  return [
    {
      id: "2967020181",
      title: "Mindgame",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/f/8/0/0/f809afe7d16ca2420efe8735b2868fb9.mp3?hdnea=exp=1734957735~acl=/api/1/1/f/8/0/0/f809afe7d16ca2420efe8735b2868fb9.mp3*~data=user_id=0,application_id=42~hmac=a272f07a8476f5f8b696525c906b8a7815bf4c0dd887bdbd135de050cadf4251",
      artist: { name: "Flawed Mangoes" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/3b8bbbe9abc00107cd9d7d21959f3c3a/56x56-000000-80-0-0.jpg",
        title: "The Unwavering Hand",
      },
    },
    {
      id: "1987726237",
      title: "Reelin' In The Years",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/5/9/d/0/59df7fce89018023b106320df82755da.mp3?hdnea=exp=1734949252~acl=/api/1/1/5/9/d/0/59df7fce89018023b106320df82755da.mp3*~data=user_id=0,application_id=42~hmac=c16c56555d46ddbcdf8806100cbcd3c7478756ba298f4ca8627c4f42f45788d3",
      artist: { name: "Steely Dan" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/d6dfdac98e19bdec4a121dfb2d3f98fa/56x56-000000-80-0-0.jpg",
        title: "Can't Buy A Thrill",
      },
    },
    {
      id: "626123",
      title: "We Didn't Start the Fire",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/3/c/2/0/3c217db98586cfe1f9e923b0bde7db96.mp3?hdnea=exp=1734949693~acl=/api/1/1/3/c/2/0/3c217db98586cfe1f9e923b0bde7db96.mp3*~data=user_id=0,application_id=42~hmac=b73e815444d3d4bf5b25d808126371a34091ac780f9d7ac492415b61d627c259",
      artist: { name: "Billy Joel" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/8a44cff0ab7a842716dc62235a211a30/56x56-000000-80-0-0.jpg",
        title: "Storm Front",
      },
    },
    {
      id: "770637812",
      title: "Cities",
      preview:
        "https://cdn-preview-0.dzcdn.net/stream/c-01b1fc80ba67fd6a4f793637bd0ec5ed-4.mp3",
      artist: { name: "Throttle" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/544d04807869e82b2ecc943d006cf25c/56x56-000000-80-0-0.jpg",
        title: "Where U Are",
      },
    },
    {
      id: "136341550",
      title: "My Generation",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/7/e/3/0/7e32ae92364ce07e54542402efe32b32.mp3?hdnea=exp=1734949647~acl=/api/1/1/7/e/3/0/7e32ae92364ce07e54542402efe32b32.mp3*~data=user_id=0,application_id=42~hmac=df85b4b5918c4f3239c26bcc833b016ae407f4dd8920874f1f5beb9d01f89660",
      artist: { name: "The Who" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/23c805dcd2a98dd04131fcb5d89c1480/56x56-000000-80-0-0.jpg",
        title: "My Generation (50th Anniversary / Super Deluxe)",
      },
    },
    {
      id: "3137127971",
      title: "Space II",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/5/2/1/0/5216af4469470f4f7d54e7ed358b9a5a.mp3?hdnea=exp=1734955927~acl=/api/1/1/5/2/1/0/5216af4469470f4f7d54e7ed358b9a5a.mp3*~data=user_id=0,application_id=42~hmac=6b47419f03898715da8d1ce23c3a2c6ecc7e513bf9957515730e62780b5ff690",
      artist: { name: "Dorian Concept" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/a9aa8ecea3b048548be9a37c44b43a84/56x56-000000-80-0-0.jpg",
        title: "Space II",
      },
    },
  ];
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
    const defaultTracks = getDefaultTracks();
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
