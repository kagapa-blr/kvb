import apiClient from "./restclient.js";

// ================= CONFIG =================
apiClient.setBaseUrl("/api/v1");
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

// ================= INIT =================
document.addEventListener("DOMContentLoaded", async () => {
  initializeModals();
  initializeEventListeners();
  initializeTabs();
  await loadParvas();
});

// ================= MODAL INITIALIZATION =================
function initializeModals() {
  const modalIds = ['parvaModal', 'sandhiModal', 'padyaModal', 'deleteConfirmModal'];
  
  modalIds.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      state.modals[id] = new bootstrap.Modal(element);
      
      // Sandhi modal dropdown population
      if (id === 'sandhiModal') {
        element.addEventListener('show.bs.modal', populateSandhiModalDropdowns);
      }
      
      // Padya modal dropdown population
      if (id === 'padyaModal') {
        element.addEventListener('show.bs.modal', populatePadyaModalDropdowns);
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
  
  // Padya modal parva selection change
  document.getElementById('padya_parva_select_modal')?.addEventListener('change', async () => {
    const parvaNumber = document.getElementById('padya_parva_select_modal').value;
    const sandhiDropdown = document.getElementById('padya_sandhi_select_modal');
    sandhiDropdown.innerHTML = `<option value="">ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>`;
    
    if (parvaNumber) {
      try {
        const sandhiResult = await apiRequest(`/sandhi/by_parva/${parvaNumber}`);
        sandhiResult.data.forEach(s => {
          const sandhiNum = s.sandhi_number || s.id || '';
          if (sandhiNum) {
            sandhiDropdown.innerHTML += `<option value="${sandhiNum}">${escapeHtml(s.name || '')}</option>`;
          }
        });
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
        const parvaResult = await apiRequest("/parva", { params: { offset: 0, limit: 100 } });
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
  ['parva_search', 'sandhi_search', 'padya_search'].forEach(id => {
    document.getElementById(id)?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const btnId = id.replace('_search', '-search-btn');
        document.getElementById(btnId)?.click();
      }
    });
  });
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
    const result = await apiRequest(`/parva/${parvaNumber}`);
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
    await apiRequest(`/parva/${parvaNumber}`, { method: "DELETE" });
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

    const result = await apiRequest("/parva", {
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
      await apiRequest(`/parva/${parvaNumber}`, {
        method: "PUT",
        body: { name },
      });
      showAlert("ಪರ್ವ ನವೀಕರಿಸಲಾಗಿದೆ", "success");
    } else {
      // Create new parva
      await apiRequest("/parva", {
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
    const result = await apiRequest("/parva", {
      params: { offset: 0, limit: 100 },
    });

    // Filter on client-side
    let filtered = result.data;
    if (searchTerm) {
      filtered = result.data.filter(p => 
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    const result = await apiRequest(`/sandhi/${parvaNumber}/${sandhiNumber}`);
    const sandhi = result.data;

    // Populate modal for edit
    document.getElementById("sandhi_name").value = sandhi.name || '';
    document.getElementById("sandhi_name").dataset.parvaNumber = parvaNumber;
    document.getElementById("sandhi_name").dataset.sandhiNumber = sandhiNumber;
    
    // Populate parva dropdown (for display only in edit mode)
    const parvaResult = await apiRequest("/parva", { params: { offset: 0, limit: 100 } });
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
    await apiRequest(`/sandhi/${parvaNumber}/${sandhiNumber}`, { 
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

    const result = await apiRequest(`/sandhi/by_parva/${parvaNumber}`);
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
      await apiRequest(`/sandhi/${parvaNumber}/${sandhiNumber}`, {
        method: "PUT",
        body: { name },
      });
      showAlert("ಸಂಧಿ ನವೀಕರಿಸಲಾಗಿದೆ", "success");
    } else {
      // Create new sandhi
      await apiRequest("/sandhi", {
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
    
    // If search term provided, need to filter manually or use API search if available
    const result = await apiRequest(`/sandhi/by_parva/${parvaNumber}`, { params });

    // Filter on client-side if needed
    let filtered = result.data;
    if (searchTerm) {
      filtered = result.data.filter(s => 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
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
    const result = await apiRequest(`/sandhi/by_parva/${parvaNumber}`);
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

    const result = await apiRequest("/padya/search", { params });

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
      <td>${padyaNumber}</td>
      <td class="text-truncate" style="max-width: 300px;" title="${escapeHtml(fullText)}">
        <small class="text-muted">${escapeHtml(preview)}</small>
      </td>
      <td>
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
    const parvaResult = await apiRequest("/parva", { params: { offset: 0, limit: 100 } });
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
    const parvaResult = await apiRequest("/parva", { params: { offset: 0, limit: 100 } });
    const parvaDropdown = document.getElementById("padya_parva_select_modal");
    parvaDropdown.innerHTML = `<option value="">ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;
    
    parvaResult.data.forEach(p => {
      const parvaNumber = p.parva_number || p.id || '';
      if (parvaNumber) {
        parvaDropdown.innerHTML += `<option value="${parvaNumber}">${escapeHtml(p.name || '')}</option>`;
      }
    });
    
    // Reset sandhi dropdown
    document.getElementById("padya_sandhi_select_modal").innerHTML = `<option value="">ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>`;

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
    let endpoint = "/padya";
    
    if (padyaNumber) {
      // Update existing - need parva_number, sandhi_number, padya_number
      endpoint = `/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`;
    }

    await apiRequest(endpoint, {
      method: method,
      body: { 
        parva_number: parseInt(parvaNumber), 
        sandhi_number: parseInt(sandhiNumber),
        padya: padyaText,
        artha: document.getElementById("modal_padya_artha")?.value.trim() || null,
        tippani: document.getElementById("modal_padya_tippani")?.value.trim() || null,
        gadya: document.getElementById("modal_padya_gadya")?.value.trim() || null,
        suchane: document.getElementById("modal_padya_suchane")?.value.trim() || null,
        pathantar: document.getElementById("modal_padya_pathantar")?.value.trim() || null,
      },
    });

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
  
  // Clear hidden fields
  document.getElementById("modal_padya_id").value = "";
  document.getElementById("modal_padya_parva_number").value = "";
  document.getElementById("modal_padya_sandhi_number").value = "";
  
  document.getElementById("padyaModalTitle").textContent = "ಹೊಸ ಪದ್ಯ ಸೇರಿಸಿ";
  document.getElementById("save-padya-btn").textContent = "ಸೇರಿಸಿ";
  document.getElementById("padya_parva_select_modal").value = "";
  document.getElementById("padya_sandhi_select_modal").value = "";
  document.getElementById("modal_padya_text").value = "";
  document.getElementById("modal_padya_artha").value = "";
  document.getElementById("modal_padya_tippani").value = "";
  document.getElementById("modal_padya_gadya").value = "";
  document.getElementById("modal_padya_suchane").value = "";
  document.getElementById("modal_padya_pathantar").value = "";
}

async function editPadya(parvaNumber, sandhiNumber, padyaNumber) {
  try {
    // Fetch the full padya record with complete details
    const result = await apiRequest(`/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`);
    const padya = result.data;

    // Show display mode (for editing)
    document.getElementById("padya_select_mode").style.display = "none";
    document.getElementById("padya_display_mode").style.display = "block";
    
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
    await apiRequest(`/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`, { 
      method: "DELETE" 
    });

    showAlert("ಪದ್ಯ ಅಳಿಸಲಾಗಿದೆ", "success");
    loadPadyaList();
  } catch (error) {
    showAlert("ಪದ್ಯ ಅಳಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ: " + error.message, "danger");
    console.error("Delete padya error:", error);
  }
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