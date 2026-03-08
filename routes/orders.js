// ─────────────────────────────────────────────
// routes/orders.js
// All REST routes for Orders and Order_Items
// Mounted at: app.use('/orders', require('./routes/orders'))
// Actual columns:
//   Orders: order_id, order_date, cus_id, store_id, emp_id
//   Order_Items: order_id, pro_id, quantity
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

// ── Shared SQL fragment for ORDER SELECT with JOINs ──
const SELECT_ORDER_BASE = `
  SELECT
    o.order_id,
    o.order_date,
    o.cus_id,
    CONCAT(c.f_name, ' ', c.l_name) AS cus_name,
    o.emp_id,
    CONCAT(e.f_name, ' ', e.l_name) AS emp_name,
    o.store_id,
    s.store_name
  FROM Orders o
  LEFT JOIN Customer c ON o.cus_id   = c.cus_id
  LEFT JOIN Employee e ON o.emp_id   = e.emp_id
  LEFT JOIN Store    s ON o.store_id = s.store_id
`;

// ─────────────────────────────────────────────
// ORDERS CRUD
// ─────────────────────────────────────────────

// GET /orders — all orders with customer/employee/store names
router.get("/", (req, res) => {
    const sql = SELECT_ORDER_BASE + " ORDER BY o.order_id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch orders", details: err.message });
        res.json(results);
    });
});

// GET /orders/search/filter?customer=&store=
router.get("/search/filter", (req, res) => {
    const { customer = "", store = "" } = req.query;
    const sql = SELECT_ORDER_BASE +
        " WHERE CONCAT(c.f_name, ' ', c.l_name) LIKE ? AND s.store_name LIKE ? ORDER BY o.order_id DESC";
    db.query(sql, [`%${customer}%`, `%${store}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

// GET /orders/:id — single order
router.get("/:id", (req, res) => {
    const sql = SELECT_ORDER_BASE + " WHERE o.order_id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch order", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Order not found" });
        res.json(results[0]);
    });
});

// GET /orders/:id/items — items for an order with product names
router.get("/:id/items", (req, res) => {
    const sql = `
      SELECT oi.order_id, oi.pro_id, p.pro_name, oi.quantity, p.pro_price,
             (oi.quantity * p.pro_price) AS line_total
      FROM Order_Items oi
      LEFT JOIN Product p ON oi.pro_id = p.pro_id
      WHERE oi.order_id = ?
      ORDER BY oi.pro_id`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch order items", details: err.message });
        res.json(results);
    });
});

// POST /orders — create order
router.post("/", (req, res) => {
    const { order_id, order_date, cus_id, emp_id, store_id } = req.body;
    if (!order_id)
        return res.status(400).json({ error: "order_id is required" });

    const sql = "INSERT INTO Orders (order_id, order_date, cus_id, emp_id, store_id) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [order_id, order_date || null, cus_id || null, emp_id || null, store_id || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Order ID already exists" });
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(400).json({ error: "Referenced customer, employee, or store does not exist" });
            return res.status(500).json({ error: "Failed to create order", details: err.message });
        }
        res.status(201).json({ message: "Order created successfully" });
    });
});

// PUT /orders/:id — update order
router.put("/:id", (req, res) => {
    const { order_date, cus_id, emp_id, store_id } = req.body;
    const sql = "UPDATE Orders SET order_date = ?, cus_id = ?, emp_id = ?, store_id = ? WHERE order_id = ?";
    db.query(sql, [order_date || null, cus_id || null, emp_id || null, store_id || null, req.params.id], (err, result) => {
        if (err) {
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(400).json({ error: "Referenced customer, employee, or store does not exist" });
            return res.status(500).json({ error: "Failed to update order", details: err.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
        res.json({ message: "Order updated successfully" });
    });
});

// DELETE /orders/:id — delete order + its items
router.delete("/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM Order_Items WHERE order_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete order items", details: err.message });
        db.query("DELETE FROM Orders WHERE order_id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete order", details: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
            res.json({ message: "Order deleted successfully" });
        });
    });
});

// ─────────────────────────────────────────────
// ORDER ITEMS CRUD
// ─────────────────────────────────────────────

// POST /orders/:id/items — add item to order
router.post("/:id/items", (req, res) => {
    const { pro_id, quantity } = req.body;
    if (!pro_id || !quantity)
        return res.status(400).json({ error: "pro_id and quantity are required" });

    const sql = "INSERT INTO Order_Items (order_id, pro_id, quantity) VALUES (?, ?, ?)";
    db.query(sql, [req.params.id, pro_id, quantity], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "This product is already in the order" });
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(400).json({ error: "Order or product not found" });
            return res.status(500).json({ error: "Failed to add item", details: err.message });
        }
        res.status(201).json({ message: "Item added to order" });
    });
});

// DELETE /orders/:id/items/:proId — remove item from order
router.delete("/:id/items/:proId", (req, res) => {
    const { id, proId } = req.params;
    db.query("DELETE FROM Order_Items WHERE order_id = ? AND pro_id = ?", [id, proId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to remove item", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found in order" });
        res.json({ message: "Item removed from order" });
    });
});

module.exports = router;
