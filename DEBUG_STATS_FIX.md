"""
DEBUG GUIDE: /api/dashboard/stats 500 Error Fix
===============================================

PROBLEM: The /api/dashboard/stats endpoint was returning 500 error

ROOT CAUSE: Statistics module was being initialized at module import time,
before Flask app context was ready, causing initialization failures.

SOLUTION: Implemented lazy-loading pattern for Statistics class.
Statistics is now initialized only when first requested.

FILES CHANGED:
1. routers/parvya.py - Lazy-load Statistics with get_stats() function
2. utils/statistics.py - Simplified initialization, moved connection test to fetch_statistics()

HOW IT WORKS NOW:
================

1. At server start:
   - parvya.py is imported
   - Statistics is NOT initialized (no import, no connection test)
   - get_stats() function is defined but not called

2. When /api/dashboard/stats is requested:
   - Endpoint calls get_stats()
   - get_stats() checks if _stats_instance is None
   - If None, it imports Statistics and creates instance
   - If error, logs it and returns None
   - Endpoint checks if stats is None and returns graceful error

3. If /api/dashboard/stats succeeds:
   - fetch_statistics() is called
   - Database connection is tested
   - All queries are executed with detailed logging
   - Results are returned as JSON

DEBUGGING STEPS:
================

Step 1: Check Flask Console Logs
---------------------------------
When you access /api/dashboard/stats, you should see:

SUCCESS:
  INFO: Initializing Statistics module (lazy-load)...
  INFO: ✓ Statistics module initialized successfully
  DEBUG: Engine created, connecting to database...
  DEBUG: ✓ Connected to database successfully
  DEBUG: Testing basic query...
  DEBUG: ✓ Basic query successful
  DEBUG: Fetching parva count...
  INFO: ✓ Statistics fetched successfully

ERROR (Example - Database not running):
  ERROR: ✗ Failed to initialize Statistics module: (2003, "Can't connect to MySQL server on '127.0.0.1' (111)")
  ERROR: Error fetching statistics: Statistics module not available

Step 2: Run Diagnostic Test
----------------------------
python test_statistics_diagnostics.py

This tests the entire chain step by step.

Step 3: Check Individual Components
------------------------------------

A. Test config module:
   python config/db_config.py

B. Test database connection directly:
   from config.db_config import get_config
   config = get_config()
   engine = config.get_engine()
   
C. Test Statistics class in isolation:
   from utils.statistics import Statistics
   stats = Statistics()
   data = stats.fetch_statistics()

COMMON ISSUES & SOLUTIONS:
==========================

Issue 1: "Can't connect to MySQL server"
Solution:
  - Check if MySQL is running: mysql -u root -p
  - Verify credentials in .env are correct
  - Check if host/port is correct

Issue 2: "Unknown database 'new_kvb'"
Solution:
  - Database doesn't exist
  - Run: python dbmigrate.py
  - Or create manually: CREATE DATABASE new_kvb;

Issue 3: "Table 'new_kvb.parva' doesn't exist"
Solution:
  - Database exists but tables are missing
  - Run: python dbmigrate.py
  - This creates all required tables

Issue 4: "Access denied for user 'root'@'127.0.0.1'"
Solution:
  - DB_PASSWORD in .env is wrong
  - Check actual MySQL password
  - Update .env and restart Flask

Issue 5: ImportError: cannot import name 'Statistics'
Solution:
  - utils/statistics.py is in wrong location
  - Check utils/__init__.py exists
  - Check sys.path includes project root

EXPECTED BEHAVIOR AFTER FIX:
============================

Browser Console:
  GET http://127.0.0.1:8443/api/dashboard/stats - Status: 200 OK
  Response:
  {
    "total_parva": 10,
    "total_sandhi": 120,
    "total_padya": 5000,
    "total_users": 5,
    "sandhi_in_each_parva": [...],
    "padya_in_each_sandhi": [...],
    "padya_in_each_parva": [...]
  }

Admin Dashboard:
  - Stats panel shows actual counts
  - No loading errors
  - Data updates when adding/deleting records

Flask Console:
  - No ERROR logs for /api/dashboard/stats
  - All requests show 200 status
  - Debug logs show query execution times

TESTING CHECKLIST:
==================

[ ] MySQL server is running
[ ] .env file has correct credentials
[ ] Database 'new_kvb' exists
[ ] Tables are created (run dbmigrate.py if needed)
[ ] Flask app starts without errors
[ ] Diagnostic test passes: python test_statistics_diagnostics.py
[ ] /api/dashboard/stats returns 200
[ ] Admin dashboard shows stats
[ ] Search functionality works
[ ] Adding new records updates stats
[ ] Page reload shows updated stats

PERFORMANCE NOTES:
==================

Lazy-loading provides benefits:
- Faster Flask startup (no DB test at import time)
- Clear error reporting (errors happen at request time)
- Easier debugging (logs show state transitions)
- Better error recovery (can retry on next request)

Downside:
- First request to /stats is slightly slower (initializes stats)
- Subsequent requests are fast (reuses _stats_instance)

If you need pre-initialization:
  - Can be done in app.py after Flask app is created
  - Not recommended - lazy-loading is safer

QUESTIONS?
==========

If still seeing 500 error:
1. Check the diagnostic test output
2. Look at Flask console for detailed error message
3. Search for the specific error in this guide
4. Check the docstrings in the code

The error message in the response JSON will tell you exactly what failed!
"""

