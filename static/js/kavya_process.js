// Update API endpoints
const apiEndpoints = {
  parva: "/api/parva",
  getAllSandhiByParva: "/api/all_sandhi/by_parva",
  getSandhiByParvaSandhi: "/api/get_sandhi_by_parva_sandhi",
  getPadyaByParvaSandhiPadya: "/api/padya/by_parva_sandhi_padya",
  padyaContent: "/api/padya",
  insertParva: "/api/parva",
  insertSandhi: "/api/sandhi",
  insertPadya: "/api/padya",
  getAllSandhi: "/api/sandhi",
};

let padyaNumbers = []; // List to store padya numbers
let currentIndex = 0; // Index to keep track of current padya number

// Function to fetch data from API with error handling
async function fetchData(url, params = "") {
  try {
    const response = await $.getJSON(`${url}${params}`);
    return response;
  } catch (jqXHR) {
    handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, url);
    throw jqXHR;
  }
}
// Debounce function to limit the rate of API calls
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
// Function to handle API errors
function handleApiError(jqXHR, textStatus, errorThrown, context) {
  console.error(`Error fetching ${context} data:`, textStatus, errorThrown);
  alert(`Failed to fetch ${context}. Please try again.`);
}

$(document).ready(function () {
  // Function to populate a dropdown with data
  function populateDropdown(selector, data, valueKey, textKey) {
    const $dropdown = $(selector);
    $dropdown.empty(); // Clear existing options
    $dropdown.append($("<option>", { value: "", text: "Select" }));
    $.each(data, function (index, item) {
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
      const data = await fetchData(apiEndpoints.parva);

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
      const data = await fetchData(
        apiEndpoints.getAllSandhiByParva,
        `/${parvaNumber}`
      );
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
        apiEndpoints.getAllSandhiByParva
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
            apiEndpoints.getPadyaByParvaSandhiPadya,
            `/${parva.parva_number}/${sandhi.sandhi_number}/${selectedPadyaNumber}`
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
            apiEndpoints.getPadyaByParvaSandhiPadya
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

  //allSandhiTable();
  // Initialize dropdowns
  fetchAndPopulateParva();

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
          .querySelector(".padya.editable")
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

        // Make the PUT request using fetch API
        fetch(apiEndpoints.padyaContent, {
          // Ensure this matches the Flask route
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.error) {
              alert(`Error: ${data.error}`);
            } else {
              alert("Padya updated successfully!");
              // Optionally update the UI with the new data
              console.log("Updated Padya:", data);
            }
          })
          .catch((error) => {
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
    $.each(data, function (index, parva) {
      const row = $("<tr>");
      row.append($("<td>").text(parva.parva_number));
      row.append($("<td>").text(parva.name));
      tableBody.append(row);
    });
  }

  // Function to populate modal table with all Sandhi data
  async function allSandhiTable() {
    try {
      const data = await fetchData(apiEndpoints.getAllSandhi);
      const tableBody = $("#sandhiTableBodyContent");
      tableBody.empty(); // Clear the table body
      $.each(data, function (index, sandhi) {
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

  async function postParva(newParvaName) {
    try {
      const response = await fetch(apiEndpoints.insertParva, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newParvaName }),
      });

      const result = await response.json();

      if (response.ok && result.id && result.name) {
        document.getElementById(
          "parvaMessage"
        ).textContent = `ಪರ್ವ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${result.name}`;
        document.getElementById("parvaMessage").style.color = "green";
        document.getElementById("newParvaName").value = "";
        fetchAndPopulateParva(); // Uncomment this line if you want to refresh the Parva dropdown after insertion
      } else {
        const errorMessage = result.error || "ಪರ್ವ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ"; // Fallback to a default message if no message is returned
        document.getElementById("parvaMessage").textContent = errorMessage;
        document.getElementById("parvaMessage").style.color = "red";
      }
    } catch (error) {
      const errorMessage = error.message || "ಪರ್ವ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ"; // Fallback to a default message if no error message is provided
      document.getElementById("parvaMessage").textContent = errorMessage;
      document.getElementById("parvaMessage").style.color = "red";
      handleApiError(error, error.message, apiEndpoints.insertParva);
    }
  }

  async function postSandhi(parvaNumber, newSandhiName) {
    try {
      const response = await fetch(apiEndpoints.insertSandhi, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parva_number: parvaNumber,
          name: newSandhiName,
        }),
      });

      const result = await response.json();

      if (response.ok && result.id && result.name) {
        document.getElementById(
          "sandhiMessage"
        ).textContent = `ಸಂಧಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${result.name}`;
        document.getElementById("sandhiMessage").style.color = "green";
        document.getElementById("newSandhiName").value = "";
        document.getElementById("parvaNumber").value = ""; // Clear parva number field
        // Optionally, you might want to refresh dropdowns or other elements
        // fetchAndPopulateParva(); // Refresh the Parva dropdown if needed
      } else {
        document.getElementById("sandhiMessage").textContent =
          result.error || "ಸಂಧಿ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ";
        document.getElementById("sandhiMessage").style.color = "red";
      }
    } catch (error) {
      document.getElementById("sandhiMessage").textContent =
        "ಸಂಧಿ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ";
      document.getElementById("sandhiMessage").style.color = "red";
      handleApiError(error, error.message, apiEndpoints.insertSandhi);
    }
  }

  // Function to post a new Padya
  async function postPadya(
    parvaNumber,
    sandhiNumber,
    padyaNumber,
    padya,
    pathantar,
    gadya,
    tippani,
    artha
  ) {
    try {
      const response = await fetch(apiEndpoints.insertPadya, {
        // Adjust endpoint if needed
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parva_number: parvaNumber,
          sandhi_number: sandhiNumber,
          padya_number: padyaNumber,
          padya: padya,
          pathantar: pathantar,
          gadya: gadya,
          tippani: tippani,
          artha: artha,
        }),
      });

      const result = await response.json();

      if (response.ok && result.id) {
        $("#padyainsertPadyaMessage")
          .text(`ಪದ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${result.id}`)
          .css("color", "green");
        // Clear form fields
        $("#parvaNumber").val("");
        $("#sandhiNumber").val("");
        $("#padyaNumber").val("");
        $("#padya").val("");
        $("#pathantar").val("");
        $("#gadya").val("");
        $("#tippani").val("");
        $("#artha").val("");
        // Call a function to refresh data or update the UI
        // fetchAndPopulateParva(); // Uncomment if needed
      } else {
        $("#padyainsertPadyaMessage")
          .text(result.error || "ಪದ್ಯ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ")
          .css("color", "red");
      }
    } catch (error) {
      $("#padyainsertPadyaMessage")
        .text("ಪದ್ಯ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ")
        .css("color", "red");
      console.error("API Error:", error);
    }
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
      ); // Replace with your actual value
      const sandhi_number = formatNumber(
        sandhiDataCache[$("#sandhiDropdown").val()].sandhi_number
      ); // Replace with your actual value
      const padya = formatNumber($padyaNumberDropdown.val());

      if (parva_number && sandhi_number && padya) {
        const fileName = `${parva_number}-${sandhi_number}-${padya}.mp3`;
        $audioSource.attr("src", `/static/audio/01-aadiparva/${fileName}`);
        $audioElement.load(); // Reload audio element with new source
      }
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

  //update padya
  updatePadya();

  allSandhiTable();
  fetchAudioforPadya();
});
