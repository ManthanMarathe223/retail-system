// ─────────────────────────────────────────────
// products.js — Product page logic
// Depends on: api.js, ui.js (loaded before this in products.html)
// DB columns: pro_id, pro_name, pro_price, pro_description, pro_type, stock_quantity, supp_id
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadProducts(name = "", type = "") {
    try {
        const path = (name || type)
            ? `/products/search/filter?name=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`
            : "/products";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load products", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("productTableBody");
    document.getElementById("productCount").textContent =
        rows.length + " product" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No products found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(p => {
        const safeName = p.pro_name.replace(/'/g, "\\'");
        const typeCell = p.pro_type || "<span class='text-muted'>—</span>";
        const descCell = p.pro_description || "<span class='text-muted'>—</span>";
        const priceCell = p.pro_price != null ? `₹${parseFloat(p.pro_price).toFixed(2)}` : "<span class='text-muted'>—</span>";
        const stockBadge = `<span class="badge ${p.stock_quantity > 0 ? 'bg-success' : 'bg-danger'}">${p.stock_quantity}</span>`;
        const suppCell = p.supp_id || "<span class='text-muted'>—</span>";

        return `<tr>
            <td><strong>${p.pro_id}</strong></td>
            <td>${p.pro_name}</td>
            <td>${typeCell}</td>
            <td>${descCell}</td>
            <td>${priceCell}</td>
            <td>${stockBadge}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editProduct(${p.pro_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" id="del-prod-${p.pro_id}"
                    onclick="confirmDeleteProduct(${p.pro_id}, '${safeName}')" title="Delete">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        </tr>`;
    }).join("");
}

// ═══════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════

const debouncedSearch = debounce(() => {
    loadProducts(
        document.getElementById("searchName").value.trim(),
        document.getElementById("searchType").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchName").value ||
        document.getElementById("searchType").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchName").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchType").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchName").value = "";
    document.getElementById("searchType").value = "";
    setButtonDisabled("clearBtn", true);
    loadProducts();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("pro_id").value.trim();
    const name = document.getElementById("pro_name").value.trim();
    setButtonDisabled("submitBtn", !(id && name));
    setButtonDisabled("cancelBtn", !(id || name));
}

["pro_id", "pro_name", "pro_type", "pro_description", "pro_price", "stock_quantity", "supp_id"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("pro_id").value;
    const body = {
        pro_id: parseInt(id),
        pro_name: document.getElementById("pro_name").value.trim(),
        pro_type: document.getElementById("pro_type").value.trim(),
        pro_description: document.getElementById("pro_description").value.trim(),
        pro_price: parseFloat(document.getElementById("pro_price").value) || null,
        stock_quantity: parseInt(document.getElementById("stock_quantity").value) || 0,
        supp_id: parseInt(document.getElementById("supp_id").value) || null,
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/products/${id}`, body)
            : await apiPost("/products", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        showToast(isEdit ? "Product updated!" : "Product added!");
        resetForm();
        loadProducts();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT PRODUCT
// ═══════════════════════════════════════════════

async function editProduct(id) {
    try {
        const { ok, data: p } = await apiGet(`/products/${id}`);
        if (!ok) { showToast(p.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Product";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Product';

        document.getElementById("pro_id").value = p.pro_id;
        document.getElementById("pro_id").readOnly = true;
        document.getElementById("pro_name").value = p.pro_name;
        document.getElementById("pro_type").value = p.pro_type || "";
        document.getElementById("pro_description").value = p.pro_description || "";
        document.getElementById("pro_price").value = p.pro_price || "";
        document.getElementById("stock_quantity").value = p.stock_quantity || 0;
        document.getElementById("supp_id").value = p.supp_id || "";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load product data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE PRODUCT (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteProduct(id, name) {
    twoClickConfirm(`del-prod-${id}`, () => deleteProduct(id, name));
}

async function deleteProduct(id, name) {
    try {
        const { ok, data } = await apiDelete(`/products/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Product "${name}" deleted!`);
        loadProducts();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("productForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Product";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Product';
    document.getElementById("pro_id").readOnly = false;
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadProducts();
