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
    Column({ space: 3 }) {
      Row({ space: 3 }) {
        Text(this.courseName)
          .layoutWeight(1)
          .fontSize(14)
          .fontWeight(FontWeight.Bold)
          .fontColor($r('app.color.widget_lockscreen_foreground'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })

        if (this.lastUpdateTimeCompact.length > 0) {
          Row({ space: 1 }) {
            Image($r('app.media.ic_refresh_lockscreen'))
              .width(10)
              .height(10)
              .opacity(0.72)
              .objectFit(ImageFit.Contain)

            Text(this.lastUpdateTimeCompact)
              .fontSize(10)
              .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
              .maxLines(1)
          }
          .alignItems(VerticalAlign.Center)
        }
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)

      Row({ space: 3 }) {
        Text(this.courseLocation)
          .layoutWeight(1)
          .fontSize(10)
          .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })

        if (this.courseWeek.length > 0) {
          Text(this.courseWeek)
            .fontSize(10)
            .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
            .maxLines(1)
        }

        if (this.courseWeekday.length > 0) {
          Text(this.courseWeekday)
            .fontSize(10)
            .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
            .maxLines(1)
        }

        if (this.courseTime.length > 0) {
          Text(this.courseTime)
            .fontSize(10)
            .fontColor($r('app.color.widget_lockscreen_secondary_foreground'))
            .maxLines(1)
        }
      }
      .width('100%')
      .alignItems(VerticalAlign.Center)
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
