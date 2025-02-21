#!/bin/zsh
# save as ci_scripts/ci_post_xcodebuild.sh in your project root


# 安装 translate-shell 为了多语言支持
brew install translate-shell

if [[ -d "$CI_APP_STORE_SIGNED_APP_PATH" ]]; then
    TESTFLIGHT_DIR_PATH=../TestFlight
    [[ ! -d $TESTFLIGHT_DIR_PATH ]] && mkdir $TESTFLIGHT_DIR_PATH
    git fetch --deepen 3 || { echo "Failed to fetch git history"; exit 1; }
    GIT_LOG=$(git log -3 --pretty=format:"%s") || { echo "Failed to get git log"; exit 1; }

    # 翻译提交信息到中文
    GIT_LOG_ZH=$(echo "$GIT_LOG" | trans -brief -t zh)

    # 写入 en-US 文件
    echo "$GIT_LOG" > $TESTFLIGHT_DIR_PATH/WhatToTest.en-US.txt || { echo "Failed to write WhatToTest.en-US file"; exit 1; }

    # 写入 zh-CN 文件
    echo "$GIT_LOG_ZH" > $TESTFLIGHT_DIR_PATH/WhatToTest.zh-CN.txt || { echo "Failed to write WhatToTest.zh-CN file"; exit 1; }
fi

# 这个脚本是在 Xcode Cloud 上运行的，在 Xcode 构建完成后执行
# 用于将提交信息写入到 TestFlight 文件夹中，以便上传到 TestFlight 时使用
# 可以自动基于 git log 生成 WhatToTest.en-US.txt 和 WhatToTest.zh-CN.txt 文件
# 这样可以在 TestFlight 显示 "What to Test" 信息，方便测试人员了解本次构建的改动

# 来源：https://developer.apple.com/forums/thread/711208
# 这个文件放置在 /scripts 的原因是做备份，如果需要修改脚本内容，需要同步修改 ios/ci_scripts/ci_post_clone.sh 里的文件