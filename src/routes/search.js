const express = require("express");
const router = express.Router();
const axios = require("axios");

function getDefaultTracks() {
  // Deliberately handpicked demo songs from Deezer to provide varied results.
  return [
    {
      id: "1987726237",
      title: "Reelin' In The Years",
      preview:
        "https://cdnt-preview.dzcdn.net/api/1/1/5/9/d/0/59df7fce89018023b106320df82755da.mp3?hdnea=exp=1734934882~acl=/api/1/1/5/9/d/0/59df7fce89018023b106320df82755da.mp3*~data=user_id=0,application_id=42~hmac=c370bdfedfcaa42e94c65e15fd4c9418aed560d8990670c8459fa69359425e2d",
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
        "https://cdnt-preview.dzcdn.net/api/1/1/3/c/2/0/3c217db98586cfe1f9e923b0bde7db96.mp3?hdnea=exp=1734934488~acl=/api/1/1/3/c/2/0/3c217db98586cfe1f9e923b0bde7db96.mp3*~data=user_id=0,application_id=42~hmac=859bd2d44439a3eaab8e51a312f472880770b38884ba62a074e813b915ca46e5",
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
        "https://cdnt-preview.dzcdn.net/api/1/1/7/e/3/0/7e32ae92364ce07e54542402efe32b32.mp3?hdnea=exp=1734935129~acl=/api/1/1/7/e/3/0/7e32ae92364ce07e54542402efe32b32.mp3*~data=user_id=0,application_id=42~hmac=70d56367c56127ccc2c3599250e9ce37b5638e1a34ab0d23f1df7e531977b889",
      artist: { name: "The Who" },
      album: {
        cover_small:
          "https://cdn-images.dzcdn.net/images/cover/23c805dcd2a98dd04131fcb5d89c1480/56x56-000000-80-0-0.jpg",
        title: "My Generation (50th Anniversary / Super Deluxe)",
      },
    },
  ];
}

router.get("/", (req, res) => {
  const defaultTracks = getDefaultTracks();
  res.render("search", {
    title: "Search",
    results: defaultTracks,
  });
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
