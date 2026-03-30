// API endpoints are now centralized in ApiEndpoints (endpoints.js)
// All API calls should use ApiClient (restclient.js) singleton with Axios
// Example: ApiClient.get(ApiEndpoints.PARVA.LIST)

let padyaNumbers = []; // List to store padya numbers
let currentIndex = 0; // Index to keep track of current padya number

/**
 * CRITICAL: Ensure ApiClient is ready before making any API calls
 * Waits for ApiClient and ApiEndpoints to be initialized
 * 
 * @param {Function} callback - Function to execute after ApiClient is ready
 * @param {number} timeout - Maximum wait time in milliseconds (default: 5000)
 */
function ensureApiClientReady(callback, timeout = 5000) {
  const startTime = Date.now();
  const checkInterval = setInterval(() => {
    // Only require ApiClient.get to be available - ApiEndpoints is optional
    const isReady = typeof window.ApiClient !== 'undefined' &&
      typeof window.ApiClient.get === 'function';

    if (isReady) {
      clearInterval(checkInterval);
      console.log('[KavyaProcess] ApiClient is ready, executing callback');
      // Capture a reference to ApiClient to ensure it's available in the callback
      const apiClientRef = window.ApiClient;
      // Store it globally so fetchData can access it reliably
      window.__ApiClientRef = apiClientRef;
      callback();
    } else if (Date.now() - startTime > timeout) {
      clearInterval(checkInterval);
      console.error('[KavyaProcess] TIMEOUT: ApiClient did not initialize within ' + timeout + 'ms');
      // Still try to proceed - there might be partial initialization
      if (typeof window.ApiClient !== 'undefined') {
        callback();
      } else {
        alert('Error: API Client failed to initialize. Please refresh the page.');
      }
    }
  }, 50); // Check every 50ms
}

/**
 * Fetch data from API with error handling
 * Uses ApiClient for proper base URL support and Axios promises
 * IMPORTANT: Always call ensureApiClientReady() before using fetchData()
 * 
 * @param {string} endpoint - API endpoint URL
 * @param {string} params - Query parameters or path parameters
 * @returns {Promise} Promise that resolves with response data
 */
async function fetchData(endpoint, params = "") {
  try {
    // Use the captured reference to ApiClient for reliability
    const client = window.__ApiClientRef || window.ApiClient;

    // Defensive check - ensure ApiClient is available
    if (typeof client === 'undefined' || typeof client.get !== 'function') {
      throw new Error('ApiClient is not initialized. This should not happen - check script loading order.');
    }

    // Build the full endpoint URL
    const fullEndpoint = params ? `${endpoint}${params}` : endpoint;

    // Use ApiClient for base URL support and centralized configuration
    // ApiClient is Axios-based, returns native Promises
    const response = await client.get(fullEndpoint);
    return response;
  } catch (error) {
    // Handle Axios error format (different from jQuery $.ajax)
    handleApiError(error, endpoint);
    throw error;
  }
}

/**
 * Handle API errors with user-friendly messages
 * Works with both Axios and jQuery error objects
 * 
 * @param {Object} error - Error object from Axios or jQuery
 * @param {string} context - Context information for error message
 */
function handleApiError(error, context = "API") {
  let errorMessage = `Failed to fetch ${context}. Please try again.`;

  if (error.response) {
    // Server responded with an error status
    const status = error.response.status;
    const statusText = error.response.statusText || "Server Error";
    errorMessage = `Error ${status}: ${statusText}`;
    console.error(`API Error (${status}):`, error.response.data);
  } else if (error.request) {
    // Request was made but no response received
    errorMessage = "No response from server. Please check your connection.";
    console.error("No response from server:", error.request);
  } else if (error.message) {
    // Error in request setup or other error
    errorMessage = error.message;
    console.error("Request Error:", error);
  } else {
    // Fallback for jQuery error format
    errorMessage = error.userMessage || errorMessage;
    console.error("Error fetching data:", error);
  }

  console.error(`Error fetching ${context} data:`, errorMessage);
  alert(errorMessage);
}

