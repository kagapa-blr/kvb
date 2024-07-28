$(document).ready(function () {
    // Define API endpoints
    const apiEndpoints = {
        parva: '/api/parva',
        sandhiByParva: '/api/sandhi/by_parva',
        padyaBySandhi: '/api/padya/by_sandhi',
        padyaContent: '/api/padya',
        insertParva: '/api/parva',
        insertSandhi: '/api/sandhi',
        insertPadya: '/api/padya'
    };

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
            handleApiError(jqXHR, jqXHR.statusText, jqXHR.statusText, 'post');
            throw jqXHR;
        }
    }

    // Fetch and populate Parva dropdown
    async function fetchAndPopulateParva() {
        if (!cache.parva) {
            try {
                const data = await fetchData(apiEndpoints.parva, 'parva');
                populateDropdown('#parvaDropdown', data, 'id', 'name');
                // Use this data to show in Bootstrap modal table upon clicking on view table.
                populateModalTable(data);
            } catch (e) {
                console.log(e);
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
                cache.sandhi[parvaId] = data;
                populateDropdown('#sandhiDropdown', data, 'id', 'name');
                $('#sandhiDropdown').prop('disabled', false);
            } catch (e) {
                console.log(e);
            }
        } else {
            populateDropdown('#sandhiDropdown', cache.sandhi[parvaId], 'id', 'name');
            $('#sandhiDropdown').prop('disabled', false);
        }
        $('#padyaNumberDropdown').prop('disabled', true).empty(); // Reset Padya Number dropdown
        $('.padya, .pathantar, .gadya, .artha, .tippani').empty(); // Clear content
    }

    // Fetch and populate Padya Number dropdown based on selected Sandhi
    async function fetchPadya(sandhiId) {
        if (!cache.padya[sandhiId]) {
            try {
                const data = await fetchData(apiEndpoints.padyaBySandhi, 'padya', `/${sandhiId}`);
                cache.padya[sandhiId] = data;
                populateDropdown('#padyaNumberDropdown', data, 'padya_number', 'padya_number');
                $('#padyaNumberDropdown').prop('disabled', false);
            } catch (e) {
                console.log(e);
            }
        } else {
            populateDropdown('#padyaNumberDropdown', cache.padya[sandhiId], 'padya_number', 'padya_number');
            $('#padyaNumberDropdown').prop('disabled', false);
        }
        $('.padya, .pathantar, .gadya, .artha, .tippani').empty(); // Clear content
    }

    // Handle changes in Parva dropdown
    $('#parvaDropdown').change(debounce(async function () {
        const selectedParva = $(this).val();
        if (selectedParva) {
            await fetchSandhi(selectedParva);
        } else {
            $('#sandhiDropdown').prop('disabled', true).empty();
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('.padya, .pathantar, .gadya, .artha, .tippani').empty(); // Clear content
        }
    }, 300));

    // Handle changes in Sandhi dropdown
    $('#sandhiDropdown').change(debounce(async function () {
        const selectedSandhi = $(this).val();
        if (selectedSandhi) {
            await fetchPadya(selectedSandhi);
        } else {
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('.padya, .pathantar, .gadya, .artha, .tippani').empty(); // Clear content
        }
    }, 300));

    // Handle changes in Padya Number dropdown
    $('#padyaNumberDropdown').change(debounce(async function () {
        const selectedPadyaNumber = $(this).val();
        const selectedSandhi = $('#sandhiDropdown').val();
        if (selectedPadyaNumber) {
            try {
                const data = await fetchData(apiEndpoints.padyaContent, 'padyaContent', `/${selectedSandhi}/${selectedPadyaNumber}`);
                $('.padya').text(data['padya']);
                $('.pathantar').text(data['pathantar']);
                $('.gadya').text(data['gadya']);
                $('.artha').text(data['artha']);
                $('.tippani').text(data['tippani']);
            } catch (e) {
                console.log(e);
            }
        } else {
            $('.padya, .pathantar, .gadya, .artha, .tippani').empty();
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

    // // Show modal when button is clicked
    // $('#viewParvaBtn').on('click', function () {
    //     $('#parvaModal').modal('show');
    // });

    // Initialize dropdowns
    fetchAndPopulateParva();
});

// Function to post a new Parva
function postParva(newParvaName) {
    postData(apiEndpoints.insertParva, { name: newParvaName })
        .then(response => {
            if (response.id && response.name) {
                $('#parvaMessage').text(`ಪರ್ವ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.name}`).css('color', 'green');
                $('#newParvaName').val('');
                fetchAndPopulateParva(); // Refresh Parva dropdown
            } else {
                $('#parvaMessage').text('ಪರ್ವ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
            }
        })
        .catch(error => {
            console.error('Error inserting Parva:', error);
            $('#parvaMessage').text('ಪರ್ವ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
        });
}

// Function to post a new Sandhi
function postSandhi(parvaId, newSandhiName) {
    postData(apiEndpoints.insertSandhi, { parva_id: parvaId, name: newSandhiName })
        .then(response => {
            if (response.id && response.name) {
                $('#sandhiMessage').text(`ಸಂಧಿ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.name}`).css('color', 'green');
                $('#newSandhiName').val('');
                $('#parvaId').val('');
                fetchSandhi(parvaId); // Refresh Sandhi dropdown
            } else {
                $('#sandhiMessage').text('ಸಂಧಿ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
            }
        })
        .catch(error => {
            console.error('Error inserting Sandhi:', error);
            $('#sandhiMessage').text('ಸಂಧಿ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
        });
}

// Function to post a new Padya
function postPadya(sandhiId, padyaNumber, padya, pathantar, gadya, tippani, artha) {
    postData(apiEndpoints.insertPadya, {
        sandhi_id: sandhiId,
        padya_number: padyaNumber,
        padya: padya,
        pathantar: pathantar,
        gadya: gadya,
        tippani: tippani,
        artha: artha
    })
        .then(response => {
            if (response.id && response.padya_number) {
                $('#padyaMessage').text(`ಪದ್ಯ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ: ${response.padya_number}`).css('color', 'green');
                $('#padyaForm')[0].reset();
                fetchPadya(sandhiId); // Refresh Padya dropdown
            } else {
                $('#padyaMessage').text('ಪದ್ಯ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
            }
        })
        .catch(error => {
            console.error('Error inserting Padya:', error);
            $('#padyaMessage').text('ಪದ್ಯ ಸೇರಿಸಲು ವಿಫಲವಾಗಿದೆ').css('color', 'red');
        });
}




// Function to populate the modal table with data
function populateModalTable(data) {
    const tableBody = $('#parvaTableBodyContent'); // The tbody element in the modal table
    tableBody.empty(); // Clear any existing rows

    // Check if data is an array and has items
    if (Array.isArray(data) && data.length > 0) {
        // Append rows to the table
        data.forEach(item => {
            tableBody.append(
                `<tr>
                    <td>${item.id}</td>
                    <td>${item.name}</td>
                </tr>`
            );
        });
    } else {
        // Display a message if no data is available
        tableBody.append(
            '<tr><td colspan="2">No data available</td></tr>'
        );
    }
}




