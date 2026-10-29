#!/usr/bin/env bash
# Makes an existing member an admin in the LOCAL database.
# Usage: pnpm admin:grant person@example.com
# For production, run the same UPDATE in the Supabase SQL editor (see docs/OPERATIONS.md).
set -euo pipefail
email="${1:?Usage: pnpm admin:grant <email>}"
docker exec -i supabase_db_journapp psql -U postgres -v ON_ERROR_STOP=1 -v email="$email" <<'SQL'
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = lower(:'email'))
returning id, display_name, role;
SQL
