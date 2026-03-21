import os
from psycopg2 import pool
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

try:
    db_pool = pool.SimpleConnectionPool(1, 20, DATABASE_URL)
    if db_pool:
        print("Postgres Connection Pool created successfully")
except Exception as e:
    print(f"Error creating Connection Pool: {e}")
    db_pool = None
