/**
 * Kavya Process - Modern ES6 Module
 * Loads and displays padya data with gamaka metadata
 */

import { apiClient } from "./restclient.js";
import { ApiEndpoints } from "./endpoints.js";

console.log("[KavyaProcess] ✓ Module initialized with apiClient");

// ============================================
// UTILITY FUNCTIONS
// ============================================

function buildAssetUrl(path) {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const basePath = window.location.pathname.includes("/kvb/") ? "/kvb" : "";
  const cleanPath = path.startsWith("/") ? path : `/${path}`;

  return `${basePath}${cleanPath}`;
}

function extractData(response) {
  return response && response.data
    ? response.data
    : Array.isArray(response)
      ? response
      : [];
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

// Get all Kannada character clusters from a line
function getallcharsByline(line) {
  const k = line || "";
  const arr = [];

  for (let i = 0; i < k.length; i++) {
    let s = k.charAt(i);

    while (
      i + 1 < k.length &&
      (k.charCodeAt(i + 1) < 0xc85 ||
        k.charCodeAt(i + 1) > 0xcb9 ||
        k.charCodeAt(i) === 0xccd)
    ) {
      s += k.charAt(i + 1);
      i++;
    }

    arr.push(s);
  }

  return arr;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlightFirstOccurrence(inputString, charToHighlight) {
  if (!charToHighlight || charToHighlight === " ") {
    return inputString;
  }

  const regex = new RegExp(escapeRegex(charToHighlight));
  return inputString.replace(regex, (match) => {
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
    } else if (result && typeof result === "object") {
      if (Object.prototype.hasOwnProperty.call(result, "data")) {
        data = result.data ?? [];
        count =
          result.count ?? (Array.isArray(result.data) ? result.data.length : 0);
      } else {
        data = result;
        count = 1;
      }
    }

    return { data, count };
  } catch (error) {
    console.error("[KavyaProcess] API Error:", error);
    const message =
      error.response?.data?.message || error.message || "API request failed";
    throw new Error(message);
  }
}

// ============================================
// MAIN CODE
// ============================================

$(document).ready(function () {
  let parvaDataCache = {};
  let sandhiDataCache = {};

  const $parvaDropdown = $("#parvaDropdown");
  const $sandhiDropdown = $("#sandhiDropdown");
  const $padyaNumberDropdown = $("#padyaNumberDropdown");

  const audioElement = document.getElementById("audio");
  const singerPhoto = document.getElementById("singerPhoto");
  const $singerName = $("#singerName");
  const $ragaName = $("#ragaName");

  const DEFAULT_RAGA = "-";

  if (audioElement) {
    audioElement.addEventListener("error", function (e) {
      console.warn("[KavyaProcess] Audio loading error:", e);
    });

    audioElement.addEventListener("loadstart", function () {
      console.log("[KavyaProcess] Audio loading started");
    });

    audioElement.addEventListener("loadedmetadata", function () {
      console.log("[KavyaProcess] Audio metadata loaded");
    });
  }

  if (singerPhoto) {
    singerPhoto.addEventListener("error", function () {
      console.warn("[KavyaProcess] Photo loading error:", this.src);
      this.removeAttribute("src");
    });

    singerPhoto.addEventListener("load", function () {
      console.log("[KavyaProcess] Photo loaded successfully:", this.src);
    });
  }

  function populateDropdown(selector, data, valueKey, textKey) {
    const $dropdown = $(selector);
    $dropdown.empty();

    const items = extractData(data);
    items.forEach((item) => {
      $dropdown.append(
        $("<option>", {
          value: item[valueKey],
          text: item[textKey],
        }),
      );
    });
  }

  function formatText(text) {
    return text ? String(text).replace(/\n/g, "<br>") : "";
  }

  function formatPadyaText(text) {
    if (!text) return "";

    return String(text)
      .split("\n")
      .map((line) => {
        const charList = getallcharsByline(line);
        const secondCharToHighlight = charList[1] || "";
        return highlightFirstOccurrence(line, secondCharToHighlight);
      })
      .join("<br>");
  }

  function clearPadyaContent() {
    $(".padya").html("");
    $(".pathantar").html("");
    $(".gadya").html("");
    $(".artha").html("");
    $(".tippani").html("");
  }

  function clearGamakaMetadata() {
    if (singerPhoto) {
      singerPhoto.removeAttribute("src");
    }

    $singerName.text("");
    $ragaName.text(DEFAULT_RAGA);

    if (audioElement) {
      audioElement.pause();
      audioElement.removeAttribute("src");
      audioElement.load();
    }
  }

  function updateGamakaMetadata(gamakaArray) {
    const gamaka = gamakaArray?.[0];

    if (!gamaka) {
      clearGamakaMetadata();
      return;
    }

    const photoUrl = buildAssetUrl(gamaka.gamaka_vachakar_photo_path);
    const audioUrl = buildAssetUrl(gamaka.gamaka_vachakar_audio_path);

    if (photoUrl) {
      singerPhoto.setAttribute("src", photoUrl);
    } else if (singerPhoto) {
      singerPhoto.removeAttribute("src");
    }

    $singerName.text(gamaka.gamaka_vachakara_name || "");
    $ragaName.text(gamaka.raga || DEFAULT_RAGA);

    if (audioElement) {
      audioElement.pause();

      if (audioUrl) {
        audioElement.src = audioUrl;
      } else {
        audioElement.removeAttribute("src");
      }

      audioElement.load();
    }
  }

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
        $parvaDropdown.val(data[0].id).trigger("change");
      }
    } catch (e) {
      console.error("[KavyaProcess] Error loading Parva:", e);
      $parvaDropdown.html("<option>Error loading Parva data</option>");
    } finally {
      hideLoading();
    }
  }

  async function loadSandhi(parvaNumber) {
    try {
      const response = await apiRequest(
        ApiEndpoints.SANDHI.byParva(parvaNumber),
      );
      const data = extractData(response.data);

      populateDropdown("#sandhiDropdown", data, "id", "name");
      $sandhiDropdown.prop("disabled", false);
      $padyaNumberDropdown.prop("disabled", true).empty();

      sandhiDataCache = data.reduce((acc, s) => {
        acc[s.id] = s;
        return acc;
      }, {});

      if (data.length > 0) {
        $sandhiDropdown.val(data[0].id).trigger("change");
      } else {
        clearPadyaContent();
        clearGamakaMetadata();
      }
    } catch (e) {
      console.error("[KavyaProcess] Error loading Sandhi:", e);
      $sandhiDropdown
        .prop("disabled", true)
        .html("<option>Error loading Sandhi data</option>");
      clearPadyaContent();
      clearGamakaMetadata();
    }
  }

  async function loadPadyas(sandhiId) {
    try {
      const sandhi = sandhiDataCache[sandhiId];
      if (!sandhi) return;

      const response = await apiRequest(
        ApiEndpoints.PADYA.numbersBySandhi(sandhiId),
      );
      const padyaNumbers = response.data?.padya_numbers || [];

      if (padyaNumbers.length > 0) {
        populateDropdown(
          "#padyaNumberDropdown",
          padyaNumbers.map((num) => ({ padya_number: num, display: num })),
          "padya_number",
          "display",
        );

        $padyaNumberDropdown.prop("disabled", false);
        $padyaNumberDropdown.val(padyaNumbers[0]).trigger("change");
      } else {
        $padyaNumberDropdown.prop("disabled", true).empty();
        clearPadyaContent();
        clearGamakaMetadata();
      }
    } catch (e) {
      console.error("[KavyaProcess] Error loading Padyas:", e);
      $padyaNumberDropdown
        .prop("disabled", true)
        .html("<option>Error loading Padya data</option>");
      clearPadyaContent();
      clearGamakaMetadata();
    }
  }

  $parvaDropdown.on(
    "change",
    debounce(async function () {
      const parva = parvaDataCache[$(this).val()];
      if (parva) {
        await loadSandhi(parva.parva_number);
      }
    }, 300),
  );

  $sandhiDropdown.on(
    "change",
    debounce(async function () {
      const sandhiId = $(this).val();
      if (sandhiId) {
        await loadPadyas(sandhiId);
      }
    }, 300),
  );

  $padyaNumberDropdown.on(
    "change",
    debounce(async function () {
      const parva = parvaDataCache[$parvaDropdown.val()];
      const sandhi = sandhiDataCache[$sandhiDropdown.val()];
      const padyaNumber = $(this).val();

      if (!parva || !sandhi || !padyaNumber) {
        return;
      }

      showLoading();

      try {
        const response = await apiRequest(
          ApiEndpoints.PADYA.get(
            parva.parva_number,
            sandhi.sandhi_number,
            padyaNumber,
          ),
        );

        const data = response.data || {};

        $(".padya").html(formatPadyaText(data.padya));
        $(".pathantar").html(formatText(data.pathantar));
        $(".gadya").html(formatText(data.gadya));
        $(".artha").html(formatText(data.artha));
        $(".tippani").html(formatText(data.tippani));

        updateGamakaMetadata(data.gamaka_vachana || []);
      } catch (e) {
        console.error("[KavyaProcess] Error loading Padya:", e);
        clearPadyaContent();
        clearGamakaMetadata();
      } finally {
        hideLoading();
      }
    }, 300),
  );

  function updateDropdown(newValue) {
    $padyaNumberDropdown.val(newValue).trigger("change");
  }

  $("#prevPadya").on("click", function () {
    const idx = $padyaNumberDropdown.prop("selectedIndex");
    if (idx > 0) {
      const prevVal = $padyaNumberDropdown
        .find("option")
        .eq(idx - 1)
        .val();
      updateDropdown(prevVal);
    }
  });

  $("#nextPadya").on("click", function () {
    const idx = $padyaNumberDropdown.prop("selectedIndex");
    const total = $padyaNumberDropdown.find("option").length;
    if (idx < total - 1) {
      const nextVal = $padyaNumberDropdown
        .find("option")
        .eq(idx + 1)
        .val();
      updateDropdown(nextVal);
    }
  });

  console.log("[KavyaProcess] Starting initialization - loading Parva data");
  clearGamakaMetadata();
  loadParva();
});
