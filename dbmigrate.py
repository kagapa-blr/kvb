import subprocess


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
    migration_message = "Added password hashing to User model"
    perform_migration(migration_message)
