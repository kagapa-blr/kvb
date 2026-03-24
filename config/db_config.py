import os
import logging
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError

load_dotenv()

logger = logging.getLogger(__name__)


class DatabaseConfig:

    def __init__(self):

        self.db_user = os.getenv("DB_USER", "root")
        self.db_password = os.getenv("DB_PASSWORD", "")
        self.db_host = os.getenv("DB_HOST", "127.0.0.1")
        self.db_port = os.getenv("DB_PORT", "3306")
        self.db_name = os.getenv("DB_NAME", "new_kvb")

        self.db_password_encoded = quote_plus(self.db_password)

        self._validate()

    # -----------------------------------------------------
    # Validation
    # -----------------------------------------------------

    def _validate(self):

        if not self.db_user:
            raise ValueError("DB_USER is required")

        if not self.db_host:
            raise ValueError("DB_HOST is required")

        if not self.db_name:
            raise ValueError("DB_NAME is required")

    # -----------------------------------------------------
    # Credentials
    # -----------------------------------------------------

    def get_credentials(self):

        return {
            "user": self.db_user,
            "password": self.db_password,
            "host": self.db_host,
            "port": self.db_port,
            "database": self.db_name,
        }

    # -----------------------------------------------------
    # Database URL
    # -----------------------------------------------------

    def get_database_url(self, driver="pymysql"):

        driver_map = {
            "pymysql": "mysql+pymysql",
            "mysqldb": "mysql+mysqldb",
            "mysql-connector": "mysql+mysqlconnector",
        }

        if driver not in driver_map:
            raise ValueError(
                "Driver must be one of: pymysql, mysqldb, mysql-connector"
            )

        return (
            f"{driver_map[driver]}://{self.db_user}:{self.db_password_encoded}"
            f"@{self.db_host}:{self.db_port}/{self.db_name}"
            "?charset=utf8mb4"
        )

    # -----------------------------------------------------
    # NEW: Server URL (no database)
    # -----------------------------------------------------

    def get_server_url(self, driver="pymysql"):

        driver_map = {
            "pymysql": "mysql+pymysql",
            "mysqldb": "mysql+mysqldb",
            "mysql-connector": "mysql+mysqlconnector",
        }

        return (
            f"{driver_map[driver]}://{self.db_user}:{self.db_password_encoded}"
            f"@{self.db_host}:{self.db_port}"
        )

    # -----------------------------------------------------
    # NEW: Create database if not exists
    # -----------------------------------------------------

    def ensure_database_exists(self, driver="pymysql"):

        try:

            logger.info(
                "Checking database existence: %s",
                self.db_name
            )

            engine = create_engine(
                self.get_server_url(driver),
                isolation_level="AUTOCOMMIT",
            )

            with engine.connect() as conn:

                conn.execute(
                    text(
                        f"""
                        CREATE DATABASE IF NOT EXISTS `{self.db_name}`
                        CHARACTER SET utf8mb4
                        COLLATE utf8mb4_unicode_ci
                        """
                    )
                )

            logger.info(
                "Database ready: %s",
                self.db_name
            )

        except OperationalError as e:

            logger.error(
                "Failed to create database: %s",
                e
            )

            raise

    # -----------------------------------------------------
    # Engine
    # -----------------------------------------------------

    def get_engine(self, driver="pymysql", **kwargs):

        # Ensure DB exists first
        self.ensure_database_exists(driver)

        pool_defaults = {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_recycle": 3600,
            "echo": False,
            "future": True,
        }

        pool_defaults.update(kwargs)

        engine = create_engine(
            self.get_database_url(driver),
            connect_args={
                "charset": "utf8mb4",
                "init_command":
                "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            },
            **pool_defaults,
        )

        logger.info(
            "Database engine created -> %s:%s/%s",
            self.db_host,
            self.db_port,
            self.db_name,
        )

        return engine

    # -----------------------------------------------------

    def to_dict(self):

        return {
            "user": self.db_user,
            "host": self.db_host,
            "port": self.db_port,
            "database": self.db_name,
            "password": "***MASKED***",
            "charset": "utf8mb4",
            "collation": "utf8mb4_unicode_ci",
            "engine": "InnoDB",
        }


# Singleton

_config_instance = None


def get_config():

    global _config_instance

    if _config_instance is None:
        _config_instance = DatabaseConfig()

    return _config_instance


config = get_config()