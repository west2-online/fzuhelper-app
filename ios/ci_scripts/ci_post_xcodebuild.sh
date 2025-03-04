#!/bin/zsh
# save as ci_scripts/ci_post_xcodebuild.sh in your project root


# 安装 translate-shell 为了多语言支持
brew install translate-shell

if [[ -d "$CI_APP_STORE_SIGNED_APP_PATH" ]]; then
    TESTFLIGHT_DIR_PATH=../TestFlight
    [[ ! -d $TESTFLIGHT_DIR_PATH ]] && mkdir $TESTFLIGHT_DIR_PATH
    git fetch --deepen 3 || { echo "Failed to fetch git history"; exit 1; }
    GIT_LOG=$(git log -3 --pretty=format:"%s%n%b") || { echo "Failed to get git log"; exit 1; }

    # 翻译提交信息到中文
    GIT_LOG_EN=$(echo "$GIT_LOG" | trans -brief -t en)

    # 翻译提交信息到日文
    GIT_LOG_JP=$(echo "$GIT_LOG" | trans -brief -t jp)

    # 写入 en-US 文件
    echo -e "Non-human Translation:\n$GIT_LOG_EN" > $TESTFLIGHT_DIR_PATH/WhatToTest.en-US.txt || { echo "Failed to write WhatToTest.en-US file"; exit 1; }

    # 写入 zh-Hans 文件
    echo -e "同步自 Github 最近三条提交记录:\n$GIT_LOG" > $TESTFLIGHT_DIR_PATH/WhatToTest.zh-Hans.txt || { echo "Failed to write WhatToTest.zh-Hans file"; exit 1; }

    # 写入 zh-Hant 文件
    echo -e "同步自 Github 最近三筆提交記錄:\n$GIT_LOG" > $TESTFLIGHT_DIR_PATH/WhatToTest.zh-Hant.txt || { echo "Failed to write WhatToTest.zh-Hant file"; exit 1; }

    # 写入 ja 文件
    echo -e "人間以外の翻訳:\n$GIT_LOG_JP" > $TESTFLIGHT_DIR_PATH/WhatToTest.ja.txt || { echo "Failed to write WhatToTest.ja file"; exit 1; }
fi

# 这个脚本是在 Xcode Cloud 上运行的，在 Xcode 构建完成后执行
# 用于将提交信息写入到 TestFlight 文件夹中，以便上传到 TestFlight 时使用
# 可以自动基于 git log 生成 WhatToTest.en-US.txt 和 WhatToTest.zh-CN.txt 文件
# 这样可以在 TestFlight 显示 "What to Test" 信息，方便测试人员了解本次构建的改动

# 来源：https://developer.apple.com/forums/thread/711208
# 这个文件放置在 /scripts 的原因是做备份，如果需要修改脚本内容，需要同步修改 ios/ci_scripts/ci_post_clone.sh 里的文件