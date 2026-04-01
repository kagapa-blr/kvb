/**
 * Parva Manager - Modern ES6 Module
 * Manages Parva (book/section) operations
 * 
 * Usage: import into HTML pages via ES6 module
 */

import { apiClient } from './restclient.js';

console.log('[ParvaManager] ✓ Module initialized with apiClient');

// API ENDPOINTS
const ENDPOINTS = {
    LIST: "/parva",
    CREATE: "/parva",
    UPDATE: (id) => `/parva/${id}`,
    DELETE_BY_NUMBER: (number) => `/parva/${number}`,
};

// Global state
let modal = null;
let deleteModal = null;
let deleteNumber = null;
let tableBody = null;
let isLoading = false;

// Make functions globally available for onclick
window.openCreateModal = null;
window.saveParva = null;
window.confirmDelete = null;

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

async function initApp() {
    try {
        modal = new bootstrap.Modal(document.getElementById("parvaModal"));
        deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
        tableBody = document.getElementById("parvaTable");
        
        setupEventListeners();
        await fetchParvas();
    } catch (error) {
        console.error("Failed to initialize app:", error);
        showMessage("Failed to initialize application", "danger");
    }
}

function setupEventListeners() {
    const addBtn = document.querySelector(".btn-success");
    const saveBtn = document.getElementById("saveParvaBtn");
    const deleteBtn = document.getElementById("confirmDeleteBtn");

    if (addBtn) addBtn.addEventListener("click", openCreateModal);
    if (saveBtn) saveBtn.addEventListener("click", saveParva);
    if (deleteBtn) deleteBtn.addEventListener("click", confirmDelete);
    
    if (tableBody) tableBody.addEventListener("click", handleTableClick);
}

function handleTableClick(event) {
    const button = event.target.closest("button");
    if (!button) return;

    const { action, id, number, name } = button.dataset;
    
    if (action === "edit") {
        editParva(id, name, number);
    } else if (action === "delete") {
        deleteParva(number);
    }
}

function showMessage(msg, type = "success") {
    const messageDiv = document.getElementById("message");
    if (!messageDiv) return;

    messageDiv.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${msg}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;

    if (type === "success") {
        setTimeout(() => {
            const alert = messageDiv.querySelector(".alert");
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }
}

function setLoading(loading = true) {
    isLoading = loading;
    
    const addBtn = document.querySelector(".btn-success");
    const saveBtn = document.getElementById("saveParvaBtn");
    const saveSpinner = document.getElementById("saveSpinner");
    const deleteSpinner = document.getElementById("deleteSpinner");
    const deleteBtn = document.getElementById("confirmDeleteBtn");

    if (addBtn) addBtn.disabled = loading;
    if (saveBtn) saveBtn.disabled = loading;
    if (saveSpinner) saveSpinner.classList.toggle("d-none", !loading);
    if (deleteSpinner) deleteSpinner.classList.toggle("d-none", !loading);
    if (deleteBtn) deleteBtn.disabled = loading;
}

async function fetchParvas() {
    if (isLoading) return;
    
    setLoading(true);
    try {
        const data = await apiClient.get(ENDPOINTS.LIST);
        renderTable(data);
    } catch (error) {
        console.error("Fetch error:", error);
        showMessage(error?.userMessage || "Failed to fetch parvas", "danger");
    } finally {
        setLoading(false);
    }
}

function renderTable(data = []) {
    if (!tableBody) return;

    tableBody.innerHTML = data.length === 0 
        ? '<tr><td colspan="3" class="text-center py-4 text-muted">No parvas found</td></tr>'
        : '';

    data.forEach((parva) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${escapeHtml(parva.parva_number || '')}</td>
            <td>${escapeHtml(parva.name || '')}</td>
            <td>
                <div class="btn-group btn-group-sm" role="group">
                    <button class="btn btn-primary me-1" 
                            data-action="edit"
                            data-id="${parva.id || ''}"
                            data-number="${parva.parva_number || ''}"
                            data-name="${escapeHtml(parva.name || '')}"
                            title="Edit">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-danger" 
                            data-action="delete"
                            data-number="${parva.parva_number || ''}"
                            title="Delete">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    setupEventListeners();
}

// Global functions for onclick compatibility
window.openCreateModal = function() {
    setModalTitle("Create Parva");
    clearForm();
    modal?.show();
};

window.saveParva = async function() {
    const id = getValue("parva_id");
    const name = getValue("parva_name");
    const number = getValue("parva_number");

    if (!name.trim()) {
        showMessage("Parva name is required", "warning");
        document.getElementById("parva_name").focus();
        return;
    }

    setLoading(true);
    try {
        let result;
        if (id) {
            result = await updateParva(id, name, number);
        } else {
            result = await createParva(name);
        }

        modal?.hide();
        showMessage(result?.message || "Saved successfully");
        await fetchParvas();
    } catch (error) {
        console.error("Save error:", error);
        showMessage(error?.userMessage || "Operation failed", "danger");
    } finally {
        setLoading(false);
    }
};

window.confirmDelete = async function() {
    if (!deleteNumber) return;

    setLoading(true);
    try {
        const result = await apiClient.delete(ENDPOINTS.DELETE_BY_NUMBER(deleteNumber));
        deleteModal?.hide();
        deleteNumber = null;
        showMessage(result?.message || "Deleted successfully");
        await fetchParvas();
    } catch (error) {
        console.error("Delete error:", error);
        showMessage(error?.userMessage || "Delete failed", "danger");
    } finally {
        setLoading(false);
    }
};

function editParva(id, name, number) {
    setModalTitle("Update Parva");
    setValue("parva_id", id || "");
    setValue("parva_name", name || "");
    setValue("parva_number", number || "");
    modal?.show();
}

function deleteParva(number) {
    deleteNumber = number;
    const deleteMsg = document.getElementById("deleteConfirmMsg");
    if (deleteMsg) {
        deleteMsg.innerHTML = `Are you sure you want to delete Parva <strong>${escapeHtml(number)}</strong>?`;
    }
    deleteModal?.show();
}

async function createParva(name) {
    return await apiClient.post(ENDPOINTS.CREATE, { name: name.trim() });
}

async function updateParva(id, name, number) {
    const payload = { name: name.trim() };
    if (number && number.trim()) {
        payload.parva_number = parseInt(number.trim(), 10);
    }
    return await apiClient.put(ENDPOINTS.UPDATE(id), payload);
}

function setModalTitle(title) {
    const titleEl = document.getElementById("modalTitle");
    if (titleEl) titleEl.textContent = title;
}

function clearForm() {
    setValue("parva_id", "");
    setValue("parva_name", "");
    setValue("parva_number", "");
    document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : "";
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || "";
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
