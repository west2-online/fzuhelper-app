#!/bin/bash
set -e
echo "Running ci_post_clone.sh"

# cd out of ios/ci_scripts into main project directory
cd ../../

# install node and cocoapods
brew install node yarn cocoapods

# install node modules
yarn install

npx expo prebuild --platform ios


# 脚本来源：https://www.richinfante.com/2024/11/18/running-expo-prebuild-in-xcode-cloud
# 目的：在 Xcode Cloud 上运行 Expo 项目
# 这个文件放置在 /scripts 的原因是做备份，如果需要修改脚本内容，需要同步修改 ios/ci_scripts/ci_post_clone.sh 里的文件
