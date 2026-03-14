"""
DIAGNOSTIC TEST SCRIPT
======================

Run this script to diagnose database issues with the Statistics module.

USAGE:
    python test_statistics_diagnostics.py

This will:
1. Test Python imports
2. Test database configuration
3. Test database connection
4. Test database queries
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("\n" + "="*70)
print("KVB STATISTICS DIAGNOSTIC TEST")
print("="*70)

# Test 1: Environment and Python Path
print("\n[1] PYTHON ENVIRONMENT")
print("-" * 70)
print(f"Python Version: {sys.version}")
print(f"Python Executable: {sys.executable}")
print(f"Project Root: {os.getcwd()}")
print(f"Python Path: {sys.path[0]}")

# Test 2: .env File
print("\n[2] ENVIRONMENT VARIABLES (.env)")
print("-" * 70)
try:
    from dotenv import load_dotenv
    load_dotenv()
    
    import os as env_os
    db_name = env_os.getenv("DB_NAME")
    db_user = env_os.getenv("DB_USER")
    db_password = env_os.getenv("DB_PASSWORD")
    db_host = env_os.getenv("DB_HOST")
    db_port = env_os.getenv("DB_PORT")
    
    print(f"✓ .env file loaded")
    print(f"  DB_NAME: {db_name}")
    print(f"  DB_USER: {db_user}")
    print(f"  DB_HOST: {db_host}")
    print(f"  DB_PORT: {db_port}")
    print(f"  DB_PASSWORD: {'***MASKED***' if db_password else '(empty)'}")
except Exception as e:
    print(f"✗ Failed to load .env: {e}")

# Test 3: Import config.db_config
print("\n[3] DATABASE CONFIG MODULE")
print("-" * 70)
try:
    from config.db_config import get_config, DatabaseConfig
    print("✓ config.db_config imported successfully")
    
    # Test 4: Create config instance
    print("\n[4] DATABASE CONFIGURATION")
    print("-" * 70)
    config = get_config()
    print("✓ DatabaseConfig instance created")
    print(f"  User: {config.db_user}")
    print(f"  Host: {config.db_host}")
    print(f"  Port: {config.db_port}")
    print(f"  Database: {config.db_name}")
    
    db_url = config.get_database_url('pymysql')
    print(f"\n✓ Database URL generated")
    # Mask password in display
    display_url = db_url.replace(config.db_password, '***')
    print(f"  URL: {display_url}")
    
except Exception as e:
    print(f"✗ Failed to load config.db_config: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 5: Database Connection
print("\n[5] DATABASE CONNECTION TEST")
print("-" * 70)
try:
    from sqlalchemy import create_engine, text
    
    engine = create_engine(db_url)
    print("✓ SQLAlchemy engine created")
    
    with engine.connect() as conn:
        print("✓ Connected to database")
        
        # Test basic query
        result = conn.execute(text("SELECT 1 as test")).scalar()
        print(f"✓ Basic query successful (result: {result})")
        
        # Check tables exist
        print("\n  Checking tables...")
        tables = ['parva', 'sandhi', 'padya', 'users']
        for table in tables:
            try:
                count = conn.execute(text(f"SELECT COUNT(*) FROM {table}")).scalar()
                print(f"    ✓ {table}: {count} rows")
            except Exception as e:
                print(f"    ✗ {table}: {str(e)}")
    
    engine.dispose()
    
except Exception as e:
    print(f"✗ Database connection failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Test 6: Statistics Class
print("\n[6] STATISTICS CLASS INITIALIZATION")
print("-" * 70)
try:
    from utils.statistics import Statistics
    print("✓ utils.statistics imported successfully")
    
    stats = Statistics()
    print("✓ Statistics class initialized successfully")
    
    # Test 7: Fetch Statistics
    print("\n[7] FETCH STATISTICS")
    print("-" * 70)
    print("Fetching statistics...")
    data = stats.fetch_statistics()
    
    print("✓ Statistics fetched successfully")
    print(f"\n  Results:")
    print(f"    Total Parva: {data.get('total_parva', 'N/A')}")
    print(f"    Total Sandhi: {data.get('total_sandhi', 'N/A')}")
    print(f"    Total Padya: {data.get('total_padya', 'N/A')}")
    print(f"    Total Users: {data.get('total_users', 'N/A')}")
    
except Exception as e:
    print(f"✗ Statistics initialization/fetch failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)

# All tests passed
print("\n" + "="*70)
print("✓ ALL TESTS PASSED!")
print("="*70)
print("\nThe database configuration and statistics module are working correctly.")
print("If you're still seeing errors in the web interface, try:")
print("  1. Restart the Flask application")
print("  2. Clear browser cache")
print("  3. Check the Flask console for detailed error messages")
print("\n" + "="*70 + "\n")
