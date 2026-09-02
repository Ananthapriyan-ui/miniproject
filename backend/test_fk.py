import sqlite3
import traceback

conn = sqlite3.connect('cloudvuln.db')
cursor = conn.cursor()

try:
    cursor.execute("PRAGMA foreign_keys = ON;")
    
    # 1. Insert Scan
    cursor.execute("""
        INSERT INTO scans (scan_ref, target, provider, scan_type, status, critical_count, high_count, medium_count, low_count, risk_score, duration, created_at, scan_data)
        VALUES ('TEST-FK-001', 'test.com', 'AWS', 'Audit', 'passed', 0, 0, 0, 0, 0, '1m', '2026-09-01 10:00:00', '{}')
    """)
    conn.commit()
    print("Scan inserted successfully.")
    
    # 2. Insert Report
    cursor.execute("""
        INSERT INTO reports (report_ref, scan_ref, target, executive_summary, scan_type, duration, html_generated, csv_generated, created_at)
        VALUES ('REP-TEST-FK-001', 'TEST-FK-001', 'test.com', 'Summary', 'Audit', '1m', 1, 1, '2026-09-01 10:00:00')
    """)
    conn.commit()
    print("Report inserted successfully.")
    
except Exception as e:
    print("Error:", e)
    traceback.print_exc()

conn.close()