#!/usr/bin/env bash
# Pushes JournApp's auth settings to the LINKED hosted Supabase project.
# Builds a production copy of supabase/config.toml (live URLs, hosted defaults kept for everything
# JournApp does not manage), shows the diff, then pushes. Requires Owner/Admin on the organisation.
#
# Usage: SITE_URL=https://journ-lyart.vercel.app [CONFIRM_EMAIL=false] [SIGNUP_RATE=30] bash scripts/push-auth-config.sh
set -euo pipefail
: "${SITE_URL:?Set SITE_URL, e.g. https://journ-lyart.vercel.app}"
CONFIRM_EMAIL="${CONFIRM_EMAIL:-false}"   # set true once Resend SMTP is connected
SIGNUP_RATE="${SIGNUP_RATE:-30}"          # sign-ups and sign-ins per 5 minutes per IP
PREVIEW_URLS="${PREVIEW_URLS:-https://journ-*-oshiokesalakis-projects.vercel.app/**}"

root="$(cd "$(dirname "$0")/.." && pwd)"
ref="$(cat "$root/supabase/.temp/project-ref")"
work="$root/supabase/production"
mkdir -p "$work/supabase/.temp"
cp "$root/supabase/.temp/"* "$work/supabase/.temp/"

python3 - "$root/supabase/config.toml" "$work/supabase/config.toml" <<PY
import re, sys
s = open(sys.argv[1]).read()
def sub(pattern, repl):
    global s
    s, n = re.subn(pattern, repl, s, count=1, flags=re.M)
    assert n == 1, pattern
sub(r'^site_url = .*', 'site_url = "${SITE_URL}"')
sub(r'^additional_redirect_urls = .*', 'additional_redirect_urls = ["${SITE_URL}/**", "${PREVIEW_URLS}", "http://localhost:3000/**"]')
sub(r'^sign_in_sign_ups = .*', 'sign_in_sign_ups = ${SIGNUP_RATE}')
sub(r'^token_refresh = .*', 'token_refresh = 150')
# Email confirmation lives in [auth.email]; the SMS block has its own flag.
s = s.replace('[auth.email]\n', '[auth.email]\n', 1)
head, tail = s.split('[auth.email]\n', 1)
tail = re.sub(r'^enable_confirmations = .*', 'enable_confirmations = ${CONFIRM_EMAIL}', tail, count=1, flags=re.M)
s = head + '[auth.email]\n' + tail
# Hosted defaults for settings JournApp does not manage.
sub(r'^max_frequency = "1s"', 'max_frequency = "1m0s"')
sub(r'^otp_length = 6', 'otp_length = 8')
sub(r'^default_pool_size = 20', 'default_pool_size = 15')
sub(r'^max_client_conn = 100', 'max_client_conn = 200')
s = re.sub(r'(\[auth\.mfa\.totp\]\s*\n)enroll_enabled = false\nverify_enabled = false', r'\1enroll_enabled = true\nverify_enabled = true', s)
s = re.sub(r'\[storage\.vector\]\n(?:[^\[]*\n)', '', s, count=1)
s += '\n[storage.vector]\nenabled = false\n'
open(sys.argv[2], 'w').write(s)
PY

npx supabase config diff --workdir "$work" --project-ref "$ref" 2>&1 | tail -1 \
  | python3 -c "import json,sys; d=json.load(sys.stdin); [print(' ', '.'.join(map(str,c['path'])), ':', c.get('remote'), '->', c.get('local')) for c in d['changes']] or print('  no changes')"
read -r -p "Push these changes? [y/N] " answer
[[ "$answer" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }
npx supabase config push --workdir "$work" --project-ref "$ref" --yes 2>&1 | tail -1 \
  | python3 -c "import json,sys; print(json.load(sys.stdin).get('message'))"
