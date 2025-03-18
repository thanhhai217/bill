import os
import psycopg2
from dotenv import load_dotenv

# Load biến môi trường từ .env
load_dotenv()

# Kết nối đến PostgreSQL trên VPS
def get_connection():
    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )
