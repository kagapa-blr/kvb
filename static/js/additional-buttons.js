import { apiClient } from './restclient.js';
import { ApiEndpoints } from './endpoints.js';

/**
 * Open a modal by ID
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

window.openModal = openModal;

function initializeAdditionalButtons() {
    const additionalPages = {
        'ಹೆಚ್ಚಿನ ಶೋಧನೆ': { type: 'modal', id: 'modal1' },
        'ಅಕಾರಾದಿ ಸೂಚಿ': { type: 'page', url: ApiEndpoints.ADDITIONAL.akaradiSuchi },
        'ಲೇಖನ ಸೂಚಿ': { type: 'page', url: ApiEndpoints.ADDITIONAL.lekanSuchi },
        'ಗಾದೆಗಳ ಸೂಚಿ': { type: 'page', url: ApiEndpoints.ADDITIONAL.gadeSuchi },
        'ಅರ್ಥ ಕೋಶ': { type: 'page', url: ApiEndpoints.ADDITIONAL.arhaKosha },
        'ವಿಷಯ ಪರಿವಿಡಿ': { type: 'page', url: ApiEndpoints.ADDITIONAL.vishayaParividi },
        'ಗಮಕ': { type: 'page', url: ApiEndpoints.GAMAKA.list },
        'ಅನುಬಂಧ': { type: 'page', url: ApiEndpoints.ADDITIONAL.anubanch },
        'ಟಿಪ್ಪಣಿ': { type: 'page', url: ApiEndpoints.ADDITIONAL.tippani }
    };

    let searchWord = '';
    const modalInstances = {};
    const modalContentCache = {};

    // Search for a word and show results
    async function searchByWord(word) {
        try {
            console.log(`[AdditionalButtons] Searching for: ${word}`);
            console.log(`[AdditionalButtons] Calling endpoint: ${ApiEndpoints.PADYA.search}`);

            const data = await apiClient.get(ApiEndpoints.PADYA.search, {
                params: { keyword: word }
            });

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

    // Format and display search results with highlighting
    function displaySearchResults(results) {
        const resultsContainer = document.getElementById('search-results');
        if (!resultsContainer) {
            console.warn('[AdditionalButtons] search-results container not found');
            return;
        }

        resultsContainer.innerHTML = '';

        const resultsArray = Array.isArray(results) ? results : (results.data || []);
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
            return;
        }

        resultsArray.forEach(result => {
            const listItem = document.createElement('li');
            listItem.className = 'list-group-item mb-3 p-3 border rounded shadow-sm';

            const padyaHtml = highlightWord(result.padya || '', searchWord);

            listItem.innerHTML = `
                <h5 class="mb-2"><strong>ಪರ್ವದ ಹೆಸರು:</strong> ${result.parva_name || result.parva_number || '-'}</h5>
                <p class="mb-1"><strong>ಸಂಧಿ ಸಂಖ್ಯೆ:</strong> ${result.sandhi_number || '-'}</p>
                <p class="mb-1"><strong>ಪದ್ಯ ಸಂಖ್ಯೆ:</strong> ${result.padya_number || '-'}</p>
                <p class="mb-3"><strong>ಪದ್ಯ:</strong> <pre class="p-2 rounded">${padyaHtml}</pre></p>
                <p class="mb-1"><strong>ಅರ್ಥ:</strong> ${result.artha || '-'}</p>
                <p class="mb-1"><strong>ಟಿಪ್ಪಣಿ:</strong> ${(result.tippani || '-').replace('nan', '-')}</p>
                <p class="mb-1"><strong>ಪಾಠಾಂತರ:</strong> ${result.pathantar || '-'}</p>
            `;

            resultsContainer.appendChild(listItem);
        });
    }

    // Escape HTML entities for safe innerHTML rendering
    function escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m] || m);
    }

    // Highlight search word in text with yellow background
    function highlightWord(text, word) {
        if (!word || word.trim() === '') return escapeHtml(text);

        const escapedText = escapeHtml(text);
        const escapedWord = escapeHtml(word.trim()).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(${escapedWord})`, 'gi');

        return escapedText.replace(regex, '<span style="background-color: yellow;">$1</span>');
    }

    // Load API content and show in modal (if you still need API modal)
    async function loadAdditionalContent(buttonText, config) {
        try {
            if (modalContentCache[buttonText]) {
                console.log(`[AdditionalButtons] Using cached content for: ${buttonText}`);
                displayAdditionalContentInModal(buttonText, modalContentCache[buttonText]);
                return;
            }

            console.log(`[AdditionalButtons] Loading content for: ${buttonText}`);

            const endpoint = config.endpoint; // endpoint is string, not a function
            console.log(`[AdditionalButtons] API endpoint: ${endpoint}`);

            const response = await apiClient.get(endpoint);

            modalContentCache[buttonText] = response;
            displayAdditionalContentInModal(buttonText, response);
        } catch (error) {
            const errorMessage = error.userMessage || error.message || 'Error loading content';
            console.error(`[AdditionalButtons] ${errorMessage}:`, error);
            showErrorModal(buttonText, errorMessage);
        }
    }

    // Common mapping from button text to modal ID
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

    // Display API‑loaded content in the corresponding modal
    function displayAdditionalContentInModal(buttonText, response) {
        const modalId = buttonToModalMap[buttonText];
        if (!modalId) {
            console.error(`[AdditionalButtons] No modal mapping for: ${buttonText}`);
            return;
        }

        let htmlContent = '';

        try {
            const dataArray = Array.isArray(response) ? response : (response.data || response);

            if (Array.isArray(dataArray)) {
                htmlContent = '<div class="content-list">';
                dataArray.forEach((item, index) => {
                    htmlContent += `
                        <div class="content-item p-3 mb-3 border rounded" style="background: #f9f9f9;">
                            <h6>${escapeHtml(item.name || item.title || `Item ${index + 1}`)}</h6>
                            <p class="text-muted small">${escapeHtml(item.description || item.content || '')}</p>
                        </div>
                    `;
                });
                htmlContent += '</div>';
            } else if (typeof dataArray === 'object' && dataArray !== null) {
                htmlContent = `
                    <div class="content-item p-3">
                        <h5>${escapeHtml(dataArray.name || dataArray.title || 'Content')}</h5>
                        <p>${escapeHtml(dataArray.description || dataArray.content || 'No content available')}</p>
                    </div>
                `;
            } else {
                htmlContent = `<div class="p-3">${escapeHtml(String(dataArray))}</div>`;
            }

            const modalElement = document.getElementById(modalId);
            if (!modalElement) return;

            const modalBody = modalElement.querySelector('.modal-body');
            if (!modalBody) return;

            modalBody.innerHTML = htmlContent;

            if (!modalInstances[modalId]) {
                modalInstances[modalId] = new bootstrap.Modal(modalElement);
            }

            modalInstances[modalId].show();
            console.log(`[AdditionalButtons] Displayed content in modal: ${modalId}`);
        } catch (error) {
            console.error('[AdditionalButtons] Error formatting content:', error);
            showErrorModal(buttonText, 'Error displaying content');
        }
    }

    // Show error in modal when API fails
    function showErrorModal(buttonText, errorMessage) {
        const modalId = buttonToModalMap[buttonText];
        if (!modalId) return;

        const modalElement = document.getElementById(modalId);
        if (!modalElement) return;

        const modalBody = modalElement.querySelector('.modal-body');
        if (!modalBody) return;

        modalBody.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <strong>ಲೋಡಿಂಗ್ ದೋಷ:</strong> ${escapeHtml(errorMessage)}
            </div>
        `;

        if (!modalInstances[modalId]) {
            modalInstances[modalId] = new bootstrap.Modal(modalElement);
        }

        modalInstances[modalId].show();
    }

    // Handle search form submit
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchWord = searchInput.value.trim();
                if (searchWord) {
                    searchByWord(searchWord);
                }
            }
        });
    }

    // Handle button clicks: modal same‑tab, pages new‑tab
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
                const modalElement = document.getElementById(config.id);
                if (modalElement) {
                    if (!modalInstances[config.id]) {
                        const modal = new bootstrap.Modal(modalElement, {
                            backdrop: true,
                            keyboard: true
                        });

                        modalElement.addEventListener('hidden.bs.modal', function () {
                            console.log(`[AdditionalButtons] Modal hidden: ${config.id}`);
                            document.body.classList.remove('modal-open');
                            document.querySelectorAll('.modal-backdrop').forEach(backdrop => backdrop.remove());
                        });

                        modalInstances[config.id] = modal;
                    }

                    modalInstances[config.id].show();
                    console.log(`[AdditionalButtons] Opening modal: ${config.id}`);
                }
            } else if (config.type === 'page' && config.url) {
                // Open in new tab with base path
                const fullUrl = apiClient.baseUrl + config.url;
                window.open(fullUrl, '_blank').focus();
            } else if (config.type === 'api') {
                // Load API content and show in modal
                loadAdditionalContent(buttonText, config);
            }
        });
    });

    console.log('[AdditionalButtons] ✓ Initialized - listening for button clicks');
}

// Run after DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('[AdditionalButtons] ✓ DOM loaded, initializing additional buttons');
    initializeAdditionalButtons();
});

export { openModal, initializeAdditionalButtons };