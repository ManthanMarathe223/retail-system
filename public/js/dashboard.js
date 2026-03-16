// ─────────────────────────────────────────────
// dashboard.js — Dashboard page logic
// Depends on: api.js, ui.js (loaded before this in dashboard.html)
// ─────────────────────────────────────────────

// Chart.js default font & colour palette
const CHART_COLORS = [
    "rgba(13,110,253,0.8)",   // blue
    "rgba(25,135,84,0.8)",    // green
    "rgba(13,202,240,0.8)",   // cyan
    "rgba(255,193,7,0.8)",    // yellow
    "rgba(220,53,69,0.8)",    // red
    "rgba(111,66,193,0.8)",   // purple
    "rgba(253,126,20,0.8)",   // orange
    "rgba(108,117,125,0.8)",  // grey
];

// ═══════════════════════════════════════════════
// STAT CARDS
// ═══════════════════════════════════════════════

async function loadStats() {
    try {
        const { ok, data } = await apiGet("/dashboard/stats");
        if (!ok) { showToast(data.error || "Failed to load stats", "danger"); return; }

        document.getElementById("stat-suppliers").textContent  = data.suppliers;
        document.getElementById("stat-products").textContent   = data.products;
        document.getElementById("stat-customers").textContent  = data.customers;
        document.getElementById("stat-stores").textContent     = data.stores;
        document.getElementById("stat-employees").textContent  = data.employees;
        document.getElementById("stat-orders").textContent     = data.orders;
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// PRODUCTS PER TYPE — Bar Chart
// ═══════════════════════════════════════════════

async function loadProductsByType() {
    try {
        const { ok, data } = await apiGet("/dashboard/products-by-type");
        if (!ok) { showToast(data.error || "Failed to load chart data", "danger"); return; }

        const labels = data.map(r => r.pro_type);
        const counts = data.map(r => r.count);

        new Chart(document.getElementById("chartProductsByType"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Number of Products",
                    data: counts,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} product(s)` } }
                },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    } catch {
        showToast("Failed to render Products chart", "danger");
    }
}

// ═══════════════════════════════════════════════
// EMPLOYEES PER STORE — Pie Chart
// ═══════════════════════════════════════════════

async function loadEmployeesByStore() {
    try {
        const { ok, data } = await apiGet("/dashboard/employees-by-store");
        if (!ok) { showToast(data.error || "Failed to load chart data", "danger"); return; }

        const labels = data.map(r => r.store_name);
        const counts = data.map(r => r.count);

        new Chart(document.getElementById("chartEmployeesByStore"), {
            type: "pie",
            data: {
                labels,
                datasets: [{
                    data: counts,
                    backgroundColor: CHART_COLORS.slice(0, labels.length),
                    hoverOffset: 8,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: "bottom" },
                    tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed} employee(s)` } }
                }
            }
        });
    } catch {
        showToast("Failed to render Employees chart", "danger");
    }
}

// ═══════════════════════════════════════════════
// REVENUE PER STORE — Bar Chart
// ═══════════════════════════════════════════════

async function loadRevenueByStore() {
    try {
        const { ok, data } = await apiGet("/dashboard/revenue-by-store");
        if (!ok) { showToast(data.error || "Failed to load chart data", "danger"); return; }

        const labels  = data.map(r => r.store_name);
        const revenue = data.map(r => parseFloat(r.revenue) || 0);

        new Chart(document.getElementById("chartRevenueByStore"), {
            type: "bar",
            data: {
                labels,
                datasets: [{
                    label: "Revenue (₹)",
                    data: revenue,
                    backgroundColor: "rgba(25,135,84,0.8)",
                    borderRadius: 6,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: ctx => ` ₹${ctx.parsed.y.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: val => "₹" + val.toLocaleString("en-IN")
                        }
                    }
                }
            }
        });
    } catch {
        showToast("Failed to render Revenue chart", "danger");
    }
}

// ═══════════════════════════════════════════════
// INIT — Load everything in parallel
// ═══════════════════════════════════════════════
loadStats();
loadProductsByType();
loadEmployeesByStore();
loadRevenueByStore();
