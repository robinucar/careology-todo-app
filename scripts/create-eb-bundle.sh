#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE_NAME="${1:-careology-todo-eb-v2.zip}"
OUTPUT_DIR="$ROOT_DIR/deploy"
STAGE_DIR="$ROOT_DIR/.deploy/eb-bundle"

if [[ "$BUNDLE_NAME" != *.zip ]]; then
  BUNDLE_NAME="$BUNDLE_NAME.zip"
fi

BUNDLE_PATH="$OUTPUT_DIR/$BUNDLE_NAME"

cd "$ROOT_DIR"

require_path() {
  local path="$1"

  if [[ ! -e "$path" ]]; then
    echo "Missing required path: $path" >&2
    exit 1
  fi
}

echo "Generating Prisma client..."
npm run db:generate --workspace @careology/api

echo "Building application..."
npm run build

require_path "Procfile"
require_path ".ebextensions/01_deploy.config"
require_path "apps/api/dist/index.js"
require_path "apps/api/dist/generated/prisma/client.js"
require_path "apps/api/prisma.config.ts"
require_path "apps/api/prisma/schema.prisma"
require_path "apps/web/dist/index.html"
require_path "packages/shared/dist/index.js"

echo "Preparing Elastic Beanstalk bundle..."
rm -rf "$STAGE_DIR"
mkdir -p "$STAGE_DIR/.ebextensions"
mkdir -p "$STAGE_DIR/apps/api"
mkdir -p "$STAGE_DIR/apps/web"
mkdir -p "$STAGE_DIR/packages/shared"
mkdir -p "$OUTPUT_DIR"

cp package.json package-lock.json Procfile "$STAGE_DIR/"
cp .ebextensions/01_deploy.config "$STAGE_DIR/.ebextensions/"

cp apps/api/package.json "$STAGE_DIR/apps/api/"
cp apps/api/prisma.config.ts "$STAGE_DIR/apps/api/"
cp -R apps/api/dist "$STAGE_DIR/apps/api/"
cp -R apps/api/prisma "$STAGE_DIR/apps/api/"

cp -R apps/web/dist "$STAGE_DIR/apps/web/"

cp packages/shared/package.json "$STAGE_DIR/packages/shared/"
cp -R packages/shared/dist "$STAGE_DIR/packages/shared/"

cat > "$STAGE_DIR/.npmrc" <<'NPMRC'
omit=dev
audit=false
fund=false
progress=false
NPMRC

echo "Creating $BUNDLE_PATH..."
rm -f "$BUNDLE_PATH"
(
  cd "$STAGE_DIR"
  zip -qr "$BUNDLE_PATH" .
)

echo "Bundle ready: $BUNDLE_PATH"
