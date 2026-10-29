#!/usr/bin/env bash
# Runs one SQL statement on the LINKED (hosted) Supabase project, as postgres, and commits it.
# Uses the CLI's own connection (supabase login + link), so no password or secret key is needed.
# Usage: bash scripts/remote-sql.sh "update public.profiles set role = 'admin' where ..."
set -euo pipefail
sql="${1:?Usage: scripts/remote-sql.sh \"<sql>\"}"
root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
mkdir -p "$work/supabase/tests" "$work/supabase/.temp"
cp "$root/supabase/config.toml" "$work/supabase/"
cp "$root/supabase/.temp/"* "$work/supabase/.temp/"
cat > "$work/supabase/tests/run.test.sql" <<SQL
set role postgres;
set search_path to public, extensions;
select plan(1);
$sql;
select pass('done');
select * from finish();
SQL
# One call at a time: parallel CLI connections collide. Retry a transient failure.
lock="${TMPDIR:-/tmp}/journapp-remote-sql.lock"
until mkdir "$lock" 2>/dev/null; do sleep 1; done
trap 'rm -rf "$work"; rmdir "$lock" 2>/dev/null || true' EXIT
for attempt in 1 2 3; do
  if out="$(npx supabase test db --linked --workdir "$work" 2>&1)" && grep -q "Result: PASS" <<<"$out"; then
    echo "Result: PASS"
    exit 0
  fi
  sleep $((attempt * 3))
done
echo "$out" | tail -5 >&2
exit 1
