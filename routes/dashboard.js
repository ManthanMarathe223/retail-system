// ─────────────────────────────────────────────
// routes/dashboard.js
// Analytics endpoints for the Dashboard page
// Mounted at: app.use('/dashboard', require('./routes/dashboard'))
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ── GET /dashboard/stats ─────────────────────
// Returns total count of every entity
router.get("/stats", (req, res) => {
    const sql = `
        SELECT
            (SELECT COUNT(*) FROM supplier)  AS suppliers,
            (SELECT COUNT(*) FROM product)   AS products,
            (SELECT COUNT(*) FROM customer)  AS customers,
            (SELECT COUNT(*) FROM store)     AS stores,
            (SELECT COUNT(*) FROM employee)  AS employees,
            (SELECT COUNT(*) FROM orders)    AS orders
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch stats", details: err.message });
        res.json(results[0]);
    });
});

// ── GET /dashboard/products-by-type ──────────
// Returns product count grouped by pro_type
router.get("/products-by-type", (req, res) => {
    const sql = `
        SELECT
            COALESCE(pro_type, 'Uncategorized') AS pro_type,
            COUNT(*) AS count
        FROM product
        GROUP BY pro_type
        ORDER BY count DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch products by type", details: err.message });
        res.json(results);
    });
});

// ── GET /dashboard/employees-by-store ────────
// Returns employee count grouped by store name
router.get("/employees-by-store", (req, res) => {
    const sql = `
        SELECT
            COALESCE(s.store_name, 'Unassigned') AS store_name,
            COUNT(e.emp_id) AS count
        FROM employee e
        LEFT JOIN store s ON e.store_id = s.store_id
        GROUP BY s.store_name
        ORDER BY count DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch employees by store", details: err.message });
        res.json(results);
    });
});

// ── GET /dashboard/revenue-by-store ──────────
// Returns total revenue (quantity * price) grouped by store
router.get("/revenue-by-store", (req, res) => {
    const sql = `
        SELECT
            s.store_name,
            SUM(oi.quantity * p.pro_price) AS revenue
        FROM order_items oi
        JOIN product p  ON oi.pro_id    = p.pro_id
        JOIN orders  o  ON oi.order_id  = o.order_id
        JOIN store   s  ON o.store_id   = s.store_id
        GROUP BY s.store_name
        ORDER BY revenue DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch revenue by store", details: err.message });
        res.json(results);
    });
});

module.exports = router;
