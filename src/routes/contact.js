const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  return res.render("contact", { title: "Contact" });
});

module.exports = router;
