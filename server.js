// ─────────────────────────────────────────────
// server.js — Entry point
// To add a new entity: add one app.use() line below
// ─────────────────────────────────────────────
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// Initialise DB connection (side-effect: logs success/failure)
require("./db");

const app = express();
app.use(cors());
app.use(express.json());

// ── Static files ──────────────────────────────
const publicPath = path.join(__dirname, "public");
app.use(express.static(publicPath));

// ── API Routes ────────────────────────────────
app.use("/suppliers", require("./routes/suppliers"));
app.use("/products", require("./routes/products"));
app.use("/customers", require("./routes/customers"));
app.use("/stores", require("./routes/stores"));
app.use("/employees", require("./routes/employees"));
app.use("/orders", require("./routes/orders"));

// ── Fallback: serve index.html for root ───────
app.get("/", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

// ── Start ─────────────────────────────────────
app.listen(3000, () => {
  console.log("🚀 Server running at http://localhost:3000");
});