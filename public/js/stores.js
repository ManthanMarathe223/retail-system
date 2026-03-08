// ─────────────────────────────────────────────
// stores.js — Store page logic
// Depends on: api.js, ui.js (loaded before this in stores.html)
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadStores(name = "", city = "") {
    try {
        const path = (name || city)
            ? `/stores/search/filter?name=${encodeURIComponent(name)}&city=${encodeURIComponent(city)}`
            : "/stores";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load stores", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("storeTableBody");
    document.getElementById("storeCount").textContent =
        rows.length + " store" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No stores found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(s => {
        const safeName = s.store_name.replace(/'/g, "\\'");
        const cityCell = s.store_city || "<span class='text-muted'>—</span>";
        const addrCell = s.store_address || "<span class='text-muted'>—</span>";
        const phoneCell = s.store_phone || "<span class='text-muted'>—</span>";

        return `<tr>
            <td><strong>${s.store_id}</strong></td>
            <td>${s.store_name}</td>
            <td>${cityCell}</td>
            <td>${addrCell}</td>
            <td>${phoneCell}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editStore(${s.store_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" id="del-store-${s.store_id}"
                    onclick="confirmDeleteStore(${s.store_id}, '${safeName}')" title="Delete">
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
    loadStores(
        document.getElementById("searchName").value.trim(),
        document.getElementById("searchCity").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchName").value ||
        document.getElementById("searchCity").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchName").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchCity").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchName").value = "";
    document.getElementById("searchCity").value = "";
    setButtonDisabled("clearBtn", true);
    loadStores();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("store_id").value.trim();
    const name = document.getElementById("store_name").value.trim();
    setButtonDisabled("submitBtn", !(id && name));
    setButtonDisabled("cancelBtn", !(id || name));
}

["store_id", "store_name", "store_city", "store_address", "store_phone"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("storeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("store_id").value;
    const body = {
        store_id: parseInt(id),
        store_name: document.getElementById("store_name").value.trim(),
        store_city: document.getElementById("store_city").value.trim(),
        store_address: document.getElementById("store_address").value.trim(),
        store_phone: document.getElementById("store_phone").value.trim(),
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/stores/${id}`, body)
            : await apiPost("/stores", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        showToast(isEdit ? "Store updated!" : "Store added!");
        resetForm();
        loadStores();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT STORE
// ═══════════════════════════════════════════════

async function editStore(id) {
    try {
        const { ok, data: s } = await apiGet(`/stores/${id}`);
        if (!ok) { showToast(s.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Store";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Store';

        document.getElementById("store_id").value = s.store_id;
        document.getElementById("store_id").readOnly = true;
        document.getElementById("store_name").value = s.store_name;
        document.getElementById("store_city").value = s.store_city || "";
        document.getElementById("store_address").value = s.store_address || "";
        document.getElementById("store_phone").value = s.store_phone || "";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load store data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE STORE (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteStore(id, name) {
    twoClickConfirm(`del-store-${id}`, () => deleteStore(id, name));
}

async function deleteStore(id, name) {
    try {
        const { ok, data } = await apiDelete(`/stores/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Store "${name}" deleted!`);
        loadStores();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("storeForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Store";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Store';
    document.getElementById("store_id").readOnly = false;
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadStores();
