import {
  AnyJSBundleProvider,
  FileJSBundleProvider,
  MetroJSBundleProvider,
  ResourceJSBundleProvider,
  RNApp,
  RNOHCoreContext,
  RNOHErrorDialog,
  TraceJSBundleProviderDecorator,
} from '@rnoh/react-native-openharmony';
import { getRNOHPackages } from '../PackageProvider';

@Entry
@Component
struct Index {
  @StorageLink('RNOHCoreContext') private rnohCoreContext: RNOHCoreContext | undefined = undefined;

  onBackPress(): boolean {
    this.rnohCoreContext?.dispatchBackPress();
    return true;
  }

  build() {
    Column() {
      if (this.rnohCoreContext) {
        if (this.rnohCoreContext.isDebugModeEnabled) {
          RNOHErrorDialog({ ctx: this.rnohCoreContext })
        }
        RNApp({
          rnInstanceConfig: {
            name: 'main',
            createRNPackages: getRNOHPackages,
            enableCAPIArchitecture: true,
            fontResourceByFontFamily: {
              'Roboto': $rawfile('fonts/Roboto-Regular.ttf'),
              'Roboto-Regular': $rawfile('fonts/Roboto-Regular.ttf'),
              'Roboto-Bold': $rawfile('fonts/Roboto-Bold.ttf'),
              'Ionicons': $rawfile('fonts/Ionicons.ttf'),
            },
            enableDebugger: this.rnohCoreContext.isDebugModeEnabled,
          },
          appKey: 'main',
          jsBundleProvider: new TraceJSBundleProviderDecorator(
            new AnyJSBundleProvider([
              new MetroJSBundleProvider('http://localhost:8082/.expo/.virtual-metro-entry.bundle?platform=harmony&dev=true&minify=false&modulesOnly=false&runModule=true'),
              new FileJSBundleProvider('/data/storage/el2/base/files/bundle.harmony.js'),
              new ResourceJSBundleProvider(this.rnohCoreContext.uiAbilityContext.resourceManager, 'bundle.harmony.js'),
            ]),
            this.rnohCoreContext.logger,
          ),
        })
      }
    }
    .height('100%')
    .width('100%')
  }
}
