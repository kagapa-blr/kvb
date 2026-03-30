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
    // Endpoints for buttons - first button opens modal, rest open in new tabs
    const additionalPages = {
        'ಹೆಚ್ಚಿನ ಶೋಧನೆ': { type: 'modal', id: 'modal1' },
        'ಅಕಾರಾದಿ ಸೂಚಿ': { type: 'newtab', url: '/akaradi-suchi' },
        'ಲೇಖನ ಸೂಚಿ': { type: 'newtab', url: '/lekhana-suchi' },
        'ಗಾದೆಗಳ ಸೂಚಿ': { type: 'newtab', url: '/gadegal-suchi' },
        'ಅರ್ಥ ಕೋಶ': { type: 'newtab', url: '/artha-kosha' },
        'ವಿಷಯ ಪರಿವಿಡಿ': { type: 'newtab', url: '/vishaya-parividi' },
        'ಗಮಕ': { type: 'newtab', url: '/gamaka' },
        'ಅನುಬಂಧ': { type: 'newtab', url: '/anuband-info' },
        'ಟಿಪ್ಪಣಿ': { type: 'newtab', url: '/tippani-info' }
    };

    let searchWord = "";
    const modalInstances = {}; // Cache modal instances
    /**
     * Search for a word and display results
     * Uses ApiClient.get with Axios to search padya by keyword
     */
    async function searchByWord(word) {
        try {
            console.log(`[AdditionalButtons] Searching for: ${word}`);

            // Use ApiClient.get with Axios and the correct endpoint
            // GET /api/v1/padya/search?keyword=word
            const endpoint = `/api/v1/padya/search?keyword=${encodeURIComponent(word)}`;
            const data = await window.ApiClient.get(endpoint);

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
            } else if (config.type === 'newtab') {
                // Open in new tab
                console.log(`[AdditionalButtons] Opening in new tab: ${config.url}`);
                window.open(config.url, '_blank');
            }
        });
    });

    console.log('[AdditionalButtons] ✓ Initialized - listening for button clicks');
}
