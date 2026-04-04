import { apiClient } from "../restclient.js";
import { ApiEndpoints } from "../endpoints.js";

// =========================
// Akaradi Suchi JavaScript
// =========================

$(document).ready(function () {
  let selectedLetter = "";
  let selectedParva = "";
  let allRows = [];
  let isLoading = false;
  let parvaMap = {}; // Map to store parva_number -> parva_name

  // =========================
  // DataTable Initialization
  // =========================

  const table = $("#dictionaryTable").DataTable({
    language: {
      search: "ಹುಡುಕು:",
      lengthMenu: "_MENU_ ಪದ್ಯಗಳನ್ನು ತೋರಿಸು",
      info: "_TOTAL_ ಪದ್ಯಗಳಲ್ಲಿ _START_ ರಿಂದ _END_ ವರೆಗಿನ ಪದ್ಯಗಳು",
      infoEmpty: "ಯಾವುದೇ ದಾಖಲೆಗಳಿಲ್ಲ",
      zeroRecords: "ಹೊಂದುವ ದಾಖಲೆಗಳಿಲ್ಲ",
      paginate: {
        first: "ಮೊದಲ",
        last: "ಕೊನೆಯ",
        next: "ಮುಂದಿನ",
        previous: "ಹಿಂದಿನ",
      },
      sortAscending: ": ಆರೋಹಣ ಕ್ರಮದಲ್ಲಿ ವಿಂಗಡಿಸಲು",
      sortDescending: ": ಅವರೋಹಣ ಕ್ರಮದಲ್ಲಿ ವಿಂಗಡಿಸಲು",
    },

    searching: false, // Disable frontend search - only use backend search
    pageLength: 10,
    lengthMenu: [5, 10, 25, 50, 100],
    ordering: true,
    order: [[0, "asc"]],

    columns: [
      {
        data: "gade_suchi",
        title: "ಪದ್ಯದ ಮೊದಲ ಸಾಲು",
        render: function (data) {
          return `<span class="fw-bold">${escapeHtml(data)}</span>`;
        },
      },
      {
        data: "parva_number",
        title: "ಪರ್ವ ಸಂಖ್ಯೆ",
      },
      {
        data: "sandhi_number",
        title: "ಸಂಧಿ ಸಂಖ್ಯೆ",
      },
      {
        data: "padya_number",
        title: "ಪದ್ಯದ ಸಂಖ್ಯೆ",
      },
    ],
  });

  // =========================
  // Loading Overlay
  // =========================

  function showLoading() {
    isLoading = true;
    $("#loadingOverlay").css("display", "flex");
  }

  function hideLoading() {
    isLoading = false;
    $("#loadingOverlay").hide();
  }

  // =========================
  // Utilities
  // =========================

  function escapeHtml(text) {
    if (text === null || text === undefined) return "";

    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function highlightWord(text, word) {
    if (!text) return "";

    const safeText = escapeHtml(text);

    if (!word) return safeText;

    const safeWord = escapeHtml(word).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    const regex = new RegExp(`(${safeWord})`, "gi");

    return safeText.replace(
      regex,
      '<span style="background-color: yellow;">$1</span>',
    );
  }

  // =========================
  // Load Parva List
  // =========================

  async function loadParvaList() {
    try {
      const response = await apiClient.get(ApiEndpoints.PARVA.list);

      if (response && response.data && Array.isArray(response.data)) {
        const dropdown = $("#parvaDropdown");
        const currentValue = dropdown.val();

        dropdown.empty();
        dropdown.append('<option value="">ಎಲ್ಲಾ ಪರ್ವಗಳು</option>');

        response.data.forEach((parva) => {
          parvaMap[parva.parva_number] = parva.name;
          dropdown.append(
            `<option value="${parva.parva_number}">${escapeHtml(parva.name)} (${parva.parva_number})</option>`,
          );
        });

        if (currentValue) {
          dropdown.val(currentValue);
        }
      }
    } catch (err) {
      console.error("Error loading parva list:", err);
    }
  }

  // =========================
  // Populate Parva Dropdown
  // =========================

  function populateParvaDropdown(rows) {
    // This function is now mainly for updating parva map if needed
    rows.forEach((item) => {
      if (
        item.parva_number !== null &&
        item.parva_number !== undefined &&
        !parvaMap[item.parva_number]
      ) {
        parvaMap[item.parva_number] = String(item.parva_number);
      }
    });
  }

  // =========================
  // Client Side Filtering
  // =========================

  function applyClientFilters() {
    let filteredRows = [...allRows];

    if (selectedLetter) {
      filteredRows = filteredRows.filter(
        (item) =>
          item.gade_suchi && item.gade_suchi.trim().startsWith(selectedLetter),
      );
    }

    if (selectedParva) {
      filteredRows = filteredRows.filter(
        (item) => String(item.parva_number) === String(selectedParva),
      );
    }

    table.clear().rows.add(filteredRows).draw();
  }

  // =========================
  // Load Akaradi Suchi
  // =========================

  async function loadAkaradiSuchi(search = "") {
    if (isLoading) return;

    showLoading();

    try {
      const paramsObj = {
        offset: 0,
        limit: 100,
      };

      if (search && search.trim() !== "") {
        paramsObj.search = search.trim();
      }

      // Add parva_number parameter if a parva is selected
      if (selectedParva && selectedParva !== "") {
        paramsObj.parva_number = selectedParva;
      }

      const response = await apiClient.get(ApiEndpoints.GADESUCHI_API.list, {
        params: paramsObj,
      });

      if (
        response &&
        response.status === "success" &&
        Array.isArray(response.data)
      ) {
        allRows = response.data;

        populateParvaDropdown(allRows);

        applyClientFilters();
      } else {
        console.error("Unexpected response:", response);

        allRows = [];

        table.clear().draw();
      }
    } catch (err) {
      console.error("Error fetching akaradi suchi:", err);

      allRows = [];

      table.clear().draw();

      alert("ಡೇಟಾ ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ");
    } finally {
      hideLoading();
    }
  }

  // =========================
  // Alphabet Click
  // =========================

  $(".alphabet-grid span").on("click", function () {
    const clickedLetter = $(this).text().trim();

    if (selectedLetter === clickedLetter) {
      selectedLetter = "";

      $(".alphabet-grid span").removeClass("active");

      loadAkaradiSuchi("");

      return;
    }

    selectedLetter = clickedLetter;

    $(".alphabet-grid span").removeClass("active");

    $(this).addClass("active");

    loadAkaradiSuchi(selectedLetter);
  });

  // =========================
  // Parva Filter
  // =========================

  $("#parvaDropdown").on("change", function () {
    selectedParva = $(this).val();

    // Reload data with the selected parva filter
    selectedLetter = "";
    $(".alphabet-grid span").removeClass("active");
    loadAkaradiSuchi("");
  });

  // =========================
  // Row Click → Load Padya
  // =========================

  $("#dictionaryTable tbody").on("click", "tr", async function () {
    const rowData = table.row(this).data();

    if (!rowData) return;

    showLoading();

    $("#padyaModal .modal-body").html(`
        <div class="text-center">
          <div class="spinner-border"></div>
        </div>
      `);

    $("#padyaModal").modal("show");

    const apiUrl = `${ApiEndpoints.PADYA.list}/${rowData.parva_number}/${rowData.sandhi_number}/${rowData.padya_number}`;

    try {
      const data = await apiClient.get(apiUrl);

      // Format gamaka_vachana if present
      let gamakaHtml = "-";
      if (
        data.gamaka_vachana &&
        Array.isArray(data.gamaka_vachana) &&
        data.gamaka_vachana.length > 0
      ) {
        gamakaHtml = data.gamaka_vachana
          .map((item) => `<div class="badge bg-info">${escapeHtml(item)}</div>`)
          .join(" ");
      }

      // Format dates
      const createdDate = data.created
        ? new Date(data.created).toLocaleDateString("kn-IN")
        : "-";
      const updatedDate = data.updated
        ? new Date(data.updated).toLocaleDateString("kn-IN")
        : "-";

      $("#padyaModal .modal-body").html(`
          <div style="max-height: 70vh; overflow-y: auto;">
            <!-- Header Information -->
            <div class="mb-3 pb-3 border-bottom">
              <p class="mb-1">
                <strong>ಪರ್ವ:</strong>
                ${escapeHtml(data.parva_name || rowData.parva_number || "-")} (${escapeHtml(data.parva_number || "-")})
              </p>
              <p class="mb-1">
                <strong>ಸಂಧಿ:</strong>
                ${escapeHtml(data.sandhi_name || rowData.sandhi_number || "-")} (${escapeHtml(data.sandhi_number || "-")})
              </p>
              <p class="mb-0">
                <strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong>
                ${escapeHtml(data.padya_number || "-")}
              </p>
            </div>

            <!-- Main Padya -->
            <p class="mb-3">
              <strong>ಪದ್ಯ:</strong>
              <pre class="p-2 bg-light rounded mt-2">
${highlightWord(data.padya || "", rowData.gade_suchi || "")}
              </pre>
            </p>

            <!-- First Line -->
            <p class="mb-3">
              <strong>ಪದ್ಯದ ಮೊದಲ ಸಾಲು:</strong><br>
              ${escapeHtml(data.gade_suchi || "-")}
            </p>

            <!-- Artha (Meaning) -->
            <p class="mb-3">
              <strong>ಅರ್ಥ (ಅರ್ಥೈಸು):</strong><br>
              ${escapeHtml(data.artha || "-")}
            </p>

            <!-- Gadya (Prose) -->
            <p class="mb-3">
              <strong>ಗದ್ಯ:</strong><br>
              ${escapeHtml(data.gadya || "-")}
            </p>

            <!-- Gamaka Vachana -->
            <p class="mb-3">
              <strong>ಗಮಕ ವಾಚನ:</strong><br>
              ${gamakaHtml}
            </p>

            <!-- Tippani (Notes) -->
            <p class="mb-3">
              <strong>ಟಿಪ್ಪಣಿ:</strong><br>
              ${escapeHtml((data.tippani || "-").replace("nan", "-"))}
            </p>

            <!-- Pathantar (Textual Variations) -->
            <p class="mb-3">
              <strong>ಪಾಠಾಂತರ:</strong><br>
              ${escapeHtml(data.pathantar || "-")}
            </p>

            <!-- Suchane (Suggestions/Notes) -->
            ${data.suchane
          ? `
            <p class="mb-3">
              <strong>ಸೂಚನೆ:</strong><br>
              ${escapeHtml(data.suchane)}
            </p>
            `
          : ""
        }

            <!-- Metadata -->
            <div class="mt-3 pt-3 border-top">
              <small class="text-muted">
                <p class="mb-1">ನವೀಕರಿಸಿದ ದಿನಾಂಕ : ${updatedDate}</p>
                <p class="mb-1">ರಚಿಸಲಾದ ದಿನಾಂಕ : ${createdDate}</p>
                ${data.id ? `<p class="mb-0">ಐಡಿ: ${escapeHtml(data.id)}</p>` : ""}
              </small>
            </div>
          </div>
        `);
    } catch (err) {
      console.error("Error loading padya:", err);

      $("#padyaModal .modal-body").html(`
          <div class="alert alert-danger">
            ಪದ್ಯದ ಮಾಹಿತಿಯನ್ನು ಪಡೆಯಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ
          </div>
        `);
    } finally {
      hideLoading();
    }
  });

  // =========================
  // Back Button
  // =========================

  $(".back-button").on("click", function () {
    window.history.back();
  });

  // =========================
  // Initial Load
  // =========================

  async function initializePage() {
    await loadParvaList();
    loadAkaradiSuchi();
  }

  initializePage();
});
