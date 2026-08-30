import { SplashScreenView } from '@react-native-ohos/react-native-splash-screen';

@Entry
@Component
struct SplashScreenPage {
  build() {
    Row() {
      SplashScreenView()
    }
    .width('100%')
    .height('100%')
  }
}
