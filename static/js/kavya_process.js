/**
 * Kavya Process - Modern ES6 Module
 * Loads and displays padya data with gamaka metadata
 * 
 * Usage: import into test.html via ES6 module
 */

import { apiClient } from './restclient.js';
import { ApiEndpoints } from './endpoints.js';

console.log('[KavyaProcess] ✓ Module initialized with apiClient');

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Normalize file paths - convert absolute paths to relative paths
 */
function normalizePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    console.warn('[KavyaProcess] Invalid path:', filePath);
    return null;
  }

  const normalizedPath = filePath.replace(/\\/g, '/'); // Convert backslashes to forward slashes
  
  // If already relative (starts with photos/ or audio/), return as is
  if (normalizedPath.startsWith('photos/') || normalizedPath.startsWith('audio/')) {
    console.log('[KavyaProcess] Path already relative:', normalizedPath);
    return normalizedPath;
  }
  
  // Extract relative path from absolute paths
  // Match patterns like: C:\path\to\photos\gamakaPhotos\file.jpg or similar
  const photoMatch = normalizedPath.match(/photos\/gamakaPhotos\/.+/i);
  if (photoMatch) {
    console.log('[KavyaProcess] Photo path extracted:', photoMatch[0]);
    return photoMatch[0];
  }
  
  const audioMatch = normalizedPath.match(/audio\/gamakaAudio\/.+/i);
  if (audioMatch) {
    console.log('[KavyaProcess] Audio path extracted:', audioMatch[0]);
    return audioMatch[0];
  }
  
  // If it looks like a filename or relative path, use it as is
  if (!normalizedPath.includes(':\\') && !normalizedPath.startsWith('/')) {
    console.log('[KavyaProcess] Path treated as relative:', normalizedPath);
    return normalizedPath;
  }
  
  console.warn('[KavyaProcess] Could not normalize path:', filePath);
  return null;
}

function getStaticUrl(path) {
  if (!path) {
    console.warn('[KavyaProcess] getStaticUrl called with empty path');
    return '';
  }
  
  // If path is already a complete URL, return it
  if (path.startsWith('http://') || path.startsWith('https://')) {
    console.log('[KavyaProcess] Path is complete URL:', path);
    return path;
  }
  
  // Detect base path from current location
  const basePath = window.location.pathname.includes('/kvb/') ? '/kvb' : '';
  
  // If path already includes /static/, don't add it again
  if (path.includes('/static/')) {
    console.log('[KavyaProcess] Path already has /static/ prefix');
    return basePath + path;
  }
  
  // Build the full URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${basePath}/static${cleanPath}`;
  console.log('[KavyaProcess] Built static URL - base:', basePath, 'path:', cleanPath, 'full:', fullUrl);
  return fullUrl;
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
  var arr = [];
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
  const $singerPhoto = $("#singerPhoto");

  // Add error handlers for debugging
  if ($audioElement) {
    $audioElement.addEventListener('error', function(e) {
      console.error('[KavyaProcess] Audio loading error:', e);
    });
    $audioElement.addEventListener('loadstart', function() {
      console.log('[KavyaProcess] Audio loading started');
    });
    $audioElement.addEventListener('loadedmetadata', function() {
      console.log('[KavyaProcess] Audio metadata loaded');
    });
  }
  
  if ($singerPhoto.length) {
    $singerPhoto.on('error', function() {
      console.error('[KavyaProcess] Photo loading error:', this.src);
    });
    $singerPhoto.on('load', function() {
      console.log('[KavyaProcess] Photo loaded successfully:', this.src);
    });
  }

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
      const response = await apiRequest(ApiEndpoints.PARVA.list);
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
      const response = await apiRequest(ApiEndpoints.SANDHI.byParva(parvaNumber));
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
      const response = await apiRequest(ApiEndpoints.PADYA.numbersBySandhi(sandhiId));
      
      const padyaNumbers = response.data.padya_numbers || [];
      
      if (padyaNumbers.length > 0) {
        populateDropdown(
          "#padyaNumberDropdown",
          padyaNumbers.map(num => ({ padya_number: num, display: num })),
          "padya_number",
          "display"
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
        ApiEndpoints.PADYA.get(parva.parva_number, sandhi.sandhi_number, padyaNumber)
      );

      const data = response.data;
      
      // Update padya content
      $(".padya").html(formatPadyaText(data.padya));
      $(".pathantar").html(formatText(data.pathantar));
      $(".gadya").html(formatText(data.gadya));
      $(".artha").html(formatText(data.artha));
      $(".tippani").html(formatText(data.tippani));
      
      // Update gamaka metadata (photo, singer, raga, audio)
      console.log('[KavyaProcess] Padya response data:', data);
      if (data.gamaka_vachana && data.gamaka_vachana.length > 0) {
        console.log('[KavyaProcess] Found gamaka_vachana data, updating metadata');
        updateGamakaMetadata(data.gamaka_vachana);
      } else {
        console.warn('[KavyaProcess] No gamaka_vachana data in response');
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
    console.log('[KavyaProcess] Updating gamaka metadata:', gamakaArray);
    
    if (!gamakaArray || gamakaArray.length === 0) {
      console.warn('[KavyaProcess] No gamaka data provided');
      clearGamakaMetadata();
      return;
    }

    const gamaka = gamakaArray[0];
    console.log('[KavyaProcess] Processing gamaka:', gamaka);

    // Set photo
    if (gamaka.gamaka_vachakar_photo_path) {
      console.log('[KavyaProcess] Photo path from DB:', gamaka.gamaka_vachakar_photo_path);
      const photoPath = normalizePath(gamaka.gamaka_vachakar_photo_path);
      if (photoPath) {
        const fullUrl = getStaticUrl(photoPath);
        console.log('[KavyaProcess] Setting photo URL:', fullUrl);
        $('#singerPhoto').attr('src', fullUrl);
      } else {
        console.warn('[KavyaProcess] Could not normalize photo path');
      }
    } else {
      console.warn('[KavyaProcess] No photo path provided');
    }

    // Set singer name
    if (gamaka.gamaka_vachakara_name) {
      console.log('[KavyaProcess] Singer name:', gamaka.gamaka_vachakara_name);
      $('#singerName').text(gamaka.gamaka_vachakara_name);
    }

    // Set raga
    if (gamaka.raga) {
      console.log('[KavyaProcess] Raga:', gamaka.raga);
      $('#ragaName').html(`${gamaka.raga} <span style="font-size: 0.9em;">ರಾಗ</span>`);
    }

    // Set audio
    if (gamaka.gamaka_vachakar_audio_path) {
      console.log('[KavyaProcess] Audio path from DB:', gamaka.gamaka_vachakar_audio_path);
      const audioPath = normalizePath(gamaka.gamaka_vachakar_audio_path);
      if (audioPath) {
        const fullUrl = getStaticUrl(audioPath);
        console.log('[KavyaProcess] Setting audio URL:', fullUrl);
        $audioSource.attr('src', fullUrl);
        if ($audioElement) {
          $audioElement.load();
          console.log('[KavyaProcess] Audio element reloaded');
        }
      } else {
        console.warn('[KavyaProcess] Could not normalize audio path');
      }
    } else {
      console.warn('[KavyaProcess] No audio path provided');
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

  // Initialize - loadParva immediately since apiClient is already imported as ES6 module
  console.log('[KavyaProcess] Starting initialization - loading Parva data');
  loadParva();
});
