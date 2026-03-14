// ─────────────────────────────────────────────
// api.js — Generic CRUD fetch helpers
// Used by all entity JS files (suppliers.js, etc.)
// ─────────────────────────────────────────────

const API_BASE = "";

/**
 * GET  /path
 */
async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

/**
 * POST /path  with JSON body
 */
async function apiPost(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

/**
 * PUT  /path  with JSON body
 */
async function apiPut(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}

/**
 * DELETE /path
 */
async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: "DELETE" });
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
}
