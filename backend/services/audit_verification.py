

import hashlib
import json

from db import get_db_connection


def calculate_audit_hash(event_data):
    """
    Recalculate the SHA-256 hash using the same
    JSON format used when the audit record was created.
    """

    event_json = json.dumps(
        event_data,
        sort_keys=True,
        separators=(",", ":")
    )

    return hashlib.sha256(
        event_json.encode("utf-8")
    ).hexdigest()


def verify_audit_chain():

    connection = None
    cursor = None

    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)

        # Retrieve audit records in chronological order
        cursor.execute("""
            SELECT
                log_id,
                user_id,
                document_id,
                action,
                result,
                reason,
                ip_address,
                timestamp,
                previous_hash,
                current_hash
            FROM audit_logs
            ORDER BY log_id ASC
        """)

        records = cursor.fetchall()

        expected_previous_hash = "0" * 64

        total_records = len(records)
        verified_records = 0

        for record in records:

            # Step 1: Verify previous hash connection
            if record["previous_hash"] != expected_previous_hash:

                return {
                    "valid": False,
                    "message": "Audit chain is broken",
                    "failed_log_id": record["log_id"],
                    "reason": "PREVIOUS_HASH_MISMATCH",
                    "total_records": total_records,
                    "verified_records": verified_records
                }

            # Step 2: Rebuild the original event data
            event_data = {
                "user_id": record["user_id"],
                "document_id": record["document_id"],
                "action": record["action"],
                "result": record["result"],
                "reason": record["reason"],
                "ip_address": record["ip_address"],
                "timestamp": record["timestamp"].isoformat(
                    timespec="microseconds"
                ),
                "previous_hash": record["previous_hash"]
            }

            # Step 3: Recalculate the hash
            recalculated_hash = calculate_audit_hash(event_data)

            # Step 4: Compare calculated and stored hashes
            if recalculated_hash != record["current_hash"]:

                return {
                    "valid": False,
                    "message": "Audit record has been modified",
                    "failed_log_id": record["log_id"],
                    "reason": "CURRENT_HASH_MISMATCH",
                    "total_records": total_records,
                    "verified_records": verified_records
                }

            # Move to the next record
            expected_previous_hash = record["current_hash"]

            verified_records += 1

        return {
            "valid": True,
            "message": "All audit records are valid",
            "total_records": total_records,
            "verified_records": verified_records
        }

    except Exception as error:

        print("Audit verification error:", error)

        raise

    finally:

        if cursor:
            cursor.close()

        if connection and connection.is_connected():
            connection.close()
