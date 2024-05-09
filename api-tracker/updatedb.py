"""
Update db
"""

import csv
import os
import pdb
import sys

CSV_FILE_PATH = "rows.csv"
SQL_FILE_NEXT_PUBLIC_WEEK_MAXPATH = "update-statistics.sql"


def generate_user_insert(addrs):
    unique_addrs = set(addrs)
    return f"""
INSERT INTO users (address)
SELECT x.address FROM (VALUES {",\n".join("('" + addr + "')" for addr in unique_addrs)}) AS x(address)
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.address = x.address
);
    """


def generate_stats_upsert(rows):
    return f"""
INSERT INTO public.statistics
    (id, timestamp, pool_type, user_address, action_count_longs, action_count_shorts, action_count_lps, volume_longs, volume_shorts, volume_lps)
VALUES
{",\n".join("('" + "', '".join(row) + "')" for row in rows)}
ON CONFLICT (timestamp, pool_type, user_address) DO UPDATE SET
    action_count_longs = EXCLUDED.action_count_longs,
    action_count_shorts = EXCLUDED.action_count_shorts,
    action_count_lps = EXCLUDED.action_count_lps,
    volume_longs = EXCLUDED.volume_longs,
    volume_shorts = EXCLUDED.volume_shorts,
    volume_lps = EXCLUDED.volume_lps;
    """


def main():
    do_user_update = bool(os.environ["DO_USER"])
    do_stats_upsert = bool(os.environ["DO_STATS_UPSERT"])

    statement = ""

    if do_user_update:
        with open(CSV_FILE_PATH, newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row
            statement += generate_user_insert(r[3] for r in reader)

    if do_stats_upsert:
        with open(CSV_FILE_PATH, newline="", encoding="utf-8") as csvfile:
            reader = csv.reader(csvfile)
            next(reader)  # Skip the header row
            statement += generate_stats_upsert(reader)

    with open(SQL_FILE_PATH, "w", encoding="utf-8") as sqlfile:
        sqlfile.write(statement)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # This captures the exception and starts a post-mortem debugging
        info = sys.exc_info()
        pdb.post_mortem(info[2])  # info[2] is the traceback object
        raise
