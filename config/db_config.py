"""
DATABASE CONFIGURATION
=====================

Centralized database configuration module for the KVB application.

This module:
- Loads database credentials from environment variables (.env)
- Provides database URLs for different drivers (SQLAlchemy, PyMySQL, MySQLdb)
- Creates and manages database engine instances
- Provides logging for database operations

USAGE:
    from config.db_config import DatabaseConfig
    
    # For SQLAlchemy
    db_config = DatabaseConfig()
    engine = db_config.get_engine()
    
    # For direct connection strings
    url = db_config.get_database_url('pymysql')  # or 'mysqldb'
    credentials = db_config.get_credentials()
"""

import os
import logging
from dotenv import load_dotenv
from sqlalchemy import create_engine
from urllib.parse import quote_plus

# Load environment variables from .env file
load_dotenv()

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class DatabaseConfig:
    """
    Centralized database configuration class.
    
    Reads database credentials from environment variables and provides
    methods to create database connections with various drivers.
    """
    
    def __init__(self):
        """Initialize database configuration from environment variables."""
        self.db_user = os.getenv("DB_USER", "root")
        self.db_password = os.getenv("DB_PASSWORD", "")
        self.db_host = os.getenv("DB_HOST", "127.0.0.1")
        self.db_port = os.getenv("DB_PORT", "3306")
        self.db_name = os.getenv("DB_NAME", "new_kvb")
        
        # URL-encode password to handle special characters
        self.db_password_encoded = quote_plus(self.db_password)
        
        # Validate configuration
        self._validate_config()
        
        # Log configuration (without password)
        logger.debug(
            f"Database Config Initialized: {self.db_user}@{self.db_host}:{self.db_port}/{self.db_name}"
        )
    
    def _validate_config(self):
        """
        Validate that all required database configuration is present.
        
        Raises:
            ValueError: If required configuration is missing
        """
        if not self.db_user:
            raise ValueError("DB_USER environment variable is required")
        if not self.db_host:
            raise ValueError("DB_HOST environment variable is required")
        if not self.db_name:
            raise ValueError("DB_NAME environment variable is required")
        
        logger.debug("Database configuration validation passed")
    
    def get_credentials(self):
        """
        Get database credentials as a dictionary.
        
        Returns:
            dict: Dictionary containing user, password, host, port, name
            
        EXAMPLE:
            >>> config = DatabaseConfig()
            >>> creds = config.get_credentials()
            >>> print(creds['host'])
            '127.0.0.1'
        """
        return {
            'user': self.db_user,
            'password': self.db_password,
            'host': self.db_host,
            'port': self.db_port,
            'name': self.db_name
        }
    
    def get_database_url(self, driver='pymysql'):
        """
        Get full database URL for specified driver.
        
        Supports multiple MySQL drivers for flexibility:
        - pymysql: Pure Python MySQL client (lightweight, no C dependencies)
        - mysqldb: MySQL C extension (faster but requires C compiler)
        - mysql-connector: Official MySQL connector
        
        Args:
            driver (str): Driver name ('pymysql', 'mysqldb', 'mysql-connector')
            
        Returns:
            str: Full database URL (SQLAlchemy format)
            
        EXAMPLES:
            >>> config = DatabaseConfig()
            >>> pymysql_url = config.get_database_url('pymysql')
            >>> 'mysql+pymysql://root:***@127.0.0.1:3306/new_kvb'
            
            >>> mysqldb_url = config.get_database_url('mysqldb')
            >>> 'mysql+mysqldb://root:***@127.0.0.1:3306/new_kvb'
        """
        if driver == 'pymysql':
            url = f"mysql+pymysql://{self.db_user}:{self.db_password_encoded}@{self.db_host}:{self.db_port}/{self.db_name}"
        elif driver == 'mysqldb':
            url = f"mysql+mysqldb://{self.db_user}:{self.db_password_encoded}@{self.db_host}:{self.db_port}/{self.db_name}"
        elif driver == 'mysql-connector':
            url = f"mysql+mysqlconnector://{self.db_user}:{self.db_password_encoded}@{self.db_host}:{self.db_port}/{self.db_name}"
        else:
            raise ValueError(f"Unsupported driver: {driver}. Use 'pymysql', 'mysqldb', or 'mysql-connector'")
        
        logger.debug(f"Generated database URL for driver: {driver}")
        return url
    
    def get_engine(self, driver='pymysql', **kwargs):
        """
        Create and return SQLAlchemy engine instance.
        
        Args:
            driver (str): Database driver to use ('pymysql', 'mysqldb', 'mysql-connector')
            **kwargs: Additional arguments to pass to create_engine()
            
        Returns:
            sqlalchemy.engine.Engine: Configured database engine
            
        KWARGS:
            pool_size (int): Connection pool size (default: 10)
            max_overflow (int): Max overflow connections (default: 20)
            pool_recycle (int): Pool recycle time in seconds (default: 3600)
            echo (bool): Log all SQL statements (default: False)
            
        EXAMPLE:
            >>> config = DatabaseConfig()
            >>> engine = config.get_engine(
            ...     driver='pymysql',
            ...     pool_size=15,
            ...     max_overflow=30,
            ...     echo=False
            ... )
        """
        # Default connection pool settings for stability
        default_kwargs = {
            'pool_size': 10,
            'max_overflow': 20,
            'pool_recycle': 3600,  # Recycle connections every hour
            'echo': False  # Set to True for SQL logging
        }
        
        # Merge with user-provided kwargs
        default_kwargs.update(kwargs)
        
        url = self.get_database_url(driver)
        
        try:
            engine = create_engine(url, **default_kwargs)
            logger.info(f"SQLAlchemy engine created successfully with driver: {driver}")
            return engine
        except Exception as e:
            logger.error(f"Failed to create SQLAlchemy engine: {str(e)}", exc_info=True)
            raise
    
    def get_connection_string(self, driver='pymysql'):
        """
        Get simple connection string (for manual connections).
        
        Returns:
            str: Connection string
            
        EXAMPLE:
            >>> config = DatabaseConfig()
            >>> conn_str = config.get_connection_string()
        """
        return self.get_database_url(driver)
    
    def to_dict(self):
        """
        Export configuration as dictionary (for logging/debugging).
        
        Returns:
            dict: Configuration with credentials masked
        """
        return {
            'user': self.db_user,
            'host': self.db_host,
            'port': self.db_port,
            'database': self.db_name,
            'password': '***MASKED***',  # Never log actual password
            'driver': 'pymysql (recommended)',
            'status': 'Configured'
        }


