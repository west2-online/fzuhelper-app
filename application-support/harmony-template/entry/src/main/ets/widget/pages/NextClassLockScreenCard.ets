const lockScreenWidgetStorage = new LocalStorage();

@Entry(lockScreenWidgetStorage)
@Component
struct NextClassLockScreenCard {
  @LocalStorageProp('courseName') courseName: string = '本地没有数据';
  @LocalStorageProp('courseLocation') courseLocation: string = '请打开课表设置刷新';
  @LocalStorageProp('courseTime') courseTime: string = '';
  @LocalStorageProp('courseWeek') courseWeek: string = '';
  @LocalStorageProp('courseWeekday') courseWeekday: string = '';
  @LocalStorageProp('lastUpdateTimeCompact') lastUpdateTimeCompact: string = '';

  build() {
    Column({ space: 2 }) {
      Text(this.courseName)
        .width('100%')
        .fontSize(16)
        .fontWeight(FontWeight.Bold)
        .fontColor($r('app.color.widget_lockscreen_foreground'))
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })

      Row({ space: 4 }) {
        Text(this.courseLocation)
          .layoutWeight(1)
          .fontSize(11)
          .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })

        if (this.courseWeekday.length > 0) {
          Text(this.courseWeekday)
            .fontSize(11)
            .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
            .maxLines(1)
        }

        if (this.courseWeek.length > 0) {
          Text(this.courseWeek)
            .fontSize(11)
            .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
            .maxLines(1)
        }
      }
      .width('100%')

      Row() {
        Text(this.lastUpdateTimeCompact)
          .layoutWeight(1)
          .fontSize(11)
          .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
          .maxLines(1)

        Text(this.courseTime)
          .fontSize(11)
          .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
          .maxLines(1)
      }
      .width('100%')
    }
    .width('100%')
    .height('100%')
    // https://developer.huawei.com/consumer/cn/doc/design-guides/system-features-service-widget-0000002087671904#section252mcpsimp
    .padding({ left: 14, right: 12, top: 8, bottom: 8 })
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
