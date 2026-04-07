/**
 * Dashboard Admin - Modern ES6 Module
 * Complete CRUD operations for Parva, Sandhi, Padya, and Users
 * 
 * Usage: import into admin/dashboard.html via ES6 module
 */

import { apiClient } from './restclient.js';
import { ApiEndpoints } from './endpoints.js';

console.log('[Dashboard] ✓ Module initialized with apiClient and ApiEndpoints');

// API base URL is configured in restclient.js (BASE_PATH = "/kvb")
apiClient.setDebugMode(false);

// ================= STATE =================
const state = {
  deleteAction: null,
  modals: {},
  currentData: {
    parvas: [],
    sandhis: [],
    padyas: []
  }
};

// ================= UTILITY FUNCTIONS =================
/**
 * Normalize file paths - convert absolute paths to relative paths
 * Examples:
 * - Input: "C:/Users/techk/Desktop/kagapa/kvb/static/photos/gamakaPhotos/file.jpg"
 * - Output: "photos/gamakaPhotos/file.jpg"
 * - Input: "photos/gamakaPhotos/file.jpg"
 * - Output: "photos/gamakaPhotos/file.jpg"
 */
function normalizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

  // If path contains absolute Windows or Unix paths, extract the relative part
  // Look for patterns like "static/photos/..." or "static/audio/..." in the path
  const normalizedPath = filePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
  
  // Extract relative path starting from 'photos/' or 'audio/' if absolute path exists
  const photoMatch = normalizedPath.match(/photos\/gamakaPhotos\/.+/);
  if (photoMatch) {
    return photoMatch[0];
  }
  
  const audioMatch = normalizedPath.match(/audio\/gamakaAudio\/.+/);
  if (audioMatch) {
    return audioMatch[0];
  }
  
  // If already relative, return as is
  if (normalizedPath.startsWith('photos/') || normalizedPath.startsWith('audio/')) {
    return normalizedPath;
  }
  
  return normalizedPath; // Return original if can't normalize
}

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  initializeModals();
  initializeEventListeners();
  initializeTabs();
  // Initialize photo and audio upload handlers once at page load
  initializePhotoUpload();
  initializeAudioUpload();
  await loadParvas();
});

// ================= MODAL INITIALIZATION =================
function initializeModals() {
  const modalIds = ['parvaModal', 'sandhiModal', 'padyaModal', 'deleteConfirmModal', 'bulkUploadModal', 'userModal', 'userEditModal', 'userDeleteConfirmModal'];
  
  modalIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      state.modals[id] = new bootstrap.Modal(element, { backdrop: id.includes('user') ? 'static' : true });
      
      // Sandhi modal dropdown population
      if (id === 'sandhiModal') {
        element.addEventListener('show.bs.modal', populateSandhiModalDropdowns);
      }
      
      // Padya modal dropdown population
      if (id === 'padyaModal') {
        element.addEventListener('show.bs.modal', populatePadyaModalDropdowns);
      }
      
      // Bulk upload modal reset
      if (id === 'bulkUploadModal') {
        element.addEventListener('show.bs.modal', resetBulkUploadModal);
      }
    }
  });
}

// ================= EVENT LISTENERS =================
function initializeEventListeners() {
  // Search buttons
  document.getElementById('parva-search-btn')?.addEventListener('click', searchParva);
  document.getElementById('sandhi-search-btn')?.addEventListener('click', searchSandhi);
  document.getElementById('padya-search-btn')?.addEventListener('click', loadPadyaList);
  
  // Enter key for search inputs
  document.getElementById('parva_search')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchParva();
  });
  document.getElementById('sandhi_search')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') searchSandhi();
  });
  document.getElementById('padya_search')?.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') loadPadyaList();
  });
  
  // Save buttons
  document.getElementById('save-parva-btn')?.addEventListener('click', createParva);
  document.getElementById('save-sandhi-btn')?.addEventListener('click', createSandhi);
  document.getElementById('save-padya-btn')?.addEventListener('click', savePadya);
  document.getElementById('confirm-delete-btn')?.addEventListener('click', confirmDelete);
  
  // Sandhi dropdown change listener
  document.getElementById('sandhi_parva_select')?.addEventListener('change', loadSandhisByParva);
  
  // Padya dropdown change listeners
  document.getElementById('padya_parva_select')?.addEventListener('change', loadSandhiOptions);
  document.getElementById('padya_sandhi_select')?.addEventListener('change', loadPadyaList);
  
  // Padya bulk operations
  document.getElementById('download-padya-template-btn')?.addEventListener('click', downloadPadyaTemplate);
  document.getElementById('export-padya-csv-btn')?.addEventListener('click', exportPadyaCSV);
  
  // Bulk upload modal handlers
  document.getElementById('dropZone')?.addEventListener('click', () => {
    document.getElementById('bulkUploadFile').click();
  });
  
  // Drag and drop support
  const dropZone = document.getElementById('dropZone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#0d6efd';
      dropZone.style.backgroundColor = '#e7f1ff';
    });
    
    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#0d6efd';
      dropZone.style.backgroundColor = '';
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.style.borderColor = '#0d6efd';
      dropZone.style.backgroundColor = '';
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        document.getElementById('bulkUploadFile').files = files;
        updateFileSelectionUI(files[0]);
      }
    });
  }
  
  document.getElementById('bulkUploadFile')?.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      updateFileSelectionUI(e.target.files[0]);
    }
  });
  
  document.getElementById('confirmUploadBtn')?.addEventListener('click', startBulkUpload);
  
  // Padya modal parva selection change
  document.getElementById('padya_parva_select_modal')?.addEventListener('change', async () => {
    const parvaNumber = document.getElementById('padya_parva_select_modal').value;
    const sandhiDropdown = document.getElementById('padya_sandhi_select_modal');
    
    if (!sandhiDropdown) return;
    
    sandhiDropdown.innerHTML = `<option value="">ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>`;
    
    if (parvaNumber) {
      try {
    const sandhiResult = await apiRequest(ApiEndpoints.SANDHI.byParva(parvaNumber));
        const sandhis = (sandhiResult && sandhiResult.data) ? sandhiResult.data : [];
        
        if (Array.isArray(sandhis)) {
          sandhis.forEach(s => {
            const sandhiNum = s.sandhi_number || s.id || '';
            if (sandhiNum) {
              sandhiDropdown.innerHTML += `<option value="${sandhiNum}">${escapeHtml(s.name || '')}</option>`;
            }
          });
        }
      } catch (error) {
        console.error("Modal sandhi load error:", error);
      }
    }
  });

  // Padya modal show event - reset form for new entry
  const padyaModalElem = document.getElementById('padyaModal');
  if (padyaModalElem) {
    padyaModalElem.addEventListener('show.bs.modal', async (e) => {
      // Only reset if not coming from edit
      if (!document.getElementById('modal_padya_id').value) {
        resetPadyaModal();
        await populatePadyaModalDropdowns();
      }
      // Reset upload areas (already initialized at page load)
      // No need to re-initialize to avoid duplicate event listeners
    });
  }

  // Parva modal show event - reset form for new entry
  const parvaModalElem = document.getElementById('parvaModal');
  if (parvaModalElem) {
    parvaModalElem.addEventListener('show.bs.modal', async (e) => {
      const input = document.getElementById('parva_name');
      // Only reset if not coming from edit
      if (!input?.dataset.parvaNumber) {
        document.getElementById("parvaModalTitle").textContent = "ಹೊಸ ಪರ್ವ ಸೇರಿಸಿ";
        input.value = '';
        const saveBtn = document.getElementById('save-parva-btn');
        saveBtn.textContent = 'ಸೇರಿಸಿ';
        delete saveBtn.dataset.mode;
      }
    });
  }

  // Sandhi modal show event - reset form for new entry
  const sandhiModalElem = document.getElementById('sandhiModal');
  if (sandhiModalElem) {
    sandhiModalElem.addEventListener('show.bs.modal', async (e) => {
      const input = document.getElementById('sandhi_name');
      const parvaDropdown = document.getElementById('sandhi_parva_select_modal');
      
      // Only reset if not coming from edit
      if (!input?.dataset.sandhiNumber) {
        input.value = '';
        document.getElementById("sandhiModalTitle").textContent = "ಹೊಸ ಸಂಧಿ ಸೇರಿಸಿ";
        
        // Enable parva dropdown and load parvas for new sandhis
        parvaDropdown.disabled = false;
    const parvaResult = await apiRequest(ApiEndpoints.PARVA.list, { params: { offset: 0, limit: 100 } });
        parvaDropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
        parvaResult.data.forEach(p => {
          const pNum = p.parva_number || p.id || '';
          if (pNum) {
            parvaDropdown.innerHTML += `<option value="${pNum}">${escapeHtml(p.name || '')}</option>`;
          }
        });
        
        const saveBtn = document.getElementById('save-sandhi-btn');
        saveBtn.textContent = 'ಸೇರಿಸಿ';
        delete saveBtn.dataset.mode;
      }
    });
  }
  
  // Search inputs (Enter key)
  ['parva_search', 'sandhi_search', 'padya_search', 'user_search'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const btnId = id.replace('_search', '-search-btn');
        document.getElementById(btnId)?.click();
      }
    });
  });

  // User management event listeners
  const userSearchBtn = document.getElementById('user-search-btn');
  const userSearchInput = document.getElementById('user_search');
  
  if (userSearchBtn) {
    userSearchBtn.addEventListener('click', handleUserSearch);
  }
  
  if (userSearchInput) {
    userSearchInput.addEventListener('keyup', handleUserSearch);
  }
  
  const saveUserBtn = document.getElementById('save-user-btn');
  if (saveUserBtn) {
    saveUserBtn.addEventListener('click', saveUser);
  }
  
  const saveUserEditBtn = document.getElementById('save-user-edit-btn');
  if (saveUserEditBtn) {
    saveUserEditBtn.addEventListener('click', saveUserEdit);
  }
  
  const confirmUserDeleteBtn = document.getElementById('confirm-user-delete-btn');
  if (confirmUserDeleteBtn) {
    confirmUserDeleteBtn.addEventListener('click', confirmUserDelete);
  }
  
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  if (togglePasswordBtn) {
    togglePasswordBtn.addEventListener('click', () => {
      togglePasswordVisibility('modal_user_password', 'togglePasswordBtn');
    });
  }
  
  const toggleEditPasswordBtn = document.getElementById('toggleEditPasswordBtn');
  if (toggleEditPasswordBtn) {
    toggleEditPasswordBtn.addEventListener('click', () => {
      togglePasswordVisibility('modal_edit_user_password', 'toggleEditPasswordBtn');
    });
  }
}

// ================= TAB HANDLING =================
function initializeTabs() {
  document.querySelectorAll('[data-bs-toggle="tab"]').forEach(tab => {
    tab.addEventListener("shown.bs.tab", (event) => {
      const target = event.target.getAttribute("data-bs-target");
      handleTabChange(target);
    });
  });
}

function handleTabChange(target) {
  switch (target) {
    case "#parva_tab":
      loadParvas();
      break;
    case "#sandhi_tab":
      if (state.currentData.parvas.length > 0) {
        loadSandhisByParva();
      }
      break;
    case "#padya_tab":
      if (state.currentData.parvas.length > 0) {
        fillPadyaParvaDropdown(state.currentData.parvas);
      }
      break;
    case "#users_tab":
      loadUsers();
      break;
  }
}

// ================= HELPERS =================
function showAlert(message, type = "danger") {
  const container = document.getElementById("alertContainer");
  if (!container) return;

  container.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${escapeHtml(message)}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  setTimeout(() => {
    const alert = container.querySelector('.alert');
    if (alert) {
      const bsAlert = new bootstrap.Alert(alert);
      bsAlert.close();
    }
  }, 5000);
}