# Global instance for easy importing
_config_instance = None


def get_config():
    """
    Get or create the global DatabaseConfig instance.
    
    This is a singleton pattern - returns the same instance every time.
    
    Returns:
        DatabaseConfig: Global database configuration instance
        
    EXAMPLE:
        >>> from config.db_config import get_config
        >>> config = get_config()
        >>> engine = config.get_engine()
    """
    global _config_instance
    if _config_instance is None:
        _config_instance = DatabaseConfig()
    return _config_instance


# For convenience - create default instance on module load
config = get_config()


if __name__ == "__main__":
    """
    Test the database configuration when run directly.
    
    USAGE: python config/db_config.py
    """
    print("\n" + "="*60)
    print("DATABASE CONFIGURATION TEST")
    print("="*60)
    
    try:
        test_config = DatabaseConfig()
        
        print("\n✓ Configuration loaded successfully")
        print("\nConfiguration Details:")
        print("-" * 60)
        for key, value in test_config.to_dict().items():
            print(f"  {key:.<40} {value}")
        
        print("\n\nAvailable Database URLs:")
        print("-" * 60)
        for driver in ['pymysql', 'mysqldb', 'mysql-connector']:
            try:
                url = test_config.get_database_url(driver)
                # Mask password in display
                display_url = url.replace(test_config.db_password, '***')
                print(f"  {driver:.<35} {display_url}")
            except Exception as e:
                print(f"  {driver:.<35} ERROR: {str(e)}")
        
        print("\n\nTesting Engine Creation:")
        print("-" * 60)
        try:
            engine = test_config.get_engine('pymysql')
            print("  ✓ PyMySQL engine created successfully")
            print(f"  Engine URL: {engine.url}")
        except Exception as e:
            print(f"  ✗ Failed to create engine: {str(e)}")
        
        print("\n" + "="*60)
        print("Configuration test complete!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n✗ Configuration Error: {str(e)}")
        print("\nPlease check your .env file and try again.")
