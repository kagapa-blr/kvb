/**
 * API ENDPOINTS - Centralized configuration for all backend API routes
 * 
 * PURPOSE: Single source of truth for API configuration and endpoint definitions
 * 
 * ARCHITECTURE:
 *   - Centralized API base path configuration
 *   - Consistent naming conventions for all endpoints
 *   - Helper methods for common operations
 *   - Clear separation of concerns
 * 
 * FEATURES:
 *   - Dynamic endpoint construction with parameter substitution
 *   - Built-in path validation and normalization
 *   - Resource-based organization (REST principles)
 *   - Easy discovery of available endpoints
 * 
 * USAGE EXAMPLES:
 *   // Simple endpoints
 *   ApiClient.get(ApiEndpoints.PARVA.list())
 *   
 *   // Dynamic endpoints with IDs
 *   ApiClient.get(ApiEndpoints.PARVA.byId(5))
 *   ApiClient.delete(ApiEndpoints.USERS.delete('admin'))
 *   
 *   // Complex endpoints with multiple parameters
 *   ApiClient.get(ApiEndpoints.PADYA.getByParvaSandhiPadya(1, 2, 3))
 *   ApiClient.get(ApiEndpoints.GAMAKA.byPadya('?parva_id=1&sandhi_id=2&padya_number=3'))
 */

