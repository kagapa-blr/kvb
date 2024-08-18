// Define API endpoints
const apiEndpoints = {
    parva: '/api/parva',
    sandhiByParva: '/api/sandhi/by_parva',
    padyaBySandhi: '/api/padya/by_sandhi',
    padyaContent: '/api/padya',
    insertParva: '/api/parva',
    insertSandhi: '/api/sandhi',
    insertPadya: '/api/padya',
    getAllSandhi: '/api/sandhi'
};

let padyaNumbers = []; // List to store padya numbers
let currentIndex = 0; // Index to keep track of current padya number

// Function to fetch data from API with error handling
async function fetchData(url, params = '') {
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
        $dropdown.append($('<option>', { value: '', text: 'Select' }));
        $.each(data, function (index, item) {
            $dropdown.append($('<option>', {
                value: item[valueKey],
                text: item[textKey]
            }));
        });
    }




    // Function to post data to API with error handling
    async function postData(url, data) {
        try {
            const response = await $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                dataType: 'json'
            });
            return response;
        } catch (jqXHR) {
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, url);
            throw jqXHR;
        }
    }

    // Fetch and populate Parva dropdown
    async function fetchAndPopulateParva() {
        try {
            const data = await fetchData(apiEndpoints.parva);
            populateDropdown('#parvaDropdown', data, 'id', 'name');
            allParvaTable(data);
        } catch (e) {
            // Handle fetch error
        }
    }

    // Fetch and populate Sandhi dropdown based on selected Parva
    async function fetchSandhi(parvaId) {
        try {
            const data = await fetchData(apiEndpoints.sandhiByParva, `/${parvaId}`);
            populateDropdown('#sandhiDropdown', data, 'id', 'name');
            $('#sandhiDropdown').prop('disabled', false);
        } catch (e) {
            // Handle fetch error
        }
        $('#padyaNumberDropdown').prop('disabled', true).empty(); // Reset Padya Number dropdown
        $('#padyaContent').empty(); // Clear content
    }

    // Fetch and populate Padya Number dropdown based on selected Sandhi
    async function fetchPadya(sandhiId) {
        try {
            const data = await fetchData(apiEndpoints.padyaBySandhi, `/${sandhiId}`);
            populateDropdown('#padyaNumberDropdown', data, 'padya_number', 'padya_number');
            $('#padyaNumberDropdown').prop('disabled', false);


            // Store padya numbers in the list
            padyaNumbers = data.map(item => item.padya_number);



        } catch (e) {
            // Handle fetch error
            console.log('Erorr in fetching padya')
        }
        $('#padyaContent').empty(); // Clear content
    }

    // Handle changes in Parva dropdown
    $('#parvaDropdown').change(debounce(async function () {
        const selectedParva = $(this).val();
        if (selectedParva) {
            await fetchSandhi(selectedParva);
        } else {
            $('#sandhiDropdown').prop('disabled', true).empty();
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('#padyaContent').empty(); // Clear content
        }
    }, 300));

    // Handle changes in Sandhi dropdown
    $('#sandhiDropdown').change(debounce(async function () {
        const selectedSandhi = $(this).val();
        if (selectedSandhi) {
            await fetchPadya(selectedSandhi);
        } else {
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('#padyaContent').empty(); // Clear content
        }
    }, 300));



    // Handle changes in Padya Number dropdown
    $('#padyaNumberDropdown').change(debounce(async function () {
        const selectedPadyaNumber = $(this).val();
        currentIndex = selectedPadyaNumber;
        const selectedSandhi = $('#sandhiDropdown').val();
        if (selectedPadyaNumber) {
            try {
                const data = await fetchData(apiEndpoints.padyaContent, `/${selectedSandhi}/${selectedPadyaNumber}`);

                function formatText(text) {
                    return text.replace(/\n/g, '<br>');
                }

                $('.padya').html(formatText(data['padya']));
                $('.pathantar').html(formatText(data['pathantar']));
                $('.gadya').html(formatText(data['gadya']));
                $('.artha').html(formatText(data['artha']));
                $('.tippani').html(formatText(data['tippani']));



            } catch (e) {
                // Handle fetch error
            }
        } else {
            $('.padya').empty();
            $('.pathantar').empty();
            $('.gadya').empty();
            $('.artha').empty();
            $('.tippani').empty();
        }


    }, 300));



    // Handle click event for the Previous button
    $('#check-previous').click(async function () {

        // Set initial index based on dropdown value
        const initialPadya = $('#padyaNumberDropdown').val();
        currentIndex = padyaNumbers.indexOf(parseInt(initialPadya, 10)); // Find index of the initial value

        if (currentIndex === -1 && padyaNumbers.length > 0) {
            currentIndex = padyaNumbers.length - 1; // Default to last item if initial value not found
        }


        if (currentIndex > 0) {
            currentIndex--; // Decrement the index
        } else {
            console.log('No previous padya number');
            return; // No previous padya number
        }

        const currentSandhi = $('#sandhiDropdown').val();
        const currentPadya = padyaNumbers[currentIndex]; // Get the current padya number

        if (currentSandhi && currentPadya) {
            await fetchAndDisplayData(currentSandhi, currentPadya);
            $('#padyaNumberDropdown').val(currentPadya); // Update dropdown value
        } else {
            console.log('Sandhi or Padya number is missing');
        }


    });

    // Handle click event for the Next button
    $('#check-next').click(async function () {

        // Set initial index based on dropdown value
        const initialPadya = $('#padyaNumberDropdown').val();
        currentIndex = padyaNumbers.indexOf(parseInt(initialPadya, 10)); // Find index of the initial value

        if (currentIndex === -1 && padyaNumbers.length > 0) {
            currentIndex = padyaNumbers.length - 1; // Default to last item if initial value not found
        }


        if (currentIndex < padyaNumbers.length - 1) {
            currentIndex++; // Increment the index
        } else {
            console.log('No next padya number');
            return; // No next padya number
        }

        const currentSandhi = $('#sandhiDropdown').val();
        const currentPadya = padyaNumbers[currentIndex]; // Get the current padya number

        if (currentSandhi && currentPadya) {
            await fetchAndDisplayData(currentSandhi, currentPadya);
            $('#padyaNumberDropdown').val(currentPadya); // Update dropdown value
        } else {
            console.log('Sandhi or Padya number is missing');
        }


    });





    // Handle inserting a new Parva
    $('#insertParvaBtn').click(function () {
        const newParvaName = $('#newParvaName').val().trim();
        if (newParvaName === '') {
            $('#parvaMessage').text('ಪರ್ವದ ಹೆಸರು ನಮೂದಿಸಬೇಕು').css('color', 'red');
            return;
        }
        postParva(newParvaName);
    });

    // Handle inserting a new Sandhi
    $('#insertSandhiBtn').click(function () {
        const parvaId = $('#parvaId').val().trim();
        const newSandhiName = $('#newSandhiName').val().trim();

        if (parvaId === '' || newSandhiName === '') {
            $('#sandhiMessage').text('ಅಿವಾರ್ಯ ಕ್ಷೇತ್ರಗಳನ್ನು ನಮೂದಿಸಬೇಕು').css('color', 'red');
            return;
        }

        postSandhi(parvaId, newSandhiName);
    });

    // Handle inserting a new Padya
    $('#insertPadyaBtn').click(function () {
        const sandhiId = $('#sandhiId').val().trim();
        const padyaNumber = $('#padyaNumber').val().trim();
        const padya = $('#padya').val().trim();
        const pathantar = $('#pathantar').val().trim();
        const gadya = $('#gadya').val().trim();
        const tippani = $('#tippani').val().trim();
        const artha = $('#artha').val().trim();

        if (sandhiId === '' || padyaNumber === '' || padya === '') {
            $('#padyaMessage').text('ಅಾವಣವನ್ನು ನಮೂದಿಸಬೇಕು').css('color', 'red');
            return;
        }

        postPadya(sandhiId, padyaNumber, padya, pathantar, gadya, tippani, artha);
    });

    // Function to populate modal table with Parva data
    function allParvaTable(data) {
        const tableBody = $('#parvaTableBodyContent');
        tableBody.empty(); // Clear the table body
        $.each(data, function (index, parva) {
            const row = $('<tr>');
            row.append($('<td>').text(parva.id));
            row.append($('<td>').text(parva.name));
            tableBody.append(row);
        });
    }

    // Function to populate modal table with all Sandhi data
    async function allSandhiTable() {
        try {
            const data = await fetchData(apiEndpoints.getAllSandhi);
            const tableBody = $('#sandhiTableBodyContent');
            tableBody.empty(); // Clear the table body
            $.each(data, function (index, sandhi) {
                const row = $('<tr>');
                row.append($('<td>').text(sandhi.id));
                row.append($('<td>').text(sandhi.name));
                row.append($('<td>').text(sandhi.parva_id));
                tableBody.append(row);
            });
        } catch (error) {
            console.error('Error fetching all Sandhi data:', error);
            alert('Failed to fetch all Sandhi data. Please try again.');
        }
    }

    // Function to format numbers to two digits
    function formatNumber(number) {
        return number.toString().padStart(2, '0');
    }



    // Initialize the audio source when the document is ready
    initializeAudioDropdowns();


    allSandhiTable();
    // Initialize dropdowns
    fetchAndPopulateParva();

    //update padya
    updatePadya()
});

