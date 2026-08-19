import { common } from '@kit.AbilityKit';
import { preferences } from '@kit.ArkData';
import { promptAction } from '@kit.ArkUI';
import { formBindingData, formProvider } from '@kit.FormKit';
import {
  putShowAsSquare,
  putShowLastUpdateTime,
  readWidgetConfig,
} from '../widget/WidgetConfig';
import {
  buildWidgetBindingData,
  WIDGET_DATA_KEY,
  WIDGET_STORE_NAME,
} from '../widget/WidgetData';
import { WIDGET_CONFIG_FORM_ID } from '../widget/WidgetConfigurationAbility';

@Entry
@Component
struct WidgetConfigurationPage {
  @StorageProp(WIDGET_CONFIG_FORM_ID) formId: string = '';
  @State showLastUpdateTime: boolean = false;
  @State showAsSquare: boolean = false;

  aboutToAppear(): void {
    const store = preferences.getPreferencesSync(getContext(this), { name: WIDGET_STORE_NAME });
    const config = readWidgetConfig(store, this.formId);
    this.showLastUpdateTime = config.showLastUpdateTime;
    this.showAsSquare = config.showAsSquare;
  }

  private async saveAndUpdate(): Promise<void> {
    const store = preferences.getPreferencesSync(getContext(this), { name: WIDGET_STORE_NAME });
    putShowLastUpdateTime(store, this.formId, this.showLastUpdateTime);
    putShowAsSquare(store, this.formId, this.showAsSquare);
    await store.flush();
    const value = store.getSync(WIDGET_DATA_KEY, '');
    const json = typeof value === 'string' ? value : '';
    const config = readWidgetConfig(store, this.formId);
    await formProvider.updateForm(
      this.formId,
      formBindingData.createFormBindingData(
        buildWidgetBindingData(json, config.showLastUpdateTime, config.verticalInset),
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

        Text('下一节课设置')
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
        Text('显示更新时间与刷新')
          .fontSize(16)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))

        Blank()

        Toggle({ type: ToggleType.Switch, isOn: this.showLastUpdateTime })
          .onChange((value: boolean) => {
            this.showLastUpdateTime = value;
            this.saveAndUpdate();
          })
      }
      .width('100%')
      .height(50)
      .padding({ left: 20, right: 20 })
      .alignItems(VerticalAlign.Center)

      Row() {
        Text('显示为正方形')
          .fontSize(16)
          .fontColor($r('sys.color.ohos_id_color_text_primary'))

        Blank()

        Toggle({ type: ToggleType.Switch, isOn: this.showAsSquare })
          .onChange((value: boolean) => {
            this.showAsSquare = value;
            this.saveAndUpdate();
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
          this.saveAndUpdate().then(() => {
            promptAction.showToast({ message: '已刷新' });
          });
        })

      Blank()
    }
    .width('100%')
    .height('100%')
    .backgroundColor($r('sys.color.ohos_id_color_background'))
  }
}
