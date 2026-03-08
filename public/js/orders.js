// ─────────────────────────────────────────────
// orders.js — Order page logic
// Depends on: api.js, ui.js (loaded before this in orders.html)
// DB columns: Orders(order_id,order_date,cus_id,store_id,emp_id), Order_Items(order_id,pro_id,quantity)
// ─────────────────────────────────────────────

// ── State ─────────────────────────────────────
let currentModalOrderId = null; // order whose items modal is open

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadOrders(customer = "", store = "") {
    try {
        const path = (customer || store)
            ? `/orders/search/filter?customer=${encodeURIComponent(customer)}&store=${encodeURIComponent(store)}`
            : "/orders";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load orders", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("orderTableBody");
    document.getElementById("orderCount").textContent =
        rows.length + " order" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No orders found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(o => {
        const dateCell = o.order_date
            ? new Date(o.order_date).toLocaleDateString()
            : "<span class='text-muted'>—</span>";
        const custCell = o.cus_name ? `<span class="badge bg-info text-dark">${o.cus_name}</span>` : "<span class='text-muted'>—</span>";
        const empCell = o.emp_name ? `<span class="badge bg-secondary">${o.emp_name}</span>` : "<span class='text-muted'>—</span>";
        const storeCell = o.store_name ? `<span class="badge bg-warning text-dark">${o.store_name}</span>` : "<span class='text-muted'>—</span>";

        return `<tr>
            <td><strong>#${o.order_id}</strong></td>
            <td>${dateCell}</td>
            <td>${custCell}</td>
            <td>${empCell}</td>
            <td>${storeCell}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editOrder(${o.order_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger me-1" id="del-ord-${o.order_id}"
                    onclick="confirmDeleteOrder(${o.order_id})" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
                <button class="btn btn-sm btn-primary"
                    onclick="openItemsModal(${o.order_id})" title="View / Edit Items">
                    <i class="bi bi-list-ul"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

// ═══════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════

const debouncedSearch = debounce(() => {
    loadOrders(
        document.getElementById("searchCustomer").value.trim(),
        document.getElementById("searchStore").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchCustomer").value ||
        document.getElementById("searchStore").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchCustomer").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchStore").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchCustomer").value = "";
    document.getElementById("searchStore").value = "";
    setButtonDisabled("clearBtn", true);
    loadOrders();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("order_id").value.trim();
    setButtonDisabled("submitBtn", !id);
    setButtonDisabled("cancelBtn", !id);
}

["order_id", "order_date", "cus_id", "emp_id", "store_id"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("order_id").value;
    const body = {
        order_id: parseInt(id),
        order_date: document.getElementById("order_date").value || null,
        cus_id: parseInt(document.getElementById("cus_id").value) || null,
        emp_id: parseInt(document.getElementById("emp_id").value) || null,
        store_id: parseInt(document.getElementById("store_id").value) || null,
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/orders/${id}`, body)
            : await apiPost("/orders", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        showToast(isEdit ? "Order updated!" : "Order created!");
        resetForm();
        loadOrders();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT ORDER
// ═══════════════════════════════════════════════

async function editOrder(id) {
    try {
        const { ok, data: o } = await apiGet(`/orders/${id}`);
        if (!ok) { showToast(o.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Order";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Order';

        document.getElementById("order_id").value = o.order_id;
        document.getElementById("order_id").readOnly = true;
        document.getElementById("order_date").value = o.order_date ? o.order_date.slice(0, 10) : "";
        document.getElementById("cus_id").value = o.cus_id || "";
        document.getElementById("emp_id").value = o.emp_id || "";
        document.getElementById("store_id").value = o.store_id || "";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load order data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE ORDER (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteOrder(id) {
    twoClickConfirm(`del-ord-${id}`, () => deleteOrder(id));
}

async function deleteOrder(id) {
    try {
        const { ok, data } = await apiDelete(`/orders/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Order #${id} deleted!`);
        loadOrders();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("orderForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Order";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Order';
    document.getElementById("order_id").readOnly = false;
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// ORDER ITEMS MODAL
// ═══════════════════════════════════════════════

let itemsModalInstance;

async function openItemsModal(orderId) {
    currentModalOrderId = orderId;
    document.getElementById("modalOrderId").textContent = orderId;
    document.getElementById("newProdId").value = "";
    document.getElementById("newQty").value = "";
    await loadItemsModal(orderId);
    itemsModalInstance = new bootstrap.Modal(document.getElementById("itemsModal"));
    itemsModalInstance.show();
}

async function loadItemsModal(orderId) {
    const { ok, data } = await apiGet(`/orders/${orderId}/items`);
    const tbody = document.getElementById("itemsModalBody");

    if (!ok || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No items in this order yet</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        const priceFmt = item.pro_price != null ? `₹${parseFloat(item.pro_price).toFixed(2)}` : "—";
        const totalFmt = item.line_total != null ? `₹${parseFloat(item.line_total).toFixed(2)}` : "—";
        const prodName = item.pro_name || `Product #${item.pro_id}`;

        return `<tr>
            <td><strong>${item.pro_id}</strong></td>
            <td>${prodName}</td>
            <td>${item.quantity}</td>
            <td>${priceFmt}</td>
            <td>${totalFmt}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-outline-danger" id="del-item-${item.pro_id}"
                    onclick="confirmDeleteItem(${item.pro_id})" title="Remove">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

function confirmDeleteItem(proId) {
    twoClickConfirm(
        `del-item-${proId}`,
        () => deleteItem(proId),
        "<i class='bi bi-check-lg'></i> Confirm?"
    );
}

async function addItemFromModal() {
    const proId = parseInt(document.getElementById("newProdId").value);
    const quantity = parseInt(document.getElementById("newQty").value);
    if (!proId) { showToast("Enter a product ID", "warning"); return; }
    if (!quantity || quantity < 1) { showToast("Enter a valid quantity", "warning"); return; }

    try {
        const { ok, data } = await apiPost(`/orders/${currentModalOrderId}/items`, { pro_id: proId, quantity });
        if (!ok) { showToast(data.error, "danger"); return; }
        document.getElementById("newProdId").value = "";
        document.getElementById("newQty").value = "";
        showToast("Item added!");
        await loadItemsModal(currentModalOrderId);
    } catch {
        showToast("Failed to add item. Is the server running?", "danger");
    }
}

async function deleteItem(proId) {
    if (!currentModalOrderId) { showToast("No order selected", "danger"); return; }
    try {
        const { ok, data } = await apiDelete(`/orders/${currentModalOrderId}/items/${proId}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast("Item removed!");
        await loadItemsModal(currentModalOrderId);
    } catch {
        showToast("Failed to remove item. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadOrders();
