const express = require("express");
const path = require("path");
const db = require("./db");
const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));

app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});