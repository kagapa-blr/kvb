# Navigation Handler - Production Base Path Support

## Overview
The new `navigation.js` script provides automatic base path resolution for page navigation, working seamlessly in both development (root deployment) and production (/kvb/ subdirectory deployment).

## How It Works

### 1. **Centralized Endpoints Object**
Define all page navigation endpoints in a single object:
```javascript
const ENDPOINTS = {
    'akaradi-suchi': '/akaradi-suchi',
    'lekhana-suchi': '/lekhana-suchi',
    'artha-kosha': '/artha-kosha'
};
```

### 2. **Data Attributes on Buttons**
Use simple `data-endpoint` attributes:
```html
<button class="btn btn-primary" data-endpoint="akaradi-suchi">ಅಕಾರಾದಿ ಸೂಚಿ</button>
```

### 3. **Automatic Base Path Resolution**
The script automatically uses `ApiClient.getBaseUrl()` to resolve paths:
- **Development**: `/akaradi-suchi` → `/akaradi-suchi`
- **Production**: `/akaradi-suchi` → `/kvb/akaradi-suchi`

## Usage Example

### Template (e.g., test.html)
```html
<head>
    <!-- Include ApiClient first for base path detection -->
    <script src="{{ url_for('static', filename='js/axios.min.js') }}"></script>
    <script src="{{ url_for('static', filename='js/restclient.js') }}"></script>
</head>

<body>
    <!-- Buttons with data-endpoint attribute -->
    <button data-endpoint="akaradi-suchi">ಅಕಾರಾದಿ ಸೂಚಿ</button>
    <button data-endpoint="lekhana-suchi">ಲೇಖನ ಸೂಚಿ</button>

    <!-- Define endpoints object BEFORE navigation.js -->
    <script>
        const ENDPOINTS = {
            'akaradi-suchi': '/akaradi-suchi',
            'lekhana-suchi': '/lekhana-suchi'
        };
    </script>

    <!-- Include navigation handler -->
    <script src="{{ url_for('static', filename='js/navigation.js') }}"></script>
</body>
```

## Features

✅ **Multi-template Support** - Use across all pages  
✅ **Base Path Aware** - Auto-detects /kvb/ in production  
✅ **Modal Support** - `openModal()` helper for Bootstrap modals  
✅ **Simple API** - Just add `data-endpoint` attributes  
✅ **Console Logging** - Debug-friendly output  
✅ **Fallback** - Works without ApiClient (direct paths)  

## Console Output

```
[Navigation] ✓ Initialized 6 endpoint button(s)
[Navigation] Using ApiClient base: "/kvb" + endpoint: "akaradi-suchi"
[Navigation] Opening URL: /kvb/akaradi-suchi
```

## Script Functions

### `openModal(modalId)`
Opens a Bootstrap modal by ID:
```javascript
<button onclick="openModal('modal1')">Open Modal</button>
```

### `initializeEndpointButtons()`
Automatically called on DOMContentLoaded. Scans for `[data-endpoint]` elements and adds handlers.

## Benefits Over Inline onclick

| Feature | Inline | Data-Endpoint |
|---------|--------|--------------|
| Base path handling | ❌ Manual | ✅ Automatic |
| Production ready | ❌ Hardcoded | ✅ Dynamic |
| Maintainability | ❌ Scattered | ✅ Centralized |
| Reusability | ❌ Per page | ✅ Across pages |
| Debugging | ❌ Inline | ✅ Console logs |

## Integration Checklist

- [ ] Include `axios.min.js` (before restclient)
- [ ] Include `restclient.js` (provides ApiClient)
- [ ] Define `ENDPOINTS` object with all paths
- [ ] Add `data-endpoint` attribute to buttons
- [ ] Include `navigation.js` script
- [ ] Test in browser console for logs
