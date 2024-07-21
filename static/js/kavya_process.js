$(document).ready(function() {
    // Define API endpoints
    const apiEndpoints = {
        parva: '/api/parva',
        sandhiByParva: '/api/sandhi/by_parva',
        padyaBySandhi: '/api/padya/by_sandhi',
        padyaContent: '/api/padya'
    };

    // Function to populate a dropdown with data
    function populateDropdown(selector, data, valueKey, textKey) {
        const $dropdown = $(selector);
        $dropdown.empty(); // Clear existing options
        $dropdown.append($('<option>', { value: '', text: 'Select' }));
        $.each(data, function(index, item) {
            $dropdown.append($('<option>', {
                value: item[valueKey],
                text: item[textKey]
            }));
        });
    }

    // Function to handle API errors
    function handleApiError(jqXHR, textStatus, errorThrown, context) {
        console.error(`Error fetching ${context} data:`, textStatus, errorThrown);
    }

    // Fetch and populate Parva dropdown
    function fetchAndPopulateParva() {
        $.getJSON(apiEndpoints.parva)
            .done(function(data) {
                populateDropdown('#parvaDropdown', data, 'id', 'name');
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                handleApiError(jqXHR, textStatus, errorThrown, 'Parva');
            });
    }

    // Fetch and populate Sandhi dropdown based on selected Parva
    function fetchSandhi(parvaId) {
        $.getJSON(`${apiEndpoints.sandhiByParva}/${parvaId}`)
            .done(function(data) {
                populateDropdown('#sandhiDropdown', data, 'id', 'name');
                $('#sandhiDropdown').prop('disabled', false);
                $('#padyaDropdown').prop('disabled', true).empty(); // Reset Padya dropdown
                $('#padyaNumberDropdown').prop('disabled', true).empty(); // Reset Padya Number dropdown
                $('#padyaContent').empty(); // Clear content
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                handleApiError(jqXHR, textStatus, errorThrown, 'Sandhi');
            });
    }

    // Fetch and populate Padya dropdown based on selected Sandhi
    function fetchPadya(sandhiId) {
        $.getJSON(`${apiEndpoints.padyaBySandhi}/${sandhiId}`)
            .done(function(data) {
                populateDropdown('#padyaDropdown', data, 'id', 'name');
                populateDropdown('#padyaNumberDropdown', data, 'padya_number', 'padya_number');
                $('#padyaDropdown').prop('disabled', false);
                $('#padyaNumberDropdown').prop('disabled', false);
                $('#padyaContent').empty(); // Clear content
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                handleApiError(jqXHR, textStatus, errorThrown, 'Padya');
            });
    }

    // Handle changes in Parva dropdown
    $('#parvaDropdown').change(function() {
        const selectedParva = $(this).val();
        if (selectedParva) {
            fetchSandhi(selectedParva);
        } else {
            $('#sandhiDropdown').prop('disabled', true).empty();
            $('#padyaDropdown').prop('disabled', true).empty();
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('#padyaContent').empty(); // Clear content
        }
    });

    // Handle changes in Sandhi dropdown
    $('#sandhiDropdown').change(function() {
        const selectedSandhi = $(this).val();
        if (selectedSandhi) {
            fetchPadya(selectedSandhi);
        } else {
            $('#padyaDropdown').prop('disabled', true).empty();
            $('#padyaNumberDropdown').prop('disabled', true).empty();
            $('#padyaContent').empty(); // Clear content
        }
    });

    // Handle changes in Padya Number dropdown
    $('#padyaNumberDropdown').change(function() {
        const selectedPadyaNumber = $(this).val();
        if (selectedPadyaNumber) {
            $.getJSON(`${apiEndpoints.padyaContent}/${selectedPadyaNumber}`)
                .done(function(data) {
                console.log(data);

                    $('.padya').text(data['name']);
                    $('.pathantar').text(data['pathantar']);
                    $('.gadya').text(data['gadya']);
                    $('.artha').text(data['artha']);
                    $('.tippani').text(data['tippani']);
                })
                .fail(function(jqXHR, textStatus, errorThrown) {
                    handleApiError(jqXHR, textStatus, errorThrown, 'Padya Content');
                });
        } else {
            $('#padyaContent').empty(); // Clear content if no selection
        }
    });

    // Initialize dropdowns
    fetchAndPopulateParva();
});