const ApiEndpoints = {
    /**
     * API CONFIGURATION
     * Centralized settings for all API calls
     */
    CONFIG: {
        // Base path for all API calls
        API_BASE: '/api',

        // Response format
        FORMAT: 'json',

        // Timeout (managed by ApiClient, but documented here)
        TIMEOUT: 30000,

        // Enable/disable detailed logging
        DEBUG: false
    },

    /**
     * Helper to construct full endpoint paths
     * @param {string} path - Relative path from API base
     * @returns {string} Full endpoint path
     */
    _buildPath(path) {
        const base = this.CONFIG.API_BASE;
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${base}${cleanPath}`;
    },
    // ========================================
    // USER MANAGEMENT ENDPOINTS
    // ========================================
    USERS: {
        list: () => ApiEndpoints._buildPath('/users'),
        create: () => ApiEndpoints._buildPath('/users'),
        get: (username) => ApiEndpoints._buildPath(`/users/${username}`),
        delete: (username) => ApiEndpoints._buildPath(`/users/${username}`),

        // Backward compatibility
        LIST: '/api/users',
        CREATE: '/api/users',
        DELETE: (username) => `/api/users/${username}`,
    },

    // ========================================
    // PARVA (Book/Section) ENDPOINTS
    // ========================================
    PARVA: {
        list: () => ApiEndpoints._buildPath('/parva'),
        create: () => ApiEndpoints._buildPath('/parva'),
        get: (id) => ApiEndpoints._buildPath(`/parva/${id}`),
        sandhisByParva: (parvaNumber) => ApiEndpoints._buildPath(`/all_sandhi/by_parva/${parvaNumber}`),

        // Backward compatibility
        LIST: '/api/parva',
        GET_BY_ID: (id) => `/api/parva/${id}`,
        ALL_SANDHIS: '/api/sandhi',
        SANDHIS_BY_PARVA: (parvaNumber) => `/api/all_sandhi/by_parva/${parvaNumber}`,
    },

    // ========================================
    // SANDHI (Chapter/Division) ENDPOINTS
    // ========================================
    SANDHI: {
        list: () => ApiEndpoints._buildPath('/sandhi'),
        get: (id) => ApiEndpoints._buildPath(`/sandhi/${id}`),
        byParva: (parvaNumber) => ApiEndpoints._buildPath(`/all_sandhi/by_parva/${parvaNumber}`),
        padyas: (sandhiId) => ApiEndpoints._buildPath(`/padya/by_sandhi/${sandhiId}`),

        // Backward compatibility
        LIST: '/api/sandhi',
        GET_BY_ID: (id) => `/api/sandhi/${id}`,
        BY_PARVA: (parvaNumber) => `/api/all_sandhi/by_parva/${parvaNumber}`,
        PADYAS_BY_SANDHI: (sandhiId) => `/api/padya/by_sandhi/${sandhiId}`,
    },

    // ========================================
    // PADYA (Verse) ENDPOINTS
    // ========================================
    PADYA: {
        list: () => ApiEndpoints._buildPath('/padya'),
        create: () => ApiEndpoints._buildPath('/padya'),
        get: (id) => ApiEndpoints._buildPath(`/padya/${id}`),
        update: () => ApiEndpoints._buildPath('/padya'),
        delete: (id) => ApiEndpoints._buildPath(`/padya/${id}`),
        byParva: (parvaNumber, sandhiNumber, padyaNumber) =>
            ApiEndpoints._buildPath(`/padya/by_parva_sandhi_padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`),

        // Backward compatibility
        LIST: '/api/padya',
        CREATE: '/api/padya',
        GET_BY_ID: (sandhiId, padyaNumber) => `/api/padya/${sandhiId}/${padyaNumber}`,
        UPDATE: '/api/padya',
        DELETE: (id) => `/api/padya/${id}`,
        BY_SANDHI: (sandhiId) => `/api/padya/by_sandhi/${sandhiId}`,
        GET_CONTENT: (sandhiId, padyaNumber) => `/api/padya/${sandhiId}/${padyaNumber}`,
        GET_BY_PARVA_SANDHI_PADYA: (parvaNumber, sandhiNumber, padyaNumber) =>
            `/api/padya/by_parva_sandhi_padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
    },

    // ========================================
    // GAMAKA VACHANA (Musical Raag/Singer Info) ENDPOINTS
    // ========================================
    GAMAKA: {
        list: () => ApiEndpoints._buildPath('/gamaka'),
        create: () => ApiEndpoints._buildPath('/gamaka'),
        get: (id) => ApiEndpoints._buildPath(`/gamaka/${id}`),
        update: (id) => ApiEndpoints._buildPath(`/gamaka/${id}`),
        delete: (id) => ApiEndpoints._buildPath(`/gamaka/${id}`),
        byPadya: (queryParams = '') => ApiEndpoints._buildPath(`/gamaka/padya${queryParams}`),

        // Backward compatibility
        LIST: '/api/gamaka',
        CREATE: '/api/gamaka',
        GET_BY_ID: (id) => `/api/gamaka/${id}`,
        UPDATE: (id) => `/api/gamaka/${id}`,
        DELETE: (id) => `/api/gamaka/${id}`,
        BY_PADYA: () => '/api/gamaka/padya',
    },

    // ========================================
    // DASHBOARD STATISTICS ENDPOINTS
    // ========================================
    DASHBOARD: {
        stats: () => ApiEndpoints._buildPath('/dashboard/stats'),

        // Backward compatibility
        STATS: '/api/dashboard/stats',
    },

    // ========================================
    // ADDITIONAL CONTENT MANAGEMENT ENDPOINTS
    // ========================================
    ADDITIONAL: {
        akaradiUpdate: () => ApiEndpoints._buildPath('/akaradi-suchi/update'),
        gadeUpload: () => ApiEndpoints._buildPath('/gade-suchi/upload'),
        tippaniUpdate: () => ApiEndpoints._buildPath('/tippani/update'),

        // Backward compatibility
        AKARADI_UPDATE: '/akaradi-suchi/update',
        GADE_UPLOAD: '/gade-suchi/upload',
        TIPPANI_UPDATE: '/tippani/update',
    },

    /**
     * UTILITY METHODS
     * Helper functions for endpoint management and discovery
     */

    /**
     * Update API base path dynamically
     * Useful if API base changes at runtime
     * 
     * @param {string} newBase - New API base path (e.g., '/api/v2')
     */
    setApiBase(newBase) {
        this.CONFIG.API_BASE = newBase;
        console.log(`[ApiEndpoints] API base updated to: ${newBase}`);
    },

    /**
     * Get current API base configuration
     * @returns {Object} Current API configuration
     */
    getConfig() {
        return { ...this.CONFIG };
    },

    /**
     * Build URL with parameters
     * 
     * PURPOSE: Helper to construct URLs with dynamic parameters
     * HOW TO USE: ApiEndpoints.buildUrl('/api/users/{id}', 'username')
     * 
     * @param {string} template - URL template with {param} placeholders
     * @param {*} params - Parameters to substitute (single value or object)
     * @returns {string} Constructed URL
     */
    buildUrl(template, ...params) {
        let url = template;
        params.forEach((param, index) => {
            url = url.replace(new RegExp(`\\{${index}\\}`, 'g'), param);
        });
        return url;
    },

    /**
     * Get all endpoints as a reference object
     * Returns both new (camelCase) and old (UPPERCASE) formats for compatibility
     * 
     * PURPOSE: Developer reference - List all available endpoints
     * HOW TO USE: console.log(ApiEndpoints.getAllEndpoints());
     * 
     * @returns {Object} All endpoints grouped by category
     */
    getAllEndpoints() {
        return {
            users: this.USERS,
            parva: this.PARVA,
            sandhi: this.SANDHI,
            padya: this.PADYA,
            gamaka: this.GAMAKA,
            dashboard: this.DASHBOARD,
            additional: this.ADDITIONAL
        };
    },

    /**
     * Print all available endpoints to console
     * Shows both new camelCase and old UPPERCASE formats
     * 
     * PURPOSE: Quick reference during development
     * HOW TO USE: ApiEndpoints.printEndpoints();
     */
    printEndpoints() {
        console.log('=== AVAILABLE API ENDPOINTS ===\n');
        console.log('API Base:', this.CONFIG.API_BASE);
        console.log('');

        const endpoints = this.getAllEndpoints();
        Object.keys(endpoints).forEach(category => {
            console.log(`${category.toUpperCase()}:`);
            const categoryEndpoints = endpoints[category];
            Object.keys(categoryEndpoints).forEach(key => {
                if (typeof categoryEndpoints[key] === 'function') {
                    console.log(`  ${key}(...) [function]`);
                } else if (typeof categoryEndpoints[key] === 'string') {
                    console.log(`  ${key}: ${categoryEndpoints[key]}`);
                }
            });
            console.log('');
        });
    },

    /**
     * Format query parameters for API calls
     * 
     * @param {Object} params - Query parameters object
     * @returns {string} Formatted query string (e.g., '?key=value&foo=bar')
     */
    formatQueryParams(params) {
        if (!params || Object.keys(params).length === 0) return '';
        const query = new URLSearchParams(params).toString();
        return query ? `?${query}` : '';
    },

    /**
     * Validate if an endpoint exists
     * 
     * @param {string} category - Category name (e.g., 'USERS', 'PADYA')
     * @param {string} endpoint - Endpoint name (e.g., 'list', 'create')
     * @returns {boolean} True if endpoint exists
     */
    hasEndpoint(category, endpoint) {
        return this[category] &&
            (this[category][endpoint] !== undefined || this[category][endpoint.toUpperCase()] !== undefined);
    }
};

