class ApiClient {
    constructor(baseUrl = '') {
        if (typeof axios === 'undefined') {
            throw new Error('Axios library not loaded');
        }

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

    setBaseUrl(url) {
        this.baseUrl = url.replace(/\/$/, '');
        this.instance.defaults.baseURL = this.baseUrl;
        console.log(`[ApiClient] Base URL: "${this.baseUrl}"`);
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

// Initialize global instance
if (typeof axios !== 'undefined') {
    try {
        window.ApiClient = new ApiClient();
        console.log('[ApiClient] ✓ Ready');
    } catch (error) {
        console.error('[ApiClient] ✗ Error:', error.message);
        window.ApiClient = { get: () => { throw error; }, post: () => { throw error; } };
    }
} else {
    console.error('[ApiClient] ✗ Axios not loaded');
    window.ApiClient = { get: () => { throw new Error('Axios not loaded'); }, post: () => { throw new Error('Axios not loaded'); } };
}



