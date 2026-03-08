// ─────────────────────────────────────────────
// customers.js — Customer page logic
// Depends on: api.js, ui.js (loaded before this in customers.html)
// DB columns: cus_id, f_name, l_name, cus_number  (full_name = CONCAT(f_name,' ',l_name))
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadCustomers(name = "", phone = "") {
    try {
        const path = (name || phone)
            ? `/customers/search/filter?name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}`
            : "/customers";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load customers", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("customerTableBody");
    document.getElementById("customerCount").textContent =
        rows.length + " customer" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No customers found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(c => {
        const fullName = c.full_name || `${c.f_name} ${c.l_name || ""}`.trim();
        const safeName = fullName.replace(/'/g, "\\'");
        const phoneCell = c.cus_number || "<span class='text-muted'>—</span>";
        const lnameCell = c.l_name || "<span class='text-muted'>—</span>";

        return `<tr>
            <td><strong>${c.cus_id}</strong></td>
            <td>${c.f_name}</td>
            <td>${lnameCell}</td>
            <td>${phoneCell}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editCustomer(${c.cus_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" id="del-cust-${c.cus_id}"
                    onclick="confirmDeleteCustomer(${c.cus_id}, '${safeName}')" title="Delete">
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
    loadCustomers(
        document.getElementById("searchName").value.trim(),
        document.getElementById("searchPhone").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchName").value ||
        document.getElementById("searchPhone").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchName").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchPhone").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchName").value = "";
    document.getElementById("searchPhone").value = "";
    setButtonDisabled("clearBtn", true);
    loadCustomers();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("cus_id").value.trim();
    const name = document.getElementById("f_name").value.trim();
    setButtonDisabled("submitBtn", !(id && name));
    setButtonDisabled("cancelBtn", !(id || name));
}

["cus_id", "f_name", "l_name", "cus_number"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("customerForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("cus_id").value;
    const body = {
        cus_id: parseInt(id),
        f_name: document.getElementById("f_name").value.trim(),
        l_name: document.getElementById("l_name").value.trim(),
        cus_number: document.getElementById("cus_number").value.trim(),
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/customers/${id}`, body)
            : await apiPost("/customers", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        showToast(isEdit ? "Customer updated!" : "Customer added!");
        resetForm();
        loadCustomers();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT CUSTOMER
// ═══════════════════════════════════════════════

async function editCustomer(id) {
    try {
        const { ok, data: c } = await apiGet(`/customers/${id}`);
        if (!ok) { showToast(c.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Customer";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Customer';

        document.getElementById("cus_id").value = c.cus_id;
        document.getElementById("cus_id").readOnly = true;
        document.getElementById("f_name").value = c.f_name;
        document.getElementById("l_name").value = c.l_name || "";
        document.getElementById("cus_number").value = c.cus_number || "";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load customer data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE CUSTOMER (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteCustomer(id, name) {
    twoClickConfirm(`del-cust-${id}`, () => deleteCustomer(id, name));
}

async function deleteCustomer(id, name) {
    try {
        const { ok, data } = await apiDelete(`/customers/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Customer "${name}" deleted!`);
        loadCustomers();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("customerForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Customer";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Customer';
    document.getElementById("cus_id").readOnly = false;
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadCustomers();
