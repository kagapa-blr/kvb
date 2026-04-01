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
        // Base path for all API calls (v1 for parva/sandhi/padya, base /api for gamaka)
        API_BASE: '/api/v1',

        // Response format
        FORMAT: 'json',

        // Timeout (managed by ApiClient, but documented here)
        TIMEOUT: 30000,

        // Enable/disable detailed logging
        DEBUG: false
    },

    /**
     * Helper to construct full endpoint paths
     * Since apiClient already has '/api/v1' as base URL,
     * this function returns only the relative path (resources and verbs)
     * @param {string} path - Relative path from API base
     * @returns {string} Relative endpoint path for use with apiClient
     */
    _buildPath(path) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return cleanPath;  // Return relative path only - apiClient adds the base URL
    },
    // ========================================
    // USER MANAGEMENT ENDPOINTS
    // ========================================
    USERS: {
        list: () => ApiEndpoints._buildPath('/users/'),
        create: () => ApiEndpoints._buildPath('/users/'),
        get: (username) => ApiEndpoints._buildPath(`/users/${username}`),
        update: (username) => ApiEndpoints._buildPath(`/users/${username}`),
        delete: (username) => ApiEndpoints._buildPath(`/users/${username}`),
    },

    // ========================================
    // PARVA (Book/Section) ENDPOINTS
    // ========================================
    PARVA: {
        list: () => ApiEndpoints._buildPath('/parva'),
        create: () => ApiEndpoints._buildPath('/parva'),
        get: (id) => ApiEndpoints._buildPath(`/parva/${id}`),
        update: (id) => ApiEndpoints._buildPath(`/parva/${id}`),
        delete: (id) => ApiEndpoints._buildPath(`/parva/${id}`),
        search: () => ApiEndpoints._buildPath('/parva/search'),
        sandhisByParva: (parvaNumber) => ApiEndpoints._buildPath(`/sandhi/by_parva/${parvaNumber}`),

        // Backward compatibility
        LIST: '/api/v1/parva',
        CREATE: '/api/v1/parva',
        GET_BY_ID: (id) => `/api/v1/parva/${id}`,
        UPDATE: (id) => `/api/v1/parva/${id}`,
        DELETE: (id) => `/api/v1/parva/${id}`,
        SEARCH: '/api/v1/parva/search',
        ALL_SANDHIS: '/api/v1/sandhi',
        SANDHIS_BY_PARVA: (parvaNumber) => `/api/v1/sandhi/by_parva/${parvaNumber}`,
    },

    // ========================================
    // SANDHI (Chapter/Division) ENDPOINTS
    // ========================================
    SANDHI: {
        list: () => ApiEndpoints._buildPath('/sandhi'),
        create: () => ApiEndpoints._buildPath('/sandhi'),
        get: (parvaNumber, sandhiNumber) => ApiEndpoints._buildPath(`/sandhi/${parvaNumber}/${sandhiNumber}`),
        update: (parvaNumber, sandhiNumber) => ApiEndpoints._buildPath(`/sandhi/${parvaNumber}/${sandhiNumber}`),
        delete: (parvaNumber, sandhiNumber) => ApiEndpoints._buildPath(`/sandhi/${parvaNumber}/${sandhiNumber}`),
        byParva: (parvaNumber) => ApiEndpoints._buildPath(`/sandhi/by_parva/${parvaNumber}`),
        search: (parvaNumber) => ApiEndpoints._buildPath(`/sandhi/search/${parvaNumber}`),

        // Backward compatibility
        LIST: '/api/v1/sandhi',
        CREATE: '/api/v1/sandhi',
        GET_BY_ID: (parvaNumber, sandhiNumber) => `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
        UPDATE: (parvaNumber, sandhiNumber) => `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
        DELETE: (parvaNumber, sandhiNumber) => `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
        BY_PARVA: (parvaNumber) => `/api/v1/sandhi/by_parva/${parvaNumber}`,
        SEARCH: (parvaNumber) => `/api/v1/sandhi/search/${parvaNumber}`,
    },

    // ========================================
    // PADYA (Verse) ENDPOINTS
    // ========================================
    PADYA: {
        list: () => ApiEndpoints._buildPath('/padya'),
        create: () => ApiEndpoints._buildPath('/padya'),
        search: () => ApiEndpoints._buildPath('/padya/search'),
        get: (parvaNumber, sandhiNumber, padyaNumber) => 
            ApiEndpoints._buildPath(`/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`),
        update: (parvaNumber, sandhiNumber, padyaNumber) => 
            ApiEndpoints._buildPath(`/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`),
        delete: (parvaNumber, sandhiNumber, padyaNumber) => 
            ApiEndpoints._buildPath(`/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`),
        downloadTemplate: () => ApiEndpoints._buildPath('/padya/template/download'),
        uploadBulk: () => ApiEndpoints._buildPath('/padya/bulk/upload'),
        uploadPhoto: () => ApiEndpoints._buildPath('/padya/upload-photo'),
        uploadAudio: () => ApiEndpoints._buildPath('/padya/upload-audio'),
        exportCsv: () => ApiEndpoints._buildPath('/padya/export'),

        // Backward compatibility
        LIST: '/api/v1/padya',
        CREATE: '/api/v1/padya',
        SEARCH: '/api/v1/padya/search',
        GET_BY_ID: (parvaNumber, sandhiNumber, padyaNumber) => 
            `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
        UPDATE: (parvaNumber, sandhiNumber, padyaNumber) => 
            `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
        DELETE: (parvaNumber, sandhiNumber, padyaNumber) => 
            `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
        DOWNLOAD_TEMPLATE: '/api/v1/padya/template/download',
        UPLOAD_BULK: '/api/v1/padya/bulk/upload',
        UPLOAD_PHOTO: '/api/v1/padya/upload-photo',
        UPLOAD_AUDIO: '/api/v1/padya/upload-audio',
        EXPORT_CSV: '/api/v1/padya/export',
    },

    // ========================================
    // GAMAKA VACHANA (Musical Raag/Singer Info) ENDPOINTS
    // ========================================
    GAMAKA: {
        list: () => '/api/gamaka',
        create: () => '/api/gamaka',
        get: (id) => `/api/gamaka/${id}`,
        update: (id) => `/api/gamaka/${id}`,
        delete: (id) => `/api/gamaka/${id}`,
        byPadya: (queryParams = '') => `/api/gamaka/padya${queryParams}`,
        // Audio file handling endpoints
        parseFilename: () => '/api/audio/parse-filename',
        mapToPadya: () => '/api/audio/map-to-padya',
        processDirectory: () => '/api/audio/process-directory',
        getWithFsCheck: () => '/api/audio/get-with-fs-check',
        findInFilesystem: () => '/api/audio/find-in-filesystem',
        updateAudioPath: () => '/api/audio/update-path',

        // Backward compatibility
        LIST: '/api/gamaka',
        CREATE: '/api/gamaka',
        GET_BY_ID: (id) => `/api/gamaka/${id}`,
        UPDATE: (id) => `/api/gamaka/${id}`,
        DELETE: (id) => `/api/gamaka/${id}`,
        BY_PADYA: () => '/api/gamaka/padya',
        PARSE_FILENAME: '/api/audio/parse-filename',
        MAP_TO_PADYA: '/api/audio/map-to-padya',
        PROCESS_DIRECTORY: '/api/audio/process-directory',
        GET_WITH_FS_CHECK: '/api/audio/get-with-fs-check',
        FIND_IN_FILESYSTEM: '/api/audio/find-in-filesystem',
        UPDATE_AUDIO_PATH: '/api/audio/update-path',
    },

    // ========================================
    // DASHBOARD STATISTICS ENDPOINTS
    // ========================================
    DASHBOARD: {
        stats: () => ApiEndpoints._buildPath('/dashboard/stats'),

        // Backward compatibility
        STATS: '/api/v1/dashboard/stats',
    },

    // ========================================
    // ADDITIONAL CONTENT MANAGEMENT ENDPOINTS
    // ========================================
    ADDITIONAL: {
        akaradiSuchi: () => '/api/additional/akaradi-suchi',
        gadeSuchi: () => '/api/additional/gade-suchi',
        lekanSuchi: () => '/api/additional/lekhan-suchi',
        arhaKosha: () => '/api/additional/artha-kosha',
        vishayaParividi: () => '/api/additional/vishaya-parividi',
        anubanch: () => '/api/additional/anuband',
        tippani: () => '/api/additional/tippani',

        // Backward compatibility
        AKARADI_SUCHI: '/api/additional/akaradi-suchi',
        GADE_SUCHI: '/api/additional/gade-suchi',
        LEKAN_SUCHI: '/api/additional/lekhan-suchi',
        ARTHA_KOSHA: '/api/additional/artha-kosha',
        VISHAYA_PARIVIDI: '/api/additional/vishaya-parividi',
        ANUBAND: '/api/additional/anuband',
        TIPPANI: '/api/additional/tippani',
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

// Export as ES6 module for import in other modules
export { ApiEndpoints };

console.log('[Endpoints] ✓ ApiEndpoints initialized with centralized configuration');
