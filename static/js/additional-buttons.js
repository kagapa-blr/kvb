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
 * Wait for ApiClient to be ready before initializing buttons
 * Ensures axios and base URL detection has completed
 */
function ensureApiClientReady(callback, timeout = 5000) {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
        // Check if ApiClient and required methods are available
        if (typeof window.ApiClient !== 'undefined' &&
            typeof window.ApiClient.get === 'function' &&
            typeof window.ApiClient.post === 'function') {
            clearInterval(checkInterval);
            console.log('[AdditionalButtons] ApiClient is ready');
            callback();
        } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.error('[AdditionalButtons] TIMEOUT: ApiClient did not initialize within ' + timeout + 'ms');
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
    // API endpoints mapped to modal IDs
    const additionalApi = {
        'modal1': '/api/stats/search_word',         // For "ಹೆಚ್ಚಿನ ಶೋಧನೆ"
        'modal2': '/api/akaradi-suchi',            // For "ಅಕಾರಾದಿ ಸೂಚಿ"
        'modal3': '/api/gaadigala-suchi',          // For "ಗಾದೆಗಳ ಸೂಚಿ"
        'modal4': '/api/lekhana-suchi',            // For "ಲೇಖನ ಸೂಚಿ"
        'modal5': '/api/artha-kosha',              // For "ಅರ್ಥ ಕೋಶ"
        'modal6': '/api/vishaya-parividi',         // For "ವಿಷಯ ಪರಿವಿಡಿ"
        'modal7': '/api/gamaka',                   // For "ಗಮಕ"
        'modal8': '/api/anubandha',                // For "ಅನುಬಂಧ"
        'modal9': '/api/tippani'                   // For "ಟಿಪ್ಪಣಿ"
    };

    let searchWord = "";
    const modalInstances = {}; // Cache modal instances

    /**
     * Generic fetch function using ApiClient
     * Handles both GET and POST requests with proper Axios error handling
     * 
     * @param {string} endpoint - API endpoint path
     * @param {string} modalId - Modal element ID to update
     * @param {Object} options - Optional: { method, data }
     */
    async function fetchModalContent(endpoint, modalId, options = {}) {
        const method = options.method || 'GET';
        const modalBody = document.querySelector(`#${modalId} .modal-body`);

        if (!modalBody) {
            console.warn(`[AdditionalButtons] Modal body not found: #${modalId}`);
            return;
        }

        try {
            let response;

            if (method === 'POST') {
                // Use ApiClient.post with Axios
                response = await window.ApiClient.post(endpoint, options.data || {});
            } else {
                // Use ApiClient.get with Axios
                response = await window.ApiClient.get(endpoint);
            }

            // Response is already data (not Response object) due to ApiClient interceptor
            if (typeof response === 'string') {
                // Text response (HTML content)
                modalBody.innerHTML = response;
            } else if (typeof response === 'object') {
                // JSON response - render as content
                if (Array.isArray(response)) {
                    // Array of results
                    displaySearchResults(response);
                } else {
                    // Single object or error response
                    modalBody.innerHTML = '<p>Content loaded successfully</p>';
                }
            }

            console.log(`[AdditionalButtons] Content loaded for modal: ${modalId}`);
        } catch (error) {
            // Use Axios error message if available
            const errorMessage = error.userMessage || error.message || 'Sorry, there was an error loading the content.';
            modalBody.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
            console.error(`[AdditionalButtons] Error loading ${modalId}:`, error);
        }
    }

    /**
     * Search for a word and display results
     * Uses ApiClient.post for proper request handling
     */
    async function searchByWord(word) {
        try {
            console.log(`[AdditionalButtons] Searching for: ${word}`);

            // Use ApiClient.post with Axios
            const data = await window.ApiClient.post(
                additionalApi['modal1'],
                { search_word: word }
            );

            // Data is already parsed JSON from ApiClient interceptor
            displaySearchResults(data);
        } catch (error) {
            const errorMessage = error.userMessage || 'Error fetching search results';
            console.error(`[AdditionalButtons] ${errorMessage}:`, error);

            const resultsContainer = document.getElementById('search-results');
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p style="color: red;">${errorMessage}</p>`;
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

        // Display total results count
        const totalResults = Array.isArray(results) ? results.length : 0;
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
            results.forEach(result => {
                const listItem = document.createElement('li');
                listItem.className = 'list-group-item mb-3 p-3 border rounded shadow-sm';

                listItem.innerHTML = `
                    <h5 class="mb-2"><strong>ಪರ್ವದ ಹೆಸರು:</strong> ${result.parva_name}</h5>
                    <p class="mb-1"><strong>ಸಂಧಿ ಸಂಖ್ಯೆ:</strong> ${result.sandhi_number}</p>
                    <p class="mb-1"><strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong> ${result.padya_number}</p>
                    <p class="mb-3"><strong>ಪದ್ಯ:</strong> <pre class="p-2 rounded">${highlightWord(result.padya, searchWord)}</pre></p>
                    <p class="mb-1"><strong>ಅರ್ಥ:</strong> ${result.artha}</p>
                    <p class="mb-1"><strong>ಟಿಪ್ಪಣಿ:</strong> ${result.tippani.replace('nan', '-')}</p>
                    <p class="mb-1"><strong>ಪಾಠಾಂತರ:</strong> ${result.pathantar}</p>
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

    // Event listener for button clicks to load modal content
    document.querySelectorAll('.button-list button').forEach(function (button) {
        // Skip external link buttons - they have their own handler
        if (button.classList.contains('external-link-button')) {
            console.log(`[AdditionalButtons] Skipping external link button: ${button.textContent.trim()}`);
            return;
        }

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            event.preventDefault();

            const buttonText = button.textContent.trim();
            let modalId;
            let endpoint;
            let skipFetch = false;

            // Map button text to corresponding modal and endpoint
            switch (buttonText) {
                case 'ಹೆಚ್ಚಿನ ಶೋಧನೆ':
                    // Modal1 is a search form - no content to fetch
                    // The search form already exists in the modal HTML
                    modalId = 'modal1';
                    skipFetch = true; // Don't fetch content
                    break;
                case 'ಅಕಾರಾದಿ ಸೂಚಿ':
                    modalId = 'modal2';
                    endpoint = additionalApi['modal2'];
                    break;
                case 'ಗಾದೆಗಳ ಸೂಚಿ':
                    modalId = 'modal3';
                    endpoint = additionalApi['modal3'];
                    break;
                case 'ಲೇಖನ ಸೂಚಿ':
                    modalId = 'modal4';
                    endpoint = additionalApi['modal4'];
                    break;
                case 'ಅರ್ಥ ಕೋಶ':
                    modalId = 'modal5';
                    endpoint = additionalApi['modal5'];
                    break;
                case 'ವಿಷಯ ಪರಿವಿಡಿ':
                    modalId = 'modal6';
                    endpoint = additionalApi['modal6'];
                    break;
                case 'ಗಮಕ':
                    modalId = 'modal7';
                    endpoint = additionalApi['modal7'];
                    break;
                case 'ಅನುಬಂಧ':
                    modalId = 'modal8';
                    endpoint = additionalApi['modal8'];
                    break;
                case 'ಟಿಪ್ಪಣಿ':
                    modalId = 'modal9';
                    endpoint = additionalApi['modal9'];
                    break;
                default:
                    modalId = null;
                    endpoint = null;
            }

            if (modalId) {
                // Only fetch content if not skipped and endpoint exists
                if (!skipFetch && endpoint) {
                    console.log(`[AdditionalButtons] Fetching content for ${modalId} from ${endpoint}`);
                    fetchModalContent(endpoint, modalId);
                } else if (skipFetch) {
                    console.log(`[AdditionalButtons] Skipping API call for ${modalId} (static form modal)`);
                }

                // Show the modal - reuse instance if available
                const modalElement = document.getElementById(modalId);
                if (modalElement) {
                    // Get or create cached modal instance
                    if (!modalInstances[modalId]) {
                        const modal = new bootstrap.Modal(modalElement, { backdrop: true, keyboard: true });

                        // Add event listener to properly clean up when modal is hidden
                        modalElement.addEventListener('hidden.bs.modal', function () {
                            console.log(`[AdditionalButtons] Modal hidden: ${modalId}`);

                            // Force cleanup of modal backdrop and body overflow
                            document.body.classList.remove('modal-open');
                            const backdropElements = document.querySelectorAll('.modal-backdrop');
                            backdropElements.forEach(backdrop => backdrop.remove());
                        }, { once: false });

                        modalInstances[modalId] = modal;
                    }

                    modalInstances[modalId].show();
                    console.log(`[AdditionalButtons] Opening modal: ${modalId}`);
                }
            }
        });
    });

    console.log('[AdditionalButtons] ✓ Initialized - listening for button clicks');
}
