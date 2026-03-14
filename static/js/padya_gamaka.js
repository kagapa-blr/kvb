/**
 * ========================================
 * PADYA & GAMAKA VACHANA MANAGEMENT
 * ========================================
 * 
 * FILE: padya_gamaka.js
 * PURPOSE: 
 * - Content Update: Edit padya, pathantar, gadya, tippani, artha
 * - Gamaka Vachana: Manage raga, singer, photo for each padya
 * 
 * FEATURES:
 * - Dynamically populate dropdowns (Parva > Sandhi > Padya)
 * - Load existing padya content
 * - Update padya content via API
 * - Manage gamaka vachana (add, list, delete)
 * 
 * DEPENDENCIES: jQuery, Bootstrap 5, restclient.js, endpoints.js
 */

/**
 * ========================================
 * CONTENT UPDATE FUNCTIONALITY
 * ========================================
 */

/**
 * FUNCTION: initializeContentUpdateDropdowns()
 * 
 * PURPOSE:
 *   Populate the Parva dropdown with all available parvas
 *   from the database
 * 
 * HOW TO USE:
 *   - Automatically called when Content Update modal is opened
 *   - User selects Parva > Sandhi > Padya in sequence
 * 
 * API ENDPOINT: GET /api/parva
 */
function initializeContentUpdateDropdowns() {
    console.log('Initializing content update dropdowns...');

    // API call using RestClient
    ApiClient.get(ApiEndpoints.PARVA.LIST)
        .done(function (parvas) {
            console.log('✓ Parvas loaded:', parvas.length);

            const dropdown = document.getElementById('contentParvaDropdown');
            const selectedParva = dropdown.value;

            // Keep existing first option
            const firstOption = dropdown.innerHTML.split('\n')[1];
            let html = `<option selected>ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>`;

            parvas.forEach(parva => {
                html += `<option value="${parva.parva_number}">${parva.name} (${parva.parva_number})</option>`;
            });

        })
        .fail(function () {
            console.error('✗ Error loading parvas');
            alert('ಪರ್ವಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಲ್ಲಿ ದೋಷ');
        });
}

/**
 * EVENT: contentParvaDropdown change event
 * 
 * PURPOSE: Load Sandhis when a Parva is selected
 */
document.addEventListener('DOMContentLoaded', function () {
    const parvaDropdown = document.getElementById('contentParvaDropdown');
    const sandhiDropdown = document.getElementById('contentSandhiDropdown');
    const padyaDropdown = document.getElementById('contentPadyaDropdown');

    if (parvaDropdown) {
        parvaDropdown.addEventListener('change', function () {
            const parvaNumber = this.value;

            if (!parvaNumber || parvaNumber === 'ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ') {
                sandhiDropdown.disabled = true;
                padyaDropdown.disabled = true;
                sandhiDropdown.innerHTML = '<option selected>ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>';
                padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</option>';
                return;
            }

            // Load Sandhis for selected Parva using RestClient
            ApiClient.get(ApiEndpoints.PARVA.SANDHIS_BY_PARVA(parvaNumber))
                .done(function (response) {
                    const sandhis = response.sandhis || response;
                    console.log('✓ Sandhis loaded:', sandhis.length);
                    let html = '<option selected>ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>';

                    if (Array.isArray(sandhis)) {
                        sandhis.forEach(sandhi => {
                            html += `<option value="${sandhi.id}">${sandhi.name} (${sandhi.sandhi_number})</option>`;
                        });
                    }

                    sandhiDropdown.innerHTML = html;
                    sandhiDropdown.disabled = false;
                    padyaDropdown.disabled = true;
                    padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</option>';
                })
                .fail(function () {
                    console.error('✗ Error loading sandhis');
                    alert('ಸಂಧಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಲ್ಲಿ ದೋಷ');
                });
        });
    }

    if (sandhiDropdown) {
        sandhiDropdown.addEventListener('change', function () {
            const sandhiId = this.value;

            if (!sandhiId || sandhiId === 'ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ') {
                padyaDropdown.disabled = true;
                padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</option>';
                return;
            }

            // Load Padyas for selected Sandhi using RestClient
            ApiClient.get(ApiEndpoints.SANDHI.PADYAS_BY_SANDHI(sandhiId))
                .done(function (padyas) {
                    console.log('✓ Padyas loaded:', padyas.length);
                    let html = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ</option>';

                    padyas.forEach(padya => {
                        html += `<option value="${padya.padya_number}">${padya.padya_number}</option>`;
                    });

                    padyaDropdown.innerHTML = html;
                    padyaDropdown.disabled = false;
                })
                .fail(function () {
                    console.error('✗ Error loading padyas');
                    alert('ಪದ್ಯಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಲ್ಲಿ ದೋಷ');
                });
        });
    }

    if (padyaDropdown) {
        padyaDropdown.addEventListener('change', function () {
            const padyaNumber = this.value;
            const sandhiId = document.getElementById('contentSandhiDropdown').value;

            if (!padyaNumber || !sandhiId || padyaNumber === 'ಪದ್ಯ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ') {
                clearContentFields();
                return;
            }

            loadPadyaContent(sandhiId, padyaNumber);
        });
    }
});