// For debugging: Uncomment to see all endpoints on page load
// ApiEndpoints.printEndpoints();

/**
 * =============================================================================
 * ENDPOINT USAGE GUIDE - Quick Reference for Common Operations
 * =============================================================================
 * 
 * Modern Style (Recommended - camelCase):
 * ─────────────────────────────────────
 * 
 * Get all parvas:
 *   ApiClient.get(ApiEndpoints.PARVA.list())
 * 
 * Get sandhis for parva 1:
 *   ApiClient.get(ApiEndpoints.PARVA.sandhisByParva(1))
 * 
 * Get padyas for sandhi 5:
 *   ApiClient.get(ApiEndpoints.SANDHI.padyas(5))
 * 
 * Get specific padya content:
 *   ApiClient.get(ApiEndpoints.PADYA.byParva(1, 2, 3))
 * 
 * Create new padya:
 *   ApiClient.post(ApiEndpoints.PADYA.create(), {...data})
 * 
 * Update padya:
 *   ApiClient.put(ApiEndpoints.PADYA.update(), {...data})
 * 
 * Delete item:
 *   ApiClient.delete(ApiEndpoints.GAMAKA.delete(gamakaId))
 * 
 * Get gamaka with query params:
 *   ApiClient.get(ApiEndpoints.GAMAKA.byPadya('?parva_id=1&sandhi_id=2&padya_number=3'))
 * 
 * Get dashboard stats:
 *   ApiClient.get(ApiEndpoints.DASHBOARD.stats())
 * 
 * 
 * Legacy Style (Still supported for backward compatibility):
 * ───────────────────────────────────────────────────────
 * 
 * Get all parvas:
 *   ApiClient.get(ApiEndpoints.PARVA.LIST)
 * 
 * Delete user:
 *   ApiClient.delete(ApiEndpoints.USERS.DELETE('username'))
 * 
 * 
 * CONFIGURATION:
 * ──────────────
 * 
 * Change API base path:
 *   ApiEndpoints.setApiBase('/api/v2')
 * 
 * Get current config:
 *   ApiEndpoints.getConfig()
 * 
 * Format query parameters:
 *   ApiEndpoints.formatQueryParams({user_id: 1, limit: 10})
 *   // Returns: '?user_id=1&limit=10'
 * 
 * Check if endpoint exists:
 *   ApiEndpoints.hasEndpoint('PADYA', 'list')
 * 
 * =============================================================================
 */

// Export globally for access across all pages
window.ApiEndpoints = ApiEndpoints;
console.log('[Endpoints] ✓ ApiEndpoints initialized with centralized configuration');
