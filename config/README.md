# Configuration Package

Centralized configuration management for the KVB application.

## Overview

The `config` package provides centralized management of application configuration, with a focus on database configuration.

## Structure

```
config/
├── __init__.py          # Package initialization
├── db_config.py         # Database configuration and connection management
└── README.md            # This file
```

## Database Configuration

The `DatabaseConfig` class handles all database-related configuration.

### Features

- ✅ Loads credentials from `.env` file
- ✅ Supports multiple MySQL drivers (PyMySQL, MySQLdb, MySQL Connector)
- ✅ URL-encodes passwords to handle special characters
- ✅ Validates configuration on initialization
- ✅ Creates SQLAlchemy engine instances
- ✅ Comprehensive logging for debugging

### Environment Variables

Required variables in `.env`:

```dotenv
DB_NAME=new_kvb
DB_USER=root
DB_PASSWORD=kagapa
DB_HOST=127.0.0.1
DB_PORT=3306
```

### Usage

#### Basic Usage (Getting Database URL)

```python
from config.db_config import get_config

config = get_config()
db_url = config.get_database_url('pymysql')
print(db_url)  # mysql+pymysql://root:***@127.0.0.1:3306/new_kvb
```

#### SQLAlchemy Engine Creation

```python
from config.db_config import get_config

config = get_config()
engine = config.get_engine(
    driver='pymysql',
    pool_size=15,
    max_overflow=30,
    echo=False
)
```

#### Get Credentials Dictionary

```python
from config.db_config import get_config

config = get_config()
creds = config.get_credentials()

print(creds)
# {
#     'user': 'root',
#     'password': 'kagapa',
#     'host': '127.0.0.1',
#     'port': '3306',
#     'name': 'new_kvb'
# }
```

#### Singleton Pattern

The module uses a singleton pattern:

```python
from config.db_config import get_config

# Both calls return the same instance
config1 = get_config()
config2 = get_config()

assert config1 is config2  # True
```

### Supported Drivers

1. **PyMySQL** (recommended)
   - Pure Python implementation
   - No C dependencies
   - Works on all platforms
   - Default choice

2. **MySQLdb**
   - C extension
   - Faster than PyMySQL
   - Requires MySQL development headers

3. **MySQL Connector**
   - Official MySQL connector
   - Feature-rich
   - Good for enterprise deployments

### Testing Configuration

To test your database configuration:

```bash
cd config
python db_config.py
```

This will:
- ✓ Load configuration
- ✓ Display configuration details
- ✓ Show available database URLs
- ✓ Test engine creation
- ✓ Report any errors

### Files Using DatabaseConfig

1. **app.py** - Flask application initialization
2. **utils/statistics.py** - Statistics module
3. **dbmigrate.py** - Database migrations

### Migration Guide

If you're updating an existing file to use `DatabaseConfig`:

**Before:**
```python
import os
from dotenv import load_dotenv

load_dotenv()

db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_name = os.getenv("DB_NAME")

db_url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}/{db_name}"
```

**After:**
```python
from config.db_config import get_config

config = get_config()
db_url = config.get_database_url('pymysql')
```

### Logging

Database configuration uses Python's logging module. To see detailed logs:

```python
import logging
from config.db_config import get_config

# Enable debug logging
logging.basicConfig(level=logging.DEBUG)

config = get_config()  # Will log debug messages
engine = config.get_engine()  # Will log successful engine creation
```

### Error Handling

The module provides clear error messages:

```python
try:
    config = get_config()
except ValueError as e:
    print(f"Configuration Error: {e}")
    # Examples:
    # "DB_USER environment variable is required"
    # "DB_HOST environment variable is required"
    # "DB_NAME environment variable is required"
```

### Security Notes

- ⚠️ Never commit `.env` file to version control
- ⚠️ Never log actual passwords (module masks them automatically)
- ⚠️ Use environment variables for sensitive data
- ⚠️ For production, use environment-specific `.env` files

### Best Practices

1. **Always use `get_config()` singleton** - Don't create multiple instances
2. **Store sensitive data in `.env`** - Never hardcode credentials
3. **Use connection pooling** - Let `get_engine()` handle pool settings
4. **Check logs for errors** - Enable logging to debug connection issues
5. **Validate config on startup** - Module validates automatically

---

For more information, see the inline documentation in `db_config.py`.
