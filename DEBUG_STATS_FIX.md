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

# This is a documentation file - no Python code
