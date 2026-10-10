#!/usr/bin/env bash
# Runs the RLS / storage policy tests (supabase/policy-tests) against a plain,
# EMPTY, throwaway PostgreSQL database: Supabase stubs -> every migration (plus
# the production-drift fixture after the baseline) -> *_test.sql.
#
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/postgres npm run test:db
#
# Never point it at a real Supabase project: it creates schemas and roles.
set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to an empty throwaway Postgres database (superuser)}"
cd "$(dirname "$0")/.."

dir=supabase/policy-tests
run() { PGOPTIONS="-c client_min_messages=${LEVEL:-warning}" psql "$DATABASE_URL" -X -q -v ON_ERROR_STOP=1 -o /dev/null -f "$1"; }

run "$dir/00_supabase_stub.sql"
for migration in supabase/migrations/*.sql; do
  echo "migrate: $migration"
  run "$migration"
  if [[ $migration == *_baseline_schema.sql ]]; then run "$dir/01_production_drift.sql"; fi
done
run "$dir/02_helpers.sql"

for test in "$dir"/*_test.sql; do
  echo "test: $test"
  LEVEL=notice run "$test" 2>&1 | sed -e 's/^psql:[^ ]* NOTICE:  /  /'
done
echo "All policy tests passed."
