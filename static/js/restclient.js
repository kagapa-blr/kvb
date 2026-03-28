const BASE_PATH = "";

class ApiClient {

    constructor(baseUrl = BASE_PATH) {

        this.baseUrl = baseUrl;
        this.timeout = 30000;
        this.debugMode = false;

        this.instance = axios.create({
            baseURL: this.baseUrl,
            timeout: this.timeout,
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
        });

        this.setupInterceptors();
    }

    setupInterceptors() {

        this.instance.interceptors.request.use(
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

        this.instance.interceptors.response.use(
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

    setBaseUrl(url) {

        this.baseUrl = url.replace(/\/$/, "");

        this.instance.defaults.baseURL =
            this.baseUrl;
    }

    setDebugMode(enabled) {

        this.debugMode = enabled;
    }

    setTimeout(ms) {

        this.timeout = ms;

        this.instance.defaults.timeout = ms;
    }

    get(endpoint, config = {}) {

        return this.instance.get(
            endpoint,
            config
        );
    }

    post(endpoint, data = {}, config = {}) {

        return this.instance.post(
            endpoint,
            data,
            config
        );
    }

    put(endpoint, data = {}, config = {}) {

        return this.instance.put(
            endpoint,
            data,
            config
        );
    }

    delete(endpoint, config = {}) {

        return this.instance.delete(
            endpoint,
            config
        );
    }

    patch(endpoint, data = {}, config = {}) {

        return this.instance.patch(
            endpoint,
            data,
            config
        );
    }

    request(config) {

        return this.instance.request(
            config
        );
    }
}


// Singleton instance

const apiClient =
    new ApiClient();


// Browser global fallback

if (typeof window !== "undefined") {

    window.ApiClient =
        apiClient;
}


// Proper ES module export

export default apiClient;