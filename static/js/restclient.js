/**
 * ApiClient - Modern ES6 Module for HTTP Requests
 * 
 * Usage:
 * import { apiClient } from './restclient.js';
 * const response = await apiClient.get('/endpoint');
 * 
 * Or import the class:
 * import { ApiClient } from './restclient.js';
 * const client = new ApiClient('/api/v1');
 */

const BASE_PATH = "";  // Empty by default, set to your API base path (e.g., '/api/v1' or '/kvb/api/v1')

class ApiClient {
    constructor(baseUrl = BASE_PATH) {
        this.baseUrl = baseUrl || "";
        this.timeout = 30000;
        this.debugMode = false;
        this.defaults = {
            baseURL: this.baseUrl,
            timeout: this.timeout
        };

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
                    console.log('[ApiClient] ✓ Axios loaded, instance ready');
                    resolve(this.instance);
                }
            }, 50);

            // Timeout after 10 seconds
            setTimeout(() => {
                clearInterval(checkInterval);
                console.error('[ApiClient] ✗ Timeout waiting for axios');
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
     * Set base URL dynamically
     */
    setBaseUrl(url) {
        this.baseUrl = url;
        this.defaults.baseURL = url;
        if (this.instance) {
            this.instance.defaults.baseURL = url;
        }
        console.log(`[ApiClient] ✓ Base URL updated to: ${url}`);
    }

    /**
     * Set debug mode
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        console.log(`[ApiClient] ✓ Debug mode: ${enabled ? 'ON' : 'OFF'}`);
    }

    /**
     * Ensure axios instance is ready
     * @private
     */
    async ensureInstance() {
        if (!this.instance) {
            if (this.initializationPromise) {
                await this.initializationPromise;
            }
            if (!this.instance) {
                throw new Error('ApiClient: Axios instance not initialized');
            }
        }
    }

    /**
     * Generic request method
     */
    async request(config) {
        await this.ensureInstance();
        return this.instance.request(config);
    }

    /**
     * GET request
     */
    async get(url, config = {}) {
        await this.ensureInstance();
        return this.instance.get(url, config);
    }

    /**
     * POST request
     */
    async post(url, data = {}, config = {}) {
        await this.ensureInstance();
        return this.instance.post(url, data, config);
    }

    /**
     * PUT request
     */
    async put(url, data = {}, config = {}) {
        await this.ensureInstance();
        return this.instance.put(url, data, config);
    }

    /**
     * PATCH request
     */
    async patch(url, data = {}, config = {}) {
        await this.ensureInstance();
        return this.instance.patch(url, data, config);
    }

    /**
     * DELETE request
     */
    async delete(url, config = {}) {
        await this.ensureInstance();
        return this.instance.delete(url, config);
    }
}

// Create singleton instance
const apiClient = new ApiClient(BASE_PATH);

// Backward compatibility: Expose on window for templates that haven't been migrated to ES6 modules
if (typeof window !== 'undefined') {
    window.ApiClient = apiClient;
}

// ES6 Module exports
export { ApiClient, apiClient };
