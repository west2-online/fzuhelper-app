import { uniformTypeDescriptor } from '@kit.ArkData';
import { window } from '@kit.ArkUI';
import { util } from '@kit.ArkTS';
import { cryptoFramework } from '@kit.CryptoArchitectureKit';
import { systemShare } from '@kit.ShareKit';
import { EtsUITurboModule } from '@rnoh/react-native-openharmony/ets';

export class HarmonySystemTurboModule extends EtsUITurboModule {
  static readonly NAME: string = 'HarmonySystem';

  private navigationBarBehavior: string = 'overlay-swipe';
  private navigationBarPosition: string = 'absolute';
  private navigationBarVisibility: string = 'visible';
  private navigationBarBorderColor: string = '#00000000';

  async shareFile(uri: string, _dialogTitle: string, mimeType: string): Promise<void> {
    let uniformDataType: string = uniformTypeDescriptor.UniformDataType.FILE;
    if (mimeType.length > 0) {
      try {
        uniformDataType = uniformTypeDescriptor.getUniformDataTypeByMIMEType(mimeType);
      } catch (error) {
        // Fall back to a generic file when the MIME type has no UTD mapping.
      }
    }
    const record: systemShare.SharedRecord = {
      utd: uniformDataType,
      uri,
    };
    const controller = new systemShare.ShareController(new systemShare.SharedData(record));
    await controller.show(this.ctx.uiAbilityContext, {
      previewMode: systemShare.SharePreviewMode.DEFAULT,
      selectionMode: systemShare.SelectionMode.SINGLE,
    });
  }

  isSharingAvailable(): boolean {
    return true;
  }

  async getNavigationBarBackgroundColor(): Promise<string> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    return appWindow.getWindowSystemBarProperties().navigationBarColor ?? '#00000000';
  }

  async setNavigationBarBackgroundColor(color: string): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    await appWindow.setWindowSystemBarProperties({ navigationBarColor: color });
  }

  getNavigationBarBehavior(): string {
    return this.navigationBarBehavior;
  }

  setNavigationBarBehavior(behavior: string): void {
    this.navigationBarBehavior = behavior;
  }

  getNavigationBarBorderColor(): string {
    return this.navigationBarBorderColor;
  }

  setNavigationBarBorderColor(color: string): void {
    // HarmonyOS does not expose a separate navigation-bar divider color.
    // Keep the requested value so Expo's getter remains internally consistent.
    this.navigationBarBorderColor = color;
  }

  async getNavigationBarButtonStyle(): Promise<string> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    return appWindow.getWindowSystemBarProperties().isNavigationBarLightIcon ? 'light' : 'dark';
  }

  async setNavigationBarButtonStyle(style: string): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    await appWindow.setWindowSystemBarProperties({
      isNavigationBarLightIcon: style === 'light',
    });
  }

  getNavigationBarPosition(): string {
    return this.navigationBarPosition;
  }

  async setNavigationBarPosition(position: string): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    await appWindow.setWindowLayoutFullScreen(position === 'absolute');
    this.navigationBarPosition = position;
  }

  getNavigationBarVisibility(): string {
    return this.navigationBarVisibility;
  }

  async setNavigationBarVisibility(visibility: string): Promise<void> {
    const appWindow = await window.getLastWindow(this.ctx.uiAbilityContext);
    const isVisible = visibility === 'visible';
    await appWindow.setSpecificSystemBarEnabled('navigation', isVisible, true);
    await appWindow.setSpecificSystemBarEnabled('navigationIndicator', isVisible, true);
    this.navigationBarVisibility = visibility;
  }

  async digestString(algorithm: string, value: string, encoding: string): Promise<string> {
    const nativeAlgorithm = this.toNativeDigestAlgorithm(algorithm);
    const digest = cryptoFramework.createMd(nativeAlgorithm);
    const input = new util.TextEncoder().encodeInto(value);
    await digest.update({ data: input });
    const output = (await digest.digest()).data;
    if (encoding === 'base64') {
      return new util.Base64Helper().encodeToStringSync(output, util.Type.BASIC);
    }
    return this.toHex(output);
  }

  async digestBytes(algorithm: string, value: number[]): Promise<number[]> {
    const nativeAlgorithm = this.toNativeDigestAlgorithm(algorithm);
    const digest = cryptoFramework.createMd(nativeAlgorithm);
    const input = new Uint8Array(value);
    await digest.update({ data: input });
    const output = (await digest.digest()).data;
    const bytes: number[] = [];
    for (let index = 0; index < output.length; index += 1) {
      bytes.push(output[index]);
    }
    return bytes;
  }

  getRandomBytes(byteCount: number): number[] {
    if (!Number.isInteger(byteCount) || byteCount < 0 || byteCount > 1024) {
      throw new Error(`Expected byteCount in range 0...1024, received ${byteCount}`);
    }
    const data = cryptoFramework.createRandom().generateRandomSync(byteCount).data;
    const bytes: number[] = [];
    for (let index = 0; index < data.length; index += 1) {
      bytes.push(data[index]);
    }
    return bytes;
  }

  private toNativeDigestAlgorithm(algorithm: string): string {
    switch (algorithm) {
      case 'MD5':
        return 'MD5';
      case 'SHA-1':
        return 'SHA1';
      case 'SHA-256':
        return 'SHA256';
      case 'SHA-384':
        return 'SHA384';
      case 'SHA-512':
        return 'SHA512';
      default:
        throw new Error(`HarmonyOS CryptoArchitectureKit does not support ${algorithm}`);
    }
  }

  private toHex(data: Uint8Array): string {
    let result = '';
    for (let index = 0; index < data.length; index += 1) {
      result += data[index].toString(16).padStart(2, '0');
    }
    return result;
  }
}
