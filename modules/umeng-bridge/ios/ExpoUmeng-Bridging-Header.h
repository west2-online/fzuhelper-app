#ifndef ExpoUmeng_Bridging_Header_h
#define ExpoUmeng_Bridging_Header_h

// 目前项目使用的是 swift，因此需要创建一个桥接文件来导入 UMCommon、UMAnalytics、UMPush 的头文件
// 为了实现桥接功能，我们还配置了 app.plugin.js 文件，里面有一个 bridgingHeaderPath 的配置项，指向了这个文件
// 这个配置项参数是由根目录的 app.config.js 传递过来的

// NOTICE: 该文件会在项目目录生成过程中被自动拷贝到 ios/Bridging 目录中，不需要手动拷贝，详情参考 app.plugin.js

// 导入 UMCommon 头文件
#import <UMCommon/UMCommon.h>

// 导入UMCommon的OC的头文件
#import <UMCommon/UMConfigure.h>

// 导入 UMAnalytics 头文件
#import <UMCommon/MobClick.h>

// 导入 UMPush 头文件
#import <UMPush/UMessage.h>
// 注意：这个头文件由于官方没有给标准的 Swift 桥接文件，我们导入后必须去看它的 Header 头文件
// 我们可以通过直接打开这个 UMPush 的 Framework 来看它的头文件，但考虑到可能后面的同学不会这么操作
// 我把 Header 文件复制了一份到 docs/codes/UMessage.h，这样大家可以直接看这个文件


#endif /* ExpoUmeng_Bridging_Header_h */