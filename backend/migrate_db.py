import sqlite3

conn = sqlite3.connect('cloudvuln.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users);")
user_cols = [col[1] for col in cursor.fetchall()]
print('Users table columns:', user_cols)

if 'last_login' not in user_cols:
    cursor.execute("ALTER TABLE users ADD COLUMN last_login DATETIME;")
    conn.commit()
    print("Added last_login column to users table")

conn.close()