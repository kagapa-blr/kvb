/**
 * ===================================================================
 * CONFIGURATION - CENTRAL BASE PATH MANAGEMENT
 * ===================================================================
 * 
 * BASE_PATH: Set the API base path here. All HTTP requests will use this.
 * 
 * Options:
 *   ""          → Auto-detect from URL (e.g., /kvb from http://localhost:5000/kvb/page.html)
 *   "/kvb"      → Explicit production path
 *   ""          → Root path (default, no subdirectory)
 *   "/custom"   → Any custom subdirectory
 * 
 * Changes made here automatically reflect across ALL HTTP requests in the app.
 * ===================================================================
 */
const BASE_PATH = ""; // Production: https://kagapa.com/kvb (no trailing slash)

class ApiClient {
    constructor(baseUrl = '') {
        // Use configured BASE_PATH if provided, otherwise auto-detect

        this.baseUrl = baseUrl;
        this.timeout = 30000;
        this.debugMode = false;

        this.instance = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        this.setupInterceptors();
        console.log(`[ApiClient] Initialized with base URL: "${this.baseUrl || '(root)'}"`);
    }

    detectBaseUrl() {
        const pathname = window.location.pathname;
        if (pathname && pathname !== '/' && !pathname.includes('.')) {
            const parts = pathname.split('/').filter(p => p);
            if (parts.length > 0) {
                return '/' + parts[0];
            }
        }
        return '';
    }

    getBaseUrl() {
        return this.baseUrl;
    }

    setBaseUrl(url) {
        // Dynamic override of base path - affects ALL subsequent HTTP requests
        this.baseUrl = url.replace(/\/$/, '');
        this.instance.defaults.baseURL = this.baseUrl;
        console.log(`[ApiClient] Base URL changed to: "${this.baseUrl}"`);
    }

    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[ApiClient] Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    setTimeout(ms) {
        this.timeout = ms;
        this.instance.defaults.timeout = ms;
    }
    setupInterceptors() {
        this.instance.interceptors.request.use(
            (config) => {
                if (this.debugMode) {
                    console.log(`[${config.method.toUpperCase()}] ${config.baseURL || ''}${config.url}`);
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.instance.interceptors.response.use(
            (response) => response.data,
            (error) => {
                const message = error.response?.statusText || error.message || 'Request failed';
                error.userMessage = `${error.response?.status || 'Error'}: ${message}`;
                return Promise.reject(error);
            }
        );
    }

    get(endpoint, config = {}) {
        return this.instance.get(endpoint, config);
    }

    post(endpoint, data = {}, config = {}) {
        return this.instance.post(endpoint, data, config);
    }

    put(endpoint, data = {}, config = {}) {
        return this.instance.put(endpoint, data, config);
    }

    delete(endpoint, config = {}) {
        return this.instance.delete(endpoint, config);
    }

    patch(endpoint, data = {}, config = {}) {
        return this.instance.patch(endpoint, data, config);
    }

    request(config) {
        return this.instance.request(config);
    }
}

// ===================================================================
// INITIALIZATION - Create and export the ApiClient instance
// ===================================================================
let apiClientInstance = null;

function initApiClient() {
    if (!apiClientInstance) {
        if (typeof axios === 'undefined') {
            console.error('[ApiClient] ✗ Axios not loaded');
            throw new Error('Axios library must be loaded before ApiClient');
        }

        try {
            apiClientInstance = new ApiClient();
            console.log(`[ApiClient] ✓ All HTTP requests will use base URL: "${apiClientInstance.getBaseUrl() || '(root)'}"`);
        } catch (error) {
            console.error('[ApiClient] ✗ Error:', error.message);
            throw error;
        }
    }
    return apiClientInstance;
}

// Auto-initialize when script loads (for backward compatibility with non-module scripts)
if (typeof axios !== 'undefined') {
    try {
        const client = initApiClient();
        window.ApiClient = client;
    } catch (error) {
        console.error('[ApiClient] Failed to initialize:', error.message);
    }
}

// ES6 Module Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, initApiClient };
}



