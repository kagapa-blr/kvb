/**
 * ApiClient - Universal HTTP Request Handler
 * Supports both ES6 modules and global browser scripts
 * 
 * Usage:
 * - Browser: <script src="restclient.js"></script> then use window.ApiClient
 * - ES6 Module: import { ApiClient } from './restclient.js'
 */

(function (global) {


    const BASE_PATH = "";

    class ApiClient {
        constructor(baseUrl = BASE_PATH) {
            this.baseUrl = baseUrl || "";
            this.timeout = 30000;
            this.debugMode = false;

            // Wait for axios to be available
            if (typeof axios === 'undefined') {
                console.warn('[ApiClient] Axios not yet loaded, will retry initialization');
                this.instance = null;
                this.initializationPromise = this.waitForAxios();
            } else {
                this.instance = this.createAxiosInstance(baseUrl);
            }
        }

        /**
         * Wait for axios to become available
         * @private
         */
        waitForAxios() {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (typeof axios !== 'undefined') {
                        clearInterval(checkInterval);
                        this.instance = this.createAxiosInstance(this.baseUrl);
                        console.log('[ApiClient] Axios loaded, instance ready');
                        resolve(this.instance);
                    }
                }, 50);

                // Timeout after 10 seconds
                setTimeout(() => {
                    clearInterval(checkInterval);
                    console.error('[ApiClient] Timeout waiting for axios');
                    resolve(null);
                }, 10000);
            });
        }

        /**
         * Create axios instance with configuration
         * @private
         */
        createAxiosInstance(baseUrl) {
            const instance = axios.create({
                baseURL: baseUrl || this.baseUrl,
                timeout: this.timeout,
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                }
            });

            this.setupInterceptors(instance);
            return instance;
        }

        /**
         * Setup request/response interceptors
         * @private
         */
        setupInterceptors(instance) {
            instance.interceptors.request.use(
                (config) => {
                    if (this.debugMode) {
                        console.log(
                            `[${config.method.toUpperCase()}]`,
                            `${config.baseURL || ""}${config.url}`
                        );
                    }
                    return config;
                },
                (error) => Promise.reject(error)
            );

            instance.interceptors.response.use(
                (response) => response.data,
                (error) => {
                    const message =
                        error.response?.statusText ||
                        error.message ||
                        "Request failed";

                    error.userMessage =
                        `${error.response?.status || "Error"}: ${message}`;

                    return Promise.reject(error);
                }
            );
        }

        /**
         * Get the base URL
         */
        getBaseUrl() {
            return this.baseUrl;
        }

        /**
         * Resolve a path with the base URL
         * @param {string} path - The path to resolve
         * @returns {string} Full path with base URL prepended if available
         */
        resolvePath(path) {
            if (!this.baseUrl || this.baseUrl === "") {
                return path;
            }
            // Ensure baseUrl doesn't end with / and path starts with /
            const cleanBase = this.baseUrl.replace(/\/$/, "");
            const cleanPath = path.startsWith("/") ? path : "/" + path;
            return cleanBase + cleanPath;
        }

        /**
         * Set base URL
         */
        setBaseUrl(url) {
            this.baseUrl = (url || "").replace(/\/$/, "");
            if (this.instance) {
                this.instance.defaults.baseURL = this.baseUrl;
            }
        }

        /**
         * Enable/disable debug mode
         */
        setDebugMode(enabled) {
            this.debugMode = enabled;
        }

        /**
         * Set request timeout
         */
        setTimeout(ms) {
            this.timeout = ms;
            if (this.instance) {
                this.instance.defaults.timeout = ms;
            }
        }

        /**
         * Ensure axios instance is ready
         * @private
         */
        async ensureReady() {
            if (!this.instance && this.initializationPromise) {
                await this.initializationPromise;
            }
            if (!this.instance) {
                throw new Error('[ApiClient] Axios is not available');
            }
            return this.instance;
        }

        /**
         * GET request
         */
        async get(endpoint, config = {}) {
            const instance = await this.ensureReady();
            return instance.get(endpoint, config);
        }

        /**
         * POST request
         */
        async post(endpoint, data = {}, config = {}) {
            const instance = await this.ensureReady();
            return instance.post(endpoint, data, config);
        }

        /**
         * PUT request
         */
        async put(endpoint, data = {}, config = {}) {
            const instance = await this.ensureReady();
            return instance.put(endpoint, data, config);
        }

        /**
         * DELETE request
         */
        async delete(endpoint, config = {}) {
            const instance = await this.ensureReady();
            return instance.delete(endpoint, config);
        }

        /**
         * PATCH request
         */
        async patch(endpoint, data = {}, config = {}) {
            const instance = await this.ensureReady();
            return instance.patch(endpoint, data, config);
        }

        /**
         * Generic request
         */
        async request(config) {
            const instance = await this.ensureReady();
            return instance.request(config);
        }
    }

    // ============================================
    // Singleton Instance Management
    // ============================================

    let apiClientInstance = null;

    /**
     * Get or create the singleton ApiClient instance
     */
    function getApiClient() {
        if (!apiClientInstance) {
            apiClientInstance = new ApiClient();
        }
        return apiClientInstance;
    }

    /**
     * Initialize the singleton ApiClient and expose to global scope
     */
    function initializeGlobalApiClient() {
        const instance = getApiClient();

        // Expose to global scope for browser scripts
        if (typeof window !== 'undefined') {
            window.ApiClient = instance;
            console.log('[RestClient] ✓ ApiClient singleton initialized and exposed to window');
        }

        return instance;
    }

    // ============================================
    // Module Exports (Browser & CommonJS)
    // ============================================

    // ES6 Module export
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {
            ApiClient: ApiClient,
            getApiClient: getApiClient,
            initializeGlobalApiClient: initializeGlobalApiClient
        };
    }

    // Browser global export
    if (typeof window !== 'undefined') {
        // Initialize on script load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeGlobalApiClient);
        } else {
            // DOM already loaded
            initializeGlobalApiClient();
        }

        // Also try initializing immediately in case axios is already loaded
        setTimeout(initializeGlobalApiClient, 0);
    }

    // Export for AMD (if needed)
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return {
                ApiClient: ApiClient,
                getApiClient: getApiClient,
                initializeGlobalApiClient: initializeGlobalApiClient
            };
        });
    }

})(typeof window !== 'undefined' ? window : global);
