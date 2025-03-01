Pod::Spec.new do |s|
  s.name           = 'NativeStorage'
  s.version        = '1.0.0'
  s.summary        = 'A sample project summary'
  s.description    = 'A sample project description'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1',
    :tvos => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
#
# require 'json'
#
# package = JSON.parse(File.read(File.join(__dir__, '..', 'package.json')))
#
# Pod::Spec.new do |s|
#   s.name           = 'ExpoWidgets'
#   s.version        = package['version']
#   s.summary        = package['description']
#   s.description    = package['description']
#   s.license        = package['license']
#   s.author         = package['author']
#   s.homepage       = package['homepage']
#   s.platform       = :ios, '13.0'
#   s.swift_version  = '5.0'
#   s.source         = { git: 'https://github.com/gitn00b1337/expo-widgets' }
#   s.static_framework = true
#
#   s.dependency 'ExpoModulesCore'
#
#   # Swift/Objective-C compatibility
#   s.pod_target_xcconfig = {
#     'DEFINES_MODULE' => 'YES',
#     'SWIFT_COMPILATION_MODE' => 'wholemodule'
#   }
#
#   s.source_files = "**/*.{h,m,swift}"
# end