# ADDITIONAL BUGS FIXED (March 14, 2026)
========================================

## Bug 1: Stats API - db.Concatenate Not Available
**File**: routers/additional.py (lines 31-34)
**Issue**: `db.Concatenate()` doesn't exist in SQLAlchemy - caused 500 error
**Fix**: Replaced with proper SQLAlchemy syntax using db.tuple_() for distinct counts
```python
# OLD (BROKEN):
total_gamaka_vachana = db.session.query(db.func.count(db.func.distinct(
    db.Concatenate(Parva.id, Sandhi.id)  # ❌ NOT AVAILABLE
))).join(Sandhi).scalar()

# NEW (FIXED):
total_gamaka_vachana = db.session.query(
    db.func.count(db.func.distinct(db.tuple_(GadeSuchigalu.parva_id, GadeSuchigalu.sandhi_id)))
).scalar() or 0
```

## Bug 2: JavaScript - Undefined 'replace' Errors in gadegala-suchi.html

### Issue 2a: `escapeHtml()` receiving undefined/null text (line 419)
**Error**: `TypeError: Cannot read properties of undefined (reading 'replace')`
**Location**: Line 419 in gadegala-suchi.html
**Fix**: Added null/type checks at start of function
```javascript
// OLD (BROKEN):
function escapeHtml(text) {
  return text.replace(/&/g, "&amp;")  // ❌ Fails if text is undefined
  // ...
}

// NEW (FIXED):
function escapeHtml(text) {
  if (!text || typeof text !== 'string') {
    return '';  // ✅ Handle undefined/null gracefully
  }
  return text.replace(/&/g, "&amp;");
  // ...
}
```

### Issue 2b: `highlightWords()` receiving undefined text (line 450)
**Error**: `TypeError: Cannot read properties of undefined (reading 'replace')`
**Fix**: Added null checks for text parameter at start of function
```javascript
function highlightWords(text, line) {
  if (!text || typeof text !== 'string') {
    return text || '';  // ✅ Guard against undefined
  }
  // ... rest of function
}
```

### Issue 2c: `data.tippani.replace()` called on undefined (line 393)
**Error**: Tippani field can be null, causing .replace() to fail
**Location**: Modal body HTML template (line 393-394)
**Fix**: Added null coalescing operator and fallback
```javascript
// OLD (BROKEN):
${data.tippani.replace("nan", "-")}  // ❌ Fails if tippani is undefined

// NEW (FIXED):
${(data.tippani || "").replace("nan", "-") || "N/A"}  // ✅ Proper fallback chain
```

### Issue 2d: highlightContent initialization (line 376)
**Fix**: Ensure highlightContent has default value and better error handling
```javascript
// OLD (BROKEN):
let highlightContent = data.padya;  // ❌ Could be undefined
try {
  highlightContent = highlightWords(data.padya, gade);
} catch {  // ❌ Silent fail
  highlightContent = data.padya;
}

// NEW (FIXED):
let highlightContent = data.padya || "N/A";  // ✅ Default value
try {
  highlightContent = highlightWords(data.padya, gade);
} catch (err) {  // ✅ Log error for debugging
  console.error("Error highlighting words:", err);
  highlightContent = data.padya || "N/A";
}
```

## Summary of Changes
=====================
✅ Fixed 1 Python backend error (500 error)
✅ Fixed 4 JavaScript errors (undefined reference errors)

These fixes ensure:
- Stats endpoint returns valid data instead of 500 error
- Modal popup doesn't crash when data fields are null/undefined
- Better error logging for debugging
- Graceful fallbacks to "N/A" instead of breaking UI

This is a documentation file - no Python code
