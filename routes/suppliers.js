// ─────────────────────────────────────────────
// routes/suppliers.js
// All REST routes for Supplier and Supplier_Mobile
// Mounted at: app.use('/suppliers', require('./routes/suppliers'))
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ── Shared SQL fragment for SELECT with mobile JOIN ──
const SELECT_WITH_MOBILES = `
  SELECT
    s.supp_id,
    s.supp_name,
    s.supp_email,
    s.supp_address,
    GROUP_CONCAT(sm.mobile_number ORDER BY sm.mobile_number SEPARATOR ', ') AS mobile_numbers
  FROM Supplier s
  LEFT JOIN Supplier_Mobile sm ON s.supp_id = sm.supp_id
`;

// ─────────────────────────────────────────────
// SUPPLIER CRUD
// ─────────────────────────────────────────────

// GET /suppliers — all suppliers with mobile numbers
router.get("/", (req, res) => {
    const sql = SELECT_WITH_MOBILES +
        "GROUP BY s.supp_id, s.supp_name, s.supp_email, s.supp_address ORDER BY s.supp_id";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch suppliers", details: err.message });
        res.json(results);
    });
});

// GET /suppliers/search/filter?name=&email= — filtered list
router.get("/search/filter", (req, res) => {
    const { name = "", email = "" } = req.query;
    const sql = SELECT_WITH_MOBILES +
        "WHERE s.supp_name LIKE ? AND s.supp_email LIKE ? " +
        "GROUP BY s.supp_id, s.supp_name, s.supp_email, s.supp_address ORDER BY s.supp_id";
    db.query(sql, [`%${name}%`, `%${email}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

// GET /suppliers/:id — single supplier with mobile numbers
router.get("/:id", (req, res) => {
    const sql = SELECT_WITH_MOBILES +
        "WHERE s.supp_id = ? GROUP BY s.supp_id, s.supp_name, s.supp_email, s.supp_address";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch supplier", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Supplier not found" });
        res.json(results[0]);
    });
});

// POST /suppliers — create supplier
router.post("/", (req, res) => {
    const { supp_id, supp_name, supp_email, supp_address } = req.body;
    if (!supp_id || !supp_name)
        return res.status(400).json({ error: "supp_id and supp_name are required" });

    const sql = "INSERT INTO Supplier (supp_id, supp_name, supp_email, supp_address) VALUES (?, ?, ?, ?)";
    db.query(sql, [supp_id, supp_name, supp_email || null, supp_address || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Supplier ID or Email already exists" });
            return res.status(500).json({ error: "Failed to create supplier", details: err.message });
        }
        res.status(201).json({ message: "Supplier created successfully" });
    });
});

// PUT /suppliers/:id — update supplier
router.put("/:id", (req, res) => {
    const { supp_name, supp_email, supp_address } = req.body;
    if (!supp_name)
        return res.status(400).json({ error: "supp_name is required" });

    const sql = "UPDATE Supplier SET supp_name = ?, supp_email = ?, supp_address = ? WHERE supp_id = ?";
    db.query(sql, [supp_name, supp_email || null, supp_address || null, req.params.id], (err, result) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Email already used by another supplier" });
            return res.status(500).json({ error: "Failed to update supplier", details: err.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: "Supplier not found" });
        res.json({ message: "Supplier updated successfully" });
    });
});

// DELETE /suppliers/:id — delete supplier + their mobiles
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM Supplier_Mobile WHERE supp_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete supplier mobiles", details: err.message });
        db.query("DELETE FROM Supplier WHERE supp_id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete supplier", details: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Supplier not found" });
            res.json({ message: "Supplier deleted successfully" });
        });
    });
});

// ─────────────────────────────────────────────
// SUPPLIER MOBILE CRUD
// ─────────────────────────────────────────────

// GET /suppliers/:id/mobiles
router.get("/:id/mobiles", (req, res) => {
    db.query("SELECT * FROM Supplier_Mobile WHERE supp_id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch mobile numbers", details: err.message });
        res.json(results);
    });
});

// POST /suppliers/:id/mobiles
router.post("/:id/mobiles", (req, res) => {
    const { mobile_number } = req.body;
    if (!mobile_number)
        return res.status(400).json({ error: "mobile_number is required" });

    db.query("INSERT INTO Supplier_Mobile (supp_id, mobile_number) VALUES (?, ?)", [req.params.id, mobile_number], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "This mobile number already exists for this supplier" });
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(404).json({ error: "Supplier not found" });
            return res.status(500).json({ error: "Failed to add mobile number", details: err.message });
        }
        res.status(201).json({ message: "Mobile number added successfully" });
    });
});

// DELETE /suppliers/:id/mobiles/:mobile
router.delete("/:id/mobiles/:mobile", (req, res) => {
    const { id, mobile } = req.params;
    db.query("DELETE FROM Supplier_Mobile WHERE supp_id = ? AND mobile_number = ?", [id, mobile], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete mobile number", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Mobile number not found for this supplier" });
        res.json({ message: "Mobile number deleted successfully" });
    });
});

module.exports = router;
