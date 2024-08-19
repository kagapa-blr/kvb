from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError


def reset_database():
    # db_name = "kagahpxe_kvb"
    # db_user = "kagahpxe_kvb"
    # db_password = "rF*K0FTe-ZwL"  # No password
    # db_host = "localhost"  # or your database host
    # db_url = 'mysql://kagahpxe_kvb:rF*K0FTe-ZwL@localhost/kagahpxe_kvb'

    db_name = "kvb"
    db_user = "root"
    db_password = ""  # No password
    db_host = "127.0.0.1"  # or your database host
    db_url = f"mysql+mysqldb://{db_user}:{db_password}@{db_host}/{db_name}"

    sql_script_path = "kvb.sql"  # Path to your SQL script

    # Create an SQLAlchemy engine
    engine = create_engine(db_url)
    connection = engine.connect()

    try:
        # Drop the tables in the correct order to avoid foreign key constraints issues
        connection.execute(text("DROP TABLE IF EXISTS padya;"))
        connection.execute(text("DROP TABLE IF EXISTS sandhi;"))
        connection.execute(text("DROP TABLE IF EXISTS parva;"))
        connection.execute(text("DROP TABLE IF EXISTS users;"))

        # Close the connection before running the SQL script
        connection.close()

        # Run the SQL script using the SQLAlchemy engine
        with open(sql_script_path, 'r') as file:
            sql_script = file.read()

        # Reconnect to the database
        engine = create_engine(db_url)
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


import os
import subprocess


def perform_migration(message):
    """
    Automates the database migration process.

    :param message: A description of the migration changes.
    """
    try:
        # Check if the migrations directory exists
        if not os.path.exists('migrations'):
            print("Initializing migrations...")
            subprocess.run(['flask', 'db', 'init'], check=True)

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
    migration_message = "model updated"
    perform_migration(migration_message)
