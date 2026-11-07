
from db import get_db_connection


try:
    connection = get_db_connection()

    print("PostgreSQL connection successful!")

    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        result = cursor.fetchone()

        print("Database version:")
        print(result["version"])

    connection.close()

except Exception as error:
    print("Database connection failed.")
    print(error)