/**
 * FUNCTION: loadPadyaContent(sandhiId, padyaNumber)
 * 
 * PURPOSE:
 *   Fetch the content of a specific padya and populate the text fields
 * 
 * HOW TO USE:
 *   - Automatically called when user selects a padya from dropdown
 *   - Populates all 5 text fields: padya, pathantar, gadya, tippani, artha
 * 
 * API ENDPOINT: GET /api/padya/{sandhi_id}/{padya_number}
 * 
 * @param {number} sandhiId - Sandhi ID
 * @param {number} padyaNumber - Padya number
 */
function loadPadyaContent(sandhiId, padyaNumber) {
    console.log(`Loading padya content: Sandhi ${sandhiId}, Padya ${padyaNumber}`);

    // API call using RestClient
    ApiClient.get(ApiEndpoints.PADYA.GET_CONTENT(sandhiId, padyaNumber))
        .done(function (padya) {
            console.log('✓ Padya content loaded');

            // Populate text fields
            document.getElementById('contentPadya').value = padya.padya || '';
            document.getElementById('contentPathantar').value = padya.pathantar || '';
            document.getElementById('contentGadya').value = padya.gadya || '';
            document.getElementById('contentTippani').value = padya.tippani || '';
            document.getElementById('contentArtha').value = padya.artha || '';
        })
        .fail(function (xhr) {
            console.error('✗ Error loading padya content:', xhr.status);
            alert('ಪದ್ಯ ಸಂಪಾದನೆಯನ್ನು ಲೋಡ್ ಮಾಡಲಲ್ಲಿ ದೋಷ');
            clearContentFields();
        });
}

/**
 * FUNCTION: clearContentFields()
 * 
 * PURPOSE: Clear all content edit fields
 */
function clearContentFields() {
    document.getElementById('contentPadya').value = '';
    document.getElementById('contentPathantar').value = '';
    document.getElementById('contentGadya').value = '';
    document.getElementById('contentTippani').value = '';
    document.getElementById('contentArtha').value = '';
}

/**
 * FUNCTION: savePadyaContent()
 * 
 * PURPOSE:
 *   Save the edited padya content back to the database
 * 
 * HOW TO USE:
 *   1. Edit any of the 5 fields (padya, pathantar, gadya, tippani, artha)
 *   2. Click "ಸ್ಥಿತಿಕೊ" (Save) button
 *   3. Content is updated in database
 *   4. Success/error message shown
 * 
 * VALIDATION:
 *   - All dropdowns must have valid selections
 *   - At least one field should be modified (API will update)
 * 
 * API ENDPOINT: PUT /api/padya
 * REQUEST FORMAT:
 * {
 *   "parva_number": 1,
 *   "sandhi_number": 1,
 *   "padya_number": 1,
 *   "padya": "content",
 *   "pathantar": "content",
 *   "gadya": "content",
 *   "tippani": "content",
 *   "artha": "content"
 * }
 */