function showLoading(tableId, colspan = 5) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-center py-4">
        <div class="spinner-border spinner-border-sm me-2" role="status"></div>
        ಲೋಡ್ ಆಗುತ್ತಿದೆ...
      </td>
    </tr>
  `;
}

function showEmpty(tableId, message, colspan = 5) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-center py-4 text-muted">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

function showError(tableId, message, colspan = 5) {
  const table = document.getElementById(tableId);
  if (!table) return;

  table.innerHTML = `
    <tr>
      <td colspan="${colspan}" class="text-center py-4 text-danger">
        ${escapeHtml(message)}
      </td>
    </tr>
  `;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text ?? "";
  return div.innerHTML;
}

// ================= API WRAPPER =================
async function apiRequest(endpoint, options = {}) {
  try {
    const config = {
      url: endpoint,
      method: (options.method || "GET").toLowerCase(),
    };

    if (options.body) config.data = options.body;
    if (options.params) config.params = options.params;

    const result = await apiClient.request(config);

    // Normalize responses from restclient:
    // - restclient.response interceptor returns `response.data` already
    // - for list endpoints this will be an Array
    // - for wrapped responses it may be an object with `.data` and `.count`
    // - for single-entity endpoints it may be an object representing the entity
    let data = [];
    let count = 0;

    if (Array.isArray(result)) {
      data = result;
      count = result.length;
    } else if (result && typeof result === 'object') {
      if (result.hasOwnProperty('data')) {
        data = result.data ?? [];
        count = result.count ?? (Array.isArray(result.data) ? result.data.length : 0);
      } else {
        // Single entity response (not wrapped)
        data = result;
        count = 1;
      }
    }

    return { data, count };
  } catch (error) {
    console.error("API Error:", error);
    const message = error.response?.data?.message || error.message || "API request failed";
    throw new Error(message);
  }
}

// ================= PARVA OPERATIONS =================

async function editParva(parvaNumber) {
  try {
    const result = await apiRequest(ApiEndpoints.PARVA.get(parvaNumber));
    const parva = result.data;

    // Populate form fields
    document.getElementById("parva_name").value = parva.name || '';
    document.getElementById("parva_name").dataset.parvaNumber = parvaNumber;
    
    // Update modal title and button
    document.getElementById("parvaModalTitle").textContent = "ಪರ್ವ ಸಂಪಾದಿಸಿ";
    const saveBtn = document.getElementById("save-parva-btn");
    saveBtn.textContent = "ನವೀಕರಿಸಿ";
    saveBtn.dataset.mode = "edit";

    state.modals.parvaModal?.show();
  } catch (error) {
    showAlert("ಪರ್ವ ಲೋಡ್ ಆಗಲಿಲ್ಲ: " + error.message, "danger");
    console.error("Edit parva error:", error);
  }
}

async function deleteParva(parvaNumber) {
  if (!confirm("ನಿಜವಾಗಿ ಈ ಪರ್ವವನ್ನು ಅಳಿಸಬೇಕೇ?")) {
    return;
  }

  try {
    await apiRequest(ApiEndpoints.PARVA.delete(parvaNumber), { method: "DELETE" });
    showAlert("ಪರ್ವ ಅಳಿಸಲಾಗಿದೆ", "success");
    loadParvas();
  } catch (error) {
    showAlert("ಪರ್ವ ಅಳಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ: " + error.message, "danger");
    console.error("Delete parva error:", error);
  }
}

async function loadParvas() {
  try {
    showLoading("parva_table");

    const result = await apiRequest(ApiEndpoints.PARVA.list, {
      params: { offset: 0, limit: 100 },
    });

    state.currentData.parvas = result.data;

    if (!result.data.length) {
      showEmpty("parva_table", "ಪರ್ವಗಳು ಇಲ್ಲ");
      fillParvaDropdown([]);
      fillPadyaParvaDropdown([]);
      return;
    }

    renderParvaTable(result.data);
    fillParvaDropdown(result.data);
    fillPadyaParvaDropdown(result.data);
  } catch (error) {
    showError("parva_table", error.message);
    console.error("Load parvas error:", error);
  }
}

function renderParvaTable(parvas) {
  const tbody = document.getElementById("parva_table");
  tbody.innerHTML = parvas.map(p => {
    const parvaNumber = p.parva_number || p.id || '';
    const safeId = parvaNumber ? parvaNumber.toString() : '';
    
    return `
    <tr>
      <td class="fw-semibold">${escapeHtml(p.name || '')}</td>
      <td>${parvaNumber}</td>
      <td>
        <span class="badge bg-primary">${p.sandhi_count ?? 0}</span>
      </td>
      <td>
        <button class="btn btn-outline-info btn-sm edit-parva-btn" 
                data-parva-number="${safeId}"
                title="Edit Parva ${parvaNumber}">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm delete-parva-btn" 
                data-parva-number="${safeId}"
                title="Delete Parva ${parvaNumber}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  // Re-attach edit event listeners
  document.querySelectorAll('#parva_table .edit-parva-btn').forEach(btn => {
    btn.removeEventListener('click', btn._editHandler);
    btn._editHandler = () => editParva(btn.dataset.parvaNumber);
    btn.addEventListener('click', btn._editHandler);
  });

  // Re-attach delete event listeners
  document.querySelectorAll('#parva_table .delete-parva-btn').forEach(btn => {
    btn.removeEventListener('click', btn._deleteHandler);
    btn._deleteHandler = () => deleteParva(btn.dataset.parvaNumber);
    btn.addEventListener('click', btn._deleteHandler);
  });
}

