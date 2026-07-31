import font from '@ohos.font';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

export class ExpoFontLoaderTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'ExpoFontLoader';
  private static loadedFonts: string[] = [
    'Roboto',
    'Roboto-Regular',
    'Roboto-Bold',
    'Ionicons',
  ];

  getLoadedFonts(): string[] {
    return Array.from(ExpoFontLoaderTurboModule.loadedFonts);
  }

  async loadAsync(fontFamilyName: string, localUri: string): Promise<void> {
    if (fontFamilyName.length === 0 || localUri.length === 0) {
      throw new Error('A font family and local font URI are required');
    }
    if (ExpoFontLoaderTurboModule.loadedFonts.includes(fontFamilyName)) {
      return;
    }

    const familySrc = localUri.startsWith('asset://')
      ? `rawfile/assets/${localUri.slice('asset://'.length)}`
      : localUri;
    font.registerFont({
      familyName: fontFamilyName,
      familySrc,
    });
    ExpoFontLoaderTurboModule.loadedFonts.push(fontFamilyName);
  }
}
