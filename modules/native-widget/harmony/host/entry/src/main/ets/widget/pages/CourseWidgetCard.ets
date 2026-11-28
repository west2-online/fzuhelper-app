import { emptyWidgetDay, WidgetDayBinding, WidgetEventBinding } from 'fzuhelper-native-widget';
import { WidgetSpacing, WidgetTextStyle, WidgetTypography } from './WidgetStyle';
import { WidgetViewThatFits } from './WidgetViewThatFits';

interface CourseLayout {
  count: number;
  remaining: boolean;
  nameLines: number;
  remarkLines: number;
  showDetails: boolean;
}

@Extend(Text)
function courseText(typography: WidgetTextStyle, lines: number = 1) {
  .fontSize(`${typography.size}vp`)
  .fontWeight(600)
  .lineHeight(`${typography.lineHeight}vp`)
  .maxLines(lines)
  .textOverflow({ overflow: TextOverflow.Ellipsis })
}

@Component
export struct CourseWidgetCard {
  @Prop medium: boolean = false;
  @LocalStorageProp('hasSnapshot') hasSnapshot: boolean = false;
  @LocalStorageProp('message') message: string = '请打开福uu同步课表';
  @LocalStorageProp('today') today: WidgetDayBinding = emptyWidgetDay();
  @LocalStorageProp('tomorrow') tomorrow: WidgetDayBinding = emptyWidgetDay();
  @LocalStorageProp('smallDay') smallDay: WidgetDayBinding = emptyWidgetDay();
  @LocalStorageProp('showRemarks') showRemarks: boolean = true;
  @State shortCard: boolean = false;

  // Replace the next course with the remaining count when only the count fits.
  // If the main course itself is too tall, shorten its remarks, title, then details.
  private layouts(day: WidgetDayBinding): CourseLayout[] {
    const candidates: CourseLayout[] = [];
    if (day.isTomorrow) {
      for (let count = day.events.length; count > 0; count--) {
        candidates.push({ count, remaining: false, nameLines: 1, remarkLines: 0, showDetails: true });
      }
    } else {
      if (day.events.length > 2) {
        candidates.push({ count: 2, remaining: true, nameLines: 2, remarkLines: 3, showDetails: true });
      }
      if (day.events.length > 1) {
        candidates.push({ count: 2, remaining: false, nameLines: 2, remarkLines: 3, showDetails: true });
        candidates.push({ count: 1, remaining: true, nameLines: 2, remarkLines: 3, showDetails: true });
      }
      const hasRemark = this.showRemarks && day.events[0].remark.trim().length > 0;
      for (let remarkLines = hasRemark ? 3 : 0; remarkLines >= 0; remarkLines--) {
        candidates.push({ count: 1, remaining: false, nameLines: 2, remarkLines, showDetails: true });
      }
      candidates.push({ count: 1, remaining: false, nameLines: 1, remarkLines: 0, showDetails: true });
    }
    candidates.push({ count: 1, remaining: false, nameLines: 1, remarkLines: 0, showDetails: false });
    return candidates;
  }

  @Builder
  private compactDetails(event: WidgetEventBinding) {
    // Give the room and time their own lines when their full widths do not fit side by side.
    Row({ space: WidgetSpacing.inlineDetails }) {
      Text(event.location.trim())
        .courseText(WidgetTypography.secondary)
        .fontColor($r('app.color.widget_secondary')).flexShrink(0)
      Text(event.timeText)
        .courseText(WidgetTypography.secondary)
        .fontColor($r('app.color.widget_secondary')).flexShrink(0)
    }
    .width(LayoutPolicy.fixAtIdealSize)
    .height(LayoutPolicy.fixAtIdealSize)
    Column({ space: WidgetSpacing.detailRows }) {
      Text(event.location.trim())
        .courseText(WidgetTypography.secondary)
        .fontColor($r('app.color.widget_secondary')).width('100%')
      Text(event.timeText)
        .courseText(WidgetTypography.secondary)
        .fontColor($r('app.color.widget_secondary')).width('100%')
    }
    .alignItems(HorizontalAlign.Start)
    .height(LayoutPolicy.fixAtIdealSize)
  }

