#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$PROJECT_DIR"

export RNOH_C_API_ARCH=1

yarn react-native bundle-harmony \
  --dev false \
  --minify true \
  --js-engine any \
  --entry-file index.harmony.js \
  --config metro.harmony.config.js \
  --bundle-output harmony/entry/src/main/resources/rawfile/bundle.harmony.js \
  --assets-dest harmony/entry/src/main/resources/rawfile/assets
