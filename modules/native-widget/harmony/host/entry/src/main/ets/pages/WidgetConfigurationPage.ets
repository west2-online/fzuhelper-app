import { common } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { promptAction } from '@kit.ArkUI';
import { formBindingData, formProvider } from '@kit.FormKit';
import {
  putShowAsSquare,
  putShowRemarks,
  putPreviewTomorrow,
  readWidgetConfig,
} from 'fzuhelper-native-widget';
import {
  buildWidgetBindingData,
  WIDGET_DATA_KEY,
  WIDGET_STORE_NAME,
} from 'fzuhelper-native-widget';
import { WIDGET_CONFIG_FORM_ID } from '../widget/WidgetConfigurationAbility';

@Entry
@Component
struct WidgetConfigurationPage {
  @StorageProp(WIDGET_CONFIG_FORM_ID) formId: string = '';
  @State showRemarks: boolean = true;
  @State previewTomorrow: boolean = false;
  @State showAsSquare: boolean = false;

  aboutToAppear(): void {
    const store = preferences.getPreferencesSync(getContext(this), { name: WIDGET_STORE_NAME });
    const config = readWidgetConfig(store, this.formId);
    this.showRemarks = config.showRemarks;
    this.previewTomorrow = config.previewTomorrow;
    this.showAsSquare = config.showAsSquare;
  }

  private async saveAndUpdate(): Promise<void> {
    const store = preferences.getPreferencesSync(getContext(this), { name: WIDGET_STORE_NAME });
    if (this.formId.length === 0) return;
    putShowRemarks(store, this.formId, this.showRemarks);
    putPreviewTomorrow(store, this.formId, this.previewTomorrow);
    putShowAsSquare(store, this.formId, this.showAsSquare);
    await store.flush();
    const value = store.getSync(WIDGET_DATA_KEY, '');
    const json = typeof value === 'string' ? value : '';
    const config = readWidgetConfig(store, this.formId);
    await formProvider.updateForm(
      this.formId,
      formBindingData.createFormBindingData(
        buildWidgetBindingData(json, config.showRemarks, config.previewTomorrow, config.verticalInset),
      ),
    );
  }

  private close(): void {
    const context = getContext(this) as common.UIAbilityContext;
    context.terminateSelf();
  }

  build() {
    Column() {
      Row() {
        Text('‹')
          .fontSize(34)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))
          .width(48)
          .height(48)
          .textAlign(TextAlign.Center)
          .onClick(() => this.close())

        Text('课程小组件设置')
          .fontSize(20)
          .fontWeight(FontWeight.Medium)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))

        Blank()

        Text('完成')
          .fontSize(16)
          .fontColor($r('app.color.primary'))
          .height(48)
          .padding({ left: 12, right: 20 })
          .textAlign(TextAlign.Center)
          .onClick(() => this.close())
      }
      .width('100%')
      .height(56)
      .alignItems(VerticalAlign.Center)

      Row() {
        Text('显示课程备注')
          .fontSize(16)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))

        Blank()

        Toggle({ type: ToggleType.Switch, isOn: this.showRemarks })
          .onChange((value: boolean) => {
            this.showRemarks = value;
            this.updateWithFeedback();
          })
      }
      .width('100%')
      .height(50)
      .padding({ left: 20, right: 20 })
      .alignItems(VerticalAlign.Center)

      Row() {
        Text('提前显示明日课程')
          .fontSize(16)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))
        Blank()
        Toggle({ type: ToggleType.Switch, isOn: this.previewTomorrow })
          .onChange((value: boolean) => {
            this.previewTomorrow = value;
            this.updateWithFeedback();
          })
      }
      .width('100%')
      .height(50)
      .padding({ left: 20, right: 20 })
      .alignItems(VerticalAlign.Center)

      Text('仅影响小号和锁屏组件。开启后，今日课程全部结束时显示明日课程；关闭时在 21:35 后切换。中号固定展示今日与明日。')
        .fontSize(13)
        .fontColor($r('sys.color.ohos_id_color_text_secondary'))
        .width('100%')
        .padding({ left: 20, right: 20, bottom: 12 })

      Row() {
        Text('小号显示为正方形')
          .fontSize(16)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))

        Blank()

        Toggle({ type: ToggleType.Switch, isOn: this.showAsSquare })
          .onChange((value: boolean) => {
            this.showAsSquare = value;
            this.updateWithFeedback();
          })
      }
      .width('100%')
      .height(50)
      .padding({ left: 20, right: 20 })
      .alignItems(VerticalAlign.Center)

      Text('刷新数据')
        .width('100%')
        .height(50)
        .padding({ left: 20, right: 20 })
        .fontSize(16)
        .fontColor($r('sys.color.ohos_id_color_text_primary'))
        .textAlign(TextAlign.Start)
        .onClick(() => {
          this.updateWithFeedback(true);
        })

      Blank()
    }
    .width('100%')
    .height('100%')
    .backgroundColor($r('sys.color.ohos_id_color_background'))
  }

  private updateWithFeedback(showSuccess: boolean = false): void {
    this.saveAndUpdate().then(() => {
      if (showSuccess) promptAction.showToast({ message: '已刷新' });
    }).catch((error: Error) => {
      console.error(`Failed to update widget configuration: ${error.message}`);
      promptAction.showToast({ message: '更新失败，请重新添加小组件' });
    });
  }
}
