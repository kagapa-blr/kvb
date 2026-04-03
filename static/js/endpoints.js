// Centralized API endpoint definitions
const ApiEndpoints = {
  // User management endpoints (/api/v1/users)
  USERS: {
    list: "/api/v1/users/",
    create: "/api/v1/users/",
    get: (username) => `/api/v1/users/${username}`,
    update: (username) => `/api/v1/users/${username}`,
    delete: (username) => `/api/v1/users/${username}`,
  },

  // Parva/sections endpoints (/api/v1)
  PARVA: {
    list: "/api/v1/parva",
    create: "/api/v1/parva",
    get: (id) => `/api/v1/parva/${id}`,
    update: (id) => `/api/v1/parva/${id}`,
    delete: (id) => `/api/v1/parva/${id}`,
    search: "/api/v1/parva/search",
    sandhisByParva: (parvaNumber) => `/api/v1/sandhi/by_parva/${parvaNumber}`,
  },

  // Sandhi/chapters endpoints (/api/v1)
  SANDHI: {
    list: "/api/v1/sandhi",
    create: "/api/v1/sandhi",
    get: (parvaNumber, sandhiNumber) =>
      `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
    update: (parvaNumber, sandhiNumber) =>
      `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
    delete: (parvaNumber, sandhiNumber) =>
      `/api/v1/sandhi/${parvaNumber}/${sandhiNumber}`,
    byParva: (parvaNumber) => `/api/v1/sandhi/by_parva/${parvaNumber}`,
    search: (parvaNumber) => `/api/v1/sandhi/search/${parvaNumber}`,
  },

  // Padya/verses endpoints (/api/v1)
  PADYA: {
    list: "/api/v1/padya",
    create: "/api/v1/padya",
    search: "/api/v1/padya/search",
    get: (parvaNumber, sandhiNumber, padyaNumber) =>
      `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
    update: (parvaNumber, sandhiNumber, padyaNumber) =>
      `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
    delete: (parvaNumber, sandhiNumber, padyaNumber) =>
      `/api/v1/padya/${parvaNumber}/${sandhiNumber}/${padyaNumber}`,
    numbersBySandhi: (sandhiId) =>
      `/api/v1/padya/numbers/by_sandhi/${sandhiId}`,
    downloadTemplate: "/api/v1/padya/template/download",
    uploadBulk: "/api/v1/padya/bulk/upload",
    uploadPhoto: "/api/v1/padya/upload-photo",
    uploadAudio: "/api/v1/padya/upload-audio",
    exportCsv: "/api/v1/padya/export",
  },

  // Gamaka/raag endpoints (/api/gamaka, /api/audio)
  GAMAKA: {
    list: "/api/gamaka",
    create: "/api/gamaka",
    get: (id) => `/api/gamaka/${id}`,
    update: (id) => `/api/gamaka/${id}`,
    delete: (id) => `/api/gamaka/${id}`,
    byPadya: (queryParams = "") => `/api/gamaka/padya${queryParams}`,
    parseFilename: "/api/audio/parse-filename",
    mapToPadya: "/api/audio/map-to-padya",
    processDirectory: "/api/audio/process-directory",
    getWithFsCheck: "/api/audio/get-with-fs-check",
    findInFilesystem: "/api/audio/find-in-filesystem",
    updateAudioPath: "/api/audio/update-path",
  },

  // Dashboard statistics endpoints
  DASHBOARD: {
    stats: "/api/v1/dashboard/stats",
  },

  // Additional content endpoints
  ADDITIONAL: {
    akaradiSuchi: "/additional/akaradi-suchi",
    gadeSuchi: "/additional/gade-suchi",
    lekanSuchi: "/additional/lekhan-suchi",
    arhaKosha: "/additional/artha-kosha",
    vishayaParividi: "/additional/vishaya-parividi",
    anubanch: "/additional/anuband",
    tippani: "/additional/tippani",
  },

  ADDITIONAL_API: {
    akaradiSuchiApi: "/api/v1/additional/akaradi-suchi",
    tippaniApi: "/api/v1/additional/tippani",
  },

  GADESUCHI_API:{
    list: "/api/v1/additional/gadesuchi",
    create: "/api/v1/additional/gadesuchi",
    get: (id) => `/api/v1/additional/gadesuchi/${id}`,
    update: (id) => `/api/v1/additional/gadesuchi/${id}`,
    delete: (id) => `/api/v1/additional/gadesuchi/${id}`,
    bulkUpload: "/api/v1/additional/gadesuchi/bulk-upload",
    
  }



};

export { ApiEndpoints };
