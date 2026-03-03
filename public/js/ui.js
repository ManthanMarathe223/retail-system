// ─────────────────────────────────────────────
// ui.js — Shared UI utilities
// Used by all entity JS files (suppliers.js, etc.)
// ─────────────────────────────────────────────

/**
 * Show a Bootstrap-style toast notification.
 * @param {string} message  - Text to display
 * @param {'success'|'danger'|'warning'} type
 */
function showToast(message, type = "success") {
    const id = "toast-" + Date.now();
    const bgClass = type === "success" ? "bg-success"
        : type === "danger" ? "bg-danger"
            : "bg-warning";
    const html = `
        <div id="${id}" class="toast align-items-center text-white ${bgClass} border-0 mb-2 show" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto"
                    onclick="document.getElementById('${id}').remove()"></button>
            </div>
        </div>`;
    document.getElementById("toast-container").insertAdjacentHTML("beforeend", html);
    setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.remove();
    }, 3500);
}

/**
 * Inline 2-click confirmation for a button (avoids browser confirm() dialogs).
 * First click  → button turns red/dark + shows "Confirm?" label.
 * Second click → onConfirm() is called.
 * Auto-resets  → after 3 seconds if not clicked again.
 *
 * @param {string}   btnId      - ID of the button element
 * @param {Function} onConfirm  - Callback executed on second click
 * @param {string}   [confirmLabel] - Label shown after first click (default "✓ Sure?")
 */
function twoClickConfirm(btnId, onConfirm, confirmLabel = "<i class='bi bi-check-lg'></i> Sure?") {
    const btn = document.getElementById(btnId);
    if (!btn) return;

    if (btn.dataset.confirming === "true") {
        onConfirm();
        return;
    }

    // First click — enter confirm state
    btn.dataset.confirming = "true";
    const originalHtml = btn.innerHTML;
    const originalClass = [...btn.classList].find(c => c.startsWith("btn-"));

    btn.classList.remove(originalClass);
    btn.classList.add("btn-dark");
    btn.innerHTML = confirmLabel;

    const timer = setTimeout(() => {
        if (btn && btn.dataset.confirming === "true") {
            btn.dataset.confirming = "false";
            btn.classList.remove("btn-dark");
            btn.classList.add(originalClass);
            btn.innerHTML = originalHtml;
        }
    }, 3000);

    // Store timer reference so it can be cancelled if needed
    btn.dataset.timerId = timer;
}

/**
 * Enable or disable a button by ID.
 * @param {string}  id
 * @param {boolean} disabled
 */
function setButtonDisabled(id, disabled) {
    const el = document.getElementById(id);
    if (el) el.disabled = disabled;
}

/**
 * Debounce a function call.
 * @param {Function} fn
 * @param {number}   delay  ms
 * @returns {Function}
 */
function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}
