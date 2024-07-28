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

$(document).ready(function () {

    // Cache for dropdown options
    const cache = {
        parva: null,
        sandhi: {},
        padya: {}
    };

    // Debounce function to limit the rate of API calls
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

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

    // Function to handle API errors
    function handleApiError(jqXHR, textStatus, errorThrown, context) {
        console.error(`Error fetching ${context} data:`, textStatus, errorThrown);
        alert(`Failed to fetch ${context}. Please try again.`);
    }

    // Function to fetch data from API with error handling
    async function fetchData(url, cacheKey, params = '') {
        try {
            const response = await $.getJSON(`${url}${params}`);
            cache[cacheKey] = response;
            return response;
        } catch (jqXHR) {
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, cacheKey);
            throw jqXHR;
        }
    }

    // Function to post data to API with error handling
    async function postData(url, cacheKey, data) {
        try {
            const response = await $.ajax({
                url: url,
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify(data),
                dataType: 'json'
            });
            cache[cacheKey] = response;
            return response;
        } catch (jqXHR) {
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, cacheKey);
            throw jqXHR;
        }
    }

    // Fetch and populate Parva dropdown
    async function fetchAndPopulateParva() {
        if (!cache.parva) {
            try {
                const data = await fetchData(apiEndpoints.parva, 'parva');
                populateDropdown('#parvaDropdown', data, 'id', 'name');
                allParvaTable(data);
            } catch (e) {
                // Handle fetch error
            }
        } else {
            populateDropdown('#parvaDropdown', cache.parva, 'id', 'name');
        }
    }

    // Fetch and populate Sandhi dropdown based on selected Parva
    async function fetchSandhi(parvaId) {
        if (!cache.sandhi[parvaId]) {
            try {
                const data = await fetchData(apiEndpoints.sandhiByParva, 'sandhi', `/${parvaId}`);
                populateDropdown('#sandhiDropdown', data, 'id', 'name');
                $('#sandhiDropdown').prop('disabled', false);
            } catch (e) {
                // Handle fetch error
            }
        } else {
            populateDropdown('#sandhiDropdown', cache.sandhi[parvaId], 'id', 'name');
            $('#sandhiDropdown').prop('disabled', false);
        }
        $('#padyaNumberDropdown').prop('disabled', true).empty(); // Reset Padya Number dropdown
        $('#padyaContent').empty(); // Clear content
    }

    // Fetch and populate Padya Number dropdown based on selected Sandhi
    async function fetchPadya(sandhiId) {
        if (!cache.padya[sandhiId]) {
            try {
                const data = await fetchData(apiEndpoints.padyaBySandhi, 'padya', `/${sandhiId}`);
                populateDropdown('#padyaNumberDropdown', data, 'padya_number', 'padya_number');
                $('#padyaNumberDropdown').prop('disabled', false);
            } catch (e) {
                // Handle fetch error
            }
        } else {
            populateDropdown('#padyaNumberDropdown', cache.padya[sandhiId], 'padya_number', 'padya_number');
            $('#padyaNumberDropdown').prop('disabled', false);
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
        const selectedSandhi = $('#sandhiDropdown').val();
        if (selectedPadyaNumber) {
            try {
                //const data = await fetchData(apiEndpoints.padyaContent, 'padyaContent', `/${selectedPadyaNumber}`);
                const data = await fetchData(apiEndpoints.padyaContent, 'padyaContent', `/${selectedSandhi}/${selectedPadyaNumber}`);

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
            $('#sandhiMessage').text('ಅನಿವಾರ್ಯ ಕ್ಷೇತ್ರಗಳನ್ನು ನಮೂದಿಸಬೇಕು').css('color', 'red');
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
            $('#padyaMessage').text('ಅಿವೃದ್ಧಿ ಫಲಿತಾಂಶವನ್ನು ನಮೂದಿಸಬೇಕು').css('color', 'red');
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
        const data = await fetchData(apiEndpoints.getAllSandhi, 'getAllSandhi');

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



    allSandhiTable();
    // Initialize dropdowns
    fetchAndPopulateParva();
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
                $('#parvaMessage').text(`ಪರ್ವ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ. ಐಡಿ: ${response.id}, ಹೆಸರು: ${response.name}`).css('color', 'green');
            } else {
                $('#parvaMessage').text('ಪರ್ವ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ').css('color', 'green');
            }
            $('#newParvaName').val(''); // Clear input field
            fetchAndPopulateParva(); // Refresh Parva dropdown
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error inserting Parva:', textStatus, errorThrown);
            $('#parvaMessage').text('ಪರ್ವ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.').css('color', 'red');
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
                $('#sandhiMessage').text(`ಸಂಧಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ. ಐಡಿ: ${response.id}, ಹೆಸರು: ${response.name}`).css('color', 'green');
            } else {
                $('#sandhiMessage').text('ಸಂಧಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ').css('color', 'green');
            }
            $('#newSandhiName').val(''); // Clear input field
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error inserting Sandhi:', textStatus, errorThrown);
            $('#sandhiMessage').text('ಸಂಧಿ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.').css('color', 'red');
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
            $('#padyaMessage').text('ಪದ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ').css('color', 'green');
            $('#sandhiId').val(''); // Clear input fields
            $('#padyaNumber').val('');
            $('#padya').val('');
            $('#pathantar').val('');
            $('#gadya').val('');
            $('#tippani').val('');
            $('#artha').val('');
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.error('Error inserting Padya:', textStatus, errorThrown);
            $('#padyaMessage').text('ಪದ್ಯ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.').css('color', 'red');
        }
    });
}


