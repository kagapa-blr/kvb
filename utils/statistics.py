from sqlalchemy import create_engine, text


class Statistics:
    def __init__(self):
        self.db_user = "root"  # Replace with your MySQL username
        self.db_password = ""  # Replace with your MySQL password if applicable
        self.db_host = "127.0.0.1"
        self.db_name = "kvb"
        self.db_url = f"mysql+mysqldb://{self.db_user}:{self.db_password}@{self.db_host}/{self.db_name}"

    def fetch_statistics(self):
        engine = create_engine(self.db_url)
        connection = engine.connect()
        statistics = {}

        try:
            # Total Parva
            total_parva = connection.execute(text("SELECT COUNT(*) AS total_parva FROM parva")).scalar()

            # Total Sandhi
            total_sandhi = connection.execute(text("SELECT COUNT(*) AS total_sandhi FROM sandhi")).scalar()

            # Total Sandhi in Each Parva
            total_sandhi_in_each_parva = connection.execute(text("""
                SELECT parva_id, COUNT(*) AS total_sandhi
                FROM sandhi
                GROUP BY parva_id
            """)).fetchall()

            # Total Padya in Each Sandhi
            total_padya_in_each_sandhi = connection.execute(text("""
                SELECT sandhi_id, COUNT(*) AS total_padya 
                FROM padya 
                GROUP BY sandhi_id
            """)).fetchall()

            # Total Padya in Each Parva with Name
            total_padya_in_each_parva = connection.execute(text("""
                SELECT p.id AS parva_id, p.name AS parva_name, COUNT(pa.id) AS total_padya
                FROM padya pa
                JOIN sandhi s ON pa.sandhi_id = s.id
                JOIN parva p ON s.parva_id = p.id
                GROUP BY p.id, p.name
            """)).fetchall()
            # Total Padya (from all Sandhi)
            total_padya_all = connection.execute(text("SELECT COUNT(*) AS total_padya_all FROM padya")).scalar()

            # Total Users
            total_users = connection.execute(text("SELECT COUNT(*) AS total_users FROM users")).scalar()

            # Organizing results into the statistics dictionary
            statistics["total_parva"] = total_parva
            statistics['total_sandhi'] = total_sandhi

            statistics['sandhi_in_each_parva'] = [
                (row.parva_id, row.total_sandhi) for row in total_sandhi_in_each_parva
            ]

            statistics['padya_in_each_sandhi'] = [
                (row.sandhi_id, row.total_padya) for row in total_padya_in_each_sandhi
            ]

            statistics['padya_in_each_parva'] = [
                {'parva_id': row.parva_id, 'parva_name': row.parva_name, 'total_padya': row.total_padya}
                for row in total_padya_in_each_parva
            ]

            statistics['total_padya'] = total_padya_all
            statistics['total_users'] = total_users

        except Exception as e:
            print(f"Error: {e}")
        finally:
            connection.close()
        return statistics

    def search_padya_by_word(self, word):
        engine = create_engine(self.db_url)
        connection = engine.connect()
        matching_rows = []

        try:
            # Search for rows in the padya column that contain the given word
            query = text("SELECT * FROM padya WHERE padya LIKE :word")
            result = connection.execute(query, {"word": f"%{word}%"}).fetchall()

            # Store the matching rows
            matching_rows = [dict(row._mapping) for row in result]

        except Exception as e:
            print(f"Error: {e}")
        finally:
            connection.close()

        return matching_rows


# Fetch and print statistics when the script is run directly
if __name__ == "__main__":
    stats = Statistics()
    statistics = stats.fetch_statistics()
    print(statistics)
