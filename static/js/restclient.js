/**
 * REST CLIENT - Axios-Based API Communication Layer
 * 
 * PURPOSE: Handle all HTTP requests to backend API endpoints using Axios
 * FEATURES:
 *   - Configurable base URL for development/production
 *   - Promise-based (async/await compatible)
 *   - Automatic JSON transformation
 *   - Request/response interceptors
 *   - Error handling with detailed messages
 *   - Request timeout support (default 30s)
 *   - Request logging for debugging
 * 
 * REQUIREMENTS:
 *   - Axios library: static/js/axios.min.js (must be loaded first!)
 *   - Script loading order MUST be:
 *     1. jQuery
 *     2. Bootstrap
 *     3. axios.min.js (THIS IS CRITICAL!)
 *     4. restclient.js (this file)
 *     5. endpoints.js
 *     6. Application scripts
 * 
 * HOW TO USE:
 *   1. Base URL is set to '/kvb/' - all requests will use this prefix
 *   2. Make requests: 
 *      - ApiClient.get('/api/users')   -> resolves to /kvb/api/users
 *      - ApiClient.post('/api/users', {name: 'admin'})
 *      - ApiClient.put('/api/users/1', {name: 'updated'})
 *      - ApiClient.delete('/api/users/1')
 *   3. All return Promises (use async/await or .then()/.catch())
 *   4. To change base URL: ApiClient.setBaseUrl('/new/path')
 * 
 * TROUBLESHOOTING:
 *   - If you see "ApiClient is not defined", check script loading order
 *   - If you see "ApiClient.get is not a function", axios is not loaded
 *   - Check browser console for [ApiClient] diagnostic messages
 * 
 * ENVIRONMENT CONFIGURATION:
 *   - Base URL: /kvb/ (Flask app sub-path)
 *   - API endpoints: /kvb/api/parva, /kvb/api/sandhi, etc.
 */

