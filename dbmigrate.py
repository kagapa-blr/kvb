import subprocess

from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


def reset_database():
    """
    Resets the database by dropping it if it exists, recreating it, and running the SQL script to set up the schema.
    """
    db_name = "kvb"
    db_user = "root"
    db_password = ""  # No password
    db_host = "127.0.0.1"  # or your database host
    db_url = f"mysql+mysqldb://{db_user}:{db_password}@{db_host}/"

    sql_script_path = "kvb.sql"  # Path to your SQL script

    # Create an SQLAlchemy engine
    engine = create_engine(db_url)
    connection = engine.connect()

    try:
        # Drop the database if it exists
        connection.execute(text(f"DROP DATABASE IF EXISTS {db_name};"))

        # Recreate the database with UTF-8 character set and collation
        connection.execute(text(f"""
            CREATE DATABASE {db_name}
            DEFAULT CHARACTER SET utf8mb4
            DEFAULT COLLATE utf8mb4_unicode_ci;
        """))

        # Switch to the newly created database
        connection.execute(text(f"USE {db_name};"))

        # Close the connection before running the SQL script
        connection.close()

        # Run the SQL script using the SQLAlchemy engine
        with open(sql_script_path, 'r') as file:
            sql_script = file.read()

        # Connect to the newly created database
        engine = create_engine(f"mysql+mysqldb://{db_user}:{db_password}@{db_host}/{db_name}")
        connection = engine.connect()

        # Execute the SQL script
        connection.execute(text(sql_script))

        print("Database reset successfully.")

    except OperationalError as e:
        print(f"MySQL error occurred: {e}")
    except Exception as e:
        print(f"Unexpected error: {e}")
    finally:
        # Ensure connection is closed
        if connection:
            connection.close()


def perform_migration(message):
    """
    Automates the database migration process.

    :param message: A description of the migration changes.
    """
    try:
        # Create a new migration script with the provided message
        subprocess.run(['flask', 'db', 'migrate', '-m', message], check=True)

        # Apply the migration changes to the database
        subprocess.run(['flask', 'db', 'upgrade'], check=True)

        print("Migration completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"An error occurred during migration: {e}")


# Example usage
if __name__ == '__main__':
    # reset_database()
    migration_message = "Added password hashing to User model"
    perform_migration(migration_message)
