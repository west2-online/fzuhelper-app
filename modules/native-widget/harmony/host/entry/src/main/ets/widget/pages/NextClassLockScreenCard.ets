const lockScreenWidgetStorage = new LocalStorage();

@Entry(lockScreenWidgetStorage)
@Component
struct NextClassLockScreenCard {
  @LocalStorageProp('courseName') courseName: string = '请打开福uu同步课表';
  @LocalStorageProp('courseLocation') courseLocation: string = '';
  @LocalStorageProp('courseTime') courseTime: string = '';

  build() {
    Column({ space: 4 }) {
        Text(this.courseName)
          .fontSize(14)
          .fontWeight(FontWeight.Bold)
          .fontColor($r('app.color.widget_lockscreen_foreground'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
      .width('100%')

      Text(this.courseLocation)
        .fontSize(10)
        .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .width('100%')

      Text(this.courseTime)
        .fontSize(10)
        .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .width('100%')
    }
    .width('100%')
    .height('100%')
    // https://developer.huawei.com/consumer/cn/doc/design-guides/system-features-service-widget-0000002087671904#section252mcpsimp
    .padding({
      left: 14,
      right: 12,
      top: 8,
      bottom: 8
    })
    .alignItems(HorizontalAlign.Start)
    .justifyContent(FlexAlign.Center)
    .onClick(() => {
      postCardAction(this, {
        action: 'router',
        abilityName: 'EntryAbility',
      });
    })
  }
}
