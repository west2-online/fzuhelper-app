#!/bin/bash
set -e
echo "Running ci_post_clone.sh"

# cd out of ios/ci_scripts into main project directory
cd ../../

# install node and cocoapods
brew install node yarn cocoapods

# install node modules
yarn install

# xcode cloud sets `CI` env var to 'TRUE':
# This causes a crash: Error: GetEnv.NoBoolean: TRUE is not a boolean.
# This is a workaround for that issue.
CI="true" npx expo prebuild --platform ios


# 脚本来源：https://www.richinfante.com/2024/11/18/running-expo-prebuild-in-xcode-cloud
# 目的：在 Xcode Cloud 上运行 Expo 项目