function savePadyaContent() {
    const parvaDropdown = document.getElementById('contentParvaDropdown');
    const sandhiDropdown = document.getElementById('contentSandhiDropdown');
    const padyaDropdown = document.getElementById('contentPadyaDropdown');

    // Validate selections
    const parvaNumber = parvaDropdown.value;
    const sandhiId = sandhiDropdown.value;
    const padyaNumber = padyaDropdown.value;

    if (!parvaNumber || !sandhiId || !padyaNumber) {
        showContentMessage('ಪರ್ವ, ಸಂಧಿ ಮತ್ತು ಪದ್ಯ ಆಯ್ಕೆ ಮಾಡಿ', 'danger');
        return;
    }

    // Get the sandhi number to send with request
    const sandhiOption = sandhiDropdown.options[sandhiDropdown.selectedIndex];
    const sandhiMatch = sandhiOption.text.match(/\((\d+)\)/);
    const sandhiNumber = sandhiMatch ? sandhiMatch[1] : sandhiId;

    const data = {
        parva_number: parseInt(parvaNumber),
        sandhi_number: parseInt(sandhiNumber),
        padya_number: parseInt(padyaNumber),
        padya: document.getElementById('contentPadya').value,
        pathantar: document.getElementById('contentPathantar').value,
        gadya: document.getElementById('contentGadya').value,
        tippani: document.getElementById('contentTippani').value,
        artha: document.getElementById('contentArtha').value
    };

    console.log('Saving padya content:', data);

    // API call using RestClient with Axios promises
    ApiClient.put(ApiEndpoints.PADYA.UPDATE, data)
        .then(function (response) {
            console.log('✓ Padya content saved successfully');
            showContentMessage('✓ ಪದ್ಯ ಸೂಚನೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಸಂಚಯಿಸಿದ', 'success');
            setTimeout(() => {
                document.getElementById('contentUpdateMessage').style.display = 'none';
                if (typeof loadDashboardStats === 'function') {
                    loadDashboardStats();
                }
            }, 3000);
        })
        .catch(function (error) {
            console.error('✗ Error saving padya content:', error);
            const errorMsg = error.response?.data?.error || 'ಪದ್ಯ ಸಯಂಚಯನಕ್ಕೆ ದೋಷ ಸಂಭವಿಸಲಾಗಿದೆ';
            showContentMessage('✗ ' + errorMsg, 'danger');
        });
}

/**
 * FUNCTION: showContentMessage(message, type)
 * 
 * PURPOSE: Display message in content update modal
 */
function showContentMessage(message, type) {
    const element = document.getElementById('contentUpdateMessage');
    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.style.display = 'block';
}

/**
 * ========================================
 * GAMAKA VACHANA MANAGEMENT
 * ========================================
 */

/**
 * FUNCTION: initializeGamakaDropdowns()
 * 
 * PURPOSE:
 *   Initialize the dropdowns for adding new gamaka vachana entry
 *   Populates Parva dropdown (similar to content update)
 */
