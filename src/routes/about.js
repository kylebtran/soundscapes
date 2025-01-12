const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.render("about", { title: "About" });
});

module.exports = router;