  @Builder
  private eventView(event: WidgetEventBinding, compact: boolean, layout: CourseLayout) {
    Row({ space: WidgetSpacing.indicatorToContent }) {
      Column() {}
        .width(2)
        .alignSelf(ItemAlign.Stretch)
        .borderRadius(2)
        .backgroundColor(compact ? $r('app.color.widget_light_blue') : $r('app.color.widget_blue'))
      Column({ space: WidgetSpacing.details }) {
        Text(event.name)
          .courseText(compact ? WidgetTypography.secondary : WidgetTypography.primaryTitle,
            compact ? 1 : layout.nameLines)
          .fontColor($r('app.color.widget_title'))
          .width('100%')
        if (compact && layout.showDetails) {
          if (event.location.trim().length > 0) {
            WidgetViewThatFits({ horizontal: true, content: (): void => this.compactDetails(event) })
              .width('100%')
              .clip(true)
          } else {
            Text(event.timeText)
              .courseText(WidgetTypography.secondary)
              .fontColor($r('app.color.widget_secondary'))
          }
        } else if (layout.showDetails) {
          Column({ space: WidgetSpacing.details }) {
            if (this.showRemarks && layout.remarkLines > 0 && event.remark.trim().length > 0) {
              Text(event.remark.trim())
                .courseText(WidgetTypography.secondary, layout.remarkLines)
                .fontColor($r('app.color.widget_secondary'))
                .width('100%')
            }
            Column({ space: WidgetSpacing.detailRows }) {
              if (event.location.trim().length > 0) {
                Text(event.location.trim())
                  .courseText(WidgetTypography.primaryDetail)
                  .fontColor($r('app.color.widget_detail'))
                  .width('100%')
              }
              Text(event.timeText)
                .courseText(WidgetTypography.primaryDetail)
                .fontColor($r('app.color.widget_detail'))
                .width('100%')
            }
            .width('100%')
            .height(LayoutPolicy.fixAtIdealSize)
            .alignItems(HorizontalAlign.Start)
          }
          .width('100%')
          .height(LayoutPolicy.fixAtIdealSize)
          .alignItems(HorizontalAlign.Start)
        }
      }
      .layoutWeight(1)
      .height(LayoutPolicy.fixAtIdealSize)
      .alignItems(HorizontalAlign.Start)
      .padding({
        top: WidgetSpacing.eventVerticalInset,
        bottom: WidgetSpacing.eventVerticalInset,
        right: WidgetSpacing.eventEndInset,
      })
    }
    .width('100%')
    .height(LayoutPolicy.fixAtIdealSize)
    .alignItems(VerticalAlign.Top)
  }

  @Builder
  private courseCandidates(day: WidgetDayBinding) {
    ForEach(this.layouts(day), (layout: CourseLayout) => {
      Column({ space: WidgetSpacing.courses }) {
        ForEach(day.events.slice(0, layout.count), (event: WidgetEventBinding, index: number) => {
          this.eventView(event, day.isTomorrow || index > 0, layout)
        })
        if (layout.remaining) {
          Row({ space: 4 }) {
            Row({ space: 2 }) {
              Column() {}.width(2).height(15).borderRadius(2).backgroundColor($r('app.color.widget_light_blue'))
              if (day.events.length - layout.count >= 2) {
                Column() {}.width(2).height(13).borderRadius(2).backgroundColor($r('app.color.widget_faint_blue'))
              }
              if (day.events.length - layout.count >= 3) {
                Column() {}.width(2).height(11).borderRadius(2).backgroundColor($r('app.color.widget_gray'))
              }
            }
            Text(`其他 ${day.events.length - layout.count} 节课`)
              .courseText(WidgetTypography.secondary)
              .fontColor($r('app.color.widget_secondary'))
          }
          .width('100%')
        }
      }
      .width('100%')
      // Do not let Column shrink a rejected candidate to the card height
      // before WidgetViewThatFits has measured its complete course rows.
      .height(LayoutPolicy.fixAtIdealSize)
      .alignItems(HorizontalAlign.Start)
    }, (layout: CourseLayout) =>
      `${layout.count}-${layout.remaining}-${layout.nameLines}-${layout.remarkLines}-${layout.showDetails}`)
  }

  @Builder
  private dayView(day: WidgetDayBinding, showWeekday: boolean) {
    Column({ space: WidgetSpacing.headingToCourses }) {
      Row({ space: WidgetSpacing.headingItems }) {
        Text(day.title)
          .courseText(WidgetTypography.heading)
          .fontColor(day.isTomorrow ? $r('app.color.widget_secondary') : $r('app.color.widget_heading'))
        if (showWeekday) {
          Text(day.weekday)
            .courseText(WidgetTypography.heading)
            .fontColor($r('app.color.widget_blue'))
            .flexShrink(0)
        }
      }
      .width('100%')

      if (day.events.length === 0) {
        Text(day.emptyText)
          .courseText(WidgetTypography.secondary)
          .fontColor($r('app.color.widget_secondary'))
          .width('100%')
          .layoutWeight(1)
          .textAlign(TextAlign.Center)
      } else {
        WidgetViewThatFits({ content: (): void => this.courseCandidates(day) })
          .width('100%')
          .layoutWeight(1)
          .clip(true)
      }
    }
    .layoutWeight(1)
    .height('100%')
    .alignItems(HorizontalAlign.Start)
  }

  build() {
    FormLink({ action: 'router', uri: 'fzuhelper://course-widget' }) {
      Row({ space: WidgetSpacing.columns }) {
        if (this.hasSnapshot) {
          this.dayView(this.medium ? this.today : this.smallDay, true)
          if (this.medium) {
            this.dayView(this.tomorrow, false)
          }
        } else {
          Text(this.message)
            .fontSize('12vp')
            .fontColor($r('app.color.widget_secondary'))
            .width('100%')
            .height('100%')
            .textAlign(TextAlign.Center)
        }
      }
      .width('100%')
      .height('100%')
      .padding(this.shortCard ? WidgetSpacing.shortCardInset : WidgetSpacing.cardInset)
      .backgroundColor($r('app.color.widget_background'))
      .borderRadius(18)
      .alignItems(VerticalAlign.Top)
      .onSizeChange((_, size) => {
        this.shortCard = Number(size.height) < WidgetSpacing.shortCardHeight;
      })
    }
    .width('100%')
    .height('100%')
  }
}