function initializeGamakaDropdowns() {
    console.log('Initializing gamaka dropdowns...');

    // API call using RestClient with Axios promises
    ApiClient.get(ApiEndpoints.PARVA.LIST)
        .then(function (parvas) {
            console.log('✓ Parvas loaded for gamaka:', parvas.length);

            const dropdown = document.getElementById('gamakaParvaDropdown');
            let html = '<option selected>ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ</option>';

            parvas.forEach(parva => {
                html += `<option value="${parva.parva_number}">${parva.name} (${parva.parva_number})</option>`;
            });

            dropdown.innerHTML = html;
        })
        .catch(function (error) {
            console.error('✗ Error loading parvas for gamaka:', error);
        });

    // Setup gamaka parva dropdown change event
    document.getElementById('gamakaParvaDropdown').addEventListener('change', function () {
        const parvaNumber = this.value;
        const sandhiDropdown = document.getElementById('gamakaSandhiDropdown');
        const padyaDropdown = document.getElementById('gamakaPadyaDropdown');

        if (!parvaNumber || parvaNumber === 'ಪರ್ವ ಆಯ್ಕೆಮಾಡಿ') {
            sandhiDropdown.disabled = true;
            padyaDropdown.disabled = true;
            sandhiDropdown.innerHTML = '<option selected>ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>';
            padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆ</option>';
            return;
        }

        // API call using RestClient with Axios promises
        ApiClient.get(ApiEndpoints.PARVA.SANDHIS_BY_PARVA(parvaNumber))
            .then(function (response) {
                let html = '<option selected>ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ</option>';
                const sandhis = response.sandhis || response;
                if (Array.isArray(sandhis)) {
                    sandhis.forEach(sandhi => {
                        html += `<option value="${sandhi.id}">${sandhi.name} (${sandhi.sandhi_number})</option>`;
                    });
                }
                sandhiDropdown.innerHTML = html;
                sandhiDropdown.disabled = false;
                padyaDropdown.disabled = true;
                padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆ</option>';
            })
            .catch(function (error) {
                console.error('✗ Error loading sandhis:', error);
            });
    });

    document.getElementById('gamakaSandhiDropdown').addEventListener('change', function () {
        const sandhiId = this.value;
        const padyaDropdown = document.getElementById('gamakaPadyaDropdown');

        if (!sandhiId || sandhiId === 'ಸಂಧಿ ಆಯ್ಕೆಮಾಡಿ') {
            padyaDropdown.disabled = true;
            padyaDropdown.innerHTML = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆ</option>';
            return;
        }

        // API call using RestClient with Axios promises
        ApiClient.get(ApiEndpoints.SANDHI.PADYAS_BY_SANDHI(sandhiId))
            .then(function (padyas) {
                let html = '<option selected>ಪದ್ಯ ಸಂಖ್ಯೆ</option>';
                if (Array.isArray(padyas)) {
                    padyas.forEach(padya => {
                        html += `<option value="${padya.padya_number}">${padya.padya_number}</option>`;
                    });
                }
                padyaDropdown.innerHTML = html;
                padyaDropdown.disabled = false;
            })
            .catch(function (error) {
                console.error('✗ Error loading padyas:', error);
            });
    });
}

/**
 * FUNCTION: addGamakaVachana()
 * 
 * PURPOSE:
 *   Add a new gamaka vachana entry (raga + singer + photo for a padya)
 * 
 * HOW TO USE:
 *   1. Select Parva > Sandhi > Padya from dropdowns
 *   2. Enter Raga name (e.g., Bhairava)
 *   3. Enter Singer name (gamaka vachakara name)
 *   4. Optionally enter photo path
 *   5. Click "ಸೇರಿಸಿ" (Add) button
 * 
 * VALIDATION:
 *   - All dropdowns must have valid selections
 *   - Raga and Singer name are required
 * 
 * API ENDPOINT: POST /api/gamaka
 * REQUEST FORMAT:
 * {
 *   "parva_id": 1,
 *   "sandhi_id": 1,
 *   "padya_number": 1,
 *   "raga": "Bhairava",
 *   "gamaka_vachakara_name": "Singer name",
 *   "gamaka_vachakar_photo_path": "/static/photos/singer.jpg"
 * }
 */
