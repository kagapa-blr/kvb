/**
 * ADDITIONAL BUTTONS - ApiClient (Axios) Based Implementation
 * 
 * PURPOSE: Handle modal content loading and search functionality
 * Uses centralized ApiClient (restclient.js) for all API communications
 * 
 * BENEFITS:
 * - Base URL support (works with subdirectory deployments like /kvb/)
 * - Axios error handling and request/response interceptors
 * - Centralized timeout and header management
 * - Proper Promise-based error handling
 * 
 * DEPENDENCIES:
 * - restclient.js (ApiClient singleton with Axios)
 * - Bootstrap 5 (for Modal)
 */

/**
 * Open a modal by ID
 * @param {string} modalId - ID of the modal element
 */
function openModal(modalId) {
    const modalElement = document.getElementById(modalId);
    if (modalElement && typeof bootstrap !== 'undefined') {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    } else {
        console.warn(`[AdditionalButtons] Modal not found or Bootstrap unavailable: ${modalId}`);
    }
}

// Expose to window so inline onclick handlers can use it
window.openModal = openModal;

/**
 * Wait for ApiClient and ApiEndpoints to be ready before initializing buttons
 * Ensures axios, base URL detection, and endpoints configuration have completed
 */
function ensureApiClientReady(callback, timeout = 5000) {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
        // Check if ApiClient, ApiEndpoints and required methods are available
        if (typeof window.ApiClient !== 'undefined' &&
            typeof window.ApiClient.get === 'function' &&
            typeof window.ApiClient.post === 'function' &&
            typeof window.ApiEndpoints !== 'undefined' &&
            typeof window.ApiEndpoints._buildPath === 'function') {
            clearInterval(checkInterval);
            console.log('[AdditionalButtons] ApiClient and ApiEndpoints are ready');
            callback();
        } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.warn('[AdditionalButtons] TIMEOUT: ApiClient or ApiEndpoints did not initialize within ' + timeout + 'ms - proceeding anyway');
            // Still try to proceed
            callback();
        }
    }, 50); // Check every 50ms
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('[AdditionalButtons] DOM loaded, waiting for ApiClient...');
    // Initialize when ApiClient is ready
    ensureApiClientReady(initializeAdditionalButtons);
});

