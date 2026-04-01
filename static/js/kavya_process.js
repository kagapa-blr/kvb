// Simplified Kavya Process - Clean version
// Core functionality only: Load padya data, display with gamaka metadata

// ============================================
// GLOBAL API CLIENT CHECK
// ============================================

const apiClient = window.ApiClient;

if (!apiClient) {
    console.error('[Kavya Process] ApiClient not initialized. Ensure restclient.js is loaded first.');
}

// Set API base URL
if (apiClient && !apiClient.defaults?.baseURL) {
  apiClient.setBaseUrl("/api/v1");
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize file paths - convert absolute paths to relative paths
 */
function normalizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    return null;
  }

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

function getStaticUrl(path) {
  const basePath = window.location.pathname.includes('/kvb/') ? '/kvb' : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}/static/${cleanPath}`;
}

function extractData(response) {
  return (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = "flex";
}

function hideLoading() {
  const el = document.getElementById("loadingOverlay");
  if (el) el.style.display = "none";
}

// Get all characters from a line
function getallcharsByline(line) {
  var k = line;
  var parts = k.split("");
  arr = [];
  for (var i = 0; i < parts.length; i++) {
    var s = k.charAt(i);

    // while the next char is not a swara/vyanjana or previous char was a virama
    while (
      (i + 1 < k.length && k.charCodeAt(i + 1) < 0xc85) ||
      k.charCodeAt(i + 1) > 0xcb9 ||
      k.charCodeAt(i) == 0xccd
    ) {
      s += k.charAt(i + 1);
      i++;
    }
    arr.push(s);
  }

  return arr;
}

// Highlight first occurrence of a character in the input string
function highlightFirstOccurrence(inputString, charToHighlight) {
  if (!charToHighlight || charToHighlight === " ") {
    return inputString;
  }

  const regex = new RegExp(charToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  return inputString.replace(regex, match => {
    return `<span style="color: #f03c3c; font-weight: bold;">${match}</span>`;
  });
}

// ============================================
// API WRAPPER
// ============================================

async function apiRequest(endpoint, options = {}) {
  try {
    const config = {
      url: endpoint,
      method: (options.method || "GET").toLowerCase(),
    };

    if (options.body) config.data = options.body;
    if (options.params) config.params = options.params;

    const result = await apiClient.request(config);

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

// ============================================
// MAIN CODE
// ============================================

$(document).ready(function () {
  let parvaDataCache = {};
  let sandhiDataCache = {};

  const $padyaNumberDropdown = $("#padyaNumberDropdown");
  const $audioElement = $("#audio")[0];
  const $audioSource = $("#audio source");

  // Populate Dropdown
  function populateDropdown(selector, data, valueKey, textKey) {
    const $dropdown = $(selector);
    $dropdown.empty();
    const items = extractData(data);
    items.forEach((item) => {
      $dropdown.append($("<option>", {
        value: item[valueKey],
        text: item[textKey],
      }));
    });
  }

  // Format text for display
  function formatText(text) {
    return text ? text.replace(/\n/g, "<br>") : "";
  }

  // Format padya with second character highlighting
  function formatPadyaText(text) {
    if (!text) return "";
    return text.split("\n").map(line => {
      const charList = getallcharsByline(line);
      const secondCharToHighlight = charList[1] || "";
      return highlightFirstOccurrence(line, secondCharToHighlight);
    }).join("<br>");
  }

  // Fetch Parva data and populate dropdown
  async function loadParva() {
    showLoading();
    try {
      const response = await apiRequest("/parva");
      const data = extractData(response.data);
      populateDropdown("#parvaDropdown", data, "id", "name");
      
      parvaDataCache = data.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});

      if (data.length > 0) {
        $("#parvaDropdown").val(data[0].id).change();
      }
    } catch (e) {
      console.error("Error loading Parva:", e);
      $("#parvaDropdown").html("<option>Error loading Parva data</option>");
    } finally {
      hideLoading();
    }
  }

  // Fetch Sandhi data for selected Parva
  async function loadSandhi(parvaNumber) {
    try {
      const response = await apiRequest(`/sandhi/by_parva/${parvaNumber}`);
      const data = extractData(response.data);
      populateDropdown("#sandhiDropdown", data, "id", "name");
      $("#sandhiDropdown").prop("disabled", false);
      $padyaNumberDropdown.prop("disabled", true).empty();
      
      sandhiDataCache = data.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {});

      if (data.length > 0) {
        $("#sandhiDropdown").val(data[0].id).change();
      }
    } catch (e) {
      console.error("Error loading Sandhi:", e);
      $("#sandhiDropdown").prop("disabled", true).html("<option>Error loading Sandhi data</option>");
    }
  }

  // Fetch Padya numbers for selected Sandhi
  async function loadPadyas(sandhiId) {
    try {
      const sandhi = sandhiDataCache[sandhiId];
      if (!sandhi) return;

      // Fetch padya numbers for this sandhi (optimized endpoint - returns only numbers)
      const response = await apiRequest(`/padya/numbers/by_sandhi/${sandhiId}`);
      
      const padyaNumbers = response.data.padya_numbers || [];
      
      if (padyaNumbers.length > 0) {
        populateDropdown(
          "#padyaNumberDropdown",
          padyaNumbers.map(num => ({ padya_number: num, padya_number: num })),
          "padya_number",
          "padya_number"
        );
        $padyaNumberDropdown.prop("disabled", false);
        $padyaNumberDropdown.val(padyaNumbers[0]).change();
      } else {
        $padyaNumberDropdown.prop("disabled", true).empty();
      }
    } catch (e) {
      console.error("Error loading Padyas:", e);
      $padyaNumberDropdown.prop("disabled", true).html("<option>Error loading Padya data</option>");
    }
  }

  // Parva dropdown change handler
  $("#parvaDropdown").change(debounce(async function () {
    const parva = parvaDataCache[$(this).val()];
    if (parva) {
      await loadSandhi(parva.parva_number);
    }
  }, 300));

  // Sandhi dropdown change handler
  $("#sandhiDropdown").change(debounce(async function () {
    const sandhiId = $(this).val();
    if (sandhiId) {
      await loadPadyas(sandhiId);
    }
  }, 300));

  // Padya dropdown change handler - Load padya content
  $padyaNumberDropdown.change(debounce(async function () {
    const parva = parvaDataCache[$("#parvaDropdown").val()];
    const sandhi = sandhiDataCache[$("#sandhiDropdown").val()];
    const padyaNumber = $(this).val();

    if (!parva || !sandhi || !padyaNumber) {
      return;
    }

    showLoading();
    try {
      const response = await apiRequest(
        `/padya/${parva.parva_number}/${sandhi.sandhi_number}/${padyaNumber}`
      );

      const data = response.data;
      
      // Update padya content
      $(".padya").html(formatPadyaText(data.padya));
      $(".pathantar").html(formatText(data.pathantar));
      $(".gadya").html(formatText(data.gadya));
      $(".artha").html(formatText(data.artha));
      $(".tippani").html(formatText(data.tippani));
      
      // Update gamaka metadata (photo, singer, raga, audio)
      if (data.gamaka_vachana && data.gamaka_vachana.length > 0) {
        updateGamakaMetadata(data.gamaka_vachana);
      } else {
        clearGamakaMetadata();
      }
    } catch (e) {
      console.error("Error loading Padya:", e);
      clearGamakaMetadata();
    } finally {
      hideLoading();
    }
  }, 300));

  // Update gamaka metadata - singer photo, name, raga, audio
  function updateGamakaMetadata(gamakaArray) {
    if (!gamakaArray || gamakaArray.length === 0) {
      clearGamakaMetadata();
      return;
    }

    const gamaka = gamakaArray[0];

    // Set photo
    if (gamaka.gamaka_vachakar_photo_path) {
      const photoPath = normalizePath(gamaka.gamaka_vachakar_photo_path);
      if (photoPath) {
        $('#singerPhoto').attr('src', getStaticUrl(photoPath));
      }
    }

    // Set singer name
    if (gamaka.gamaka_vachakara_name) {
      $('#singerName').text(gamaka.gamaka_vachakara_name);
    }

    // Set raga
    if (gamaka.raga) {
      $('#ragaName').html(`${gamaka.raga} <span style="font-size: 0.9em;">ರಾಗ</span>`);
    }

    // Set audio
    if (gamaka.gamaka_vachakar_audio_path) {
      const audioPath = normalizePath(gamaka.gamaka_vachakar_audio_path);
      if (audioPath) {
        $audioSource.attr('src', getStaticUrl(audioPath));
        if ($audioElement) $audioElement.load();
      }
    }
  }

  // Clear gamaka metadata
  function clearGamakaMetadata() {
    $('#singerPhoto').attr('src', '');
    $('#singerName').text('');
    $('#ragaName').text('');
    $audioSource.attr('src', '');
    if ($audioElement) $audioElement.load();
  }

  // Navigation buttons
  function updateDropdown(newValue) {
    $padyaNumberDropdown.val(newValue).change();
  }

  $("#prevPadya").click(function () {
    const idx = $padyaNumberDropdown.prop("selectedIndex");
    if (idx > 0) {
      const prevVal = $padyaNumberDropdown.find("option").eq(idx - 1).val();
      updateDropdown(prevVal);
    }
  });

  $("#nextPadya").click(function () {
    const idx = $padyaNumberDropdown.prop("selectedIndex");
    const total = $padyaNumberDropdown.find("option").length;
    if (idx < total - 1) {
      const nextVal = $padyaNumberDropdown.find("option").eq(idx + 1).val();
      updateDropdown(nextVal);
    }
  });

  // Initialize - Wait for ApiClient and ApiEndpoints
  const initCheck = setInterval(() => {
    if (typeof window.ApiClient !== 'undefined' && 
        typeof window.ApiClient.get === 'function' &&
        typeof window.ApiEndpoints !== 'undefined' &&
        typeof window.ApiEndpoints.PARVA !== 'undefined') {
      clearInterval(initCheck);
      loadParva();
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => clearInterval(initCheck), 10000);
});
