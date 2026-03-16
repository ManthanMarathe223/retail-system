// ─────────────────────────────────────────────
// suppliers.js — Supplier page logic
// Depends on: api.js, ui.js (loaded before this in index.html)
// ─────────────────────────────────────────────

// ── State ─────────────────────────────────────
let pendingMobiles = [];   // mobile tags being built before save
let currentModalSuppId = null; // supplier whose modal is open

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadSuppliers(name = "", email = "") {
    try {
        const path = (name || email)
            ? `/suppliers/search/filter?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}`
            : "/suppliers";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load suppliers", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("supplierTableBody");
    document.getElementById("supplierCount").textContent =
        rows.length + " supplier" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No suppliers found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(s => {
        const mobileHtml = s.mobile_numbers
            ? s.mobile_numbers.split(", ").map(m =>
                `<span class='badge bg-secondary badge-mobile me-1'>${m}</span>`).join("")
            : "<span class='text-muted small'>None</span>";
        const safeName = s.supp_name.replace(/'/g, "\\'");
        const emailCell = s.supp_email || "<span class='text-muted'>\u2014</span>";
        const addrCell = s.supp_address || "<span class='text-muted'>\u2014</span>";

        return `<tr>
            <td><strong>${s.supp_id}</strong></td>
            <td>${s.supp_name}</td>
            <td>${emailCell}</td>
            <td>${addrCell}</td>
            <td>${mobileHtml}</td>
            <td>
                <button class="btn btn-sm btn-success"
                    onclick="openProductsModal(${s.supp_id}, '${safeName}')" title="View Products">
                    <i class="bi bi-box-seam me-1"></i>View
                </button>
            </td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editSupplier(${s.supp_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-info me-1 text-white"
                    onclick="openMobileModal(${s.supp_id}, '${safeName}')" title="Manage Mobiles">
                    <i class="bi bi-phone"></i>
                </button>
                <button class="btn btn-sm btn-danger" id="del-sup-${s.supp_id}"
                    onclick="confirmDeleteSupplier(${s.supp_id}, '${safeName}')" title="Delete">
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
    loadSuppliers(
        document.getElementById("searchName").value.trim(),
        document.getElementById("searchEmail").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchName").value ||
        document.getElementById("searchEmail").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchName").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchEmail").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchName").value = "";
    document.getElementById("searchEmail").value = "";
    setButtonDisabled("clearBtn", true);
    loadSuppliers();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("supp_id").value.trim();
    const name = document.getElementById("supp_name").value.trim();
    const email = document.getElementById("supp_email").value.trim();
    const address = document.getElementById("supp_address").value.trim();
    setButtonDisabled("submitBtn", !(id && name));
    setButtonDisabled("cancelBtn", !(id || name || email || address));
}

["supp_id", "supp_name", "supp_email", "supp_address"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// MOBILE TAGS (pending list in add-supplier form)
// ═══════════════════════════════════════════════

function addMobileField() {
    const input = document.getElementById("mobile_input");
    const val = input.value.trim();
    if (!val) return;
    if (val.length < 10) { showToast("Mobile number must be exactly 10 digits", "warning"); return; }
    if (pendingMobiles.includes(val)) { showToast("Mobile already added", "warning"); return; }
    pendingMobiles.push(val);
    renderPendingMobiles();
    input.value = "";
}

function renderPendingMobiles() {
    document.getElementById("mobileList").innerHTML = pendingMobiles.map((m, i) =>
        `<span class="badge bg-secondary d-flex align-items-center gap-1">
            ${m}
            <i class="bi bi-x-circle-fill" style="cursor:pointer"
               onclick="removePendingMobile(${i})"></i>
        </span>`
    ).join("");
}

function removePendingMobile(index) {
    pendingMobiles.splice(index, 1);
    renderPendingMobiles();
}

// ═══════════════════════════════════════════════
// SUPPLIER FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("supplierForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("supp_id").value;
    const body = {
        supp_id: parseInt(id),
        supp_name: document.getElementById("supp_name").value.trim(),
        supp_email: document.getElementById("supp_email").value.trim(),
        supp_address: document.getElementById("supp_address").value.trim(),
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/suppliers/${id}`, body)
            : await apiPost("/suppliers", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        // Add pending mobile numbers (only on create)
        for (const mobile of pendingMobiles) {
            await apiPost(`/suppliers/${id}/mobiles`, { mobile_number: mobile });
        }

        showToast(isEdit ? "Supplier updated!" : "Supplier added!");
        resetForm();
        loadSuppliers();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT SUPPLIER
// ═══════════════════════════════════════════════

async function editSupplier(id) {
    try {
        const { ok, data: s } = await apiGet(`/suppliers/${id}`);
        if (!ok) { showToast(s.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Supplier";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Supplier';

        document.getElementById("supp_id").value = s.supp_id;
        document.getElementById("supp_id").readOnly = true;
        document.getElementById("supp_name").value = s.supp_name;
        document.getElementById("supp_email").value = s.supp_email || "";
        document.getElementById("supp_address").value = s.supp_address || "";

        // Hide mobile tag section in edit mode (use the modal instead)
        pendingMobiles = [];
        renderPendingMobiles();
        document.getElementById("mobileList").closest(".row").style.display = "none";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);

        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load supplier data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE SUPPLIER (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteSupplier(id, name) {
    twoClickConfirm(`del-sup-${id}`, () => deleteSupplier(id, name));
}

async function deleteSupplier(id, name) {
    try {
        const { ok, data } = await apiDelete(`/suppliers/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Supplier "${name}" deleted!`);
        loadSuppliers();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("supplierForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Supplier";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Supplier';
    document.getElementById("supp_id").readOnly = false;
    document.getElementById("mobileList").closest(".row").style.display = "";
    pendingMobiles = [];
    renderPendingMobiles();
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// MOBILE MODAL
// ═══════════════════════════════════════════════

let mobileModalInstance;

async function openMobileModal(suppId, suppName) {
    currentModalSuppId = suppId;
    document.getElementById("modalSuppId").textContent = suppId;
    document.getElementById("modalSuppName").textContent = suppName;
    document.getElementById("newMobile").value = "";
    await loadMobilesModal(suppId);
    mobileModalInstance = new bootstrap.Modal(document.getElementById("mobileModal"));
    mobileModalInstance.show();
}

async function loadMobilesModal(suppId) {
    const { ok, data } = await apiGet(`/suppliers/${suppId}/mobiles`);
    const list = document.getElementById("mobileModalList");
    if (!ok || data.length === 0) {
        list.innerHTML = `<li class="list-group-item text-muted">No mobile numbers yet</li>`;
        return;
    }
    list.innerHTML = data.map(m => {
        const encNum = encodeURIComponent(m.mobile_number);
        return `<li class="list-group-item d-flex justify-content-between align-items-center" id="mob-${encNum}">
            <span><i class="bi bi-phone me-2"></i>${m.mobile_number}</span>
            <button class="btn btn-sm btn-outline-danger" id="del-btn-${encNum}"
                onclick="confirmDeleteMobile('${encNum}', '${m.mobile_number}')" title="Delete">
                <i class="bi bi-trash"></i>
            </button>
        </li>`;
    }).join("");
}

function confirmDeleteMobile(encNum, displayNum) {
    twoClickConfirm(
        `del-btn-${encNum}`,
        () => deleteMobile(decodeURIComponent(encNum)),
        "<i class='bi bi-check-lg'></i> Confirm?"
    );
}

async function addMobileFromModal() {
    const mobile = document.getElementById("newMobile").value.trim();
    if (!mobile) { showToast("Enter a mobile number", "warning"); return; }
    if (mobile.length < 10) { showToast("Mobile number must be exactly 10 digits", "warning"); return; }
    try {
        const { ok, data } = await apiPost(`/suppliers/${currentModalSuppId}/mobiles`, { mobile_number: mobile });
        if (!ok) { showToast(data.error, "danger"); return; }
        document.getElementById("newMobile").value = "";
        showToast("Mobile number added!");
        await loadMobilesModal(currentModalSuppId);
        loadSuppliers();
    } catch {
        showToast("Failed to add mobile. Is the server running?", "danger");
    }
}

async function deleteMobile(mobile) {
    if (!currentModalSuppId) { showToast("No supplier selected", "danger"); return; }
    try {
        const { ok, data } = await apiDelete(`/suppliers/${currentModalSuppId}/mobiles/${encodeURIComponent(mobile)}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast("Mobile number removed!");
        await loadMobilesModal(currentModalSuppId);
        loadSuppliers();
    } catch {
        showToast("Failed to delete. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// SUPPLIER PRODUCTS MODAL
// ═══════════════════════════════════════════════

let suppProductsModalInstance;

async function openProductsModal(suppId, suppName) {
    document.getElementById("prodModalSuppName").textContent = suppName;
    const tbody = document.getElementById("prodModalBody");
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Loading...</td></tr>`;

    suppProductsModalInstance = new bootstrap.Modal(document.getElementById("suppProductsModal"));
    suppProductsModalInstance.show();

    try {
        const { ok, data } = await apiGet(`/suppliers/${suppId}/products`);
        if (!ok) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">${data.error || "Failed to load products"}</td></tr>`;
            return;
        }
        if (data.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">
                <i class="bi bi-inbox fs-4 d-block mb-1"></i>No products for this supplier</td></tr>`;
            return;
        }
        tbody.innerHTML = data.map(p => {
            const stockBadge = p.stock_quantity < 10
                ? `<span class="badge bg-danger">${p.stock_quantity}</span>`
                : `<span class="badge bg-success">${p.stock_quantity}</span>`;
            return `<tr>
                <td><strong>${p.pro_id}</strong></td>
                <td>${p.pro_name}</td>
                <td>${p.pro_type || "—"}</td>
                <td>₹${parseFloat(p.pro_price).toFixed(2)}</td>
                <td>${stockBadge}</td>
            </tr>`;
        }).join("");
    } catch {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3">Cannot reach server</td></tr>`;
    }
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadSuppliers();
