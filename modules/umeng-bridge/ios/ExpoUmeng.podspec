Pod::Spec.new do |s|
  s.name           = 'ExpoUmeng'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platform       = :ios, '13.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # 友盟 SDK iOS 集成文档：https://developer.umeng.com/docs/67966/detail/66734
  s.dependency 'UMCommon'
  s.dependency 'UMPush'
  s.dependency 'UMDevice'

  # 在 iOS 集成文档中，提示必装 UYuMao，但完全没告知作用，实际上换成了这个移动统计集成文档（https://developer.umeng.com/docs/119267/detail/118584）后可以注意到是选装的。除此之外，这个库不支持运行在模拟器上，综合考虑我们直接不集成这个库。
  # 文档原文：UYuMao 是一个高级运营分析功能依赖库（可选）。使用卸载分析、开启反作弊能力请务必集成，以免影响高级功能使用。common需搭配v9.6.3及以上版本，asms需搭配v1.7.0及以上版本。需更新隐私声明。需配置混淆，以避免依赖库无法生效，见本文下方【混淆设置】部分。
  # s.dependency 'UYuMao'

  # 自动将 UserNotifications.framework 导入系统依赖库
  s.frameworks = 'UserNotifications'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
