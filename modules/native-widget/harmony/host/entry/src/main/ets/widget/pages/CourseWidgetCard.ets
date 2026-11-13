import { emptyWidgetDay, WidgetDayBinding, WidgetEventBinding } from 'fzuhelper-native-widget';
import { WidgetSpacing, WidgetTextStyle, WidgetTypography } from './WidgetStyle';
import { WidgetViewThatFits } from './WidgetViewThatFits';

interface CourseLayout {
  count: number;
  remaining: boolean;
  nameLines: number;
}

@Extend(Text)
function courseText(typography: WidgetTextStyle, lines: number = 1) {
  .fontSize(typography.size)
  .fontWeight(600)
  .lineHeight(`${typography.lineHeight}fp`)
  .margin({ top: `${-typography.leadingTrim}fp`, bottom: `${-typography.leadingTrim}fp` })
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
  @LocalStorageProp('verticalInset') verticalInset: number = 0;

  // Keep the primary course's three-line remark allowance. Replace subsequent
  // courses with their count before hiding them, then truncate only the name.
  private layouts(day: WidgetDayBinding): CourseLayout[] {
    const candidates: CourseLayout[] = [];
    if (day.isTomorrow) {
      for (let count = day.events.length; count > 0; count--) {
        candidates.push({ count, remaining: false, nameLines: 1 });
      }
      return candidates;
    }
    if (day.events.length > 2) {
      candidates.push({ count: 2, remaining: true, nameLines: 2 });
    }
    if (day.events.length > 1) {
      candidates.push({ count: 2, remaining: false, nameLines: 2 });
      candidates.push({ count: 1, remaining: true, nameLines: 2 });
    }
    candidates.push({ count: 1, remaining: false, nameLines: 2 });
    candidates.push({ count: 1, remaining: false, nameLines: 1 });
    return candidates;
  }

  private hasPrimaryRemark(event: WidgetEventBinding): boolean {
    return this.showRemarks && event.remark.length > 0;
  }

  @Builder
  private compactDetails(event: WidgetEventBinding) {
    Row({ space: WidgetSpacing.compactDetails }) {
      Text(event.location)
        .courseText(WidgetTypography.compactDetail)
        .fontColor($r('app.color.widget_secondary')).flexShrink(0)
      Text(event.timeText)
        .courseText(WidgetTypography.compactDetail)
        .fontColor($r('app.color.widget_secondary')).flexShrink(0)
    }
    .width(LayoutPolicy.fixAtIdealSize)
    .height(LayoutPolicy.fixAtIdealSize)
    Column({ space: WidgetSpacing.compactDetails }) {
      Text(event.location)
        .courseText(WidgetTypography.compactDetail)
        .fontColor($r('app.color.widget_secondary')).width('100%')
      Text(event.timeText)
        .courseText(WidgetTypography.compactDetail)
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
      Column({
        space: compact ? WidgetSpacing.compactTitleToDetails :
          (this.hasPrimaryRemark(event) ? WidgetSpacing.primaryTitleToRemark : WidgetSpacing.primaryTitleToDetails),
      }) {
        Text(event.name)
          .courseText(compact ? WidgetTypography.compactTitle : WidgetTypography.primaryTitle,
            compact ? 1 : layout.nameLines)
          .fontColor(compact ? $r('app.color.widget_heading') : $r('app.color.widget_title'))
          .width('100%')
        if (compact) {
          WidgetViewThatFits({ horizontal: true, content: (): void => this.compactDetails(event) })
            .width('100%')
            .clip(true)
        } else {
          Column({ space: WidgetSpacing.remarkToDetails }) {
            if (this.hasPrimaryRemark(event)) {
              Text(event.remark)
                .courseText(WidgetTypography.remark, 3)
                .fontColor($r('app.color.widget_secondary'))
                .width('100%')
            }
            Column({ space: WidgetSpacing.detailRows }) {
              Text(event.location)
                .courseText(WidgetTypography.primaryDetail)
                .fontColor($r('app.color.widget_detail'))
                .width('100%')
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
        left: WidgetSpacing.eventHorizontalInset,
        right: WidgetSpacing.eventHorizontalInset,
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
              .courseText(WidgetTypography.remaining)
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
    }, (layout: CourseLayout) => `${layout.count}-${layout.remaining}-${layout.nameLines}`)
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
          .courseText(WidgetTypography.remaining)
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
    Column() {
      Row({ space: WidgetSpacing.columns }) {
        if (this.hasSnapshot) {
          this.dayView(this.medium ? this.today : this.smallDay, true)
          if (this.medium) {
            this.dayView(this.tomorrow, false)
          }
        } else {
          Text(this.message)
            .fontSize(12)
            .fontColor($r('app.color.widget_secondary'))
            .width('100%')
            .height('100%')
            .textAlign(TextAlign.Center)
        }
      }
      .width('100%')
      .layoutWeight(1)
      .padding(WidgetSpacing.cardInset)
      .margin({ top: this.medium ? 0 : this.verticalInset, bottom: this.medium ? 0 : this.verticalInset })
      .backgroundColor($r('app.color.widget_background'))
      .borderRadius(18)
      .alignItems(VerticalAlign.Top)
    }
    .width('100%')
    .height('100%')
    .onClick(() => {
      postCardAction(this, { action: 'router', abilityName: 'EntryAbility' });
    })
  }
}
