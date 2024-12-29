// Dependencies
const express = require("express");
const path = require("path");
require("dotenv").config();

const app = express();

// Parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// View engine
app.use(express.static(path.join(__dirname, "src/public")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "src/views"));

// Routes
const indexRouter = require("./src/routes/index");

app.use("/", indexRouter);

// Error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message });
});

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}.`);
});

module.exports = app;
