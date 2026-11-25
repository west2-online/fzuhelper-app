export interface WidgetTextStyle {
  size: number;
  lineHeight: number;
}

// Font sizes and line heights use vp to keep card layout independent of the system font scale.
export class WidgetTypography {
  static readonly heading: WidgetTextStyle = { size: 13, lineHeight: 18 };
  static readonly primaryTitle: WidgetTextStyle = { size: 15, lineHeight: 19 };
  static readonly primaryDetail: WidgetTextStyle = { size: 13, lineHeight: 16 };
  static readonly secondary: WidgetTextStyle = { size: 11, lineHeight: 14 };
}

export class WidgetSpacing {
  static readonly cardInset: Padding = { left: 14, right: 14, top: 12, bottom: 12 };
  static readonly shortCardInset: Padding = { left: 12, right: 12, top: 8, bottom: 8 };
  static readonly shortCardHeight: number = 140;
  static readonly columns: number = 10;
  static readonly headingToCourses: number = 6;
  static readonly courses: number = 4;
  static readonly details: number = 2;
  static readonly detailRows: number = 1;
  static readonly inlineDetails: number = 2;
  static readonly indicatorToContent: number = 4;
  static readonly eventEndInset: number = 2;
  static readonly eventVerticalInset: number = 2;
  static readonly headingItems: number = 4;
}