function addGamakaVachana() {
    const parvaDropdown = document.getElementById('gamakaParvaDropdown');
    const sandhiDropdown = document.getElementById('gamakaSandhiDropdown');
    const padyaDropdown = document.getElementById('gamakaPadyaDropdown');
    const raga = document.getElementById('gamakaRaga').value.trim();
    const singer = document.getElementById('gamakaVachakaraName').value.trim();
    const photoPath = document.getElementById('gamakaPhotoPath').value.trim();

    // Validation
    const parvaNumber = parvaDropdown.value;
    const sandhiId = sandhiDropdown.value;
    const padyaNumber = padyaDropdown.value;

    if (!parvaNumber || !sandhiId || !padyaNumber) {
        showGamakaFormMessage('✗ ಪರ್ವ, ಸಂಧಿ ಮತ್ತು ಪದ್ಯ ಆಯ್ಕೆ ಮಾಡಿ', 'danger');
        return;
    }

    if (!raga || !singer) {
        showGamakaFormMessage('✗ ರಾಗ ಮತ್ತು ಶಿಲ್ಪಿ ಹೆಸರು ಅವಶ್ಯಕ', 'danger');
        return;
    }

    // Get parva_id from parva_number using RestClient with Axios promises
    ApiClient.get(ApiEndpoints.PARVA.GET_BY_ID(parvaNumber))
        .then(function (parva) {
            const data = {
                parva_id: parva.id,
                sandhi_id: parseInt(sandhiId),
                padya_number: parseInt(padyaNumber),
                raga: raga,
                gamaka_vachakara_name: singer,
                gamaka_vachakar_photo_path: photoPath || null
            };

            console.log('Adding gamaka vachana:', data);

            // API call using RestClient with Axios promises
            ApiClient.post(ApiEndpoints.GAMAKA.CREATE, data)
                .then(function (response) {
                    console.log('✓ Gamaka vachana added successfully');
                    showGamakaFormMessage('✓ ಗಾಮಕ ವಾಚನ ಯಶಸ್ವಿಯಾಗಿ ಸೇರಿಸಲಾಗಿದೆ', 'success');

                    // Clear form
                    document.getElementById('gamakaRaga').value = '';
                    document.getElementById('gamakaVachakaraName').value = '';
                    document.getElementById('gamakaPhotoPath').value = '';

                    // Reload list and refresh stats
                    setTimeout(() => {
                        loadGamakaList();
                        if (typeof loadDashboardStats === 'function') {
                            loadDashboardStats();
                        }
                        showGamakaFormMessage('', '');
                    }, 1500);
                })
                .catch(function (error) {
                    console.error('✗ Error adding gamaka vachana:', error);
                    const errorMsg = error.response?.data?.error || 'ದೋಷ ಸಂಭವಿಸಿದೆ';
                    showGamakaFormMessage('✗ ' + errorMsg, 'danger');
                });
        })
        .catch(function (error) {
            console.error('✗ Error loading parva:', error);
            showGamakaFormMessage('✗ ಪರ್ವ ಮಾಹಿತಿ ಲೋಡ್ ಸಲ್ಲಿಸಿ', 'danger');
        });
}

/**
 * FUNCTION: loadGamakaList()
 * 
 * PURPOSE:
 *   Fetch and display all gamaka vachana entries
 * 
 * HOW TO USE:
 *   - Automatically called when Gamaka modal is opened
 *   - Also called after adding/deleting a gamaka entry
 * 
 * DEPENDENCIES: jQuery, Bootstrap 5, restclient.js, endpoints.js
 * 
 * API ENDPOINT: GET /api/gamaka
 */