async function createParva() {
  const input = document.getElementById("parva_name");
  const name = input.value.trim();
  const parvaNumber = input.dataset.parvaNumber;
  const isEdit = parvaNumber && parvaNumber !== '';

  if (!name) {
    showAlert("ಪರ್ವ ಹೆಸರು ನಮೂದಿಸಿ", "warning");
    input.focus();
    return;
  }

  try {
    if (isEdit) {
      // Update existing parva
      await apiRequest(ApiEndpoints.PARVA.update(parvaNumber), {
        method: "PUT",
        body: { name },
      });
      showAlert("ಪರ್ವ ನವೀಕರಿಸಲಾಗಿದೆ", "success");
    } else {
      // Create new parva
      await apiRequest(ApiEndpoints.PARVA.create, {
        method: "POST",
        body: { name },
      });
      showAlert("ಹೊಸ ಪರ್ವ ಸೇರಿಸಲಾಗಿದೆ", "success");
    }

    // Reset form
    input.value = "";
    delete input.dataset.parvaNumber;
    const saveBtn = document.getElementById("save-parva-btn");
    saveBtn.textContent = "ಸೇರಿಸಿ";
    delete saveBtn.dataset.mode;
    delete saveBtn.dataset.parvaNumber;
    
    state.modals.parvaModal?.hide();
    loadParvas();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function searchParva() {
  const searchTerm = document.getElementById("parva_search").value.trim();

  try {
    showLoading("parva_table");
    
    // Load all parvas
    const result = await apiRequest(ApiEndpoints.PARVA.list, {
      params: { offset: 0, limit: 100 },
    });

    // Filter on client-side - support both name and number search
    let filtered = result.data;
    if (searchTerm) {
      const isNumeric = /^\d+$/.test(searchTerm);
      const searchNumber = isNumeric ? parseInt(searchTerm) : null;
      
      filtered = result.data.filter(p => {
        if (isNumeric && searchNumber !== null) {
          // Search by parva number (exact match)
          return p.parva_number === searchNumber;
        } else {
          // Search by name (partial match, case-insensitive)
          return (p.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    if (!filtered.length) {
      showEmpty("parva_table", searchTerm ? "ಪರ್ವಗಳು ಕಂಡುಬಂದಿಲ್ಲ" : "ಪರ್ವಗಳು ಇಲ್ಲ");
      return;
    }

    renderParvaTable(filtered);
  } catch (error) {
    showError("parva_table", error.message);
  }
}

// ================= DROPDOWN HELPERS =================
function fillParvaDropdown(parvas) {
  const dropdown = document.getElementById("sandhi_parva_select");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
  parvas.forEach(p => {
    const parvaNumber = p.parva_number || p.id || '';
    if (parvaNumber) {
      dropdown.innerHTML += `
        <option value="${parvaNumber}">${escapeHtml(p.name || '')}</option>
      `;
    }
  });
}

function fillPadyaParvaDropdown(parvas) {
  const dropdown = document.getElementById("padya_parva_select");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
  parvas.forEach(p => {
    const parvaNumber = p.parva_number || p.id || '';
    if (parvaNumber) {
      dropdown.innerHTML += `
        <option value="${parvaNumber}">${escapeHtml(p.name || '')}</option>
      `;
    }
  });
}

// ================= SANDHI OPERATIONS =================

async function editSandhi(parvaNumber, sandhiNumber) {
  try {
    const result = await apiRequest(ApiEndpoints.SANDHI.get(parvaNumber, sandhiNumber));
    const sandhi = result.data;

    // Populate modal for edit
    document.getElementById("sandhi_name").value = sandhi.name || '';
    document.getElementById("sandhi_name").dataset.parvaNumber = parvaNumber;
    document.getElementById("sandhi_name").dataset.sandhiNumber = sandhiNumber;
    
    // Populate parva dropdown (for display only in edit mode)
    const parvaResult = await apiRequest(ApiEndpoints.PARVA.list, { params: { offset: 0, limit: 100 } });
    const parvaDropdown = document.getElementById("sandhi_parva_select_modal");
    parvaDropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
    parvaResult.data.forEach(p => {
      const pNum = p.parva_number || p.id || '';
      if (pNum) {
        parvaDropdown.innerHTML += `<option value="${pNum}">${escapeHtml(p.name || '')}</option>`;
      }
    });
    parvaDropdown.value = parvaNumber;
    parvaDropdown.disabled = true; // Disable parva selection in edit mode
    
    // Update modal title and button
    document.getElementById("sandhiModalTitle").textContent = "ಸಂಧಿ ಸಂಪಾದಿಸಿ";
    const saveBtn = document.getElementById("save-sandhi-btn");
    saveBtn.textContent = "ನವೀಕರಿಸಿ";
    saveBtn.dataset.mode = "edit";

    state.modals.sandhiModal?.show();
  } catch (error) {
    showAlert("ಸಂಧಿ ಲೋಡ್ ಆಗಲಿಲ್ಲ: " + error.message, "danger");
    console.error("Edit sandhi error:", error);
  }
}

async function deleteSandhi(parvaNumber, sandhiNumber) {
  if (!confirm("ನಿಜವಾಗಿ ಈ ಸಂಧಿವನ್ನು ಅಳಿಸಬೇಕೇ?")) {
    return;
  }

  try {
    await apiRequest(ApiEndpoints.SANDHI.delete(parvaNumber, sandhiNumber), { 
      method: "DELETE" 
    });
    showAlert("ಸಂಧಿ ಅಳಿಸಲಾಗಿದೆ", "success");
    loadSandhisByParva();
  } catch (error) {
    showAlert("ಸಂಧಿ ಅಳಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ: " + error.message, "danger");
    console.error("Delete sandhi error:", error);
  }
}

async function loadSandhisByParva() {
  const parvaNumber = document.getElementById("sandhi_parva_select").value;

  if (!parvaNumber) {
    showEmpty("sandhi_table", "ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ");
    return;
  }

  try {
    showLoading("sandhi_table");

    const result = await apiRequest(ApiEndpoints.SANDHI.byParva(parvaNumber));
    state.currentData.sandhis = result.data;

    if (!result.data.length) {
      showEmpty("sandhi_table", "ಸಂಧಿಗಳು ಇಲ್ಲ");
      fillPadyaSandhiDropdown([]);
      return;
    }

    renderSandhiTable(result.data);
    fillPadyaSandhiDropdown(result.data);
  } catch (error) {
    showError("sandhi_table", error.message);
  }
}

function renderSandhiTable(sandhis) {
  const tbody = document.getElementById("sandhi_table");
  tbody.innerHTML = sandhis.map(s => {
    const sandhiNumber = s.sandhi_number || s.id || '';
    const parvaNumber = s.parva_number || '';
    const safeSandhiId = sandhiNumber ? sandhiNumber.toString() : '';
    
    return `
    <tr>
      <td>${escapeHtml(s.name || '')}</td>
      <td>${sandhiNumber}</td>
      <td>${s.padya_count ?? 0}</td>
      <td>
        <button class="btn btn-outline-info btn-sm edit-sandhi-btn" 
                data-parva-number="${parvaNumber}"
                data-sandhi-number="${safeSandhiId}"
                title="Edit Sandhi ${sandhiNumber}">
          <i class="bi bi-pencil-square"></i>
        </button>
        <button class="btn btn-outline-danger btn-sm delete-sandhi-btn" 
                data-parva-number="${parvaNumber}"
                data-sandhi-number="${safeSandhiId}"
                title="Delete Sandhi ${sandhiNumber}">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  document.querySelectorAll('#sandhi_table .edit-sandhi-btn').forEach(btn => {
    btn.removeEventListener('click', btn._editHandler);
    btn._editHandler = () => editSandhi(
      btn.dataset.parvaNumber,
      btn.dataset.sandhiNumber
    );
    btn.addEventListener('click', btn._editHandler);
  });

  document.querySelectorAll('#sandhi_table .delete-sandhi-btn').forEach(btn => {
    btn.removeEventListener('click', btn._deleteHandler);
    btn._deleteHandler = () => deleteSandhi(
      btn.dataset.parvaNumber,
      btn.dataset.sandhiNumber
    );
    btn.addEventListener('click', btn._deleteHandler);
  });
}

async function createSandhi() {
  const input = document.getElementById("sandhi_name");
  const name = input.value.trim();
  const sandhiNumber = input.dataset.sandhiNumber;
  const isEdit = sandhiNumber && sandhiNumber !== '';
  
  // Get parva number from data attribute in edit mode, or from dropdown in create mode
  let parvaNumber = input.dataset.parvaNumber;
  if (!isEdit) {
    parvaNumber = document.getElementById("sandhi_parva_select_modal").value;
  }

  if (!name || !parvaNumber) {
    showAlert("ಸಂಧಿ ಹೆಸರು ಮತ್ತು ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ", "warning");
    return;
  }

  try {
    if (isEdit) {
      // Update existing sandhi
      await apiRequest(ApiEndpoints.SANDHI.update(parvaNumber, sandhiNumber), {
        method: "PUT",
        body: { name },
      });
      showAlert("ಸಂಧಿ ನವೀಕರಿಸಲಾಗಿದೆ", "success");
    } else {
      // Create new sandhi
      await apiRequest(ApiEndpoints.SANDHI.create, {
        method: "POST",
        body: { parva_number: parseInt(parvaNumber), name },
      });
      showAlert("ಹೊಸ ಸಂಧಿ ಸೇರಿಸಲಾಗಿದೆ", "success");
    }

    // Reset form
    input.value = "";
    delete input.dataset.parvaNumber;
    delete input.dataset.sandhiNumber;
    const saveBtn = document.getElementById("save-sandhi-btn");
    saveBtn.textContent = "ಸೇರಿಸಿ";
    delete saveBtn.dataset.mode;
    
    state.modals.sandhiModal?.hide();
    
    // Re-load sandhi by parva
    document.getElementById("sandhi_parva_select").value = parvaNumber;
    loadSandhisByParva();
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

async function searchSandhi() {
  const searchTerm = document.getElementById("sandhi_search").value.trim();
  const parvaNumber = document.getElementById("sandhi_parva_select").value;

  if (!parvaNumber) {
    showAlert("ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ", "warning");
    return;
  }

  try {
    showLoading("sandhi_table");
    const params = { offset: 0, limit: 100 };
    
    // Load sandhi by parva
    const result = await apiRequest(ApiEndpoints.SANDHI.byParva(parvaNumber), { params });

    // Filter on client-side - support both name and number search
    let filtered = result.data;
    if (searchTerm) {
      const isNumeric = /^\d+$/.test(searchTerm);
      const searchNumber = isNumeric ? parseInt(searchTerm) : null;
      
      filtered = result.data.filter(s => {
        if (isNumeric && searchNumber !== null) {
          // Search by sandhi number (exact match)
          return s.sandhi_number === searchNumber;
        } else {
          // Search by name (partial match, case-insensitive)
          return (s.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        }
      });
    }

    if (!filtered.length) {
      showEmpty("sandhi_table", searchTerm ? "ಸಂಧಿಗಳು ಕಂಡುಬಂದಿಲ್ಲ" : "ಸಂಧಿಗಳು ಇಲ್ಲ");
      return;
    }

    renderSandhiTable(filtered);
  } catch (error) {
    showError("sandhi_table", error.message);
  }
}

// ================= PADYA OPERATIONS =================
async function loadSandhiOptions() {
  const parvaNumber = document.getElementById("padya_parva_select").value;
  if (!parvaNumber) {
    fillPadyaSandhiDropdown([]);
    showEmpty("padya_table", "ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ", 4);
    return;
  }

  try {
    const result = await apiRequest(ApiEndpoints.SANDHI.byParva(parvaNumber));
    fillPadyaSandhiDropdown(result.data);
    
    // Clear sandhi selection and table when parva changes
    document.getElementById("padya_sandhi_select").value = "";
    document.getElementById("padya_search").value = "";
    showEmpty("padya_table", "ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ", 3);
  } catch (error) {
    console.error("Load sandhi options error:", error);
    fillPadyaSandhiDropdown([]);
    showEmpty("padya_table", "ಪರ್ವದ ಸಂಧಿಗಳು ಲೋಡ್ ಆಗಲಿಲ್ಲ", 3);
  }
}

function fillPadyaSandhiDropdown(sandhis) {
  const dropdown = document.getElementById("padya_sandhi_select");
  if (!dropdown) return;

  dropdown.innerHTML = `<option value="">ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>`;
  sandhis.forEach(s => {
    const sandhiNumber = s.sandhi_number || s.id || '';
    if (sandhiNumber) {
      dropdown.innerHTML += `
        <option value="${sandhiNumber}">${escapeHtml(s.name || '')}</option>
      `;
    }
  });
}

async function loadPadyaList() {
  const parvaNumber = document.getElementById("padya_parva_select").value;
  const sandhiNumber = document.getElementById("padya_sandhi_select").value;
  const searchTerm = document.getElementById("padya_search").value.trim();

  if (!parvaNumber || !sandhiNumber) {
    showEmpty("padya_table", "ಪರ್ವ ಮತ್ತು ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ", 3);
    return;
  }

  try {
    showLoading("padya_table", 3);

    const params = { 
      parva_number: parseInt(parvaNumber), 
      sandhi_number: parseInt(sandhiNumber)
    };
    if (searchTerm) params.keyword = searchTerm;

    const result = await apiRequest(ApiEndpoints.PADYA.search, { params });

    if (!result.data.length) {
      showEmpty("padya_table", searchTerm ? "ಪದ್ಯಗಳು ಕಂಡುಬಂದಿಲ್ಲ" : "ಪದ್ಯಗಳು ಇಲ್ಲ", 3);
      return;
    }

    renderPadyaTable(result.data);
  } catch (error) {
    showError("padya_table", error.message, 3);
  }
}

function renderPadyaTable(padyas) {
  const tbody = document.getElementById("padya_table");

  tbody.innerHTML = padyas.map(p => {
    const padyaNumber = p.padya_number || p.id || '';
    const parvaNumber = p.parva_number || '';
    const sandhiNumber = p.sandhi_number || '';
    
    // Get first line of padya
    const fullText = p.preview || p.padya || '';
    const firstLine = fullText.split('\n')[0].substring(0, 150);
    const preview = firstLine + (fullText.length > 150 ? '...' : '');

    return `
    <tr>
      <td class="text-center align-middle">
        ${padyaNumber}
      </td>

      <td class="text-center align-middle text-truncate"
          style="max-width: 300px;"
          title="${escapeHtml(fullText)}">
        <small class="text-muted">
          ${escapeHtml(preview)}
        </small>
      </td>

      <td class="text-center align-middle">
        <button class="btn btn-outline-info btn-sm edit-padya-btn" 
                data-parva-number="${parvaNumber}"
                data-sandhi-number="${sandhiNumber}"
                data-padya-number="${padyaNumber}"
                title="Edit Padya">
          <i class="bi bi-pencil-square"></i>
        </button>

        <button class="btn btn-outline-danger btn-sm delete-padya-btn" 
                data-parva-number="${parvaNumber}"
                data-sandhi-number="${sandhiNumber}"
                data-padya-number="${padyaNumber}"
                title="Delete Padya">
          <i class="bi bi-trash"></i>
        </button>
      </td>
    </tr>
    `;
  }).join("");

  // Attach edit event listeners
  document.querySelectorAll('#padya_table .edit-padya-btn').forEach(btn => {
    btn.removeEventListener('click', btn._editHandler);
    btn._editHandler = () => editPadya(
      btn.dataset.parvaNumber,
      btn.dataset.sandhiNumber,
      btn.dataset.padyaNumber
    );
    btn.addEventListener('click', btn._editHandler);
  });

  // Attach delete event listeners
  document.querySelectorAll('#padya_table .delete-padya-btn').forEach(btn => {
    btn.removeEventListener('click', btn._deleteHandler);
    btn._deleteHandler = () => deletePadya(
      btn.dataset.parvaNumber,
      btn.dataset.sandhiNumber,
      btn.dataset.padyaNumber
    );
    btn.addEventListener('click', btn._deleteHandler);
  });
}
// ================= PADYA MODAL =================
async function populateSandhiModalDropdowns() {
  try {
    // Load parvas for sandhi modal
    const parvaResult = await apiRequest(ApiEndpoints.PARVA.list, { params: { offset: 0, limit: 100 } });
    const parvaDropdown = document.getElementById("sandhi_parva_select_modal");
    parvaDropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
    
    parvaResult.data.forEach(p => {
      const parvaNumber = p.parva_number || p.id || '';
      if (parvaNumber) {
        parvaDropdown.innerHTML += `<option value="${parvaNumber}">${escapeHtml(p.name || '')}</option>`;
      }
    });

    // Handle parva change in sandhi modal
    parvaDropdown.removeEventListener('change', parvaDropdown._sandhiModalHandler);
    parvaDropdown._sandhiModalHandler = (e) => {
      // Selection handler for sandhi modal - just updates dropdown
    };
    parvaDropdown.addEventListener('change', parvaDropdown._sandhiModalHandler);

  } catch (error) {
    console.error("Sandhi modal dropdown population error:", error);
  }
}

async function populatePadyaModalDropdowns() {
  try {
    // Load parvas for modal
    const parvaResult = await apiRequest(ApiEndpoints.PARVA.list, { params: { offset: 0, limit: 100 } });
    const parvaDropdown = document.getElementById("padya_parva_select_modal");
    
    if (!parvaDropdown) {
      console.error("Padya parva select modal element not found");
      return;
    }
    
    parvaDropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
    
    // Safely get the data array
    const parvas = (parvaResult && parvaResult.data) ? parvaResult.data : [];
    if (Array.isArray(parvas)) {
      parvas.forEach(p => {
        const parvaNumber = p.parva_number || p.id || '';
        if (parvaNumber) {
          parvaDropdown.innerHTML += `<option value="${parvaNumber}">${escapeHtml(p.name || '')}</option>`;
        }
      });
    }
    
    // Reset sandhi dropdown
    const sandhiDropdown = document.getElementById("padya_sandhi_select_modal");
    if (sandhiDropdown) {
      sandhiDropdown.innerHTML = `<option value="">ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>`;
    }

  } catch (error) {
    console.error("Modal dropdown population error:", error);
  }
}

async function savePadya() {
  // Get parva and sandhi from hidden fields (populated in editPadya) or from dropdowns (for new)
  let parvaNumber = document.getElementById("modal_padya_parva_number").value;
  let sandhiNumber = document.getElementById("modal_padya_sandhi_number").value;
  
  const padyaText = document.getElementById("modal_padya_text").value.trim();
  const padyaNumber = document.getElementById("modal_padya_id").value;
  const updatedBy = document.getElementById("modal_padya_updated_by")?.value.trim() || null;

  // If hidden fields are empty, get from dropdowns (new padya mode)
  if (!parvaNumber) {
    parvaNumber = document.getElementById("padya_parva_select_modal").value;
  }
  if (!sandhiNumber) {
    sandhiNumber = document.getElementById("padya_sandhi_select_modal").value;
  }

  if (!parvaNumber || !sandhiNumber || !padyaText) {
    showAlert("ಪರ್ವ, ಸಂಧಿ ಮತ್ತು ಪದ್ಯ ನಮೂದಿಸಿ", "warning");
    return;
  }

  try {
    const method = padyaNumber ? "PUT" : "POST";
    let endpoint = ApiEndpoints.PADYA.create;
    
    if (padyaNumber) {
      // Update existing - need parva_number, sandhi_number, padya_number
      endpoint = ApiEndpoints.PADYA.update(parvaNumber, sandhiNumber, padyaNumber);
    }

    // Get GamakaVachana data
    const gamaka_vachakara_name = document.getElementById("modal_padya_gamaka_vachakara_name")?.value.trim() || null;
    const gamaka_raga = document.getElementById("modal_padya_gamaka_raga")?.value.trim() || null;
    let gamaka_photo_path = document.getElementById("modal_padya_gamaka_photo_path")?.value.trim() || null;
    let gamaka_audio_path = document.getElementById("modal_padya_gamaka_audio_path")?.value.trim() || null;
    
    // Check if user explicitly deleted files
    const photoPathField = document.getElementById("modal_padya_gamaka_photo_path");
    const audioPathField = document.getElementById("modal_padya_gamaka_audio_path");
    const photo_deleted = photoPathField.dataset.deleted === 'true';
    const audio_deleted = audioPathField.dataset.deleted === 'true';
    
    // Log initial state before uploads
    console.log('[SavePadya] INITIAL STATE:', {
      gamaka_photo_path: gamaka_photo_path,
      gamaka_audio_path: gamaka_audio_path,
      photo_deleted: photo_deleted,
      audio_deleted: audio_deleted,
      photo_dataset_deleted: photoPathField.dataset.deleted,
      audio_dataset_deleted: audioPathField.dataset.deleted
    });

    // Upload photo if a new one is selected
    const photoInput = document.getElementById('modal_padya_gamaka_photo_input');
    if (photoInput.files && photoInput.files.length > 0) {
      // Validate that name and raga are provided for file naming
      if (!gamaka_vachakara_name || !gamaka_raga) {
        showAlert("ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಮೊದಲು ಗಮಕ ವಾಚಕರ ಹೆಸರು ಮತ್ತು ರಾಗ ನಮೂದಿಸಿ", "warning");
        return;
      }
      
      showAlert("ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಚಾಲನೆಯಲ್ಲಿದೆ...", "info");
      
      const uploadedPath = await uploadGamakaPhoto(
        parvaNumber,
        sandhiNumber,
        padyaNumber || 1, // Use temporary number for new padyas
        gamaka_raga,
        gamaka_vachakara_name
      );
      
      if (uploadedPath) {
        gamaka_photo_path = uploadedPath;
        showAlert("ಫೋಟೋ ಸೋಪಮ್ಮತವಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ", "success");
      } else {
        showAlert("ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ವೈಫಲ್ಯವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "danger");
        return;
      }
    }

    // Upload audio if a new one is selected
    const audioInput = document.getElementById('modal_padya_gamaka_audio_input');
    if (audioInput.files && audioInput.files.length > 0) {
      // Validate that name and raga are provided for file naming
      if (!gamaka_vachakara_name || !gamaka_raga) {
        showAlert("ಆಡಿಯೊ ಅಪ್‌ಲೋಡ್ ಮಾಡುವ ಮೊದಲು ಗಮಕ ವಾಚಕರ ಹೆಸರು ಮತ್ತು ರಾಗ ನಮೂದಿಸಿ", "warning");
        return;
      }
      
      showAlert("ಆಡಿಯೊ ಅಪ್‌ಲೋಡ್ ಚಾಲನೆಯಲ್ಲಿದೆ...", "info");
      
      const uploadedPath = await uploadGamakaAudio(
        parvaNumber,
        sandhiNumber,
        padyaNumber || 1, // Use temporary number for new padyas
        gamaka_raga,
        gamaka_vachakara_name
      );
      
      if (uploadedPath) {
        gamaka_audio_path = uploadedPath;
        showAlert("ಆಡಿಯೊ ಸೋಪಮ್ಮತವಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ", "success");
      } else {
        showAlert("ಆಡಿಯೊ ಅಪ್‌ಲೋಡ್ ವೈಫಲ್ಯವಾಗಿದೆ. ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ", "danger");
        return;
      }
    }

    // Build request body - simple tracking of what changed
    const photoUploaded = photoInput.files && photoInput.files.length > 0;
    const audioUploaded = audioInput.files && audioInput.files.length > 0;
    
    const requestBody = { 
      parva_number: parseInt(parvaNumber), 
      sandhi_number: parseInt(sandhiNumber),
      padya: padyaText,
      artha: document.getElementById("modal_padya_artha")?.value.trim() || null,
      tippani: document.getElementById("modal_padya_tippani")?.value.trim() || null,
      gadya: document.getElementById("modal_padya_gadya")?.value.trim() || null,
      suchane: document.getElementById("modal_padya_suchane")?.value.trim() || null,
      pathantar: document.getElementById("modal_padya_pathantar")?.value.trim() || null,
      updated_by: updatedBy,
      gamaka_vachakara_name: gamaka_vachakara_name,
      gamaka_raga: gamaka_raga,
    };
    
    // Only send photo if it changed: uploaded OR deleted
    if (photoUploaded || photo_deleted) {
      requestBody.gamaka_photo_path = gamaka_photo_path;
      requestBody.photo_deleted = photo_deleted;
      console.log('[SavePadya] Photo changed - sending to backend');
    }
    
    // Only send audio if it changed: uploaded OR deleted
    if (audioUploaded || audio_deleted) {
      requestBody.gamaka_audio_path = gamaka_audio_path;
      requestBody.audio_deleted = audio_deleted;
      console.log('[SavePadya] Audio changed - sending to backend');
    }
    
    console.log('[SavePadya] Request body:', requestBody);

    await apiRequest(endpoint, {
      method: method,
      body: requestBody,
    });

    // After successful save, refresh the gamaka paths from database
    // to ensure paths are correctly saved and displayed
    try {
      let refreshResult = await apiRequest(ApiEndpoints.PADYA.get(parvaNumber, sandhiNumber, padyaNumber));
      let refreshedPadya = refreshResult.data;
      
      if (refreshedPadya.gamaka_vachana && refreshedPadya.gamaka_vachana.length > 0) {
        const gamaka = refreshedPadya.gamaka_vachana[0];
        const normalizedPhotoPath = normalizePath(gamaka.gamaka_vachakar_photo_path) || '';
        const normalizedAudioPath = normalizePath(gamaka.gamaka_vachakar_audio_path) || '';
        
        // Update hidden fields with refreshed paths from database
        document.getElementById("modal_padya_gamaka_photo_path").value = normalizedPhotoPath;
        document.getElementById("modal_padya_gamaka_audio_path").value = normalizedAudioPath;
        
        console.log('[Dashboard] Gamaka paths refreshed after save:', {
          photo: normalizedPhotoPath,
          audio: normalizedAudioPath
        });
      }
    } catch (refreshError) {
      console.warn('[Dashboard] Could not refresh gamaka paths after save:', refreshError);
      // Continue anyway - paths should still be saved
    }

    // Reset modal form
    resetPadyaModal();
    state.modals.padyaModal?.hide();
    showAlert(padyaNumber ? "ಪದ್ಯ ನವೀಕರಿಸಲಾಗಿದೆ" : "ಹೊಸ ಪದ್ಯ ಸೇರಿಸಲಾಗಿದೆ", "success");
    
    // Reload padya list with same filters
    if (document.getElementById("padya_parva_select").value) {
      document.getElementById("padya_parva_select").value = parvaNumber;
      loadSandhiOptions();
      document.getElementById("padya_sandhi_select").value = sandhiNumber;
      setTimeout(loadPadyaList, 300);
    }
  } catch (error) {
    showAlert(error.message, "danger");
  }
}

function resetPadyaModal() {
  // Show dropdown mode (for creating new padya)
  document.getElementById("padya_select_mode").style.display = "block";
  document.getElementById("padya_display_mode").style.display = "none";
  document.getElementById("padya_audit_info").style.display = "none";
  
  // Clear hidden fields
  document.getElementById("modal_padya_id").value = "";
  document.getElementById("modal_padya_parva_number").value = "";
  document.getElementById("modal_padya_sandhi_number").value = "";
  
  // Clear timestamp fields
  document.getElementById("modal_padya_created").value = "";
  document.getElementById("modal_padya_updated").value = "";
  document.getElementById("modal_padya_updated_by").value = "";
  
  document.getElementById("padyaModalTitle").textContent = "ಹೊಸ ಪದ್ಯ ಸೇರಿಸಿ";
  document.getElementById("save-padya-btn").textContent = "ಸೇರಿಸಿ";
  document.getElementById("padya_parva_select_modal").value = "";
  document.getElementById("padya_sandhi_select_modal").value = "";
  
  // Clear text fields
  document.getElementById("modal_padya_text").value = "";
  document.getElementById("modal_padya_artha").value = "";
  document.getElementById("modal_padya_tippani").value = "";
  document.getElementById("modal_padya_gadya").value = "";
  document.getElementById("modal_padya_suchane").value = "";
  document.getElementById("modal_padya_pathantar").value = "";
  
  // Clear GamakaVachana fields
  document.getElementById("modal_padya_gamaka_vachakara_name").value = "";
  document.getElementById("modal_padya_gamaka_raga").value = "";
  
  // Clear deletion markers
  const photoPath = document.getElementById("modal_padya_gamaka_photo_path");
  const audioPath = document.getElementById("modal_padya_gamaka_audio_path");
  photoPath.value = "";
  photoPath.dataset.deleted = '';
  audioPath.value = "";
  audioPath.dataset.deleted = '';
  
  document.getElementById("modal_padya_gamaka_id").value = "";
  
  // Clear replacing flags to ensure they don't carry over to next modal
  const photoInput = document.getElementById('modal_padya_gamaka_photo_input');
  const audioInput = document.getElementById('modal_padya_gamaka_audio_input');
  if (photoInput) photoInput.dataset.isReplacing = '';
  if (audioInput) audioInput.dataset.isReplacing = '';
  
  // Reset upload UI WITHOUT marking as deleted (only clear file inputs and UI)
  resetPhotoUploadOnlyUI();
  resetAudioUploadOnlyUI();
}

async function editPadya(parvaNumber, sandhiNumber, padyaNumber) {
  try {
    // Fetch the full padya record with complete details
    let result = await apiRequest(ApiEndpoints.PADYA.get(parvaNumber, sandhiNumber, padyaNumber));
    let padya = result.data;

    // Show display mode (for editing)
    document.getElementById("padya_select_mode").style.display = "none";
    document.getElementById("padya_display_mode").style.display = "block";
    document.getElementById("padya_audit_info").style.display = "grid";
    
    // Populate modal with existing data
    document.getElementById("modal_padya_id").value = padya.id || padyaNumber;
    document.getElementById("modal_padya_parva_number").value = padya.parva_number;
    document.getElementById("modal_padya_sandhi_number").value = padya.sandhi_number;
    document.getElementById("padyaModalTitle").textContent = "ಪದ್ಯ ಸಂಪಾದಿಸಿ";
    document.getElementById("save-padya-btn").textContent = "ನವೀಕರಿಸಿ";
    
    // Display parva and sandhi names from backend response
    document.getElementById("modal_padya_parva_display").value = 
      `${padya.parva_name} (${padya.parva_number})`;
    document.getElementById("modal_padya_sandhi_display").value = 
      `${padya.sandhi_name} (${padya.sandhi_number})`;
    
    // Populate all padya fields
    document.getElementById("modal_padya_text").value = padya.padya || '';
    document.getElementById("modal_padya_artha").value = padya.artha || '';
    document.getElementById("modal_padya_tippani").value = padya.tippani || '';
    document.getElementById("modal_padya_gadya").value = padya.gadya || '';
    document.getElementById("modal_padya_suchane").value = padya.suchane || '';
    document.getElementById("modal_padya_pathantar").value = padya.pathantar || '';
    
    // Populate GamakaVachana fields
    // NOTE: Backend implements this path resolution logic:
    // 1. If gamaka_vachakar_photo_path is NOT empty in DB → use DB value
    // 2. If gamaka_vachakar_photo_path IS empty in DB → search filesystem
    // 3. If found in filesystem → update DB and return it
    // 4. If NOT found → return null (media is unavailable)
    // Same logic applies to audio. Frontend just displays what backend returns.
    let authorName = '';
    let ragaName = '';
    
    if (padya.gamaka_vachana && padya.gamaka_vachana.length > 0) {
      const gamaka = padya.gamaka_vachana[0]; // Get the first GamakaVachana entry
      authorName = gamaka.gamaka_vachakara_name || '';
      ragaName = gamaka.raga || '';
      
      // Normalize paths from database before storing (in case of old absolute paths)
      const normalizedPhotoPath = normalizePath(gamaka.gamaka_vachakar_photo_path) || '';
      const normalizedAudioPath = normalizePath(gamaka.gamaka_vachakar_audio_path) || '';
      
      document.getElementById("modal_padya_gamaka_vachakara_name").value = authorName;
      document.getElementById("modal_padya_gamaka_raga").value = ragaName;
      document.getElementById("modal_padya_gamaka_photo_path").value = normalizedPhotoPath;
      document.getElementById("modal_padya_gamaka_audio_path").value = normalizedAudioPath;
      document.getElementById("modal_padya_gamaka_id").value = gamaka.id || ''; // Store gamaka ID for delete operations
      
      // Clear deletion markers since we just loaded data from DB
      document.getElementById("modal_padya_gamaka_photo_path").dataset.deleted = '';
      document.getElementById("modal_padya_gamaka_audio_path").dataset.deleted = '';
      
      // Re-fetch with author and raga filter to ensure we get the correct record
      if (authorName || ragaName) {
        let filteredResult = await apiRequest(ApiEndpoints.PADYA.get(parvaNumber, sandhiNumber, padyaNumber), {
          params: {
            author_name: authorName,
            raga: ragaName
          }
        });
        let filteredPadya = filteredResult.data;
        
        if (filteredPadya.gamaka_vachana && filteredPadya.gamaka_vachana.length > 0) {
          const filteredGamaka = filteredPadya.gamaka_vachana[0];
          // Update with correctly filtered data and normalize paths
          const filteredPhotoPath = normalizePath(filteredGamaka.gamaka_vachakar_photo_path) || '';
          const filteredAudioPath = normalizePath(filteredGamaka.gamaka_vachakar_audio_path) || '';
          
          document.getElementById("modal_padya_gamaka_photo_path").value = filteredPhotoPath;
          document.getElementById("modal_padya_gamaka_audio_path").value = filteredAudioPath;
          document.getElementById("modal_padya_gamaka_id").value = filteredGamaka.id || ''; // Update gamaka ID for delete operations
          
          // Clear deletion markers since we just loaded filtered data from DB
          document.getElementById("modal_padya_gamaka_photo_path").dataset.deleted = '';
          document.getElementById("modal_padya_gamaka_audio_path").dataset.deleted = '';
          
          // Display photo preview if exists
          if (filteredGamaka.gamaka_vachakar_photo_path) {
            displayGamakaPhotoPreview(filteredGamaka.gamaka_vachakar_photo_path, authorName);
          } else {
            clearPhotoUpload();
          }
          
          // Display audio preview if exists
          if (filteredGamaka.gamaka_vachakar_audio_path) {
            displayGamakaAudioPreview(filteredGamaka.gamaka_vachakar_audio_path, authorName);
          } else {
            clearAudioUpload();
          }
        } else {
          resetPhotoUploadUI();
          resetAudioUploadUI();
        }
      } else {
        // Display photo preview if exists
        if (gamaka.gamaka_vachakar_photo_path) {
          displayGamakaPhotoPreview(gamaka.gamaka_vachakar_photo_path, authorName);
        } else {
          resetPhotoUploadUI();
        }
        
        // Display audio preview if exists
        if (gamaka.gamaka_vachakar_audio_path) {
          displayGamakaAudioPreview(gamaka.gamaka_vachakar_audio_path, authorName);
        } else {
          resetAudioUploadUI();
        }
      }
    } else {
      // Clear GamakaVachana fields if none exist
      document.getElementById("modal_padya_gamaka_vachakara_name").value = '';
      document.getElementById("modal_padya_gamaka_raga").value = '';
      document.getElementById("modal_padya_gamaka_photo_path").value = '';
      document.getElementById("modal_padya_gamaka_audio_path").value = '';
      document.getElementById("modal_padya_gamaka_id").value = ''; // Clear gamaka ID
      resetPhotoUploadUI();
      resetAudioUploadUI();
    }
    
    // Clear file input for new uploads
    const photoInput = document.getElementById('modal_padya_gamaka_photo_input');
    if (photoInput) {
      photoInput.value = '';
    }
    const audioInput = document.getElementById('modal_padya_gamaka_audio_input');
    if (audioInput) {
      audioInput.value = '';
      audioInput.dataset.selectedFile = '';
    }
    
    // Populate timestamp and audit fields
    if (padya.created) {
      const createdDate = new Date(padya.created);
      document.getElementById("modal_padya_created").value = createdDate.toLocaleString('kn-IN');
    }
    if (padya.updated) {
      const updatedDate = new Date(padya.updated);
      document.getElementById("modal_padya_updated").value = updatedDate.toLocaleString('kn-IN');
    }
    document.getElementById("modal_padya_updated_by").value = padya.updated_by || '';
    
    state.modals.padyaModal?.show();
  } catch (error) {
    showAlert("ಪದ್ಯ ಲೋಡ್ ಆಗಲಿಲ್ಲ: " + error.message, "danger");
    console.error("Edit padya error:", error);
  }
}

async function deletePadya(parvaNumber, sandhiNumber, padyaNumber) {
  if (!confirm("ನಿಜವಾಗಿ ಈ ಪದ್ಯವನ್ನು ಅಳಿಸಬೇಕೇ?")) {
    return;
  }

  try {
    await apiRequest(ApiEndpoints.PADYA.delete(parvaNumber, sandhiNumber, padyaNumber), { 
      method: "DELETE" 
    });

    showAlert("ಪದ್ಯ ಅಳಿಸಲಾಗಿದೆ", "success");
    loadPadyaList();
  } catch (error) {
    showAlert("ಪದ್ಯ ಅಳಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ: " + error.message, "danger");
    console.error("Delete padya error:", error);
  }
}

// ================= GAMAKA PHOTO UPLOAD =================
function initializePhotoUpload() {
  const uploadArea = document.getElementById('gamaka_photo_upload_area');
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  const previewContainer = document.getElementById('gamaka_photo_preview_container');
  const clearBtn = document.getElementById('clear_gamaka_photo_btn');
  const replaceBtn = document.getElementById('replace_gamaka_photo_btn');

  if (!uploadArea || !fileInput) return;

  // Click to upload on the upload area
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Replace existing photo button
  if (replaceBtn) {
    replaceBtn.addEventListener('click', () => {
      // Store flag that user wants to replace (but don't mark as deleted yet)
      // The deleted flag will be set when a file is actually selected
      fileInput.dataset.isReplacing = 'true';
      fileInput.click();
    });
  }

  // File selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handlePhotoSelection(e.target.files[0]);
    }
  });

  // Drag and drop on upload area
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0d6efd';
    uploadArea.style.backgroundColor = '#e7f1ff';
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0d6efd';
    uploadArea.style.backgroundColor = '#fff';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0d6efd';
    uploadArea.style.backgroundColor = '#fff';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/webp'];
      const fileName = file.name.toLowerCase();
      const hasValidExt = ['.jpg', '.jpeg', '.webp'].some(ext => fileName.endsWith(ext));
      
      if (!allowedTypes.includes(file.type) || !hasValidExt) {
        showAlert("ಸಮರ್ಥನೀಯ ಫೋಟೋ ಸ್ವರೂಪ: JPEG (.jpg, .jpeg) ಅಥವಾ WebP (.webp)", "warning");
        return;
      }
      
      fileInput.files = files;
      handlePhotoSelection(file);
    } else {
      showAlert("ದಯವಿಟ್ಟು ಚಿತ್ರ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ", "warning");
    }
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearPhotoUpload();
    });
  }
}

function handlePhotoSelection(file) {
  // Validate file type - only JPEG and WebP
  const allowed = ['image/jpeg', 'image/webp'];
  if (!allowed.includes(file.type)) {
    showAlert("ಸಮರ್ಥನೀಯ ಫೋಟೋ ಸ್ವರೂಪ: JPEG (.jpg, .jpeg) ಅಥವಾ WebP (.webp)", "warning");
    return;
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    showAlert("ಫೋಟೋ ಗಾತ್ರ 10MB ಗಿಂತ ಹೆಚ್ಚಾಗಿರಬಾರದು", "warning");
    return;
  }

  // If user is replacing, DO NOT mark as deleted yet - they're just uploading a new file
  // Mark for replacement, which means: keep the metadata flag true but don't set deleted flag
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  const isReplacing = fileInput.dataset.isReplacing === 'true';
  
  if (isReplacing) {
    // When replacing: mark that a new file is selected (don't set deleted flag)
    fileInput.dataset.isReplacingWithNewFile = 'true';
    fileInput.dataset.isReplacing = '';  // Clear the replace flag
    console.log('[Photo] Replacement file selected - new file will overwrite old one');
  }

  // Show preview
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('gamaka_photo_preview');
    const filename = document.getElementById('gamaka_photo_filename');
    const uploadArea = document.getElementById('gamaka_photo_upload_area');
    const previewContainer = document.getElementById('gamaka_photo_preview_container');
    const pathDisplay = document.getElementById('gamaka_photo_path_display');
    const photoPath = document.getElementById('modal_padya_gamaka_photo_path');

    preview.src = e.target.result;
    filename.textContent = file.name;
    pathDisplay.textContent = '(ಸಂರಕ್ಷಿತ ಸೂಚನೆ: ಸಂರಕ್ಷಿಸಿದ ನಂತರ ಪಥ ತೋರಿಸುತ್ತಾರೆ)';
    
    // Clear old path value to use new uploaded path
    photoPath.value = '';
    
    uploadArea.style.display = 'none';
    previewContainer.style.display = 'block';
    
    // Store file for later upload
    document.getElementById('modal_padya_gamaka_photo_input').dataset.selectedFile = 'true';
  };
  reader.readAsDataURL(file);
}

function clearPhotoUpload() {
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  const uploadArea = document.getElementById('gamaka_photo_upload_area');
  const previewContainer = document.getElementById('gamaka_photo_preview_container');
  const photoPath = document.getElementById('modal_padya_gamaka_photo_path');
  const pathDisplay = document.getElementById('gamaka_photo_path_display');

  fileInput.value = '';
  photoPath.value = ''; // Setting to empty string
  photoPath.dataset.deleted = 'true'; // Mark photo as explicitly deleted by user
  fileInput.dataset.selectedFile = '';
  
  if (pathDisplay) {
    pathDisplay.textContent = '';
  }
  
  uploadArea.style.display = 'block';
  previewContainer.style.display = 'none';
  showAlert('ಫೋಟೋ ತೆಗೆದುಹಾಕಲಾಗಿದೆ - ಸಂರಕ್ಷಿಸಲು Save ಕ್ಲಿಕ್ ಮಾಡಿ', 'info');
}

// Reset photo upload UI without marking as deleted (used during modal reset/cleanup only)
function resetPhotoUploadOnlyUI() {
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  const uploadArea = document.getElementById('gamaka_photo_upload_area');
  const previewContainer = document.getElementById('gamaka_photo_preview_container');
  const pathDisplay = document.getElementById('gamaka_photo_path_display');

  fileInput.value = '';
  fileInput.dataset.selectedFile = '';
  // DO NOT clear photoPath.value or set dataset.deleted here
  // Only reset the file input and UI elements
  
  if (pathDisplay) {
    pathDisplay.textContent = '';
  }
  
  uploadArea.style.display = 'block';
  previewContainer.style.display = 'none';
}

// Reset photo upload UI without marking for deletion (used when loading existing data)
function resetPhotoUploadUI() {
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  const uploadArea = document.getElementById('gamaka_photo_upload_area');
  const previewContainer = document.getElementById('gamaka_photo_preview_container');

  fileInput.value = '';
  fileInput.dataset.selectedFile = '';
  
  // Only hide preview if there's no existing path
  const photoPath = document.getElementById('modal_padya_gamaka_photo_path');
  if (!photoPath.value) {
    uploadArea.style.display = 'block';
    previewContainer.style.display = 'none';
  }
}

function displayGamakaPhotoPreview(photoPath, authorName) {
  const uploadArea = document.getElementById('gamaka_photo_upload_area');
  const previewContainer = document.getElementById('gamaka_photo_preview_container');
  const preview = document.getElementById('gamaka_photo_preview');
  const filename = document.getElementById('gamaka_photo_filename');
  const pathDisplay = document.getElementById('gamaka_photo_path_display');

  if (photoPath) {
    // Normalize the path - convert absolute paths to relative
    const normalizedPath = normalizePath(photoPath);
    
    if (normalizedPath) {
      // Build full URL from relative path
      const fullUrl = '/static/' + normalizedPath;
      preview.src = fullUrl;
      filename.textContent = authorName || 'ಫೋಟೋ';
      pathDisplay.textContent = normalizedPath;
      
      uploadArea.style.display = 'none';
      previewContainer.style.display = 'block';
    } else {
      resetPhotoUploadUI();
    }
  } else {
    resetPhotoUploadUI();
  }
}

async function uploadGamakaPhoto(parvaNumber, sandhiNumber, padyaNumber, ragaName, authorName) {
  const fileInput = document.getElementById('modal_padya_gamaka_photo_input');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    return null; // No photo selected, return null
  }

  // Validate file type on client side
  const file = fileInput.files[0];
  const allowedMimeTypes = ['image/jpeg', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.webp'];
  
  if (!allowedMimeTypes.includes(file.type)) {
    const fileName = file.name.toLowerCase();
    const hasValidExt = allowedExtensions.some(ext => fileName.endsWith(ext));
    if (!hasValidExt) {
      showAlert('ಸಮರ್ಥನೀಯ ಫೋಟೋ ಸ್ವರೂಪ: JPEG (.jpg, .jpeg) ಅಥವಾ WebP (.webp)', 'danger');
      return null;
    }
  }

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('parva_number', parvaNumber);
    formData.append('sandhi_number', sandhiNumber);
    formData.append('padya_number', padyaNumber);
    formData.append('raga', ragaName || 'unknown');
    formData.append('author_name', authorName || 'unknown');

    console.log('Uploading photo with FormData:', {
      parva: parvaNumber,
      sandhi: sandhiNumber,
      padya: padyaNumber,
      raga: ragaName,
      author: authorName,
      filename: file.name
    });

    const result = await apiClient.post(ApiEndpoints.PADYA.uploadPhoto, formData);
    console.log('Photo upload response:', result);
    
    // Handle both direct response and wrapped response
    let photoPath = result.photo_path || (result.data && result.data.photo_path);
    
    if (!photoPath) {
      throw new Error('Backend did not return photo path');
    }
    
    // Normalize the path in case backend returns absolute path
    photoPath = normalizePath(photoPath);
    console.log('Normalized photo path:', photoPath);
    
    // Update hidden field with the photo path for database storage
    const photoPathField = document.getElementById('modal_padya_gamaka_photo_path');
    if (photoPathField) {
      photoPathField.value = photoPath;
    }
    
    // Display the backend path
    const pathDisplay = document.getElementById('gamaka_photo_path_display');
    if (pathDisplay) {
      pathDisplay.textContent = photoPath;
    }
    
    return photoPath; // Return the photo path
  } catch (error) {
    console.error('Photo upload error:', error);
    showAlert('ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ದೋಷ: ' + error.message, 'danger');
    return null;
  }
}

// ================= GAMAKA AUDIO UPLOAD =================
function initializeAudioUpload() {
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');
  const clearBtn = document.getElementById('clear_gamaka_audio_btn');
  const replaceBtn = document.getElementById('replace_gamaka_audio_btn');

  if (!uploadArea || !fileInput) return;

  // Click to upload on the upload area
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Replace existing audio button
  if (replaceBtn) {
    replaceBtn.addEventListener('click', () => {
      // Store flag that user wants to replace (but don't mark as deleted yet)
      // The deleted flag will be set when a file is actually selected
      fileInput.dataset.isReplacing = 'true';
      fileInput.click();
    });
  }

  // File selection
  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleAudioSelection(e.target.files[0]);
    }
  });

  // Drag and drop on upload area
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0dcaf0';
    uploadArea.style.backgroundColor = '#cfe2ff';
  });

  uploadArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0dcaf0';
    uploadArea.style.backgroundColor = '#fff';
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.style.borderColor = '#0dcaf0';
    uploadArea.style.backgroundColor = '#fff';
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('audio/')) {
      fileInput.files = files;
      handleAudioSelection(files[0]);
    } else {
      showAlert("ದಯವಿಟ್ಟು ಆಡಿಯೊ ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ", "warning");
    }
  });

  // Clear button
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearAudioUpload();
    });
  }
}

function handleAudioSelection(file) {
  // Validate file type
  const allowed = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/mp4', 'audio/aac', 'audio/x-ms-wma'];
  if (!allowed.includes(file.type)) {
    showAlert("ಅನುಮತಿಸಿದ ಆಡಿಯೊ ಪ್ರಕಾರ: MP3, WAV, OGG, FLAC, M4A, AAC, WMA", "warning");
    return;
  }

  // Validate file size (max 50MB)
  const maxSize = 50 * 1024 * 1024;
  if (file.size > maxSize) {
    showAlert("ಆಡಿಯೊ ಗಾತ್ರ 50MB ಗಿಂತ ಹೆಚ್ಚಾಗಿರಬಾರದು", "warning");
    return;
  }

  // If user is replacing, DO NOT mark as deleted yet - they're just uploading a new file
  // Mark for replacement, which means: keep the metadata flag true but don't set deleted flag
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  const isReplacing = fileInput.dataset.isReplacing === 'true';
  
  if (isReplacing) {
    // When replacing: mark that a new file is selected (don't set deleted flag)
    fileInput.dataset.isReplacingWithNewFile = 'true';
    fileInput.dataset.isReplacing = '';  // Clear the replace flag
    console.log('[Audio] Replacement file selected - new file will overwrite old one');
  }

  // Show preview
  const audioPreview = document.getElementById('gamaka_audio_preview');
  const filename = document.getElementById('gamaka_audio_filename');
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');
  const pathDisplay = document.getElementById('gamaka_audio_path_display');
  const audioPath = document.getElementById('modal_padya_gamaka_audio_path');

  // Create object URL for preview
  const audioUrl = URL.createObjectURL(file);
  const audioSource = audioPreview.querySelector('source');
  audioSource.src = audioUrl;
  audioPreview.load(); // Reload audio element with new source
  
  filename.textContent = file.name;
  pathDisplay.textContent = '(ಸಂರಕ್ಷಿತ ಸೂಚನೆ: ಸಂರಕ್ಷಿಸಿದ ನಂತರ ಪಥ ತೋರಿಸುತ್ತಾರೆ)';
  
  // Clear old path value to use new uploaded path
  audioPath.value = '';
  
  uploadArea.style.display = 'none';
  previewContainer.style.display = 'block';
  
  // Store file for later upload
  document.getElementById('modal_padya_gamaka_audio_input').dataset.selectedFile = 'true';
}

function clearAudioUpload() {
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');
  const audioPath = document.getElementById('modal_padya_gamaka_audio_path');
  const pathDisplay = document.getElementById('gamaka_audio_path_display');

  // Clear UI elements
  fileInput.value = '';
  audioPath.value = '';  // Setting to empty string - explicitly marks for deletion
  audioPath.dataset.deleted = 'true'; // Mark as explicitly deleted by user
  fileInput.dataset.selectedFile = '';
  
  if (pathDisplay) {
    pathDisplay.textContent = '';
  }
  
  uploadArea.style.display = 'block';
  previewContainer.style.display = 'none';
  
  showAlert('ಆಡಿಯೊ ತೆಗೆದುಹಾಕಲಾಗಿದೆ - ಸಂರಕ್ಷಿಸಲು Save ಕ್ಲಿಕ್ ಮಾಡಿ', 'info');
}

// Reset audio upload UI without marking for deletion (used when loading existing data)
function resetAudioUploadUI() {
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');

  fileInput.value = '';
  fileInput.dataset.selectedFile = '';
  
  // Only hide preview if there's no existing path
  const audioPath = document.getElementById('modal_padya_gamaka_audio_path');
  if (!audioPath.value) {
    uploadArea.style.display = 'block';
    previewContainer.style.display = 'none';
  }
}

// Reset audio upload UI without marking as deleted (used during modal reset/cleanup only)
function resetAudioUploadOnlyUI() {
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');
  const pathDisplay = document.getElementById('gamaka_audio_path_display');

  fileInput.value = '';
  fileInput.dataset.selectedFile = '';
  // DO NOT clear audioPath.value or set dataset.deleted here
  // Only reset the file input and UI elements
  
  if (pathDisplay) {
    pathDisplay.textContent = '';
  }
  
  uploadArea.style.display = 'block';
  previewContainer.style.display = 'none';
}

async function uploadGamakaAudio(parvaNumber, sandhiNumber, padyaNumber, ragaName, authorName) {
  const fileInput = document.getElementById('modal_padya_gamaka_audio_input');
  
  if (!fileInput.files || fileInput.files.length === 0) {
    return null; // No audio selected, return null
  }

  try {
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('parva_number', parvaNumber);
    formData.append('sandhi_number', sandhiNumber);
    formData.append('padya_number', padyaNumber);
    formData.append('raga', ragaName || 'unknown');
    formData.append('author_name', authorName || 'unknown');

    console.log('Uploading audio with FormData:', {
      parva: parvaNumber,
      sandhi: sandhiNumber,
      padya: padyaNumber,
      raga: ragaName,
      author: authorName,
      filename: fileInput.files[0].name
    });

    const result = await apiClient.post(ApiEndpoints.PADYA.uploadAudio, formData);
    console.log('Audio upload response:', result);
    
    // Handle both direct response and wrapped response
    let audioPath = result.audio_path || (result.data && result.data.audio_path);
    
    if (!audioPath) {
      throw new Error('Backend did not return audio path');
    }
    
    // Normalize the path in case backend returns absolute path
    audioPath = normalizePath(audioPath);
    console.log('Normalized audio path:', audioPath);
    
    // Update hidden field with the audio path for database storage
    const audioPathField = document.getElementById('modal_padya_gamaka_audio_path');
    if (audioPathField) {
      audioPathField.value = audioPath;
    }
    
    // Display the backend path
    const pathDisplay = document.getElementById('gamaka_audio_path_display');
    if (pathDisplay) {
      pathDisplay.textContent = audioPath;
    }
    
    return audioPath; // Return the audio path
  } catch (error) {
    console.error('Audio upload error:', error);
    showAlert('ಆಡಿಯೊ ಅಪ್‌ಲೋಡ್ ದೋಷ: ' + error.message, 'danger');
    return null;
  }
}

function displayGamakaAudioPreview(audioPath, authorName) {
  const uploadArea = document.getElementById('gamaka_audio_upload_area');
  const previewContainer = document.getElementById('gamaka_audio_preview_container');
  const audioPlayer = document.getElementById('gamaka_audio_preview');
  const filename = document.getElementById('gamaka_audio_filename');
  const pathDisplay = document.getElementById('gamaka_audio_path_display');

  if (audioPath) {
    // Normalize the path - convert absolute paths to relative
    const normalizedPath = normalizePath(audioPath);
    
    if (normalizedPath) {
      // Build full URL from relative path
      const fullUrl = '/static/' + normalizedPath;
      const source = audioPlayer.querySelector('source');
      source.src = fullUrl;
      audioPlayer.load(); // Reload audio element with new source
      
      filename.textContent = authorName || 'ಆಡಿಯೊ';
      pathDisplay.textContent = normalizedPath;
      
      uploadArea.style.display = 'none';
      previewContainer.style.display = 'block';
    } else {
      resetAudioUploadUI();
    }
  } else {
    resetAudioUploadUI();
  }
}

// ================= BULK OPERATIONS =================
async function downloadPadyaTemplate() {
  try {
    // Create a temporary link and trigger download
    const response = await apiClient.get(ApiEndpoints.PADYA.downloadTemplate, {
      responseType: 'blob'
    });
    
    const blob = response;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'padya_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert("ಟೆಂಪ್ಲೇಟ್ ಡೌನ್‌ಲೋಡ್ ಪೂರ್ಣವಾಗಿದೆ", "success");
  } catch (error) {
    showAlert("ಟೆಂಪ್ಲೇಟ್ ಡೌನ್‌ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: " + error.message, "danger");
    console.error("Download template error:", error);
  }
}

async function exportPadyaCSV() {
  try {
    showAlert("ನಿರ್ಯಾತ ಪ್ರಕ್ರಿಯೆ ಚಾಲನೆಯಲ್ಲಿದೆ...", "info");
    
    // Fetch export from backend
    const response = await apiClient.get(ApiEndpoints.PADYA.exportCsv, {
      responseType: 'blob'
    });
    
    // Use default filename
    const blob = response;
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'padya_export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    showAlert("ಪದ್ಯ ನಿರ್ಯಾತಿ ಪೂರ್ಣವಾಗಿದೆ", "success");
  } catch (error) {
    showAlert("ಪದ್ಯ ನಿರ್ಯಾತಿ ವಿಫಲವಾಗಿದೆ: " + error.message, "danger");
    console.error("Export padya error:", error);
  }
}

async function uploadPadyaBulk(event) {
  const file = event.target.files[0];
  
  if (!file) {
    return;
  }
  
  // Validate file type
  const validTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
  const fileExtension = file.name.toLowerCase().split('.').pop();
  
  if (!validTypes.includes(file.type) && !['csv', 'xlsx', 'xls'].includes(fileExtension)) {
    showAlert("ಕೇವಲ CSV ಅಥವಾ Excel ಫೈಲ್ ಸಮರ್ಥಿತವಾಗಿದೆ", "warning");
    event.target.value = '';
    return;
  }
  
  try {
    showStatusMessage("upload_status_message", "ಅಪ್ಲೋಡ್ ಪ್ರಕ್ರಿಯೆ ಚಾಲನೆಯಲ್ಲಿದೆ...", "info");
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Send file to backend
    const result = await apiClient.post(ApiEndpoints.PADYA.uploadBulk, formData);
    
    // Show results
    const message = `ಪದ್ಯ ಸೇರಿಸಲಾಗಿದೆ: ${result.records_created}, ವಿಫಲ: ${result.records_failed}`;
    
    if (result.errors && result.errors.length > 0) {
      console.error("Upload errors:", result.errors);
      showStatusMessage("upload_status_message", message + ` (${result.total_errors} ದೋಷಗಳು)`, "warning");
    } else {
      showStatusMessage("upload_status_message", message, "success");
    }
    
    showAlert(message, result.errors ? "warning" : "success");
    
    // Reload padya list
    setTimeout(() => {
      if (document.getElementById("padya_parva_select").value) {
        loadPadyaList();
      }
    }, 1000);
    
  } catch (error) {
    showStatusMessage("upload_status_message", "ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: " + error.message, "danger");
    showAlert("ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: " + error.message, "danger");
    console.error("Upload error:", error);
  } finally {
    // Clear file input
    event.target.value = '';
  }
}

// ================= BULK UPLOAD MODAL HANDLERS =================
function updateFileSelectionUI(file) {
  const fileInfo = document.getElementById('fileInfo');
  const fileNameSpan = document.getElementById('fileName');
  const confirmBtn = document.getElementById('confirmUploadBtn');
  
  if (file) {
    fileNameSpan.textContent = file.name + ` (${(file.size / 1024).toFixed(2)} KB)`;
    fileInfo.classList.remove('d-none');
    confirmBtn.disabled = false;
  } else {
    fileInfo.classList.add('d-none');
    confirmBtn.disabled = true;
  }
}

async function startBulkUpload() {
  const file = document.getElementById('bulkUploadFile').files[0];
  
  if (!file) {
    showAlert("ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಿ", "warning");
    return;
  }
  
  // Transition to processing step
  showBulkUploadStep(2);
  
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Simulate progress
    const progressBar = document.getElementById('uploadProgressBar');
    const statusText = document.getElementById('statusText');
    let progress = 0;
    const progressInterval = setInterval(() => {
      if (progress < 90) {
        progress += Math.random() * 30;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
        progressBar.textContent = Math.round(progress) + '%';
      }
    }, 500);
    
    statusText.textContent = 'ಸರ್ವರಕ್ಕೆ ಫೈಲ್ ನಿರೀಕ್ಷೆ...';
    
    // Send file to backend
    const result = await apiClient.post(ApiEndpoints.PADYA.uploadBulk, formData);
    clearInterval(progressInterval);
    progressBar.style.width = '100%';
    progressBar.textContent = '100%';
    
    // Update results
    displayBulkUploadResults(result);
    showBulkUploadStep(3);
    
    // Reload padya list after a delay
    setTimeout(() => {
      if (document.getElementById("padya_parva_select").value) {
        loadPadyaList();
      }
    }, 2000);
    
  } catch (error) {
    console.error("Upload error:", error);
    showAlert("ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ: " + error.message, "danger");
    showBulkUploadStep(1);
  }
}

function showBulkUploadStep(step) {
  // Hide all steps
  document.getElementById('bulk-upload-step-1').classList.add('d-none');
  document.getElementById('bulk-upload-step-2').classList.add('d-none');
  document.getElementById('bulk-upload-step-3').classList.add('d-none');
  
  // Hide all footers
  document.getElementById('footer-step-1').classList.add('d-none');
  document.getElementById('footer-step-2').classList.add('d-none');
  document.getElementById('footer-step-3').classList.add('d-none');
  
  // Show selected step
  document.getElementById(`bulk-upload-step-${step}`).classList.remove('d-none');
  document.getElementById(`footer-step-${step}`).classList.remove('d-none');
}

function displayValidationErrors(result) {
  const statusText = document.getElementById('statusText');
  const processingDetails = document.getElementById('processingDetails');
  
  // Update status
  statusText.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2" style="color: #dc3545;"></i>
    <strong>ಪರಿಶೋಧನೆ ವಿಫಲ - ಕೆಳಗೆ ದೋಷಗಳನ್ನು ನೋಡಿ</strong>
  `;
  
  // Show validation errors
  const errorHtml = `
    <div class="alert alert-danger mt-3">
      <h6 class="alert-heading mb-2">
        <i class="bi bi-exclamation-circle me-2"></i>
        ಆವಶ್ಯಕ ಕ್ಷೇತ್ರಗಳು ಯಾವುವು?
      </h6>
      <ul class="mb-0 small">
        <li><strong>parva_number</strong> - ಪರ್ವ ಸಂಖ್ಯೆ (ಆವಶ್ಯಕ, ಖಾಲಿ ಬೇಡ)</li>
        <li><strong>sandhi_number</strong> - ಸಂಧಿ ಸಂಖ್ಯೆ (ಆವಶ್ಯಕ, ಖಾಲಿ ಬೇಡ)</li>
        <li><strong>padya</strong> - ಪದ್ಯದ ಪಠ್ಯ (ಆವಶ್ಯಕ, ಖಾಲಿ ಬೇಡ)</li>
      </ul>
    </div>
    <div class="alert alert-warning mt-2">
      <h6 class="alert-heading mb-2">
        <i class="bi bi-info-circle me-2"></i>
        ಸಿದ್ಧಿ ಈ ದೋಷಗಳು:
      </h6>
      <div class="small" style="max-height: 200px; overflow-y: auto;">
        ${(result.validation_errors || [])
          .map(err => `<div class="mb-1">• ${escapeHtml(err)}</div>`)
          .join('')}
      </div>
      ${result.total_validation_errors > 20 ? `<div class="mt-2 text-muted">... ಮತ್ತು ${result.total_validation_errors - 20} ಇತರ ದೋಷಗಳು</div>` : ''}
    </div>
  `;
  
  processingDetails.innerHTML = errorHtml;
  
  // Add retry button
  const footer = document.getElementById('footer-step-2');
  footer.innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ರದ್ದುಮಾಡಿ</button>
    <button type="button" class="btn btn-warning" onclick="resetBulkUploadModal(); document.getElementById('bulkUploadFile').click();">
      <i class="bi bi-arrow-repeat me-1"></i>ಫೈಲ್ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸು
    </button>
  `;
}

function displayApiError(result) {
  const statusText = document.getElementById('statusText');
  const processingDetails = document.getElementById('processingDetails');
  
  // Update status
  statusText.innerHTML = `
    <i class="bi bi-exclamation-triangle me-2" style="color: #dc3545;"></i>
    <strong>ದೋಷ - ಕೆಳಗೆ ವಿವರಗಳನ್ನು ನೋಡಿ</strong>
  `;
  
  // Extract error message and column info
  const errorMessage = result.error || result.message || 'ಫೈಲ್ ಅಪ್ಲೋಡ್ ವಿಫಲವಾಗಿದೆ';
  const missingColumns = result.missing_columns || [];
  const givenColumns = result.given_columns || [];
  const requiredColumns = result.required_columns || [];
  
  // Build error display
  let errorHtml = `
    <div class="alert alert-danger mt-3">
      <h6 class="alert-heading mb-2">
        <i class="bi bi-exclamation-circle me-2"></i>
        ಸಮಸ್ಯೆ:
      </h6>
      <p class="mb-0">${escapeHtml(errorMessage)}</p>
  `;
  
  // Show given columns if available
  if (givenColumns && givenColumns.length > 0) {
    errorHtml += `
      <div class="mt-2 pt-2 border-top">
        <strong>📋 ನಿಮ್ಮ CSV ನಲ್ಲಿ ಇವೆ:</strong>
        <ul class="mb-0 mt-1 small" style="color: #666;">
          ${givenColumns.map(col => `<li><code>${escapeHtml(col)}</code></li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Show required columns
  if (requiredColumns && requiredColumns.length > 0) {
    errorHtml += `
      <div class="mt-2 pt-2 border-top">
        <strong>✓ ಅಗತ್ಯ ಖಾಲಿ ಮಾಡಬಹುದಾದ ಅಲ್ಲದ ಕ್ಷೇತ್ರಗಳು:</strong>
        <ul class="mb-0 mt-1 small" style="color: #007bff;">
          ${requiredColumns.map(col => `<li><code>${escapeHtml(col)}</code></li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  // Show missing columns if available
  if (missingColumns && missingColumns.length > 0) {
    errorHtml += `
      <div class="mt-2 pt-2 border-top">
        <strong style="color: #dc3545;">✗ ಕಮ್ಮಿ ಕ್ಷೇತ್ರಗಳು:</strong>
        <ul class="mb-0 mt-1 small" style="color: #dc3545;">
          ${missingColumns.map(col => `<li><code>${escapeHtml(col)}</code></li>`).join('')}
        </ul>
      </div>
    `;
  }
  
  errorHtml += `
    </div>
    <div class="alert alert-info mt-2">
      <h6 class="alert-heading mb-2">
        <i class="bi bi-info-circle me-2"></i>
        ಹಿಂಟು:
      </h6>
      <ul class="mb-0 small">
        <li><strong>parva_number</strong> - ಪರ್ವ ಸಂಖ್ಯೆ</li>
        <li><strong>sandhi_number</strong> - ಸಂಧಿ ಸಂಖ್ಯೆ</li>
        <li><strong>padya</strong> - ಪದ್ಯದ ಪಠ್ಯ</li>
      </ul>
    </div>
  `;
  
  processingDetails.innerHTML = errorHtml;
  
  // Add retry button
  const footer = document.getElementById('footer-step-2');
  footer.innerHTML = `
    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">ರದ್ದುಮಾಡಿ</button>
    <button type="button" class="btn btn-danger" onclick="resetBulkUploadModal(); document.getElementById('bulkUploadFile').click();">
      <i class="bi bi-arrow-repeat me-1"></i>ಮತ್ತೆ ಪ್ರಯತ್ನಿಸು
    </button>
  `;
}

function displayBulkUploadResults(result) {
  const resultAlert = document.getElementById('resultAlert');
  const resultTitle = document.getElementById('resultTitle');
  const errorDetails = document.getElementById('errorDetails');
  
  // Update result counts
  document.getElementById('resultCreated').textContent = result.records_created || 0;
  document.getElementById('resultUpdated').textContent = result.records_updated || 0;
  document.getElementById('resultFailed').textContent = result.records_failed || 0;
  document.getElementById('resultParvasCreated').textContent = result.parvas_created || 0;
  document.getElementById('resultSandhisCreated').textContent = result.sandhis_created || 0;
  
  // Determine result type
  const hasErrors = (result.records_failed || 0) > 0;
  const isSuccess = (result.records_failed || 0) === 0;
  
  if (isSuccess) {
    resultAlert.className = 'alert alert-success';
    resultTitle.innerHTML = '<i class="bi bi-check-circle me-2"></i>ಅಪ್ಲೋಡ್ ಯಶಸ್ವಿ!';
  } else if (hasErrors) {
    resultAlert.className = 'alert alert-warning';
    resultTitle.innerHTML = '<i class="bi bi-exclamation-triangle me-2"></i>ಅಪ್ಲೋಡ್ ಆಂಶಿಕವಾಗಿ ಸಮೀಪವಾಗಿದೆ';
  }
  
  // Show error details if any
  if (result.errors && result.errors.length > 0) {
    errorDetails.classList.remove('d-none');
    const errorList = document.getElementById('errorList');
    errorList.innerHTML = result.errors
      .map(err => `<div class="mb-1">• ${escapeHtml(err)}</div>`)
      .join('');
  } else {
    errorDetails.classList.add('d-none');
  }
}

function showStatusMessage(elementId, message, type) {
  const container = document.getElementById(elementId);
  if (!container) return;
  
  const textElement = document.getElementById(elementId.replace('_message', '_text'));
  if (textElement) {
    textElement.textContent = message;
  }
  
  // Update alert class
  container.className = `alert d-block`;
  container.classList.add(`alert-${type}`);
}

function resetBulkUploadModal() {
  // Reset to step 1
  showBulkUploadStep(1);
  
  // Clear file input
  document.getElementById('bulkUploadFile').value = '';
  document.getElementById('fileInfo').classList.add('d-none');
  document.getElementById('confirmUploadBtn').disabled = true;
  
  // Reset progress bar
  const progressBar = document.getElementById('uploadProgressBar');
  progressBar.style.width = '0%';
  progressBar.textContent = '0%';
  
  // Reset status
  document.getElementById('statusText').textContent = 'ಅಪ್ಲೋಡ್ ಪ್ರಾರಂಭವಾಗುತ್ತಿದೆ...';
}

// ================= DELETE OPERATIONS =================
function handleDelete(type, id, parvaId, sandhiId) {
  const ids = { type, id };
  if (parvaId) ids.parvaId = parvaId;
  if (sandhiId) ids.sandhiId = sandhiId;

  if (!id) {
    showAlert("Invalid ID - cannot delete", "danger");
    console.error("Delete attempted with invalid ID:", ids);
    return;
  }

  state.deleteAction = async () => {
    try {
      let endpoint = `/${type}/${id}`;
      
      if (type === 'sandhi') {
        endpoint = `/${type}/${parvaId}/${id}`;
      } else if (type === 'padya') {
        endpoint = `/${type}/${parvaId}/${sandhiId}/${id}`;
      }

      await apiRequest(endpoint, { method: "DELETE" });

      showAlert(`${type.charAt(0).toUpperCase() + type.slice(1)} ಅಳಿಸಲಾಗಿದೆ`, "success");
      
      // Refresh current view
      switch (type) {
        case 'parva':
          loadParvas();
          break;
        case 'sandhi':
          loadSandhisByParva();
          break;
        case 'padya':
          loadPadyaList();
          break;
      }
    } catch (error) {
      console.error("Delete error:", error);
      showAlert(`Delete failed: ${error.message}`, "danger");
    }
  };

  state.modals.deleteConfirmModal?.show();
}

async function confirmDelete() {
  if (state.deleteAction) {
    await state.deleteAction();
  }
  state.modals.deleteConfirmModal?.hide();
  state.deleteAction = null;
}


// ================= USER MANAGEMENT OPERATIONS =================



async function loadUsers() {
  const tableBody = document.getElementById('users_table');

  try {

    const response = await apiRequest(
      ApiEndpoints.USERS.list,
      { method: 'GET' }
    );

    console.log("Users API response:", response);

    // Backend returns array directly
    let users = [];

    if (Array.isArray(response)) {
      users = response;
    } 
    else if (response && Array.isArray(response.data)) {
      users = response.data;
    }

    tableBody.innerHTML = '';

    if (!users || users.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="5"
              class="text-center text-muted py-4">
            ಯಾವುದೇ ಬಳಕೆದಾರರು ಕಂಡುಬಂದಿಲ್ಲ
          </td>
        </tr>
      `;
      return;
    }

    users.forEach(user => {

      const row = document.createElement('tr');

      let actionButtons = '';

      if (user.is_default) {

        actionButtons = `
          <button
            class="btn btn-sm btn-secondary"
            title="ಡಿಫಾಲ್ಟ ಬಳಕೆದಾರ"
            disabled>
            <i class="bi bi-lock me-1"></i>
            ಸುರಕ್ಷಿತ
          </button>
        `;

      } else {
actionButtons = `
  <button
    type="button"
    class="btn btn-sm btn-info me-1"
    onclick="openUserEditModal('${user.username}')"
    title="ಸಂಪಾದಿಸಿ">
    <i class="bi bi-pencil"></i>
  </button>

  <button
    type="button"
    class="btn btn-sm btn-danger"
    onclick="openUserDeleteConfirmModal('${user.username}')"
    title="ಅಳಿಸಿ">
    <i class="bi bi-trash"></i>
  </button>
`;
      }

      row.innerHTML = `
        <td>
          <strong>
            ${escapeHtml(user.username)}
          </strong>

          ${
            user.is_default
              ? '<span class="default-user-badge ms-2">ಡಿಫಾಲ್ಟ</span>'
              : ''
          }
        </td>

        <td>
          ${
            user.email
              ? escapeHtml(user.email)
              : '<span class="text-muted">-</span>'
          }
        </td>

        <td>
          ${
            user.phone_number
              ? escapeHtml(user.phone_number)
              : '<span class="text-muted">-</span>'
          }
        </td>

        <td class="text-center">
          <span class="badge ${
            user.is_default
              ? 'bg-warning'
              : 'bg-success'
          }">
            ${
              user.is_default
                ? 'ನಿರ್ವಾಹಕ'
                : 'ಸಕ್ರಿಯ'
            }
          </span>
        </td>

        <td class="text-center">
          ${actionButtons}
        </td>
      `;

      tableBody.appendChild(row);

    });

  } catch (error) {

    console.error("Load users error:", error);

    tableBody.innerHTML = `
      <tr>
        <td colspan="5"
            class="text-center text-danger py-4">
          ಬಳಕೆದಾರರನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲ
        </td>
      </tr>
    `;

    showAlert(
      error.message || 'ಬಳಕೆದಾರರನ್ನು ಲೋಡ್ ಮಾಡಲು ವಿಫಲ',
      'danger'
    );

  }
}




/**
 * Handle user search
 */
function handleUserSearch() {
  const searchInput = document.getElementById('user_search').value.toLowerCase();
  const tableRows = document.querySelectorAll('#users_table tr');
  
  tableRows.forEach(row => {
    if (tableRows.length === 1 && row.querySelector('td')?.colSpan) {
      // Skip the "no users" message row
      return;
    }
    
    const username = row.cells[0]?.textContent.toLowerCase() || '';
    const email = row.cells[1]?.textContent.toLowerCase() || '';
    const phone = row.cells[2]?.textContent.toLowerCase() || '';
    
    const matches = username.includes(searchInput) || 
                   email.includes(searchInput) || 
                   phone.includes(searchInput);
    
    row.style.display = matches ? '' : 'none';
  });
}

/**
 * Open user creation modal
 */
function openUserModal() {
  // Reset form
  document.getElementById('modal_user_username').value = '';
  document.getElementById('modal_user_email').value = '';
  document.getElementById('modal_user_phone').value = '';
  document.getElementById('modal_user_password').value = '';
  document.getElementById('userModalError').classList.add('d-none');
  document.getElementById('modal_user_password').type = 'password';
  document.getElementById('togglePasswordBtn').innerHTML = '<i class="bi bi-eye"></i>';
  
  state.modals.userModal?.show();
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  
  if (input.type === 'password') {
    input.type = 'text';
    button.innerHTML = '<i class="bi bi-eye-slash"></i>';
  } else {
    input.type = 'password';
    button.innerHTML = '<i class="bi bi-eye"></i>';
  }
}

/**
 * Save new user
 */
async function saveUser() {
  const username = document.getElementById('modal_user_username').value.trim();
  const email = document.getElementById('modal_user_email').value.trim();
  const phone = document.getElementById('modal_user_phone').value.trim();
  const password = document.getElementById('modal_user_password').value.trim();
  const errorDiv = document.getElementById('userModalError');
  
  // Validate
  if (!username) {
    showModalError(errorDiv, 'ಬಳಕೆದಾರ ಹೆಸರು ಅಗತ್ಯ');
    return;
  }
  
  if (!email) {
    showModalError(errorDiv, 'ಇಮೇಲ್ ಅಗತ್ಯ');
    return;
  }
  
  if (!password) {
    showModalError(errorDiv, 'ಪಾಸ್‌ವರ್ಡ್ ಅಗತ್ಯ');
    return;
  }
  
  try {
    const saveBtn = document.getElementById('save-user-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>ಸೇರಿಸುತ್ತಿದೆ...';
    
    const response = await apiRequest(ApiEndpoints.USERS.create, {
      method: 'POST',
      body: {
        username,
        email,
        phone_number: phone || null,
        password
      }
    });
    
    showAlert('ಬಳಕೆದಾರ ಯಶಸ್ವಿಯಾಗಿ ಸೃಷ್ಟಿಸಲಾಗಿದೆ', 'success');
    state.modals.userModal?.hide();
    await loadUsers();
    
  } catch (error) {
    showModalError(errorDiv, error.message || 'ಬಳಕೆದಾರ ರಚನೆ ವಿಫಲ');
  } finally {
    const saveBtn = document.getElementById('save-user-btn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>ಸೇರಿಸಿ';
  }
}

/**
 * Open user edit modal
 */
async function openUserEditModal(username) {
  try {
    const user = await apiRequest(ApiEndpoints.USERS.get(username), { method: 'GET' });
    
    document.getElementById('modal_edit_user_username').value = username;
    document.getElementById('edit_user_display_name').textContent = username;
    document.getElementById('modal_edit_user_email').value = user.email || '';
    document.getElementById('modal_edit_user_phone').value = user.phone_number || '';
    document.getElementById('modal_edit_user_password').value = '';
    document.getElementById('userEditModalError').classList.add('d-none');
    document.getElementById('modal_edit_user_password').type = 'password';
    document.getElementById('toggleEditPasswordBtn').innerHTML = '<i class="bi bi-eye"></i>';
    
    state.modals.userEditModal?.show();
  } catch (error) {
    showAlert(`ಬಳಕೆದಾರ ಡೇಟಾ ಲೋಡ್ ವಿಫಲ: ${error.message}`, 'danger');
  }
}

/**
 * Save user edits
 */
async function saveUserEdit() {
  const username = document.getElementById('modal_edit_user_username').value;
  const email = document.getElementById('modal_edit_user_email').value.trim();
  const phone = document.getElementById('modal_edit_user_phone').value.trim();
  const password = document.getElementById('modal_edit_user_password').value.trim();
  const errorDiv = document.getElementById('userEditModalError');
  
  // Validate
  if (!email) {
    showModalError(errorDiv, 'ಇಮೇಲ್ ಅಗತ್ಯ');
    return;
  }
  
  try {
    const saveBtn = document.getElementById('save-user-edit-btn');
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>ಅಪ್‌ಡೇಟ್ ಮಾಡುತ್ತಿದೆ...';
    
    const body = {
      email,
      phone_number: phone || null
    };
    
    if (password) {
      body.password = password;
    }
    
    await apiRequest(ApiEndpoints.USERS.update(username), {
      method: 'PUT',
      body
    });
    
    showAlert('ಬಳಕೆದಾರ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಡೇಟ್ ಮಾಡಲಾಗಿದೆ', 'success');
    state.modals.userEditModal?.hide();
    await loadUsers();
    
  } catch (error) {
    showModalError(errorDiv, error.message || 'ಬಳಕೆದಾರ ಅಪ್‌ಡೇಟ್ ವಿಫಲ');
  } finally {
    const saveBtn = document.getElementById('save-user-edit-btn');
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i>ಅಪ್‌ಡೇಟ್ ಮಾಡಿ';
  }
}

/**
 * Open user delete confirmation modal
 */
function openUserDeleteConfirmModal(username) {
  document.getElementById('delete_user_display_name').textContent = username;
  document.getElementById('delete_user_username').value = username;
  state.modals.userDeleteConfirmModal?.show();
}

/**
 * Confirm user deletion
 */
async function confirmUserDelete() {
  const username = document.getElementById('delete_user_username').value;
  
  if (!username) {
    showAlert('Invalid username', 'danger');
    return;
  }
  
  try {
    const btn = document.getElementById('confirm-user-delete-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>ಅಳಿಸುತ್ತಿದೆ...';
    
    await apiRequest(ApiEndpoints.USERS.delete(username), { method: 'DELETE' });
    
    showAlert('ಬಳಕೆದಾರ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ', 'success');
    state.modals.userDeleteConfirmModal?.hide();
    await loadUsers();
    
  } catch (error) {
    showAlert(`ಬಳಕೆದಾರ ಅಳಿಸುವಿಕೆ ವಿಫಲ: ${error.message}`, 'danger');
  } finally {
    const btn = document.getElementById('confirm-user-delete-btn');
    btn.disabled = false;
    btn.innerHTML = '<i class="bi bi-trash me-1"></i>ಅಳಿಸಿ';
  }
}

/**
 * Helper function to show modal errors
 */
function showModalError(errorDiv, message) {
  errorDiv.textContent = message;
  errorDiv.classList.remove('d-none');
}

// ================= EXPOSE TO GLOBAL SCOPE =================
// Since this file is loaded as ES6 module, expose functions to window object
// for inline onclick handlers in HTML
window.openUserModal = openUserModal;
window.openUserEditModal = openUserEditModal;
window.openUserDeleteConfirmModal = openUserDeleteConfirmModal;
window.saveUser = saveUser;
window.saveUserEdit = saveUserEdit;
window.confirmUserDelete = confirmUserDelete;
window.togglePasswordVisibility = togglePasswordVisibility;
