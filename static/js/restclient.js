/**
 * REST CLIENT - Centralized API communication layer
 * 
 * PURPOSE: Handle all HTTP requests to backend API endpoints
 * FEATURES:
 *   - Configurable base URL for development/production
 *   - Standard request/response handling
 *   - Error handling with Kannada messages
 *   - Request timeout support
 *   - Request logging for debugging
 * 
 * HOW TO USE:
 *   1. Set base URL: ApiClient.setBaseUrl('http://localhost:8443');
 *   2. Make requests: ApiClient.get('/api/users').then(data => {...});
 *   3. POST/PUT/DELETE work similarly
 * 
 * ENVIRONMENT CONFIGURATION:
 *   - Development: http://localhost:8443
 *   - Production: https://yourdomain.com
 */

class ApiClient {
    /**
     * Constructor
     * Initialize with default base URL (can be changed)
     */
    constructor() {
        this.baseUrl = ''; // Default to current origin
        this.timeout = 30000; // 30 seconds
        this.debugMode = false; // Set to true for console logging
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
        this.log(`Base URL set to: ${this.baseUrl}`);
    }

    /**
     * Enable or disable debug logging
     * 
     * @param {boolean} enabled - Enable debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    /**
     * Internal logging function
     * 
     * @param {string} message - Message to log
     */
    log(message) {
        if (this.debugMode) {
            console.log(`[ApiClient] ${message}`);
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
     * Build full URL from endpoint
     * 
     * @param {string} endpoint - API endpoint (e.g., '/api/users')
     * @returns {string} Full URL
     */
    buildUrl(endpoint) {
        const url = this.baseUrl + endpoint;
        this.log(`Built URL: ${url}`);
        return url;
    }

    /**
     * Internal method to make AJAX requests
     * 
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Request data (for POST/PUT)
     * @returns {Promise} jQuery promise
     */
    request(method, endpoint, data = null) {
        const url = this.buildUrl(endpoint);
        const self = this;

        this.log(`${method} Request: ${endpoint}`);
        if (data) {
            this.log(`Request Data:`, data);
        }

        return $.ajax({
            url: url,
            type: method,
            contentType: 'application/json',
            data: data ? JSON.stringify(data) : undefined,
            timeout: this.timeout,
            dataType: 'json'
        })
            .done(function (response) {
                self.log(`${method} Success (${endpoint}):`, response);
            })
            .fail(function (xhr, status, error) {
                self.logError(`${method} Failed (${endpoint}): ${status} - ${error}`, xhr);
            });
    }

    /**
     * GET Request - Retrieve data from server
     * 
     * PURPOSE: Fetch data from API endpoint
     * HOW TO USE: ApiClient.get('/api/users').then(data => console.log(data));
     * 
     * @param {string} endpoint - API endpoint
     * @returns {Promise} jQuery promise with response data
     * 
     * EXAMPLE:
     *   ApiClient.get('/api/parva')
     *     .done(function(parvas) {
     *         console.log('Parvas:', parvas);
     *     })
     *     .fail(function(xhr) {
     *         console.error('Error:', xhr.responseJSON.error);
     *     });
     */
    get(endpoint) {
        return this.request('GET', endpoint);
    }

    /**
     * POST Request - Create new data on server
     * 
     * PURPOSE: Send data to create new resource
     * HOW TO USE: ApiClient.post('/api/users', {username: 'test', password: '123456'})
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send
     * @returns {Promise} jQuery promise with response
     * 
     * EXAMPLE:
     *   ApiClient.post('/api/users', {
     *       username: 'admin_user',
     *       password: 'password123',
     *       email: 'admin@example.com',
     *       phone_number: '9876543210'
     *   })
     *   .done(function(response) {
     *       console.log('User created:', response);
     *   })
     *   .fail(function(xhr) {
     *       console.error('Error:', xhr.responseJSON.error);
     *   });
     */
    post(endpoint, data) {
        return this.request('POST', endpoint, data);
    }

    /**
     * PUT Request - Update existing data on server
     * 
     * PURPOSE: Send data to update existing resource
     * HOW TO USE: ApiClient.put('/api/padya', {padya_number: 1, padya: 'new text'})
     * 
     * @param {string} endpoint - API endpoint
     * @param {Object} data - Data to send for update
     * @returns {Promise} jQuery promise with response
     * 
     * EXAMPLE:
     *   ApiClient.put('/api/padya', {
     *       parva_number: 1,
     *       sandhi_number: 1,
     *       padya_number: 1,
     *       padya: 'Updated verse text',
     *       pathantar: 'Alternative reading',
     *       gadya: 'Prose version',
     *       tippani: 'Commentary',
     *       artha: 'Meaning'
     *   })
     */
    put(endpoint, data) {
        return this.request('PUT', endpoint, data);
    }

    /**
     * DELETE Request - Remove data from server
     * 
     * PURPOSE: Delete resource from API
     * HOW TO USE: ApiClient.delete('/api/users/admin_user')
     * 
     * @param {string} endpoint - API endpoint with resource identifier
     * @returns {Promise} jQuery promise with response
     * 
     * EXAMPLE:
     *   ApiClient.delete('/api/users/admin_user')
     *     .done(function(response) {
     *         console.log('User deleted');
     *     })
     *     .fail(function(xhr) {
     *         console.error('Delete failed:', xhr.responseJSON.error);
     *     });
     */
    delete(endpoint) {
        return this.request('DELETE', endpoint);
    }

    /**
     * POST with file upload (multipart/form-data)
     * 
     * PURPOSE: Upload files to server
     * HOW TO USE: ApiClient.uploadFile('/api/upload', fileInputElement.files[0])
     * 
     * @param {string} endpoint - API endpoint
     * @param {File} file - File to upload
     * @param {Object} additionalData - Additional form data
     * @returns {Promise} jQuery promise
     */
    uploadFile(endpoint, file, additionalData = {}) {
        const url = this.buildUrl(endpoint);
        const formData = new FormData();

        formData.append('file', file);

        // Add any additional data to form
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });

        this.log(`File Upload: ${endpoint}`);

        return $.ajax({
            url: url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            timeout: this.timeout
        })
            .done(function (response) {
                this.log(`File Upload Success (${endpoint}):`, response);
            }.bind(this))
            .fail(function (xhr, status, error) {
                this.logError(`File Upload Failed (${endpoint}): ${status} - ${error}`, xhr);
            }.bind(this));
    }

    /**
     * Check if API is accessible (health check)
     * 
     * PURPOSE: Verify API connectivity
     * HOW TO USE: ApiClient.healthCheck().done(() => console.log('API is up'));
     * 
     * @returns {Promise} jQuery promise
     */
    healthCheck() {
        return this.get('/api/parva?limit=1')
            .done(function () {
                this.log('API Health Check: OK');
            }.bind(this))
            .fail(function () {
                this.log('API Health Check: FAILED');
            }.bind(this));
    }
}

/**
 * Global instance - Create and use throughout the application
 * 
 * HOW TO USE:
 *   // In your app initialization:
 *   ApiClient.setBaseUrl('http://localhost:8443');
 *   
 *   // In your components:
 *   ApiClient.get('/api/users')
 *       .done(function(users) { ... })
 *       .fail(function(xhr) { ... });
 */

// Create a global singleton instance
window.ApiClient = new ApiClient();

// Auto-detect base URL based on current environment
// In development: http://localhost:PORT
// In production: https://yourdomain.com
// You can override this by calling ApiClient.setBaseUrl() in your initialization
if (window.ApiClient && typeof window.ApiClient.log === 'function') {
    window.ApiClient.log(`Initializing with origin: ${window.location.origin}`);
}

