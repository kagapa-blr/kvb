/**
 * Helper to wait for ApiClient to be available
 * Usage: ensureApiClientReady(() => { ... code that uses ApiClient ... })
 */
function ensureApiClientReady(callback, timeout = 5000) {
    const startTime = Date.now();
    
    const checkInterval = setInterval(() => {
        if (typeof window.ApiClient !== 'undefined' && window.ApiClient !== null) {
            clearInterval(checkInterval);
            console.log('[ApiClientReady] ApiClient is ready');
            callback();
        } else if (Date.now() - startTime > timeout) {
            clearInterval(checkInterval);
            console.error('[ApiClientReady] TIMEOUT: ApiClient did not initialize within ' + timeout + 'ms');
            // Still try to proceed in case it initializes later
            callback();
        }
    }, 50);
}

// Expose globally
window.ensureApiClientReady = ensureApiClientReady;
