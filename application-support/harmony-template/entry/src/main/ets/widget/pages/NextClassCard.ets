const widgetStorage = new LocalStorage();

@Entry(widgetStorage)
@Component
struct NextClassCard {
  @LocalStorageProp('courseName') courseName: string = '本地没有数据';
  @LocalStorageProp('courseLocation') courseLocation: string = '';
  @LocalStorageProp('courseSection') courseSection: string = '';
  @LocalStorageProp('courseWeek') courseWeek: string = '';
  @LocalStorageProp('courseWeekday') courseWeekday: string = '';
  @LocalStorageProp('statusText') statusText: string = '请打开课表设置刷新';

  build() {
    Column() {
      Row() {
        Text('下一节课')
          .fontSize(14)
          .fontColor('#5F6B7A')
        Blank()
        Text(this.courseWeek)
          .fontSize(13)
          .fontColor('#2563EB')
      }
      .width('100%')

      Text(this.courseName)
        .fontSize(22)
        .fontWeight(FontWeight.Bold)
        .fontColor('#111827')
        .maxLines(1)
        .textOverflow({ overflow: TextOverflow.Ellipsis })
        .margin({ top: 10 })
        .width('100%')

      if (this.statusText.length > 0) {
        Text(this.statusText)
          .fontSize(14)
          .fontColor('#6B7280')
          .maxLines(2)
          .margin({ top: 8 })
          .width('100%')
      } else {
        Row({ space: 10 }) {
          Text(this.courseWeekday)
            .fontSize(14)
            .fontColor('#374151')
          Text(this.courseSection)
            .fontSize(14)
            .fontColor('#374151')
        }
        .margin({ top: 8 })
        .width('100%')

        Text(this.courseLocation)
          .fontSize(14)
          .fontColor('#6B7280')
          .maxLines(1)
          .textOverflow({ overflow: TextOverflow.Ellipsis })
          .margin({ top: 4 })
          .width('100%')
      }
      Blank()
    }
    .width('100%')
    .height('100%')
    .padding(16)
    .backgroundColor('#F8FAFC')
  }
}
