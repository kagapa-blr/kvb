/**
 * API ENDPOINTS - Centralized definition of all API routes
 * 
 * PURPOSE: Single source of truth for all backend API endpoints
 * BENEFITS:
 *   - Easy to maintain and update endpoints
 *   - No hardcoded URLs scattered across files
 *   - Clear documentation of available endpoints
 *   - Easy to find and refactor endpoints
 * 
 * HOW TO USE:
 *   1. Import this file after restclient.js
 *   2. Use endpoints as: ApiEndpoints.USERS.LIST (returns '/api/users')
 *   3. For dynamic endpoints: ApiEndpoints.buildUrl(ApiEndpoints.USERS.GET_BY_ID, 'username')
 * 
 * EXAMPLES:
 *   // Simple endpoints
 *   $.get(ApiEndpoints.USERS.LIST)
 *   
 *   // Dynamic endpoints with parameters
 *   ApiClient.delete(ApiEndpoints.USERS.DELETE('admin_user'))
 *   ApiClient.get(ApiEndpoints.PARVA.GET_SANDHIS_BY_PARVA(1))
 */

const ApiEndpoints = {
    // ========================================
    // USER MANAGEMENT ENDPOINTS
    // ========================================
    USERS: {
        LIST: '/api/users',
        CREATE: '/api/users',
        DELETE: (username) => `/api/users/${username}`,

        // Helper description
        DESCRIPTION: 'Admin user management - Create, list, delete users'
    },

    // ========================================
    // PARVA (Book/Section) ENDPOINTS
    // ========================================
    PARVA: {
        LIST: '/api/parva',
        GET_BY_ID: (id) => `/api/parva/${id}`,

        // Sandhi endpoints
        ALL_SANDHIS: '/api/sandhi',
        SANDHIS_BY_PARVA: (parvaNumber) => `/api/all_sandhi/by_parva/${parvaNumber}`,

        DESCRIPTION: 'Parva (18 sections of Mahabharata) management'
    },

    // ========================================
    // SANDHI (Chapter/Division) ENDPOINTS
    // ========================================
    SANDHI: {
        LIST: '/api/sandhi',
        GET_BY_ID: (id) => `/api/sandhi/${id}`,
        BY_PARVA: (parvaNumber) => `/api/all_sandhi/by_parva/${parvaNumber}`,

        // Padya endpoints (verses within sandhi)
        PADYAS_BY_SANDHI: (sandhiId) => `/api/padya/by_sandhi/${sandhiId}`,

        DESCRIPTION: 'Sandhi (chapters) management'
    },

    // ========================================
    // PADYA (Verse) ENDPOINTS
    // ========================================
    PADYA: {
        LIST: '/api/padya',
        CREATE: '/api/padya',
        GET_BY_ID: (sandhiId, padyaNumber) => `/api/padya/${sandhiId}/${padyaNumber}`,
        UPDATE: '/api/padya',
        DELETE: (id) => `/api/padya/${id}`,

        // Query endpoints
        BY_SANDHI: (sandhiId) => `/api/padya/by_sandhi/${sandhiId}`,

        // For content update modal
        GET_CONTENT: (sandhiId, padyaNumber) => `/api/padya/${sandhiId}/${padyaNumber}`,

        // Get padya by parva, sandhi, and padya number - Used in kavya_process.js
        GET_BY_PARVA_SANDHI_PADYA: (parvaNumber, sandhiNumber, padyaNumber) =>
            `/api/padya/by_parva_sandhi_padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,

        DESCRIPTION: 'Padya (verses) management with 5 content fields: padya, pathantar, gadya, tippani, artha'
    },

    // ========================================
    // GAMAKA VACHANA (Musical Raag/Singer Info) ENDPOINTS
    // ========================================
    GAMAKA: {
        LIST: '/api/gamaka',
        CREATE: '/api/gamaka',
        GET_BY_ID: (id) => `/api/gamaka/${id}`,
        UPDATE: (id) => `/api/gamaka/${id}`,
        DELETE: (id) => `/api/gamaka/${id}`,

        // Query endpoints
        BY_PADYA: () => '/api/gamaka/padya', // Requires query parameters

        DESCRIPTION: 'Gamaka Vachana - Raag, vocalist, and photo mapping for verses'
    },

    // ========================================
    // DASHBOARD STATISTICS ENDPOINTS
    // ========================================
    DASHBOARD: {
        STATS: '/api/dashboard/stats',

        DESCRIPTION: 'Dashboard statistics: total users, padyas, parvas, sandhis'
    },

    // ========================================
    // ADDITIONAL CONTENT MANAGEMENT ENDPOINTS
    // ========================================
    ADDITIONAL: {
        // Akaradi Suchi (Alphabetical index)
        AKARADI_UPDATE: '/akaradi-suchi/update',

        // Gade Suchi (Table of contents)
        GADE_UPLOAD: '/gade-suchi/upload',

        // Tippani (Commentary index)
        TIPPANI_UPDATE: '/tippani/update',

        DESCRIPTION: 'Additional content management - Indices and uploads'
    },

    // ========================================
    // UTILITY METHODS
    // ========================================

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
     * 
     * PURPOSE: Quick reference during development
     * HOW TO USE: ApiEndpoints.printEndpoints();
     */
    printEndpoints() {
        console.log('=== AVAILABLE API ENDPOINTS ===\n');

        const endpoints = this.getAllEndpoints();
        Object.keys(endpoints).forEach(category => {
            console.log(`${category.toUpperCase()}:`);
            const categoryEndpoints = endpoints[category];
            Object.keys(categoryEndpoints).forEach(key => {
                if (typeof categoryEndpoints[key] === 'function') {
                    console.log(`  ${key} (function)`);
                } else if (typeof categoryEndpoints[key] === 'string') {
                    console.log(`  ${key}: ${categoryEndpoints[key]}`);
                }
            });
            console.log('');
        });
    }
};

// For debugging: Uncomment to see all endpoints on page load
// ApiEndpoints.printEndpoints();

/**
 * MAPPING REFERENCE - Quick lookup of endpoints by purpose:
 * 
 * Get all parvas:
 *   ApiEndpoints.PARVA.LIST
 * 
 * Get sandhis for parva 1:
 *   ApiEndpoints.PARVA.SANDHIS_BY_PARVA(1)
 * 
 * Get padyas for sandhi 5:
 *   ApiEndpoints.SANDHI.PADYAS_BY_SANDHI(5)
 * 
 * Get specific padya content:
 *   ApiEndpoints.PADYA.GET_CONTENT(5, 3)
 * 
 * Update padya:
 *   ApiEndpoints.PADYA.UPDATE
 * 
 * Create gamaka:
 *   ApiEndpoints.GAMAKA.CREATE
 * 
 * Delete gamaka:
 *   ApiEndpoints.GAMAKA.DELETE(gamakaId)
 * 
 * Get dashboard stats:
 *   ApiEndpoints.DASHBOARD.STATS
 * 
 * Delete user:
 *   ApiEndpoints.USERS.DELETE('username')
 */

// Make ApiEndpoints globally available
window.ApiEndpoints = ApiEndpoints;
console.log('[Endpoints] ApiEndpoints exported to window.ApiEndpoints');
