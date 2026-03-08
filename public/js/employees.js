// ─────────────────────────────────────────────
// employees.js — Employee page logic
// Depends on: api.js, ui.js (loaded before this in employees.html)
// DB columns: emp_id, f_name, l_name, designation, hire_date, emp_salary, store_id
// ─────────────────────────────────────────────

// ═══════════════════════════════════════════════
// LOAD & RENDER TABLE
// ═══════════════════════════════════════════════

async function loadEmployees(name = "", designation = "") {
    try {
        const path = (name || designation)
            ? `/employees/search/filter?name=${encodeURIComponent(name)}&designation=${encodeURIComponent(designation)}`
            : "/employees";
        const { ok, data } = await apiGet(path);
        if (!ok) { showToast(data.error || "Failed to load employees", "danger"); return; }
        renderTable(data);
    } catch {
        showToast("Cannot reach server. Is it running?", "danger");
    }
}

function renderTable(rows) {
    const tbody = document.getElementById("employeeTableBody");
    document.getElementById("employeeCount").textContent =
        rows.length + " employee" + (rows.length !== 1 ? "s" : "");

    if (rows.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">
            <i class="bi bi-inbox fs-4 d-block mb-1"></i>No employees found</td></tr>`;
        return;
    }

    tbody.innerHTML = rows.map(e => {
        const fullName = e.full_name || `${e.f_name} ${e.l_name || ""}`.trim();
        const safeName = fullName.replace(/'/g, "\\'");
        const desigCell = e.designation || "<span class='text-muted'>—</span>";
        const hireCell = e.hire_date ? new Date(e.hire_date).toLocaleDateString() : "<span class='text-muted'>—</span>";
        const salaryCell = e.emp_salary != null ? `₹${parseFloat(e.emp_salary).toFixed(2)}` : "<span class='text-muted'>—</span>";
        const storeCell = e.store_id || "<span class='text-muted'>—</span>";

        return `<tr>
            <td><strong>${e.emp_id}</strong></td>
            <td>${e.f_name}</td>
            <td>${e.l_name || "<span class='text-muted'>—</span>"}</td>
            <td>${desigCell}</td>
            <td>${hireCell}</td>
            <td>${salaryCell}</td>
            <td>${storeCell}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-warning me-1"
                    onclick="editEmployee(${e.emp_id})" title="Edit">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-danger" id="del-emp-${e.emp_id}"
                    onclick="confirmDeleteEmployee(${e.emp_id}, '${safeName}')" title="Delete">
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
    loadEmployees(
        document.getElementById("searchName").value.trim(),
        document.getElementById("searchDesignation").value.trim()
    );
});

function updateClearBtn() {
    const hasText = document.getElementById("searchName").value ||
        document.getElementById("searchDesignation").value;
    setButtonDisabled("clearBtn", !hasText);
}

document.getElementById("searchName").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });
document.getElementById("searchDesignation").addEventListener("input", () => { debouncedSearch(); updateClearBtn(); });

function clearSearch() {
    document.getElementById("searchName").value = "";
    document.getElementById("searchDesignation").value = "";
    setButtonDisabled("clearBtn", true);
    loadEmployees();
}

// ═══════════════════════════════════════════════
// FORM STATE (Save / Cancel enable/disable)
// ═══════════════════════════════════════════════

function updateFormButtons() {
    const id = document.getElementById("emp_id").value.trim();
    const name = document.getElementById("f_name").value.trim();
    setButtonDisabled("submitBtn", !(id && name));
    setButtonDisabled("cancelBtn", !(id || name));
}

["emp_id", "f_name", "l_name", "designation", "hire_date", "emp_salary", "store_id"].forEach(fid =>
    document.getElementById(fid).addEventListener("input", updateFormButtons)
);

// ═══════════════════════════════════════════════
// FORM SUBMIT (Create / Update)
// ═══════════════════════════════════════════════

document.getElementById("employeeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const isEdit = document.getElementById("editMode").value === "true";
    const id = document.getElementById("emp_id").value;
    const body = {
        emp_id: parseInt(id),
        f_name: document.getElementById("f_name").value.trim(),
        l_name: document.getElementById("l_name").value.trim(),
        designation: document.getElementById("designation").value.trim(),
        hire_date: document.getElementById("hire_date").value || null,
        emp_salary: parseFloat(document.getElementById("emp_salary").value) || null,
        store_id: parseInt(document.getElementById("store_id").value) || null,
    };

    try {
        const { ok, data } = isEdit
            ? await apiPut(`/employees/${id}`, body)
            : await apiPost("/employees", body);

        if (!ok) { showToast(data.error, "danger"); return; }

        showToast(isEdit ? "Employee updated!" : "Employee added!");
        resetForm();
        loadEmployees();
    } catch {
        showToast("Request failed. Is the server running?", "danger");
    }
});

// ═══════════════════════════════════════════════
// EDIT EMPLOYEE
// ═══════════════════════════════════════════════

async function editEmployee(id) {
    try {
        const { ok, data: e } = await apiGet(`/employees/${id}`);
        if (!ok) { showToast(e.error, "danger"); return; }

        document.getElementById("editMode").value = "true";
        document.getElementById("formTitle").textContent = "Edit Employee";
        document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Update Employee';

        document.getElementById("emp_id").value = e.emp_id;
        document.getElementById("emp_id").readOnly = true;
        document.getElementById("f_name").value = e.f_name;
        document.getElementById("l_name").value = e.l_name || "";
        document.getElementById("designation").value = e.designation || "";
        document.getElementById("hire_date").value = e.hire_date ? e.hire_date.slice(0, 10) : "";
        document.getElementById("emp_salary").value = e.emp_salary || "";
        document.getElementById("store_id").value = e.store_id || "";

        setButtonDisabled("submitBtn", false);
        setButtonDisabled("cancelBtn", false);
        window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
        showToast("Failed to load employee data", "danger");
    }
}

// ═══════════════════════════════════════════════
// DELETE EMPLOYEE (2-click inline confirm)
// ═══════════════════════════════════════════════

function confirmDeleteEmployee(id, name) {
    twoClickConfirm(`del-emp-${id}`, () => deleteEmployee(id, name));
}

async function deleteEmployee(id, name) {
    try {
        const { ok, data } = await apiDelete(`/employees/${id}`);
        if (!ok) { showToast(data.error || "Delete failed", "danger"); return; }
        showToast(`Employee "${name}" deleted!`);
        loadEmployees();
    } catch {
        showToast("Delete failed. Is the server running?", "danger");
    }
}

// ═══════════════════════════════════════════════
// RESET FORM
// ═══════════════════════════════════════════════

function resetForm() {
    document.getElementById("employeeForm").reset();
    document.getElementById("editMode").value = "false";
    document.getElementById("formTitle").textContent = "Add New Employee";
    document.getElementById("submitBtn").innerHTML = '<i class="bi bi-save me-1"></i>Save Employee';
    document.getElementById("emp_id").readOnly = false;
    setButtonDisabled("submitBtn", true);
    setButtonDisabled("cancelBtn", true);
}

// ═══════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════
loadEmployees();
