from sqlalchemy import create_engine, text
import logging
import sys
import os

# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Import config with error handling
try:
    from config.db_config import get_config
    logger.debug("✓ config.db_config imported successfully")
except ImportError as e:
    logger.error(f"✗ Failed to import config.db_config: {str(e)}")
    logger.error(f"  Python path: {sys.path}")
    logger.error(f"  Current directory: {os.getcwd()}")
    raise


class Statistics:
    def __init__(self):
        """Initialize Statistics with database configuration."""
        try:
            logger.debug("Initializing Statistics class...")
            
            # Get database configuration from centralized config
            db_config = get_config()
            logger.debug(f"✓ Database config loaded: {db_config.db_host}:{db_config.db_port}/{db_config.db_name}")
            
            self.db_url = db_config.get_database_url('pymysql')
            logger.debug(f"✓ Database URL generated (driver: pymysql)")
            # Note: Connection test is deferred to fetch_statistics() to avoid
            # initialization issues at module import time
            
        except Exception as e:
            logger.error(f"✗ Error initializing Statistics: {str(e)}", exc_info=True)
            raise

    def fetch_statistics(self):
        try:
            engine = create_engine(self.db_url)
            logger.debug(f"Engine created, connecting to database...")
            connection = engine.connect()
            logger.debug(f"✓ Connected to database successfully")
            statistics = {}

            try:
                # Test basic connection
                logger.debug("Testing basic query...")
                test_result = connection.execute(text("SELECT 1 as test")).scalar()
                logger.debug(f"✓ Basic query successful")
                
                # Total Parva
                logger.debug("Fetching parva count...")
                total_parva = connection.execute(text("SELECT COUNT(*) AS total_parva FROM parva")).scalar()
                logger.debug(f"  Parva count: {total_parva}")

                # Total Sandhi
                logger.debug("Fetching sandhi count...")
                total_sandhi = connection.execute(text("SELECT COUNT(*) AS total_sandhi FROM sandhi")).scalar()
                logger.debug(f"  Sandhi count: {total_sandhi}")

                # Total Sandhi in Each Parva with Name
                logger.debug("Fetching sandhi per parva...")
                total_sandhi_in_each_parva = connection.execute(text("""
                    SELECT p.id AS parva_id, p.name AS parva_name, COUNT(s.id) AS total_sandhi
                    FROM sandhi s
                    JOIN parva p ON s.parva_id = p.id
                    GROUP BY p.id, p.name
                """)).fetchall()
                logger.debug(f"  Sandhi per parva: {len(total_sandhi_in_each_parva)} records")

                # Total Padya in Each Sandhi with Number and Parva Name
                logger.debug("Fetching padya per sandhi...")
                total_padya_in_each_sandhi = connection.execute(text("""
                    SELECT s.sandhi_number AS sandhi_number, p.name AS parva_name, COUNT(pa.id) AS total_padya
                    FROM padya pa
                    JOIN sandhi s ON pa.sandhi_id = s.id
                    JOIN parva p ON s.parva_id = p.id
                    GROUP BY s.sandhi_number, p.name
                """)).fetchall()
                logger.debug(f"  Padya per sandhi: {len(total_padya_in_each_sandhi)} records")

                # Total Padya in Each Parva with Name
                logger.debug("Fetching padya per parva...")
                total_padya_in_each_parva = connection.execute(text("""
                    SELECT p.id AS parva_id, p.name AS parva_name, COUNT(pa.id) AS total_padya
                    FROM padya pa
                    JOIN sandhi s ON pa.sandhi_id = s.id
                    JOIN parva p ON s.parva_id = p.id
                    GROUP BY p.id, p.name
                """)).fetchall()
                logger.debug(f"  Padya per parva: {len(total_padya_in_each_parva)} records")
                
                # Total Padya (from all Sandhi)
                logger.debug("Fetching total padya...")
                total_padya_all = connection.execute(text("SELECT COUNT(*) AS total_padya_all FROM padya")).scalar()
                logger.debug(f"  Total padya: {total_padya_all}")

                # Total Users
                logger.debug("Fetching user count...")
                total_users = connection.execute(text("SELECT COUNT(*) AS total_users FROM users")).scalar()
                logger.debug(f"  User count: {total_users}")

                # Organizing results into the statistics dictionary
                statistics["total_parva"] = total_parva
                statistics['total_sandhi'] = total_sandhi

                statistics['sandhi_in_each_parva'] = [
                    {'parva_id': row.parva_id, 'parva_name': row.parva_name, 'total_sandhi': row.total_sandhi}
                    for row in total_sandhi_in_each_parva
                ]

                statistics['padya_in_each_sandhi'] = [
                    {'sandhi_number': row.sandhi_number, 'parva_name': row.parva_name, 'total_padya': row.total_padya}
                    for row in total_padya_in_each_sandhi
                ]

                statistics['padya_in_each_parva'] = [
                    {'parva_id': row.parva_id, 'parva_name': row.parva_name, 'total_padya': row.total_padya}
                    for row in total_padya_in_each_parva
                ]

                statistics['total_padya'] = total_padya_all
                statistics['total_users'] = total_users
                logger.debug(f"Statistics fetched successfully: {len(statistics)} keys")

            except Exception as e:
                logger.error(f"Error executing queries: {str(e)}", exc_info=True)
                raise
            finally:
                connection.close()
                logger.debug("Database connection closed")
                
            return statistics
            
        except Exception as e:
            logger.error(f"Error in fetch_statistics: {str(e)}", exc_info=True)
            raise

    def search_padya_by_word(self, word):
        try:
            engine = create_engine(self.db_url)
            connection = engine.connect()
            logger.debug(f"Connected to database for search")
            matching_rows = []

            try:
                # Search for rows in the padya column that contain the given word
                query = text("SELECT * FROM padya WHERE padya LIKE :word")
                result = connection.execute(query, {"word": f"%{word}%"}).fetchall()

                # Store the matching rows
                matching_rows = [dict(row._mapping) for row in result]
                logger.debug(f"Found {len(matching_rows)} matching padyas for word: {word}")

            except Exception as e:
                logger.error(f"Error executing search query: {str(e)}", exc_info=True)
                raise
            finally:
                connection.close()
                logger.debug("Database connection closed after search")

            return matching_rows
            
        except Exception as e:
            logger.error(f"Error in search_padya_by_word: {str(e)}", exc_info=True)
            raise


# Fetch and print statistics when the script is run directly
if __name__ == "__main__":
    stats = Statistics()
    statistics = stats.fetch_statistics()
    print(statistics)
