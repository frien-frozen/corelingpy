#!/usr/bin/env bash
# Build Coreling v2 and pack a release tarball for install.sh / install.ps1
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="$(node -p "require('./package.json').version")"
OUT_DIR="${ROOT}/release"
ARCHIVE="${OUT_DIR}/coreling-v${VERSION}.tar.gz"

echo "Building Coreling v${VERSION}..."
export PATH="${HOME}/.bun/bin:${PATH}"
bun run build

mkdir -p "$OUT_DIR/stage"
STAGE="${OUT_DIR}/stage/coreling-v${VERSION}"
rm -rf "$STAGE"
mkdir -p "$STAGE/bin" "$STAGE/dist" "$STAGE/scripts"

cp bin/coreling "$STAGE/bin/coreling"
cp dist/cli.mjs "$STAGE/dist/cli.mjs"
cp package.json "$STAGE/package.json"
cp scripts/start-coreling.ts "$STAGE/scripts/start-coreling.ts"
cp scripts/start-llama-server.ts "$STAGE/scripts/start-llama-server.ts"

chmod +x "$STAGE/bin/coreling"

tar -czf "$ARCHIVE" -C "$OUT_DIR/stage" "coreling-v${VERSION}"

echo ""
echo "Release archive: $ARCHIVE"
echo "Upload to GitHub Releases as: coreling-v${VERSION}.tar.gz"
echo "  gh release create v${VERSION} \"$ARCHIVE\" --title \"Coreling v${VERSION}\""
