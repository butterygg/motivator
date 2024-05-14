# Deployment steps

## A. Produce new statistics

### API tracker version:

```sh
# In api-tracker:

# Use a START_BLOCK that is before the first day of the previous week and a
# end_block that is after the last day.
START_BLOCK=<> END_BLOCK=<> pipenv run python dump_events.py

# END_DATE is non-inclusive.
EVENTS=<events…>.json START_DATE=<> END_DATE=<> pipenv run python aggregate.py
cp <rows….csv> rows.csv

DO_USER=1 DO_STATS_CREATE_INDEX= DO_STATS_UPSERT=1 DO_TRUNCATE_TOTALS=1 pipenv run python updatedb.py
```

## B. Deploy code

- Update DB schema if neeeded.
- Merge `main` into `prod` branch.

## C. Load statistics SQL file in DB

```sh
# In api-tracker:
psql $PG_CONNECT_STR -f update-statistics.sql
```

## D. Update environment variables

- Change Week environment variable to n.
- Redeploy.
