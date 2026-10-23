import { CourseWidgetCard } from './CourseWidgetCard';

const widgetStorage = new LocalStorage();

@Entry(widgetStorage)
@Component
struct NextClassCard {
  build() {
    Column() {
      CourseWidgetCard({ medium: false })
    }
    .width('100%')
    .height('100%')
  }
}
