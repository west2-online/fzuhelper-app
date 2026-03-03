#!/bin/bash
set -euo pipefail

# This script requires 'jq' to parse version information from package.json.
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: 'jq' is required but not installed or not found in PATH." >&2
  exit 1
fi

commitCount=$(git rev-list --count HEAD 2>/dev/null || echo 0)
version=$(jq -r '.version' package.json 2>/dev/null || echo "0.0.0")
versionCodePrefix=$(printf "%s" "$version" | sed 's/\.//g')
versionCodeSuffix=$(printf "%03d" "$commitCount")
buildNumber="${versionCodePrefix}${versionCodeSuffix}"

echo "Computed BUILD_NUMBER=${buildNumber}"

# Replace the buildNumber line in app.config.ts. Use perl for cross-platform in-place replacement on macOS/Linux.
if [ ! -f app.config.ts ]; then
  echo "app.config.ts not found in current directory" >&2
  exit 1
fi

perl -0777 -pe "s/const buildNumber = [^;]+;/const buildNumber = '${buildNumber}';/s" -i.bak app.config.ts

echo "Injected buildNumber into app.config.ts -> ${buildNumber}"
# remove backup
rm -f app.config.ts.bak

exit 0
