import { CourseWidgetCard } from './CourseWidgetCard';

const overviewStorage = new LocalStorage();

@Entry(overviewStorage)
@Component
struct CourseOverviewCard {
  build() {
    Column() {
      CourseWidgetCard({ medium: true })
    }
    .width('100%')
    .height('100%')
  }
}
