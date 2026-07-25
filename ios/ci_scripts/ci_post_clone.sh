#!/bin/zsh

set -e
echo "Running ci_post_clone.sh"

# cd out of ios/ci_scripts into main project directory
cd ../../

# Xcode Cloud 浅克隆，这里需要拉取所有提交来正常计算版本号
if git rev-parse --is-shallow-repository | grep -q true; then
    git fetch --unshallow --no-tags origin
fi

# install node and cocoapods
brew install node yarn cocoapods

# install node modules
yarn install

npx expo prebuild --platform ios


# 脚本来源：https://www.richinfante.com/2024/11/18/running-expo-prebuild-in-xcode-cloud
# 目的：在 Xcode Cloud 上运行 Expo 项目