class ApiClient {
    /**
     * Constructor
     * Initialize Axios instance with default configuration
     */
    constructor() {
        // Detect and set base URL for API requests
        // Supports both root deployment (/) and subdirectory deployment (/subpath/)
        this.baseUrl = this.detectBaseUrl();
        this.timeout = 30000; // 30 seconds
        this.debugMode = false; // Set to true for console logging

        // Check if Axios is available
        if (typeof axios === 'undefined') {
            console.error('[ApiClient] FATAL: axios library is not defined. Check script loading order.');
            throw new Error('Axios library not loaded. Ensure axios.min.js is loaded before restclient.js');
        }

        // Create Axios instance with default config
        this.instance = axios.create({
            timeout: this.timeout,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        // Setup interceptors
        this.setupInterceptors();
    }

    /**
     * Detect the base URL for API and page navigation
     * Handles both root deployment (/) and subdirectory deployment (/subpath/)
     * 
     * @private
     * @returns {string} The detected base URL (empty string for root, or /subpath for subdirectory)
     */
    detectBaseUrl() {
        const pathname =""

        // Check if pathname indicates a subdirectory deployment
        // (e.g., /kvb/, /app/, etc.)
        if (pathname && pathname !== '/' && !pathname.includes('.')) {
            // Extract the first path segment as the base
            const parts = pathname.split('/').filter(p => p);
            if (parts.length > 0) {
                // Return the first segment as base path
                // E.g., if at /kvb/admin or /kvb/stats, return /kvb
                return '/' + parts[0];
            }
        }

        // Default: root deployment, no base URL needed
        return '';
    }

    /**
     * Get the base URL for navigation links and page references
     * 
     * @returns {string} Base URL for links (e.g., '/kvb' or '')
     */
    getBaseUrl() {
        return this.baseUrl;
    }

    /**
     * Resolve a path with the current base URL
     * Useful for constructing proper links and navigation URLs
     * 
     * @param {string} path - The path to resolve (e.g., '/admin', '/stats')
     * @returns {string} Full path with base URL (e.g., '/kvb/admin')
     */
    resolvePath(path) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return this.baseUrl + cleanPath;
    }

    /**
     * Setup Axios request/response interceptors
     * Private method - handles logging and error formatting
     */
    setupInterceptors() {
        // Request interceptor
        this.instance.interceptors.request.use(
            (config) => {
                // Add base URL if configured
                if (this.baseUrl) {
                    config.baseURL = this.baseUrl;
                }

                this.log(`[${config.method.toUpperCase()}] ${config.url}`);
                if (config.data) {
                    this.log(`Request Data:`, config.data);
                }
                return config;
            },
            (error) => {
                this.logError('Request Error:', error);
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.instance.interceptors.response.use(
            (response) => {
                this.log(`Response (${response.status}):`, response.data);
                return response.data; // Return only data, not full response
            },
            (error) => {
                let errorMessage = 'API Request Failed';

                if (error.response) {
                    // Server responded with error status
                    errorMessage = `${error.response.status}: ${error.response.statusText}`;
                    this.logError(`Response Error (${error.response.status}):`, error.response.data);
                } else if (error.request) {
                    // Request made but no response
                    errorMessage = 'No Response from Server';
                    this.logError('No Response:', error.request);
                } else {
                    // Error in request setup
                    errorMessage = error.message;
                    this.logError('Error:', error);
                }

                error.userMessage = errorMessage;
                return Promise.reject(error);
            }
        );
    }

    /**
     * Set the base URL for all API requests
     * 
     * PURPOSE: Configure API endpoint location
     * HOW TO USE: Call this once on page load or app initialization
     * 
     * @param {string} url - Base URL (e.g., 'http://localhost:8443' or 'https://api.example.com')
     * EXAMPLE: ApiClient.setBaseUrl('http://localhost:8443');
     */
    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
        this.instance.defaults.baseURL = this.baseUrl;
        this.log(`Base URL set to: ${this.baseUrl}`);
    }

    /**
     * Enable or disable debug logging
     * 
     * @param {boolean} enabled - Enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        this.log(`Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Set timeout for all requests
     * 
     * @param {number} ms - Timeout in milliseconds
     */
    setTimeout(ms) {
        this.timeout = ms;
        this.instance.defaults.timeout = ms;
        this.log(`Timeout set to: ${ms}ms`);
    }

    /**
     * Internal logging function
     * 
     * @param {string} message - Message to log
     * @param {any} data - Optional data to log
     */
    log(message, data = null) {
        if (this.debugMode) {
            if (data) {
                console.log(`[ApiClient] ${message}`, data);
            } else {
                console.log(`[ApiClient] ${message}`);
            }
        }
    }

    /**
     * Internal error logging function
     * 
     * @param {string} message - Error message
     * @param {Object} error - Error object
     */
    logError(message, error) {
        if (this.debugMode) {
            console.error(`[ApiClient] ${message}`, error);
        }
    }

    /**
     * GET Request - Retrieve data from server
     * 
     * PURPOSE: Fetch data from API endpoint
     * HOW TO USE: ApiClient.get('/api/users')
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} config - Optional Axios config (headers, params, etc.)
     * @returns {Promise} Promise that resolves with response data
     * 
     * EXAMPLE:
     *   ApiClient.get('/api/parva')
     *     .then(parvas => console.log('Parvas:', parvas))
     *     .catch(error => console.error('Error:', error.userMessage));
     */
    get(endpoint, config = {}) {
        return this.instance.get(endpoint, config);
    }

    /**
     * POST Request - Create new data on server
     * 
     * PURPOSE: Send data to create new resource
     * HOW TO USE: ApiClient.post('/api/users', {username: 'test', password: '123456'})
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send
     * @param {Object} config - Optional Axios config
     * @returns {Promise} Promise that resolves with response data
     * 
     * EXAMPLE:
     *   ApiClient.post('/api/users', {
     *       username: 'admin_user',
     *       password: 'password123',
     *       phone_number: '9876543210'
     *   })
     *   .then(response => console.log('User created:', response))
     *   .catch(error => console.error('Error:', error.userMessage));
     */
    post(endpoint, data = {}, config = {}) {
        return this.instance.post(endpoint, data, config);
    }

    /**
     * PUT Request - Update existing data on server
     * 
     * PURPOSE: Send data to update existing resource
     * HOW TO USE: ApiClient.put('/api/padya', {padya_number: 1, padya: 'new text'})
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send for update
     * @param {Object} config - Optional Axios config
     * @returns {Promise} Promise that resolves with response data
     * 
     * EXAMPLE:
     *   ApiClient.put('/api/padya', {
     *       parva_number: 1,
     *       sandhi_number: 1,
     *       padya_number: 1,
     *       padya: 'Updated verse text'
     *   })
     *   .then(response => console.log('Updated:', response))
     *   .catch(error => console.error('Error:', error.userMessage));
     */
    put(endpoint, data = {}, config = {}) {
        return this.instance.put(endpoint, data, config);
    }

    /**
     * DELETE Request - Remove data from server
     * 
     * PURPOSE: Send request to delete resource
     * HOW TO USE: ApiClient.delete('/api/users/123')
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} config - Optional Axios config
     * @returns {Promise} Promise that resolves with response data
     * 
     * EXAMPLE:
     *   ApiClient.delete('/api/users/admin_user')
     *     .then(response => console.log('Deleted:', response))
     *     .catch(error => console.error('Error:', error.userMessage));
     */
    delete(endpoint, config = {}) {
        return this.instance.delete(endpoint, config);
    }

    /**
     * PATCH Request - Partial update of existing data
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send
     * @param {Object} config - Optional Axios config
     * @returns {Promise} Promise that resolves with response data
     */
    patch(endpoint, data = {}, config = {}) {
        return this.instance.patch(endpoint, data, config);
    }

    /**
     * Make a custom request with full control
     * 
     * @param {Object} config - Axios config object
     * @returns {Promise} Promise that resolves with response data
     */
    request(config) {
        return this.instance.request(config);
    }
}

/**
 * Global instance - Create and use throughout the application
 * 
 * NOTE: Base URL is initialized to '/kvb/' for Flask app routing
 * Override with ApiClient.setBaseUrl(newUrl) if needed
 * 
 * HOW TO USE:
 *   // In your components (using async/await - recommended):
 *   try {
 *       const users = await ApiClient.get('/api/users');
 *       console.log(users);
 *   } catch (error) {
 *       console.error(error.userMessage);
 *   }
 *   
 *   // Or using .then()/.catch():
 *   ApiClient.get('/api/users')
 *       .then(users => console.log(users))
 *       .catch(error => console.error(error.userMessage));
 *   
 *   // Enable debugging:
 *   ApiClient.setDebugMode(true);
 */

// Create a global singleton instance
if (typeof axios !== 'undefined' && axios !== null) {
    try {
        window.ApiClient = new ApiClient();
        console.log('[ApiClient] ✓ Initialized successfully with Axios v' + axios.VERSION);
    } catch (error) {
        console.error('[ApiClient] ✗ Failed to initialize:', error.message);
        // Create a fallback stub to prevent runtime errors
        window.ApiClient = {
            get: function () { throw new Error('ApiClient not initialized: ' + error.message); },
            post: function () { throw new Error('ApiClient not initialized: ' + error.message); },
            put: function () { throw new Error('ApiClient not initialized: ' + error.message); },
            delete: function () { throw new Error('ApiClient not initialized: ' + error.message); }
        };
    }
} else {
    console.error('[ApiClient] ✗ FATAL: Axios library not loaded!');
    // Create a fallback stub to prevent immediate crashes
    window.ApiClient = {
        get: function () { throw new Error('Axios library not loaded'); },
        post: function () { throw new Error('Axios library not loaded'); },
        put: function () { throw new Error('Axios library not loaded'); },
        delete: function () { throw new Error('Axios library not loaded'); }
    };
}



