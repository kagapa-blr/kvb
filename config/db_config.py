import os
import logging
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import create_engine

load_dotenv()

logging.basicConfig(level=logging.INFO)
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

    def _validate(self):
        if not self.db_user:
            raise ValueError("DB_USER is required")
        if not self.db_host:
            raise ValueError("DB_HOST is required")
        if not self.db_name:
            raise ValueError("DB_NAME is required")

    def get_credentials(self):
        return {
            "user": self.db_user,
            "password": self.db_password,
            "host": self.db_host,
            "port": self.db_port,
            "database": self.db_name,
        }

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

    def get_engine(self, driver="pymysql", **kwargs):

        pool_defaults = {
            "pool_size": 10,
            "max_overflow": 20,
            "pool_recycle": 3600,
            "echo": False,
        }

        pool_defaults.update(kwargs)

        engine = create_engine(
            self.get_database_url(driver),
            connect_args={
                "charset": "utf8mb4",
                "init_command": "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
            },
            **pool_defaults,
        )

        logger.info(
            f"Database engine created ({driver}) -> {self.db_host}:{self.db_port}/{self.db_name}"
        )

        return engine

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


_config_instance = None


def get_config():
    global _config_instance

    if _config_instance is None:
        _config_instance = DatabaseConfig()

    return _config_instance


config = get_config()


if __name__ == "__main__":

    print("\nDATABASE CONFIG TEST\n")

    try:
        db = DatabaseConfig()

        print("Configuration:")
        for k, v in db.to_dict().items():
            print(f"{k:15} : {v}")

        print("\nDatabase URLs:")

        for driver in ["pymysql", "mysqldb", "mysql-connector"]:
            try:
                url = db.get_database_url(driver)
                masked = url.replace(db.db_password, "***")
                print(f"{driver:15} : {masked}")
            except Exception as e:
                print(f"{driver:15} : ERROR {e}")

        print("\nCreating test engine...")

        engine = db.get_engine("pymysql")

        print("Engine created successfully")
        print(engine)

    except Exception as e:
        print("Configuration error:", e)