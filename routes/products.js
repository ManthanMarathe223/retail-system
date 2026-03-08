// ─────────────────────────────────────────────
// routes/products.js
// All REST routes for Product
// Mounted at: app.use('/products', require('./routes/products'))
// Actual columns: pro_id, pro_name, pro_price, pro_description, pro_type, stock_quantity, supp_id
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ─────────────────────────────────────────────
// PRODUCT CRUD
// ─────────────────────────────────────────────

// GET /products — all products
router.get("/", (req, res) => {
    db.query("SELECT * FROM Product ORDER BY pro_id", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch products", details: err.message });
        res.json(results);
    });
});

// GET /products/search/filter?name=&type=
router.get("/search/filter", (req, res) => {
    const { name = "", type = "" } = req.query;
    const sql = "SELECT * FROM Product WHERE pro_name LIKE ? AND pro_type LIKE ? ORDER BY pro_id";
    db.query(sql, [`%${name}%`, `%${type}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

// GET /products/:id — single product
router.get("/:id", (req, res) => {
    db.query("SELECT * FROM Product WHERE pro_id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch product", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Product not found" });
        res.json(results[0]);
    });
});

// POST /products — create product
router.post("/", (req, res) => {
    const { pro_id, pro_name, pro_price, pro_description, pro_type, stock_quantity, supp_id } = req.body;
    if (!pro_id || !pro_name)
        return res.status(400).json({ error: "pro_id and pro_name are required" });

    const sql = "INSERT INTO Product (pro_id, pro_name, pro_price, pro_description, pro_type, stock_quantity, supp_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [pro_id, pro_name, pro_price || null, pro_description || null, pro_type || null, stock_quantity || 0, supp_id || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Product ID already exists" });
            return res.status(500).json({ error: "Failed to create product", details: err.message });
        }
        res.status(201).json({ message: "Product created successfully" });
    });
});

// PUT /products/:id — update product
router.put("/:id", (req, res) => {
    const { pro_name, pro_price, pro_description, pro_type, stock_quantity, supp_id } = req.body;
    if (!pro_name)
        return res.status(400).json({ error: "pro_name is required" });

    const sql = "UPDATE Product SET pro_name = ?, pro_price = ?, pro_description = ?, pro_type = ?, stock_quantity = ?, supp_id = ? WHERE pro_id = ?";
    db.query(sql, [pro_name, pro_price || null, pro_description || null, pro_type || null, stock_quantity || 0, supp_id || null, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update product", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product updated successfully" });
    });
});

// DELETE /products/:id — delete product
router.delete("/:id", (req, res) => {
    db.query("DELETE FROM Product WHERE pro_id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete product", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Product not found" });
        res.json({ message: "Product deleted successfully" });
    });
});

module.exports = router;
