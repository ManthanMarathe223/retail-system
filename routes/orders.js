// ─────────────────────────────────────────────
// routes/orders.js
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

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
  FROM orders o
  LEFT JOIN customer c ON o.cus_id   = c.cus_id
  LEFT JOIN employee e ON o.emp_id   = e.emp_id
  LEFT JOIN store    s ON o.store_id = s.store_id
`;

router.get("/", (req, res) => {
    const sql = SELECT_ORDER_BASE + " ORDER BY o.order_id DESC";
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch orders", details: err.message });
        res.json(results);
    });
});

router.get("/search/filter", (req, res) => {
    const { customer = "", store = "" } = req.query;
    const sql = SELECT_ORDER_BASE +
        " WHERE CONCAT(c.f_name, ' ', c.l_name) LIKE ? AND s.store_name LIKE ? ORDER BY o.order_id DESC";
    db.query(sql, [`%${customer}%`, `%${store}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

router.get("/:id", (req, res) => {
    const sql = SELECT_ORDER_BASE + " WHERE o.order_id = ?";
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch order", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Order not found" });
        res.json(results[0]);
    });
});

router.get("/:id/items", (req, res) => {
    const sql = `
      SELECT oi.order_id, oi.pro_id, p.pro_name, oi.quantity, p.pro_price,
             (oi.quantity * p.pro_price) AS line_total
      FROM order_items oi
      LEFT JOIN product p ON oi.pro_id = p.pro_id
      WHERE oi.order_id = ?
      ORDER BY oi.pro_id`;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch order items", details: err.message });
        res.json(results);
    });
});

router.post("/", (req, res) => {
    const { order_id, order_date, cus_id, emp_id, store_id } = req.body;
    if (!order_id)
        return res.status(400).json({ error: "order_id is required" });

    const sql = "INSERT INTO orders (order_id, order_date, cus_id, emp_id, store_id) VALUES (?, ?, ?, ?, ?)";
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

router.put("/:id", (req, res) => {
    const { order_date, cus_id, emp_id, store_id } = req.body;
    const sql = "UPDATE orders SET order_date = ?, cus_id = ?, emp_id = ?, store_id = ? WHERE order_id = ?";
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

router.delete("/:id", (req, res) => {
    const { id } = req.params;
    db.query("DELETE FROM order_items WHERE order_id = ?", [id], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete order items", details: err.message });
        db.query("DELETE FROM orders WHERE order_id = ?", [id], (err, result) => {
            if (err) return res.status(500).json({ error: "Failed to delete order", details: err.message });
            if (result.affectedRows === 0) return res.status(404).json({ error: "Order not found" });
            res.json({ message: "Order deleted successfully" });
        });
    });
});

router.post("/:id/items", (req, res) => {
    const { pro_id, quantity } = req.body;
    if (!pro_id || !quantity)
        return res.status(400).json({ error: "pro_id and quantity are required" });

    const sql = "INSERT INTO order_items (order_id, pro_id, quantity) VALUES (?, ?, ?)";
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

router.delete("/:id/items/:proId", (req, res) => {
    const { id, proId } = req.params;
    db.query("DELETE FROM order_items WHERE order_id = ? AND pro_id = ?", [id, proId], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to remove item", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Item not found in order" });
        res.json({ message: "Item removed from order" });
    });
});

module.exports = router;