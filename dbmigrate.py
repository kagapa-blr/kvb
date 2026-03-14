from sqlalchemy import create_engine, text, inspect
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
from config.db_config import get_config

# Load environment variables
load_dotenv()

# Get database configuration from centralized config
db_config = get_config()
db_url = db_config.get_database_url('pymysql')


# Replace the db_name, db_user, db_password, db_host, db_port variables for backward compatibility
db_name = db_config.db_name
db_user = db_config.db_user
db_password = db_config.db_password
db_host = db_config.db_host
db_port = db_config.db_port


# ---------------- HELPER FUNCTIONS ---------------- #

def get_tables(engine):
    inspector = inspect(engine)
    return inspector.get_table_names()


def reset_all_tables(connection, tables):
    connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))

    for table in tables:
        print(f"Dropping table: {table}")
        connection.execute(text(f"DROP TABLE IF EXISTS `{table}`"))

    connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    print("All tables dropped successfully.")


def reset_specific_table(connection, table_name):
    connection.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
    connection.execute(text(f"DROP TABLE IF EXISTS `{table_name}`"))
    connection.execute(text("SET FOREIGN_KEY_CHECKS = 1"))

    print(f"Table '{table_name}' dropped successfully.")


# ---------------- MENU ---------------- #

def show_main_menu():
    print("\n===== DATABASE RESET MENU =====")
    print("1. Reset ALL tables")
    print("2. Reset specific table")
    print("3. Exit")


def show_table_menu(tables):
    print("\nSelect table to reset:")
    for i, table in enumerate(tables, start=1):
        print(f"{i}. {table}")


# ---------------- MAIN ---------------- #

def main():
    try:
        engine = create_engine(db_url)
        connection = engine.connect()

        while True:
            tables = get_tables(engine)

            show_main_menu()
            choice = input("Enter your choice: ")

            if choice == "1":
                if not tables:
                    print("No tables found.")
                    continue

                confirm = input("Drop ALL tables? (y/n): ")
                if confirm.lower() == "y":
                    reset_all_tables(connection, tables)

            elif choice == "2":
                if not tables:
                    print("No tables found.")
                    continue

                show_table_menu(tables)
                t_choice = int(input("Enter table number: "))

                if 1 <= t_choice <= len(tables):
                    table_name = tables[t_choice - 1]
                    reset_specific_table(connection, table_name)
                else:
                    print("Invalid selection.")

            elif choice == "3":
                print("Exiting...")
                break

            else:
                print("Invalid option.")

    except OperationalError as e:
        print(f"MySQL error: {e}")

    finally:
        try:
            connection.close()
        except:
            pass


if __name__ == "__main__":
    main()