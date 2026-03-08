// ─────────────────────────────────────────────
// routes/customers.js
// All REST routes for Customer
// Mounted at: app.use('/customers', require('./routes/customers'))
// Actual columns: cus_id, f_name, l_name, cus_number
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ─────────────────────────────────────────────
// CUSTOMER CRUD
// ─────────────────────────────────────────────

// GET /customers — all customers
router.get("/", (req, res) => {
    db.query("SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM Customer ORDER BY cus_id", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch customers", details: err.message });
        res.json(results);
    });
});

// GET /customers/search/filter?name=&phone=
router.get("/search/filter", (req, res) => {
    const { name = "", phone = "" } = req.query;
    const sql = `SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM Customer
                 WHERE CONCAT(f_name, ' ', l_name) LIKE ? AND cus_number LIKE ?
                 ORDER BY cus_id`;
    db.query(sql, [`%${name}%`, `%${phone}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

// GET /customers/:id — single customer
router.get("/:id", (req, res) => {
    db.query("SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM Customer WHERE cus_id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch customer", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Customer not found" });
        res.json(results[0]);
    });
});

// POST /customers — create customer
router.post("/", (req, res) => {
    const { cus_id, f_name, l_name, cus_number } = req.body;
    if (!cus_id || !f_name)
        return res.status(400).json({ error: "cus_id and f_name are required" });

    const sql = "INSERT INTO Customer (cus_id, f_name, l_name, cus_number) VALUES (?, ?, ?, ?)";
    db.query(sql, [cus_id, f_name, l_name || null, cus_number || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Customer ID already exists" });
            return res.status(500).json({ error: "Failed to create customer", details: err.message });
        }
        res.status(201).json({ message: "Customer created successfully" });
    });
});

// PUT /customers/:id — update customer
router.put("/:id", (req, res) => {
    const { f_name, l_name, cus_number } = req.body;
    if (!f_name)
        return res.status(400).json({ error: "f_name is required" });

    const sql = "UPDATE Customer SET f_name = ?, l_name = ?, cus_number = ? WHERE cus_id = ?";
    db.query(sql, [f_name, l_name || null, cus_number || null, req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to update customer", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });
        res.json({ message: "Customer updated successfully" });
    });
});

// DELETE /customers/:id — delete customer
router.delete("/:id", (req, res) => {
    db.query("DELETE FROM Customer WHERE cus_id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete customer", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Customer not found" });
        res.json({ message: "Customer deleted successfully" });
    });
});

module.exports = router;
