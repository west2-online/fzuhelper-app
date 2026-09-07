const widgetStorage = new LocalStorage();

@Entry(widgetStorage)
@Component
struct NextClassCard {
  @LocalStorageProp('courseName') courseName: string = '本地没有数据';
  @LocalStorageProp('courseNameSize') courseNameSize: number = 20;
  @LocalStorageProp('courseLocation') courseLocation: string = '请打开课表设置刷新';
  @LocalStorageProp('courseSection') courseSection: string = '';
  @LocalStorageProp('courseWeek') courseWeek: string = '';
  @LocalStorageProp('courseWeekday') courseWeekday: string = '';
  @LocalStorageProp('showLastUpdateTime') showLastUpdateTime: boolean = false;
  @LocalStorageProp('lastUpdateTime') lastUpdateTime: string = '';
  @LocalStorageProp('verticalInset') verticalInset: number = 0;

  build() {
    Column() {
      Column() {
        Text('下节课上什么？')
          .fontSize(14)
          .fontColor($r('app.color.widget_foreground'))
          .margin({ left: 10, top: 10 })

        Text(this.courseName)
          .fontSize(this.courseNameSize)
          .fontWeight(FontWeight.Bold)
          .fontColor($r('app.color.widget_foreground'))
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .margin({ left: 10, top: 5, right: 6 })

        Row() {
          Text(this.courseLocation)
            .fontSize(14)
            .fontColor($r('app.color.widget_foreground'))
            .maxLines(1)
            .margin({ left: 10 })

          Text(this.courseSection)
            .fontSize(14)
            .fontColor($r('app.color.widget_foreground'))
            .maxLines(1)
            .margin({ left: 10, right: 6 })
        }
        .margin({ top: 5 })

        Row() {
          Text(this.courseWeekday)
            .fontSize(14)
            .fontColor($r('app.color.widget_foreground'))
            .margin({ left: 10 })

          Text(this.courseWeek)
            .fontSize(14)
            .fontColor($r('app.color.widget_foreground'))
            .margin({ left: 10 })
        }

        if (this.showLastUpdateTime) {
          Row() {
            Text(this.lastUpdateTime)
              .fontSize(12)
              .fontColor($r('app.color.widget_unnecessary_foreground'))
              .margin({ left: 10 })

            Image($r('app.media.ic_refresh'))
              .width(22)
              .height(22)
              .padding(2)
              .margin({ left: 2, right: 6 })
              .objectFit(ImageFit.Contain)
              .onClick(() => {
                postCardAction(this, {
                  action: 'message',
                  params: { actionType: 'refresh' },
                });
              })
          }
          .margin({ top: 5 })
          .alignItems(VerticalAlign.Center)
        }

        Blank()
      }
      .width('100%')
      .layoutWeight(1)
      .margin({ top: this.verticalInset, bottom: this.verticalInset })
      .alignItems(HorizontalAlign.Start)
      .backgroundColor($r('app.color.widget_background'))
      .borderRadius(18)
    }
    .width('100%')
    .height('100%')
    .onClick(() => {
      postCardAction(this, {
        action: 'router',
        abilityName: 'EntryAbility',
      });
    })
  }
}
