#!/usr/bin/env python3
"""
CloudVuln SQLite Zero-Downtime Database Backup Utility
Uses SQLite online backup API (sqlite3.connect().backup()) to safely backup the DB while WAL mode is active.
"""
import os
import sys
import sqlite3
import datetime
import logging

from typing import Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(message)s")
logger = logging.getLogger("BackupUtility")

def run_backup(db_path: Optional[str] = None, backup_dir: Optional[str] = None, keep_count: int = 7):
    """
    Performs an online atomic backup of the SQLite database without locking active transactions.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    if not db_path:
        db_path = os.getenv("DATABASE_PATH")
        if not db_path:
            db_url = os.getenv("DATABASE_URL", "")
            if db_url.startswith("sqlite:///"):
                db_path = db_url.replace("sqlite:///", "")
            else:
                db_path = os.path.join(base_dir, "cloudvuln.db")

    db_path = os.path.abspath(db_path)
    if not os.path.exists(db_path):
        logger.error(f"Source database file does not exist at: {db_path}")
        sys.exit(1)

    if not backup_dir:
        backup_dir = os.getenv("BACKUP_DIR", os.path.join(os.path.dirname(db_path), "backups"))

    os.makedirs(backup_dir, exist_ok=True)

    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_filename = f"cloudvuln_backup_{timestamp}.db"
    backup_path = os.path.join(backup_dir, backup_filename)

    logger.info(f"Starting online backup from '{db_path}' to '{backup_path}'...")

    try:
        source_conn = sqlite3.connect(db_path)
        dest_conn = sqlite3.connect(backup_path)

        with dest_conn:
            source_conn.backup(dest_conn)

        dest_conn.close()
        source_conn.close()

        file_size_kb = os.path.getsize(backup_path) / 1024
        logger.info(f"Backup successfully completed! Backup file size: {file_size_kb:.2f} KB")

        # Cleanup old backups retaining `keep_count` newest backups
        existing_backups = sorted([
            os.path.join(backup_dir, f) for f in os.listdir(backup_dir)
            if f.startswith("cloudvuln_backup_") and f.endswith(".db")
        ], key=os.path.getmtime)

        if len(existing_backups) > keep_count:
            to_delete = existing_backups[:-keep_count]
            for old_backup in to_delete:
                os.remove(old_backup)
                logger.info(f"Cleaned up old backup: {os.path.basename(old_backup)}")

        return backup_path

    except Exception as e:
        logger.error(f"Failed to execute database backup: {e}")
        sys.exit(1)

if __name__ == "__main__":
    run_backup()
