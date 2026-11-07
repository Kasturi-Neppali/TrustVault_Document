
import hashlib
import json
from datetime import datetime, timezone

from db import get_db_connection


def record_audit_event(
    user_id,
    document_id,
    action,
    result,
    reason,
    ip_address
):
    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor()

        # PostgreSQL advisory lock:
        # Ensures only one request writes to the audit chain at a time.
        cursor.execute(
            "SELECT pg_advisory_xact_lock(724681923)"
        )

        # Find the most recent audit hash
        cursor.execute("""
            SELECT current_hash
            FROM audit_logs
            ORDER BY log_id DESC
            LIMIT 1
        """)

        previous_record = cursor.fetchone()

        previous_hash = (
            previous_record["current_hash"]
            if previous_record
            else "0" * 64
        )

        # Use one timestamp for both the stored event and its hash
        event_time = datetime.now(timezone.utc)

        event_data = {
            "user_id": user_id,
            "document_id": document_id,
            "action": action,
            "result": result,
            "reason": reason,
            "ip_address": ip_address,
            "timestamp": event_time.isoformat(timespec="microseconds"),
            "previous_hash": previous_hash
        }

        # Convert event details into consistent JSON
        event_json = json.dumps(
            event_data,
            sort_keys=True,
            separators=(",", ":")
        )

        # Generate SHA-256 hash
        current_hash = hashlib.sha256(
            event_json.encode("utf-8")
        ).hexdigest()

        # Insert the audit event
        cursor.execute("""
            INSERT INTO audit_logs (
                user_id,
                document_id,
                action,
                result,
                reason,
                ip_address,
                timestamp,
                previous_hash,
                current_hash
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            user_id,
            document_id,
            action,
            result,
            reason,
            ip_address,
            event_time,
            previous_hash,
            current_hash
        ))

        # Commit also releases the transaction-level advisory lock
        connection.commit()

    except Exception:
        if connection:
            connection.rollback()
        raise

    finally:
        if cursor:
            cursor.close()

        if connection and not connection.closed:
            connection.close()

