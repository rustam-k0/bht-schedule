#!/bin/sh
# Existing nginx bind mount and Caddy hostname; no container rebuild required.
set -eu
cd "$(dirname "$0")/.."
server=root@152.53.101.9
release=$(date -u +%Y%m%dT%H%M%SZ)
base=/opt/bht-schedule
npm test
npm run build
ssh -o BatchMode=yes "$server" "test -f '$base/site/index.html' && mkdir -p '$base/releases/$release/before' '$base/releases/$release/build' && cp -a '$base/site/.' '$base/releases/$release/before/'"
tar -C dist -cf - . | ssh -o BatchMode=yes "$server" "tar -xf - -C '$base/releases/$release/build'"
tar -czf - src scripts public README.md package.json package-lock.json index.html tsconfig.json tsconfig.app.json tsconfig.node.json vite.config.ts requirements.txt .gitignore | ssh -o BatchMode=yes "$server" "cat > '$base/releases/$release/source.tar.gz'"
ssh -o BatchMode=yes "$server" "set -eu; test -s '$base/releases/$release/source.tar.gz'; cp -a '$base/releases/$release/build/assets/.' '$base/site/assets/'; mkdir -p '$base/site/data'; for file in '$base/releases/$release/build/data/'*.json; do name=\$(basename \"\$file\"); cp \"\$file\" '$base/site/data/'\"\$name\".pending; mv '$base/site/data/'\"\$name\".pending '$base/site/data/'\"\$name\"; done; cp '$base/releases/$release/build/favicon.svg' '$base/site/favicon.svg'; cp '$base/releases/$release/build/index.html' '$base/site/index.html.pending'; mv '$base/site/index.html.pending' '$base/site/index.html'"
curl --fail --silent --show-error https://bht-schedule.152.53.101.9.nip.io/ -o /tmp/bht-deploy-index.html
cmp dist/index.html /tmp/bht-deploy-index.html
printf 'Verified release: %s\nRollback: ssh %s "cp -a %s/releases/%s/before/. %s/site/"\n' "$release" "$server" "$base" "$release" "$base"