function loadGamakaList() {
    const spinner = document.getElementById('gamakaLoadingSpinner');
    const list = document.getElementById('gamakaList');
    const noGamers = document.getElementById('noGamers');

    spinner.style.display = 'block';
    list.style.display = 'none';
    noGamers.style.display = 'none';

    ApiClient.get(ApiEndpoints.GAMAKA.LIST)
        .then(function (gamakas) {
            console.log('✓ Gamaka list loaded:', gamakas.length);

            if (!gamakas || gamakas.length === 0) {
                spinner.style.display = 'none';
                noGamers.style.display = 'block';
                return;
            }

            // Build gamaka list HTML
            const gamakaItems = gamakas.map(gamaka => `
                <div class="card mb-2 border-start border-4 border-danger">
                    <div class="card-body">
                        <div class="row mb-2">
                            <div class="col-8">
                                <h6 class="mb-1"><strong>${escapeHtml(gamaka.gamaka_vachakara_name)}</strong></h6>
                                <p class="mb-1 text-muted">
                                    <small>
                                        <i class="fa-solid fa-music me-1"></i>
                                        ರಾಗ: ${escapeHtml(gamaka.raga)}
                                    </small>
                                </p>
                                <p class="mb-0 text-muted">
                                    <small>
                                        <i class="fa-solid fa-book me-1"></i>
                                        ಪರ್ವ: ${gamaka.parva_id}, ಸಂಧಿ: ${gamaka.sandhi_id}, ಪದ್ಯ: ${gamaka.padya_number}
                                    </small>
                                </p>
                            </div>
                            <div class="col-4 text-end">
                                <button class="btn btn-sm btn-danger" onclick="deleteGamakaVachana(${gamaka.id})">
                                    <i class="fa-solid fa-trash"></i> ಅಳಿಸಿ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');

            list.innerHTML = gamakaItems;
            spinner.style.display = 'none';
            list.style.display = 'block';
        })
        .catch(function (error) {
            console.error('✗ Error loading gamaka list:', error);
            spinner.innerHTML = '<div class="alert alert-danger">ಗಾಮಕ ವಾಚನ ಲೋಡ್ ಸಲ್ಲಿಸಿ</div>';
        });
}

/**
 * FUNCTION: deleteGamakaVachana(gamakaId)
 * 
 * PURPOSE:
 *   Delete a gamaka vachana entry with confirmation
 * 
 * HOW TO USE:
 *   - Click delete button next to a gamaka entry
 *   - Confirmation will be asked
 *   - Entry is deleted from database
 * 
 * DEPENDENCIES: jQuery, Bootstrap 5, restclient.js, endpoints.js
 * 
 * API ENDPOINT: DELETE /api/gamaka/{gamaka_id}
 * 
 * @param {number} gamakaId - ID of gamaka to delete
 */
function deleteGamakaVachana(gamakaId) {
    if (!confirm('ಈ ಗಾಮಕ ವಾಚನ ಪ್ರವೇಶವನ್ನು ಅಳಿಸಲು ಮುಂದುವರೆಯುವುದೇ?\nಈ ಕ್ರಿಯೆ ರದ್ದು ಮಾಡಲಾಗುವುದಿಲ್ಲ.')) {
        return;
    }

    console.log('Deleting gamaka vachana:', gamakaId);

    ApiClient.delete(ApiEndpoints.GAMAKA.DELETE(gamakaId))
        .then(function () {
            console.log('✓ Gamaka vachana deleted successfully');
            loadGamakaList();
            if (typeof loadDashboardStats === 'function') {
                loadDashboardStats();
            }
        })
        .catch(function (error) {
            console.error('✗ Error deleting gamaka vachana:', error);
            alert('ಗಾಮಕ ವಾಚನ ಅಳಿಸುವಿಕೆಯಲ್ಲಿ ದೋಷ');
        });
}

/**
 * FUNCTION: showGamakaFormMessage(message, type)
 * 
 * PURPOSE: Display message in gamaka form
 */
function showGamakaFormMessage(message, type) {
    const element = document.getElementById('gamakaFormMessage');
    if (!message) {
        element.style.display = 'none';
        return;
    }
    element.textContent = message;
    element.className = `alert alert-${type}`;
    element.style.display = 'block';
}

/**
 * UTILITY: escapeHtml(text)
 * Prevent XSS attacks
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}