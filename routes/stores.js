// ─────────────────────────────────────────────
// routes/stores.js
// All REST routes for Store
// Mounted at: app.use('/stores', require('./routes/stores'))
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ─────────────────────────────────────────────
// STORE CRUD
// ─────────────────────────────────────────────

// GET /stores — all stores
router.get("/", (req, res) => {
    db.query("SELECT * FROM Store ORDER BY store_id", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch stores", details: err.message });
        res.json(results);
    });
});

// GET /stores/search/filter?name=&city=
router.get("/search/filter", (req, res) => {
    const { name = "", city = "" } = req.query;
    const sql = "SELECT * FROM Store WHERE store_name LIKE ? AND store_city LIKE ? ORDER BY store_id";
    db.query(sql, [`%${name}%`, `%${city}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

// GET /stores/:id — single store
router.get("/:id", (req, res) => {
    db.query("SELECT * FROM Store WHERE store_id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch store", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Store not found" });
        res.json(results[0]);
    });
});

// POST /stores — create store
router.post("/", (req, res) => {
    const { store_id, store_name, store_city, store_address, store_phone } = req.body;
    if (!store_id || !store_name)
        return res.status(400).json({ error: "store_id and store_name are required" });

    const sql = "INSERT INTO Store (store_id, store_name, store_city, store_address, store_phone) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [store_id, store_name, store_city || null, store_address || null, store_phone || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Store ID already exists" });
            return res.status(500).json({ error: "Failed to create store", details: err.message });
        }
        res.status(201).json({ message: "Store created successfully" });
    });
});

// PUT /stores/:id — update store
router.put("/:id", (req, res) => {
    const { store_name, store_city, store_address, store_phone } = req.body;
    if (!store_name)
        return res.status(400).json({ error: "store_name is required" });

    const sql = "UPDATE Store SET store_name = ?, store_city = ?, store_address = ?, store_phone = ? WHERE store_id = ?";
    db.query(sql, [store_name, store_city || null, store_address || null, store_phone || null, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update store", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Store not found" });
        res.json({ message: "Store updated successfully" });
    });
});

// DELETE /stores/:id — delete store
router.delete("/:id", (req, res) => {
    db.query("DELETE FROM Store WHERE store_id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete store", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Store not found" });
        res.json({ message: "Store deleted successfully" });
    });
});

module.exports = router;
