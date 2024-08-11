from sqlalchemy import create_engine, text


class Statistics:
    def __init__(self):
        pass

    def fetch_statistics(self):
        db_user = "root"  # Replace with your MySQL username
        db_password = ""  # Replace with your MySQL password if applicable
        db_host = "127.0.0.1"
        db_name = "kvb"
        db_url = f"mysql+mysqldb://{db_user}:{db_password}@{db_host}/{db_name}"

        engine = create_engine(db_url)
        connection = engine.connect()

        try:
            # Total Parva
            total_parva = connection.execute(text("SELECT COUNT(*) AS total_parva FROM parva")).scalar()

            # Total Sandhi
            total_sandhi = connection.execute(text("SELECT COUNT(*) AS total_sandhi FROM sandhi")).scalar()

            # Total Padya in Each Sandhi
            total_padya = connection.execute(text("""
                SELECT sandhi_id, COUNT(*) AS total_padya 
                FROM padya 
                GROUP BY sandhi_id
            """)).fetchall()

            # Total Padya (from all Sandhi)
            total_padya_all = connection.execute(text("SELECT COUNT(*) AS total_padya_all FROM padya")).scalar()

            # Total Users
            total_users = connection.execute(text("SELECT COUNT(*) AS total_users FROM users")).scalar()

            # Print the results
            print(f"Total Parva: {total_parva}")
            print(f"Total Sandhi: {total_sandhi}")
            print("Total Padya in Each Sandhi:")
            for row in total_padya:
                print(f"Sandhi ID {row.sandhi_id}: {row.total_padya} Padya")
            print(f"Total Padya (from all Sandhi): {total_padya_all}")
            print(f"Total Users: {total_users}")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            connection.close()


# Fetch and print statistics when the script is run directly
if __name__ == "__main__":
    stats = Statistics()
    stats.fetch_statistics()