function initializeAdditionalButtons() {
    // Verify ApiEndpoints is available
    if (typeof window.ApiEndpoints === 'undefined') {
        console.error('[AdditionalButtons] ApiEndpoints is not available - initialization skipped');
        return;
    }

    // Endpoints for buttons - first button opens modal, rest load via API
    // Using centralized ApiEndpoints for all API references
    const additionalPages = {
        'ಹೆಚ್ಚಿನ ಶೋಧನೆ': { type: 'modal', id: 'modal1' },
        'ಅಕಾರಾದಿ ಸೂಚಿ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.akaradiSuchi() },
        'ಲೇಖನ ಸೂಚಿ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.lekanSuchi() },
        'ಗಾದೆಗಳ ಸೂಚಿ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.gadeSuchi() },
        'ಅರ್ಥ ಕೋಶ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.arhaKosha() },
        'ವಿಷಯ ಪರಿವಿಡಿ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.vishayaParividi() },
        'ಗಮಕ': { type: 'api', endpoint: () => window.ApiEndpoints.GAMAKA.list() },
        'ಅನುಬಂಧ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.anubanch() },
        'ಟಿಪ್ಪಣಿ': { type: 'api', endpoint: () => window.ApiEndpoints.ADDITIONAL.tippani() }
    };

    let searchWord = "";
    const modalInstances = {}; // Cache modal instances
    const modalContentCache = {}; // Cache loaded modal content
    
    /**
     * Search for a word and display results
     * Uses ApiClient.get with centralized ApiEndpoints for padya search
     */
    async function searchByWord(word) {
        try {
            console.log(`[AdditionalButtons] Searching for: ${word}`);

            // Verify ApiClient and ApiEndpoints available
            if (typeof window.ApiClient === 'undefined' || typeof window.ApiEndpoints === 'undefined') {
                throw new Error('ApiClient or ApiEndpoints not available');
            }

            // Use ApiClient.get with ApiEndpoints - properly constructed with query params
            const searchEndpoint = window.ApiEndpoints.PADYA.search() + 
                window.ApiEndpoints.formatQueryParams({ keyword: word });
            
            console.log(`[AdditionalButtons] Calling endpoint: ${searchEndpoint}`);
            const data = await window.ApiClient.get(searchEndpoint);

            // Data is already parsed JSON from ApiClient interceptor
            displaySearchResults(data);
        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Error fetching search results';
            console.error(`[AdditionalButtons] ${errorMessage}:`, error);

            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p style="color: red;">⚠️ ${errorMessage}</p>`;
            }
        }
    }

    /**
     * Display search results with highlighting
     */
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            console.warn('[AdditionalButtons] search-results container not found');
            return;
        }

        resultsContainer.innerHTML = ''; // Clear previous results

        // Handle both array format and object with data property
        let resultsArray = Array.isArray(results) ? results : (results.data || []);
        const totalResults = resultsArray.length;
        
        const resultsSummary = document.createElement('div');
        resultsSummary.className = 'mb-3';
        resultsSummary.innerHTML = `
            <p class="text-muted">Found ${totalResults} result${totalResults !== 1 ? 's' : ''}.</p>
        `;
        resultsContainer.appendChild(resultsSummary);

        if (totalResults === 0) {
            resultsContainer.innerHTML += `
                <li class="list-group-item text-center text-muted">
                    No results found.
                </li>
            `;
        } else {
            resultsArray.forEach(result => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item mb-3 p-3 border rounded shadow-sm';

                listItem.innerHTML = `
                    <h5 class="mb-2"><strong>ಪರ್ವದ ಹೆಸರು:</strong> ${result.parva_name || result.parva_number}</h5>
                    <p class="mb-1"><strong>ಸಂಧಿ ಸಂಖ್ಯೆ:</strong> ${result.sandhi_number}</p>
                    <p class="mb-1"><strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong> ${result.padya_number}</p>
                    <p class="mb-3"><strong>ಪದ್ಯ:</strong> <pre class="p-2 rounded">${highlightWord(result.padya || '', searchWord)}</pre></p>
                    <p class="mb-1"><strong>ಅರ್ಥ:</strong> ${result.artha || '-'}</p>
                    <p class="mb-1"><strong>ಟಿಪ್ಪಣಿ:</strong> ${(result.tippani || '-').replace('nan', '-')}</p>
                    <p class="mb-1"><strong>ಪಾಠಾಂತರ:</strong> ${result.pathantar || '-'}</p>
                `;

                resultsContainer.appendChild(listItem);
            });
        }
    }

    /**
     * Function to escape HTML entities
     */
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, (m) => map[m]);
    }

    /**
     * Function to highlight the search word with a yellow background
     */
    function highlightWord(text, word) {
        const escapedWord = escapeHtml(word);
        const regex = new RegExp(`(${escapedWord})`, 'gi'); // Case-insensitive search
        return escapeHtml(text).replace(regex, '<span style="background-color: yellow;">$1</span>');
    }

    /**
     * Load additional content via API and display in modal
     * Uses ApiClient with centralized ApiEndpoints
     */
    async function loadAdditionalContent(buttonText, config) {
        try {
            // Verify ApiClient is available
            if (typeof window.ApiClient === 'undefined') {
                throw new Error('ApiClient is not available');
            }

            // Check if content is already cached
            if (modalContentCache[buttonText]) {
                console.log(`[AdditionalButtons] Using cached content for: ${buttonText}`);
                displayAdditionalContentInModal(buttonText, modalContentCache[buttonText]);
                return;
            }

            console.log(`[AdditionalButtons] Loading content for: ${buttonText}`);
            
            // Get the endpoint from config
            const endpoint = config.endpoint();
            console.log(`[AdditionalButtons] API endpoint: ${endpoint}`);

            // Use ApiClient.get with the endpoint
            const response = await window.ApiClient.get(endpoint);
            
            // Store in cache for future use
            modalContentCache[buttonText] = response;
            
            // Display in appropriate modal
            displayAdditionalContentInModal(buttonText, response);
        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Error loading content';
            console.error(`[AdditionalButtons] ${errorMessage}:`, error);
            
            // Show error in modal
            showErrorModal(buttonText, errorMessage);
        }
    }

    /**
     * Display additional content in modal based on button text
     */
    function displayAdditionalContentInModal(buttonText, response) {
        let modalId = null;
        let htmlContent = '';

        // Map button text to modal ID
        const buttonToModalMap = {
            'ಅಕಾರಾದಿ ಸೂಚಿ': 'modal2',
            'ಲೇಖನ ಸೂಚಿ': 'modal3',
            'ಗಾದೆಗಳ ಸೂಚಿ': 'modal4',
            'ಅರ್ಥ ಕೋಶ': 'modal5',
            'ವಿಷಯ ಪರಿವಿಡಿ': 'modal6',
            'ಗಮಕ': 'modal7',
            'ಅನುಬಂಧ': 'modal8',
            'ಟಿಪ್ಪಣಿ': 'modal9'
        };

        modalId = buttonToModalMap[buttonText];
        if (!modalId) {
            console.error(`[AdditionalButtons] No modal mapping for: ${buttonText}`);
            return;
        }

        // Format response data into HTML
        try {
            // Handle different response formats
            let dataArray = Array.isArray(response) ? response : (response.data || response);
            
            if (Array.isArray(dataArray)) {
                // List view for array responses
                htmlContent = '<div class="content-list">';
                dataArray.forEach((item, index) => {
                    htmlContent += `
                        <div class="content-item p-3 mb-3 border rounded" style="background: #f9f9f9;">
                            <h6>${item.name || item.title || `Item ${index + 1}`}</h6>
                            <p class="text-muted small">${item.description || item.content || ''}</p>
                        </div>
                    `;
                });
                htmlContent += '</div>';
            } else if (typeof dataArray === 'object') {
                // Object view for single item responses
                htmlContent = `
                    <div class="content-item p-3">
                        <h5>${dataArray.name || dataArray.title || 'Content'}</h5>
                        <p>${dataArray.description || dataArray.content || 'No content available'}</p>
                    </div>
                `;
            } else {
                // Plain text/HTML response
                htmlContent = `<div class="p-3">${dataArray}</div>`;
            }

            // Update modal body with content
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modalBody = modalElement.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = htmlContent;

                    // Show the modal
                    if (!modalInstances[modalId]) {
                        modalInstances[modalId] = new bootstrap.Modal(modalElement);
                    }
                    modalInstances[modalId].show();
                    console.log(`[AdditionalButtons] Displayed content in modal: ${modalId}`);
                }
            }
        } catch (error) {
            console.error('[AdditionalButtons] Error formatting content:', error);
            showErrorModal(buttonText, 'Error displaying content');
        }
    }

    /**
     * Show error message in modal
     */
    function showErrorModal(buttonText, errorMessage) {
        const modalMap = {
            'ಅಕಾರಾದಿ ಸೂಚಿ': 'modal2',
            'ಲೇಖನ ಸೂಚಿ': 'modal3',
            'ಗಾದೆಗಳ ಸೂಚಿ': 'modal4',
            'ಅರ್ಥ ಕೋಶ': 'modal5',
            'ವಿಷಯ ಪರಿವಿಡಿ': 'modal6',
            'ಗಮಕ': 'modal7',
            'ಅನುಬಂಧ': 'modal8',
            'ಟಿಪ್ಪಣಿ': 'modal9'
        };

        const modalId = modalMap[buttonText];
        if (modalId) {
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                const modalBody = modalElement.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = `
                        <div class="alert alert-danger" role="alert">
                            <strong>ಲೋಡಿಂಗ್ ದೋಷ:</strong> ${errorMessage}
                        </div>
                    `;

                    if (!modalInstances[modalId]) {
                        modalInstances[modalId] = new bootstrap.Modal(modalElement);
                    }
                    modalInstances[modalId].show();
                }
            }
        }
    }

    // Event listener for search form
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault(); // Prevent the default form submission
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchWord = searchInput.value.trim();
                if (searchWord) {
                    searchByWord(searchWord);
                }
            }
        });
    }

    // Event listener for button clicks
    document.querySelectorAll('.button-list button').forEach(function (button) {
        button.addEventListener('click', function (event) {
            event.stopPropagation();
            event.preventDefault();

            const buttonText = button.textContent.trim();
            const config = additionalPages[buttonText];

            if (!config) {
                console.error(`[AdditionalButtons] Unknown button: ${buttonText}`);
                return;
            }

            if (config.type === 'modal') {
                // Open modal on same page
                const modalElement = document.getElementById(config.id);
                if (modalElement) {
                    // Get or create cached modal instance
                    if (!modalInstances[config.id]) {
                        const modal = new bootstrap.Modal(modalElement, { backdrop: true, keyboard: true });

                        // Add event listener to properly clean up when modal is hidden
                        modalElement.addEventListener('hidden.bs.modal', function () {
                            console.log(`[AdditionalButtons] Modal hidden: ${config.id}`);

                            // Force cleanup of modal backdrop and body overflow
                            document.body.classList.remove('modal-open');
                            const backdropElements = document.querySelectorAll('.modal-backdrop');
                            backdropElements.forEach(backdrop => backdrop.remove());
                        }, { once: false });

                        modalInstances[config.id] = modal;
                    }

                    modalInstances[config.id].show();
                    console.log(`[AdditionalButtons] Opening modal: ${config.id}`);
                }
            } else if (config.type === 'api') {
                // Load content via API and display in modal
                loadAdditionalContent(buttonText, config);
            }
        });
    });

    console.log('[AdditionalButtons] ✓ Initialized - listening for button clicks');
}
