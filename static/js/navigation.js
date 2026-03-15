/**
 * NAVIGATION - Production-Ready Endpoint Handler
 * 
 * PURPOSE: Handle page navigation with automatic base path resolution
 * FEATURES:
 *   - Centralized endpoint management
 *   - Automatic base path detection via ApiClient
 *   - Simple data-endpoint attribute-based navigation
 *   - Modal helper functions
 * 
 * USAGE:
 *   1. Add data-endpoint attribute to buttons: <button data-endpoint="akaradi-suchi">
 *   2. Include ENDPOINTS object with all paths before this script
 *   3. Script automatically handles base path resolution
 * 
 * EXAMPLE:
 *   <button class="btn" data-endpoint="akaradi-suchi">Open Link</button>
 *   // Automatically navigates to /kvb/akaradi-suchi in production
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
        console.warn(`[Navigation] Modal not found: ${modalId}`);
    }
}

/**
 * Initialize endpoint buttons with base path support
 * Looks for [data-endpoint] attributes and adds click handlers
 * Resolves paths using ApiClient base URL
 */
function initializeEndpointButtons() {
    const buttons = document.querySelectorAll('[data-endpoint]');

    if (buttons.length === 0) {
        console.log('[Navigation] No endpoint buttons found');
        return;
    }

    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const endpoint = this.getAttribute('data-endpoint');
            if (!endpoint) {
                console.error('[Navigation] Button missing data-endpoint attribute');
                return;
            }

            // Check if ENDPOINTS object is defined globally
            if (typeof ENDPOINTS === 'undefined' || !ENDPOINTS[endpoint]) {
                console.error('[Navigation] Endpoint not found in ENDPOINTS:', endpoint);
                return;
            }

            // Resolve path with ApiClient if available
            let url;
            if (typeof window.ApiClient !== 'undefined' && typeof window.ApiClient.getBaseUrl === 'function') {
                // Production: use ApiClient for base path resolution
                const baseUrl = window.ApiClient.getBaseUrl();
                url = baseUrl + ENDPOINTS[endpoint];
                console.log(`[Navigation] ✓ Using ApiClient base: "${baseUrl || '(root)'}" + "${ENDPOINTS[endpoint]}" = "${url}"`);
            } else {
                // Fallback: direct path
                url = ENDPOINTS[endpoint];
                console.log('[Navigation] ⚠ ApiClient not available, using endpoint:', ENDPOINTS[endpoint]);
            }

            console.log('[Navigation] Opening URL:', url);
            window.open(url, '_blank');
        });
    });

    console.log(`[Navigation] ✓ Initialized ${buttons.length} endpoint button(s)`);
}

/**
 * Initialize when document is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEndpointButtons);
} else {
    initializeEndpointButtons();
}