// Function to post a new Parva
function postParva(newParvaName) {
    $.ajax({
        url: apiEndpoints.insertParva,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ name: newParvaName }),
        success: function (response) {
            if (response.id && response.name) {
                $('#parvaMessage').text(`ಪರ್ವ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.name}`).css('color', 'green');
                $('#newParvaName').val('');
                fetchAndPopulateParva(); // Refresh the Parva dropdown
            } else {
                $('#parvaMessage').text('ಪರ್ವ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            }
        },
        error: function (jqXHR) {
            $('#parvaMessage').text('ಪರ್ವ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, apiEndpoints.insertParva);
        }
    });
}

// Function to post a new Sandhi
function postSandhi(parvaId, newSandhiName) {
    $.ajax({
        url: apiEndpoints.insertSandhi,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({ parva_id: parvaId, name: newSandhiName }),
        success: function (response) {
            if (response.id && response.name) {
                $('#sandhiMessage').text(`ಸಂಧಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.name}`).css('color', 'green');
                $('#newSandhiName').val('');
                $('#parvaId').val('');
                fetchAndPopulateParva(); // Refresh the Parva dropdown
            } else {
                $('#sandhiMessage').text('ಸಂಧಿ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            }
        },
        error: function (jqXHR) {
            $('#sandhiMessage').text('ಸಂಧಿ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, apiEndpoints.insertSandhi);
        }
    });
}

// Function to post a new Padya
function postPadya(sandhiId, padyaNumber, padya, pathantar, gadya, tippani, artha) {
    $.ajax({
        url: apiEndpoints.insertPadya,
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            sandhi_id: sandhiId,
            padya_number: padyaNumber,
            padya: padya,
            pathantar: pathantar,
            gadya: gadya,
            tippani: tippani,
            artha: artha
        }),
        success: function (response) {
            if (response.id) {
                $('#padyaMessage').text(`ಪದ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.id}`).css('color', 'green');
                $('#sandhiId').val('');
                $('#padyaNumber').val('');
                $('#padya').val('');
                $('#pathantar').val('');
                $('#gadya').val('');
                $('#tippani').val('');
                $('#artha').val('');
                fetchAndPopulateParva(); // Refresh the Parva dropdown
            } else {
                $('#padyaMessage').text('ಪದ್ಯ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            }
        },
        error: function (jqXHR) {
            $('#padyaMessage').text('ಪದ್ಯ ಸೇರಿಸುವಲ್ಲಿ ದೋಷವಿದೆ').css('color', 'red');
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, apiEndpoints.insertPadya);
        }
    });
}


function updatePadya() {
    const updateButton = document.getElementById('updateButton');

    if (updateButton) {  // Check if the updateButton exists
        updateButton.addEventListener('click', () => {
            // Collect the data from the editable fields
            const sandhiId = parseInt(document.getElementById('sandhiDropdown').value, 10);
            const padyaNumber = parseInt(document.getElementById('padyaNumberDropdown').value, 10);
            const pathantar = document.querySelector('.pathantar.editable').innerText.trim();
            const gadya = document.querySelector('.gadya.editable').innerText.trim();
            const tippani = document.querySelector('.tippani.editable').innerText.trim();
            const artha = document.querySelector('.artha.editable').innerText.trim();
            const padya = document.querySelector('.padya.editable').innerText.trim();

            // Create the data object
            const data = {
                sandhi_id: sandhiId,
                padya_number: padyaNumber,
                pathantar: pathantar,
                gadya: gadya,
                tippani: tippani,
                artha: artha,
                padya: padya
            };

            // Make the PUT request using fetch API
            fetch('/api/padya', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            })
                .then(response => response.json())
                .then(data => {
                    if (data.error) {
                        alert(`Error: ${data.error}`);
                    } else {
                        alert('Padya updated successfully!');
                        // Optionally update the UI with the new data
                        console.log('Updated Padya:', data);
                    }
                })
                .catch((error) => {
                    console.error('Error:', error);
                });
        });
    }
}


// Define the reusable function
async function fetchAndDisplayData(sandhiId, padyaNumber) {
    if (padyaNumber) {
        try {
            const data = await fetchData(apiEndpoints.padyaContent, `/${sandhiId}/${padyaNumber}`);

            function formatText(text) {
                return text.replace(/\n/g, '<br>');
            }

            $('.padya').html(formatText(data['padya']));
            $('.pathantar').html(formatText(data['pathantar']));
            $('.gadya').html(formatText(data['gadya']));
            $('.artha').html(formatText(data['artha']));
            $('.tippani').html(formatText(data['tippani']));

        } catch (e) {
            // Handle fetch error
            console.error('Fetch error:', e);
        }
    } else {
        $('.padya').empty();
        $('.pathantar').empty();
        $('.gadya').empty();
        $('.artha').empty();
        $('.tippani').empty();
    }
}





function initializeAudioDropdowns() {
    const parvaDropdown = document.getElementById('parvaDropdown');
    const sandhiDropdown = document.getElementById('sandhiDropdown');
    const padyaNumberDropdown = document.getElementById('padyaNumberDropdown');
    const audioElement = document.getElementById('audio');
    const audioSource = document.querySelector('#audio source');
    const nextButton = document.querySelector('#check-next')
    const previousButton = document.querySelector('#check-previous')


    // Function to format numbers to two digits
    function formatNumber(number) {
        return number.toString().padStart(2, '0');
    }

    // Function to update the audio source based on dropdown selections
    function updateAudioSource() {
        const parva = formatNumber(parvaDropdown.value);
        const sandhi = formatNumber(sandhiDropdown.value);
        let padya = formatNumber(currentIndex);




        if (padya <= 0) {
            padya = formatNumber(padyaNumberDropdown.value);
        }

        const converted = parseInt(padya, 10);

        if (isNaN(converted) || !isFinite(converted)) {
            console.log('padya', padya)
            return
        }
        
        if (parva && sandhi && padya) {
            const fileName = `${parva}-${sandhi}-${padya}.mp3`;
            audioSource.src = `static/audio/01-aadiparva/${fileName}`;
            audioElement.load(); // Reload audio element with new source
        }
    }

    // Add event listeners to dropdowns
    padyaNumberDropdown.addEventListener('change', updateAudioSource);
    nextButton.addEventListener('click', updateAudioSource);
    previousButton.addEventListener('click', updateAudioSource);

    // Return the updateAudioSource function so it can be called externally
    return updateAudioSource;
}
