// ─────────────────────────────────────────────
// routes/employees.js
// ─────────────────────────────────────────────
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", (req, res) => {
    db.query("SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM employee ORDER BY emp_id", (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch employees", details: err.message });
        res.json(results);
    });
});

router.get("/search/filter", (req, res) => {
    const { name = "", designation = "" } = req.query;
    const sql = `SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM employee
                 WHERE CONCAT(f_name, ' ', l_name) LIKE ? AND designation LIKE ?
                 ORDER BY emp_id`;
    db.query(sql, [`%${name}%`, `%${designation}%`], (err, results) => {
        if (err) return res.status(500).json({ error: "Search failed", details: err.message });
        res.json(results);
    });
});

router.get("/:id", (req, res) => {
    db.query("SELECT *, CONCAT(f_name, ' ', l_name) AS full_name FROM employee WHERE emp_id = ?", [req.params.id], (err, results) => {
        if (err) return res.status(500).json({ error: "Failed to fetch employee", details: err.message });
        if (results.length === 0) return res.status(404).json({ error: "Employee not found" });
        res.json(results[0]);
    });
});

router.post("/", (req, res) => {
    const { emp_id, f_name, l_name, designation, hire_date, emp_salary, store_id } = req.body;
    if (!emp_id || !f_name)
        return res.status(400).json({ error: "emp_id and f_name are required" });

    const sql = "INSERT INTO employee (emp_id, f_name, l_name, designation, hire_date, emp_salary, store_id) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(sql, [emp_id, f_name, l_name || null, designation || null, hire_date || null, emp_salary || null, store_id || null], (err) => {
        if (err) {
            if (err.code === "ER_DUP_ENTRY")
                return res.status(409).json({ error: "Employee ID already exists" });
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(400).json({ error: "Referenced store does not exist" });
            return res.status(500).json({ error: "Failed to create employee", details: err.message });
        }
        res.status(201).json({ message: "Employee created successfully" });
    });
});

router.put("/:id", (req, res) => {
    const { f_name, l_name, designation, hire_date, emp_salary, store_id } = req.body;
    if (!f_name)
        return res.status(400).json({ error: "f_name is required" });

    const sql = "UPDATE employee SET f_name = ?, l_name = ?, designation = ?, hire_date = ?, emp_salary = ?, store_id = ? WHERE emp_id = ?";
    db.query(sql, [f_name, l_name || null, designation || null, hire_date || null, emp_salary || null, store_id || null, req.params.id], (err, result) => {
        if (err) {
            if (err.code === "ER_NO_REFERENCED_ROW_2")
                return res.status(400).json({ error: "Referenced store does not exist" });
            return res.status(500).json({ error: "Failed to update employee", details: err.message });
        }
        if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
        res.json({ message: "Employee updated successfully" });
    });
});

router.delete("/:id", (req, res) => {
    db.query("DELETE FROM employee WHERE emp_id = ?", [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Failed to delete employee", details: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: "Employee not found" });
        res.json({ message: "Employee deleted successfully" });
    });
});

module.exports = router;