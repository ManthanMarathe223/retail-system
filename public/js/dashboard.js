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
// STAT CARDS (with Total Revenue)
// ═══════════════════════════════════════════════

async function loadStats() {
    try {
        const { ok, data } = await apiGet("/dashboard/summary-stats");
        if (!ok) { showToast(data.error || "Failed to load stats", "danger"); return; }

        document.getElementById("stat-suppliers").textContent  = data.suppliers;
        document.getElementById("stat-products").textContent   = data.products;
        document.getElementById("stat-customers").textContent  = data.customers;
        document.getElementById("stat-orders").textContent     = data.orders;

        const revenue = parseFloat(data.total_revenue) || 0;
        document.getElementById("stat-revenue").textContent =
            "₹" + revenue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// LOW STOCK ALERT TABLE
// ═══════════════════════════════════════════════

async function loadLowStock() {
    try {
        const { ok, data } = await apiGet("/dashboard/low-stock");
        if (!ok) { showToast(data.error || "Failed to load low stock data", "danger"); return; }

        const tbody = document.getElementById("low-stock-body");
        const countBadge = document.getElementById("low-stock-count");
        countBadge.textContent = data.length + " item" + (data.length !== 1 ? "s" : "");

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-success py-3">
                <i class="bi bi-check-circle-fill me-1"></i>All products are well stocked</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(p => {
            const stockClass = p.stock_quantity === 0 ? "table-danger fw-bold" : "table-warning";
            const badge = p.stock_quantity === 0
                ? `<span class="badge bg-danger">OUT OF STOCK</span>`
                : `<span class="badge bg-warning text-dark">${p.stock_quantity} left</span>`;
            return `<tr class="${stockClass}">
                <td><strong>${p.pro_id}</strong></td>
                <td>${p.pro_name}</td>
                <td>${p.pro_type || "—"}</td>
                <td>${badge}</td>
            </tr>`;
        }).join("");
    } catch {
        showToast("Failed to load low stock data", "danger");
    }
}

// ═══════════════════════════════════════════════
// TOP 5 BEST SELLING PRODUCTS TABLE
// ═══════════════════════════════════════════════

async function loadTopProducts() {
    try {
        const { ok, data } = await apiGet("/dashboard/top-products");
        if (!ok) { showToast(data.error || "Failed to load top products", "danger"); return; }

        const tbody = document.getElementById("top-products-body");

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No sales data yet</td></tr>`;
            return;
        }

        const medals = ["🥇", "🥈", "🥉", "4", "5"];
        tbody.innerHTML = data.map((p, i) => `<tr>
            <td><strong>${medals[i] || (i + 1)}</strong></td>
            <td>${p.pro_name}</td>
            <td><span class="badge bg-secondary">${p.pro_type || "—"}</span></td>
            <td><span class="badge bg-success">${p.total_sold} units</span></td>
        </tr>`).join("");
    } catch {
        showToast("Failed to load top products", "danger");
    }
}

// ═══════════════════════════════════════════════
// RECENT 5 ORDERS TABLE
// ═══════════════════════════════════════════════

async function loadRecentOrders() {
    try {
        const { ok, data } = await apiGet("/dashboard/recent-orders");
        if (!ok) { showToast(data.error || "Failed to load recent orders", "danger"); return; }

        const tbody = document.getElementById("recent-orders-body");

        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3">No orders yet</td></tr>`;
            return;
        }

        tbody.innerHTML = data.map(o => {
            const dateStr = o.order_date
                ? new Date(o.order_date).toLocaleDateString("en-IN")
                : "—";
            return `<tr>
                <td><strong>#${o.order_id}</strong></td>
                <td><span class="badge bg-info text-dark">${o.cus_name || "—"}</span></td>
                <td>${dateStr}</td>
                <td><span class="badge bg-warning text-dark">${o.store_name || "—"}</span></td>
            </tr>`;
        }).join("");
    } catch {
        showToast("Failed to load recent orders", "danger");
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
loadLowStock();
loadTopProducts();
loadRecentOrders();
loadProductsByType();
loadEmployeesByStore();
loadRevenueByStore();
