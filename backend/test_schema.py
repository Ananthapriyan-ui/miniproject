import sqlite3
conn = sqlite3.connect('cloudvuln.db')
cursor = conn.cursor()
cursor.execute("SELECT scan_ref FROM scans WHERE scan_ref IN ('SCAN-2026-9135', 'SCAN-2026-8690');")
print("Scans found:", cursor.fetchall())
conn.close()