/**
 * Get the base path for static resources
 * Extracts from ApiClient.baseUrl or derives from location
 * 
 * @returns {string} Base path (e.g., '/kvb/' or '/')
 */
function getBasePath() {
  // Try to get base URL from ApiClient if it's initialized
  if (typeof window.ApiClient !== 'undefined' && window.ApiClient.baseUrl) {
    return window.ApiClient.baseUrl;
  }

  // Fallback: derive from current pathname
  const pathname = window.location.pathname;
  // If path contains '/kvb/', extract it
  const kvbMatch = pathname.match(/^(.*?\/kvb\/)/);
  if (kvbMatch) {
    return kvbMatch[1];
  }

  // Default to root
  return '/';
}

/**
 * Construct full URL for static resources (audio, photos, etc.)
 * 
 * @param {string} path - Relative path (e.g., '/static/audio/01/01-01-01.mp3')
 * @returns {string} Full URL with base path
 */
function getStaticUrl(path) {
  const basePath = getBasePath();
  // Remove leading slash from path if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash from basePath to avoid double slashes, then combine
  const cleanBasePath = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${cleanBasePath}${cleanPath}`;
}

/**
 * Debounce function to limit the rate of function calls
 * Useful for input handlers and resize events
 * 
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

$(document).ready(function () {
  // Helper function to extract data from paginated responses
  function extractData(response) {
    // If response has a data property, it's paginated
    if (response && typeof response === 'object' && 'data' in response) {
      return response.data || [];
    }
    // Otherwise, assume it's already an array
    return Array.isArray(response) ? response : [];
  }

  // Function to populate a dropdown with data
  function populateDropdown(selector, data, valueKey, textKey) {
    const $dropdown = $(selector);
    $dropdown.empty(); // Clear existing options
    $dropdown.append($("<option>", { value: "", text: "Select" }));
    const items = extractData(data); // Extract data from paginated response
    items.forEach((item) => {
      $dropdown.append(
        $("<option>", {
          value: item[valueKey],
          text: item[textKey],
        })
      );
    });
  }
  let parvaDataCache = {}; // Cache to store parva data
  let sandhiDataCache = {}; // Cache to store sandhi data

  // Fetch and populate Parva dropdown
  async function fetchAndPopulateParva() {
    showLoading(); // Show loading overlay before fetching data
    try {
      const response = await fetchData(ApiEndpoints.PARVA.LIST);
      const data = extractData(response);

      // Populate dropdown with data
      populateDropdown("#parvaDropdown", data, "id", "name", "parva_number");

      // Populate the table with data
      allParvaTable(data);

      // Set initial value for Parva dropdown
      if (data.length > 0) {
        $("#parvaDropdown").val(data[0].id).change(); // Trigger change event
      }

      // Cache the sandhi data for quick access
      parvaDataCache = data.reduce((acc, parva) => {
        acc[parva.id] = parva;
        return acc;
      }, {});
    } catch (e) {
      console.error("Error fetching Parva data:", e);
      // Handle fetch error, possibly show an error message to the user
    } finally {
      hideLoading(); // Hide loading overlay regardless of success or error
    }
  }

  async function fetchSandhi(parvaNumber) {
    try {
      const response = await fetchData(
        ApiEndpoints.PARVA.SANDHIS_BY_PARVA(parvaNumber)
      );
      const data = extractData(response);
      populateDropdown("#sandhiDropdown", data, "id", "name");
      $("#sandhiDropdown").prop("disabled", false);
      $("#padyaNumberDropdown").prop("disabled", true).empty(); // Reset Padya Number dropdown
      $("#padyaContent").empty(); // Clear content

      // Set initial value for Sandhi dropdown
      if (data.length > 0) {
        $("#sandhiDropdown").val(data[0].id).change(); // Trigger change event
      }

      // Cache the sandhi data for quick access
      sandhiDataCache = data.reduce((acc, sandhi) => {
        acc[sandhi.id] = sandhi;
        return acc;
      }, {});
    } catch (e) {
      handleApiError(
        e,
        "Error fetching Sandhi data",
        e.status,
        "SANDHIS_BY_PARVA"
      );
    }
  }

  // Handle changes in Parva dropdown
  $("#parvaDropdown").change(
    debounce(async function () {
      const selectedParva = parvaDataCache[$(this).val()];
      showLoading();
      if (selectedParva) {
        await fetchSandhi(selectedParva.parva_number);
        hideLoading();
      } else {
        hideLoading();
        $("#sandhiDropdown").prop("disabled", true).empty();
        $("#padyaNumberDropdown").prop("disabled", true).empty();
        $("#padyaContent").empty(); // Clear content
      }
    }, 300)
  );

  // Handle changes in Sandhi dropdown
  $("#sandhiDropdown").change(
    debounce(async function () {
      const selectedSandhiId = $(this).val();
      showLoading();
      if (selectedSandhiId) {
        const sandhi = sandhiDataCache[selectedSandhiId];

        if (sandhi && sandhi.padya_numbers) {
          // Populate Padya Number dropdown with padya_numbers from the selected Sandhi
          populateDropdown(
            "#padyaNumberDropdown",
            sandhi.padya_numbers.map((num) => ({
              padya_number: num,
              padya_number: num,
            })),
            "padya_number",
            "padya_number"
          );
          $("#padyaNumberDropdown").prop("disabled", false);

          // Set initial value for Padya Number dropdown
          if (sandhi.padya_numbers.length > 0) {
            $("#padyaNumberDropdown").val(sandhi.padya_numbers[0]).change(); // Trigger change event
          }
        } else {
          $("#padyaNumberDropdown").prop("disabled", true).empty();
        }

        $("#padyaContent").empty(); // Clear content
        hideLoading();
      } else {
        $("#padyaNumberDropdown").prop("disabled", true).empty();
        $("#padyaContent").empty(); // Clear content
        hideLoading();
      }
    }, 300)
  );

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

    // console.log(arr);
    return arr;
  }

  function highlightFirstOccurrence(inputString, charToHighlight) {
    // Escape special characters in charToHighlight
    const escapedChar = charToHighlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Create a regular expression to find the first occurrence
    const regex = new RegExp(`(${escapedChar})`, "i");

    // Replace the first occurrence of the character with a highlighted version
    const result = inputString.replace(
      regex,
      '<span style="color: red;">$1</span>'
    );

    return result;
  }

  // Handle changes in Padya Number dropdown
  $("#padyaNumberDropdown").change(
    debounce(async function () {
      const selectedParvaNumber = $("#parvaDropdown").val();
      const selectedPadyaNumber = $(this).val();
      const selectedSandhi = $("#sandhiDropdown").val();

      const sandhi = sandhiDataCache[selectedSandhi];
      const parva = parvaDataCache[selectedParvaNumber];
      showLoading();
      if (selectedPadyaNumber) {
        try {
          // Fetch the padya content based on the selected Parva, Sandhi, and Padya Number
          const data = await fetchData(
            ApiEndpoints.PADYA.GET_BY_PARVA_SANDHI_PADYA(parva.parva_number, sandhi.sandhi_number, selectedPadyaNumber)
          );
          function formatPadyaText(text) {
            if (!text) return "";
            // Split text into lines
            const lines = text.split("\n");
            // Process each line
            return lines
              .map((line) => {
                // Get the list of characters for the current line
                const charList = getallcharsByline(line);
                // Check if we have enough characters and get the second character
                const secondCharToHighlight = charList[1] || ""; // Take the second character from the list
                // // Build the formatted line
                let formattedLine = "";

                formattedLine = highlightFirstOccurrence(
                  line,
                  secondCharToHighlight
                );

                return formattedLine;
              })
              .join("<br>"); // Join the lines back with <br> for HTML line breaks
          }
          // Function to format text for HTML
          function formatText(text) {
            return text ? text.replace(/\n/g, "<br>") : "";
          }
          $(".padya").html(formatPadyaText(data.padya));
          $(".updatepadya").html(formatText(data.padya));

          $(".pathantar").html(formatText(data.pathantar));
          $(".gadya").html(formatText(data.gadya));
          $(".artha").html(formatText(data.artha));
          $(".tippani").html(formatText(data.tippani));
          hideLoading();
        } catch (e) {
          hideLoading();
          handleApiError(
            e,
            "Error fetching Padya data",
            e.status,
            "GET_BY_PARVA_SANDHI_PADYA"
          );
        }
      } else {
        // Clear content if no Padya Number is selected
        $(".padya").empty();
        $(".pathantar").empty();
        $(".gadya").empty();
        $(".artha").empty();
        $(".tippani").empty();
      }
    }, 300)
  );

  // Function to update dropdown value and trigger change event
  function updateDropdownValue(newValue) {
    const dropdown = $("#padyaNumberDropdown");
    dropdown.val(newValue).trigger("change");
  }

  // Handle click for the "previous" arrow button
  $("#prevPadya").click(function () {
    const dropdown = $("#padyaNumberDropdown");
    let currentIndex = dropdown.prop("selectedIndex");
    if (currentIndex > 0) {
      // Select the previous option
      const prevValue = dropdown
        .find("option")
        .eq(currentIndex - 1)
        .val();
      updateDropdownValue(prevValue);
    }
  });

  // Handle click for the "next" arrow button
  $("#nextPadya").click(function () {
    const dropdown = $("#padyaNumberDropdown");
    let currentIndex = dropdown.prop("selectedIndex");
    const totalOptions = dropdown.find("option").length;

    if (currentIndex < totalOptions - 1) {
      // Select the next option
      const nextValue = dropdown
        .find("option")
        .eq(currentIndex + 1)
        .val();
      updateDropdownValue(nextValue);
    }
  });

  // CRITICAL: Ensure ApiClient is ready before initializing data
  // This prevents the "ApiClient.get is not a function" error
  ensureApiClientReady(function () {
    console.log('[KavyaProcess] Starting initial data load...');
    fetchAndPopulateParva();
    allSandhiTable();
    updatePadya();
    fetchAudioforPadya();
  });

  // Handle inserting a new Parva
  $("#insertParvaBtn").click(function () {
    const newParvaName = $("#newParvaName").val().trim();
    if (newParvaName === "") {
      $("#parvaMessage").text("ಪರ್ವದ ಹೆಸರು ನಮೂದಿಸಬೇಕು").css("color", "red");
      return;
    }
    postParva(newParvaName);
  });

  // Handle inserting a new Sandhi
  $("#insertSandhiBtn").click(function () {
    const parvaNumber = $("#parvaNumber").val().trim();
    const newSandhiName = $("#newSandhiName").val().trim();

    if (parvaNumber === "" || newSandhiName === "") {
      if (parvaNumber === "") {
        $("#sandhiMessage").text("ಪರ್ವ ಸಂಖ್ಯೆ ನಮೂದಿಸಿ").css("color", "red");
        return;
      }
      $("#sandhiMessage").text("ಸಂಧಿಯ ಹೆಸರು ನಮೂದಿಸಿ").css("color", "red");
      return;
    }

    postSandhi(parvaNumber, newSandhiName);
  });

  // Handle inserting a new Padya
  $("#padyainsertPadyaBtn").click(function () {
    const parvaNumber = $("#padyainsertParvaNumber").val().trim();
    const sandhiNumber = $("#padyainsertSandhiNumber").val().trim();
    const padyaNumber = $("#padyainsertPadyaNumber").val().trim();
    const padya = $("#padyainsertPadya").val().trim();
    const pathantar = $("#padyainsertPathantar").val().trim();
    const gadya = $("#padyainsertGadya").val().trim();
    const tippani = $("#padyainsertTippani").val().trim();
    const artha = $("#padyainsertArtha").val().trim();

    if (
      parvaNumber === "" ||
      sandhiNumber === "" ||
      padyaNumber === "" ||
      padya === ""
    ) {
      $("#padyainsertPadyaMessage")
        .text("Please fill required fields!")
        .css("color", "red");
      return;
    }

    postPadya(
      parvaNumber,
      sandhiNumber,
      padyaNumber,
      padya,
      pathantar,
      gadya,
      tippani,
      artha
    );
  });

  function updatePadya() {
    const updateButton = document.getElementById("updateButton");

    if (updateButton) {
      // Check if the updateButton exists
      updateButton.addEventListener("click", () => {
        // Collect the data from the editable fields
        const parvaNumber =
          parvaDataCache[
            parseInt(document.getElementById("parvaDropdown").value, 10)
          ].parva_number;
        const sandhiNumber =
          sandhiDataCache[
            parseInt(document.getElementById("sandhiDropdown").value, 10)
          ].sandhi_number;

        const padyaNumber = parseInt(
          document.getElementById("padyaNumberDropdown").value,
          10
        );
        const pathantar = document
          .querySelector(".pathantar.editable")
          .innerText.trim();
        const gadya = document
          .querySelector(".gadya.editable")
          .innerText.trim();
        const tippani = document
          .querySelector(".tippani.editable")
          .innerText.trim();
        const artha = document
          .querySelector(".artha.editable")
          .innerText.trim();
        const padya = document
          .querySelector(".updatepadya.editable")
          .innerText.trim();

        // Validate data
        if (isNaN(parvaNumber) || isNaN(sandhiNumber) || isNaN(padyaNumber)) {
          alert("Please ensure that all dropdown values are selected.");
          return;
        }

        // Create the data object
        const data = {
          parva_number: parvaNumber,
          sandhi_number: sandhiNumber,
          padya_number: padyaNumber,
          pathantar: pathantar,
          gadya: gadya,
          tippani: tippani,
          artha: artha,
          padya: padya,
        };

        // Make the PUT request using ApiClient with base URL support (Axios promises)
        ApiClient.put(ApiEndpoints.PADYA.UPDATE, data)
          .then(function (responseData) {
            if (responseData.error) {
              alert(`Error: ${responseData.error}`);
            } else {
              alert("Padya updated successfully!");
              // Optionally update the UI with the new data
              console.log("Updated Padya:", responseData);
            }
          })
          .catch(function (error) {
            console.error("Error:", error);
            alert("An error occurred while updating the Padya.");
          });
      });
    }
  }

  // Function to populate modal table with Parva data
  function allParvaTable(data) {
    const tableBody = $("#parvaTableBodyContent");
    tableBody.empty(); // Clear the table body
    const items = extractData(data); // Extract data from paginated response
    items.forEach((parva) => {
      const row = $("<tr>");
      row.append($("<td>").text(parva.parva_number));
      row.append($("<td>").text(parva.name));
      tableBody.append(row);
    });
  }

  // Function to populate modal table with all Sandhi data
  async function allSandhiTable() {
    try {
      const response = await fetchData(ApiEndpoints.SANDHI.LIST);
      const data = extractData(response);
      const tableBody = $("#sandhiTableBodyContent");
      tableBody.empty(); // Clear the table body
      data.forEach((sandhi) => {
        const row = $("<tr>");
        row.append($("<td>").text(sandhi.sandhi_number));
        row.append($("<td>").text(sandhi.name));
        row.append($("<td>").text(sandhi.parva_number));
        tableBody.append(row);
      });
    } catch (error) {
      console.error("Error fetching all Sandhi data:", error);
      alert("Failed to fetch all Sandhi data. Please try again.");
    }
  }

  // Function to format numbers to two digits
  function formatNumber(number) {
    return number.toString().padStart(2, "0");
  }

  function fetchAudioforPadya() {
    const $padyaNumberDropdown = $("#padyaNumberDropdown");
    const $audioElement = $("#audio")[0]; // Getting the DOM element
    const $audioSource = $("#audio source");

    // Function to format numbers to two digits
    function formatNumber(number) {
      return number.toString().padStart(2, "0");
    }

    // Function to update the audio source based on padya dropdown selection
    function updateAudioSource() {
      const parva_number = formatNumber(
        parvaDataCache[$("#parvaDropdown").val()].parva_number
      );
      const sandhi_number = formatNumber(
        sandhiDataCache[$("#sandhiDropdown").val()].sandhi_number
      );
      const padya = formatNumber($padyaNumberDropdown.val());

      const parvadir = formatNumber(parva_number);

      if (parva_number && sandhi_number && padya) {

        // update the audio source
        const fileName = `${parva_number}-${sandhi_number}-${padya}.mp3`;
        const audioUrl = getStaticUrl(`/static/audio/${parvadir}/${fileName}`);
        $audioSource.attr("src", audioUrl);
        $audioElement.load(); // Reload audio element with new source

        // Fetch gamaka data for the selected padya to update metadata using ApiClient
        const parva_id = parvaDataCache[$("#parvaDropdown").val()].id;
        const sandhi_id = sandhiDataCache[$("#sandhiDropdown").val()].id;
        const padya_number = parseInt($padyaNumberDropdown.val());

        // Use ApiClient for consistent error handling and base URL support
        const client = window.__ApiClientRef || window.ApiClient;
        if (typeof client !== 'undefined' && typeof client.get === 'function') {
          client.get(`/api/gamaka/padya?parva_id=${parva_id}&sandhi_id=${sandhi_id}&padya_number=${padya_number}`)
            .then(gamakaData => {
              updateAudioMetadata(gamakaData);
            })
            .catch(error => {
              console.error("Gamaka API error:", error.userMessage || error.message);
              updateAudioMetadata([]); // Clear metadata on error
            });
        } else {
          console.warn("ApiClient not available for gamaka metadata fetch");
          updateAudioMetadata([]); // Clear metadata if ApiClient unavailable
        }
      }
    }

    // Add this function to update audio metadata from gamaka data
    function updateAudioMetadata(gamakaData) {

      if (!gamakaData || gamakaData.length === 0) {
        $('#singerPhoto').attr('src', '');
        $('#singerName').text('');
        $('#ragaName').text('');
        return;
      }

      const gamaka = gamakaData[0];

      const photoUrl = getStaticUrl(`/static/photos/${gamaka.photo}`);
      const singerName = gamaka.gamaka_vachakara_name;
      const ragaName = gamaka.raga;

      $('#singerPhoto').attr('src', photoUrl);
      $('#singerName').text(singerName);
      $('#ragaName').text(`${ragaName} ರಾಗ`);
    }



    // Add event listener to padya dropdown
    $padyaNumberDropdown.on("change", updateAudioSource);
  }

  // Function to show loading overlay
  function showLoading() {
    const loadingElement = document.getElementById("loadingOverlay");
    if (loadingElement) {
      loadingElement.style.display = "flex";
    }
  }

  // Function to hide loading overlay
  function hideLoading() {
    const loadingElement = document.getElementById("loadingOverlay");
    if (loadingElement) {
      loadingElement.style.display = "none";
    }
  }

  // All initialization is now handled in ensureApiClientReady() above
  // to ensure ApiClient is loaded before making API calls
  // DO NOT call these functions here - they are called in the wrapper above
  // updatePadya();
  // allSandhiTable();
  // fetchAudioforPadya();
});
