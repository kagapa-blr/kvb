// Simplified Kavya Process - Clean version
// Core functionality only: Load padya data, display with gamaka metadata

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getStaticUrl(path) {
  const basePath = window.location.pathname.includes('/kvb/') ? '/kvb' : '';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${cleanPath}`;
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

// Get all characters from a line (groups combining marks with base consonants)
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
      const response = await ApiClient.get(ApiEndpoints.PARVA.list());
      const data = extractData(response);
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
    } finally {
      hideLoading();
    }
  }

  // Fetch Sandhi data for selected Parva
  async function loadSandhi(parvaNumber) {
    try {
      const response = await ApiClient.get(ApiEndpoints.PARVA.sandhisByParva(parvaNumber));
      const data = extractData(response);
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
    const sandhi = sandhiDataCache[$(this).val()];
    if (sandhi && sandhi.padya_numbers) {
      populateDropdown(
        "#padyaNumberDropdown",
        sandhi.padya_numbers.map(num => ({ padya_number: num, padya_number: num })),
        "padya_number",
        "padya_number"
      );
      $padyaNumberDropdown.prop("disabled", false);
      if (sandhi.padya_numbers.length > 0) {
        $padyaNumberDropdown.val(sandhi.padya_numbers[0]).change();
      }
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
      const response = await ApiClient.get(
        ApiEndpoints.PADYA.get(parva.parva_number, sandhi.sandhi_number, padyaNumber)
      );

      const data = response;
      $(".padya").html(formatPadyaText(data.padya));
      $(".pathantar").html(formatText(data.pathantar));
      $(".gadya").html(formatText(data.gadya));
      $(".artha").html(formatText(data.artha));
      $(".tippani").html(formatText(data.tippani));
      
      // Update gamaka metadata (photo, singer, raga)
      updateGamakaMetadata(data.gamaka_vachana);
    } catch (e) {
      console.error("Error loading Padya:", e);
    } finally {
      hideLoading();
    }
  }, 300));

  // Update gamaka metadata - singer photo, name, raga, audio
  function updateGamakaMetadata(gamakaArray) {
    // Clear all if empty
    if (!gamakaArray || gamakaArray.length === 0) {
      $('#singerPhoto').attr('src', '');
      $('#singerName').text('');
      $('#ragaName').text('');
      $audioSource.attr('src', '');
      if ($audioElement) $audioElement.load();
      return;
    }

    const gamaka = gamakaArray[0];

    // Set photo
    if (gamaka.gamaka_vachakar_photo_path) {
      $('#singerPhoto').attr('src', getStaticUrl(`/static/${gamaka.gamaka_vachakar_photo_path}`));
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
      $audioSource.attr('src', getStaticUrl(`/static/${gamaka.gamaka_vachakar_audio_path}`));
      if ($audioElement) $audioElement.load();
    }
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

  // Initialize - Wait for ApiClient and ApiEndpoints, then start loading data
  const initCheck = setInterval(() => {
    if (typeof window.ApiClient !== 'undefined' && 
        typeof window.ApiClient.get === 'function' &&
        typeof window.ApiEndpoints !== 'undefined' &&
        typeof window.ApiEndpoints.PARVA !== 'undefined') {
      clearInterval(initCheck);
      window.__ApiClientRef = window.ApiClient;
      loadParva();
    }
  }, 100);

  // Timeout after 10 seconds
  setTimeout(() => clearInterval(initCheck), 10000);
});
