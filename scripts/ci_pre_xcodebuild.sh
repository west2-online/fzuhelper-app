#!/bin/zsh

set -e

# Xcode Cloud runs ci_scripts from ios/ci_scripts/, so navigate to project root first
cd ../../

# This script requires 'jq' to parse version information from package.json.
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: 'jq' is required but not installed or not found in PATH." >&2
  exit 1
fi

commitCount=$(git rev-list --count HEAD)
version=$(jq -r '.version' package.json)
versionCodePrefix=$(printf "%s" "$version" | sed 's/\.//g')
buildNumber="${versionCodePrefix}$(printf "%03d" "$commitCount")"

echo "Setting build number to ${buildNumber}"
cd ios
agvtool new-version -all "${buildNumber}"
echo "Build number updated"

# 这个脚本用于注入 Xcode Cloud 的构建版本号
