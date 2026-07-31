import { fileIo } from '@kit.CoreFileKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

export class ExpoFileSystemHarmonyTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoFileSystemHarmony';

  async removeDirectory(path: string): Promise<void> {
    await fileIo.rmdir(path);
  }

  async move(from: string, to: string): Promise<void> {
    await fileIo.rename(from, to);
  }
}
