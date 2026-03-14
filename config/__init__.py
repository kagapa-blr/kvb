"""
Configuration Package
====================

Centralized configuration management for KVB application.

MODULES:
    - db_config: Database configuration and connection management

USAGE:
    from config.db_config import get_config
    config = get_config()
    engine = config.get_engine()
"""

from config.db_config import DatabaseConfig, get_config, config

__all__ = ['DatabaseConfig', 'get_config', 'config']
