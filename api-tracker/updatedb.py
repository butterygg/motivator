"""
Update db
"""

import csv
import itertools
import os
import pdb
import sys

SQL_FILE_PATH_FMT = "update-statistics-{}.sql"


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
    (timestamp, pool_type, user_address, action_count_longs, action_count_shorts, action_count_lps, volume_longs, volume_shorts, volume_lps, pnl_longs, pnl_shorts, pnl_lps, tvl_longs, tvl_shorts, tvl_lps)
VALUES
{",\n".join("('" + "', '".join(row) + "')" for row in rows)}
ON CONFLICT (timestamp, pool_type, user_address) DO UPDATE SET
    action_count_longs = EXCLUDED.action_count_longs,
    action_count_shorts = EXCLUDED.action_count_shorts,
    action_count_lps = EXCLUDED.action_count_lps,
    volume_longs = EXCLUDED.volume_longs,
    volume_shorts = EXCLUDED.volume_shorts,
    volume_lps = EXCLUDED.volume_lps,
    pnl_longs = EXCLUDED.pnl_longs,
    pnl_shorts = EXCLUDED.pnl_shorts,
    pnl_lps = EXCLUDED.pnl_lps,
    tvl_longs = EXCLUDED.tvl_longs,
    tvl_shorts = EXCLUDED.tvl_shorts,
    tvl_lps = EXCLUDED.tvl_lps;
    """


SQL_STATS_CREATE_INDEX = """
CREATE UNIQUE INDEX IF NOT EXISTS idx_statistics_on_timestamp_pool_user ON public.statistics (timestamp, pool_type, user_address);
"""


def chunks(iterable, size):
    it = iter(iterable)
    while True:
        chunk = list(itertools.islice(it, size))
        if not chunk:
            return
        yield chunk


def main():
    csv_file_path = os.environ["CSV_FILE_PATH"]
    chunk_size = int(os.environ.get("CHUNK_SIZE", 100000))

    statements = []

    with open(csv_file_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip the header row
        statements.append(generate_user_insert(r[3] for r in reader))

    statements.append(SQL_STATS_CREATE_INDEX)

    with open(csv_file_path, newline="", encoding="utf-8") as csvfile:
        reader = csv.reader(csvfile)
        next(reader)  # Skip the header row
        no_block_num_rows = (r[:1] + r[2:] for r in reader)
        for chunk in chunks(no_block_num_rows, chunk_size):
            print("chunk")
            statements.append(generate_stats_upsert(chunk))

    for idx, statement in enumerate(statements):
        print(f"{idx} file")
        with open(SQL_FILE_PATH_FMT.format(idx), "w", encoding="utf-8") as sqlfile:
            sqlfile.write(statement)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # This captures the exception and starts a post-mortem debugging
        info = sys.exc_info()
        pdb.post_mortem(info[2])  # info[2] is the traceback object
        raise
