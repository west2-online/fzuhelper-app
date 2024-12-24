# 常见问题排查

## iOS

### 无法打开 iOS Simulator

关键词: xcrun simctl boot {id} exited with non-zero code:2
关键词: No such file or directory

> Opening on iOS...
> Error: xcrun simctl boot 9CEBE3B2-E677-4C8D-91C1-7463A13C83A1 exited with non-zero code: 2
> An error was encountered processing the command (domain=NSPOSIXErrorDomain, code=2):
> Unable to boot device because we cannot determine the runtime bundle.
> No such file or directory

打开一次`Simulator`这个程序，它会做一些初始化工作，打开后再运行就发现正常了

出现这个问题一般是版本更新导致的，而且看起来是 Apple 工程师的问题

### 如果你认为你的代码没有问题，但持续编译报错

删除本地的构建文件夹（如`ios`或`android`），重新执行预构建-安装依赖-运行

这个问题通常不会发生很多次，通常是和底层（指的是原生系统）做交互开发时会涉及
