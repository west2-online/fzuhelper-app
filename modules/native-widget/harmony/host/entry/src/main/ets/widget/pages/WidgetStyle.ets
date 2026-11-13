export interface WidgetTextStyle {
  size: number;
  lineHeight: number;
  leadingTrim: number;
}

// Figma uses PingFang SC with cap-height trimming. HarmonyOS Sans has different
// glyph metrics: retain the primary title/remark line boxes so their CJK ink
// does not eat into the gaps. Apply the compact/detail trim in this one place.
// All font metrics use fp; container spacing uses vp.
export class WidgetTypography {
  static readonly heading: WidgetTextStyle = { size: 12, lineHeight: 12, leadingTrim: 0 };
  static readonly primaryTitle: WidgetTextStyle = { size: 14, lineHeight: 15.4, leadingTrim: 0 };
  static readonly remark: WidgetTextStyle = { size: 10, lineHeight: 10, leadingTrim: 0 };
  static readonly primaryDetail: WidgetTextStyle = { size: 12, lineHeight: 12, leadingTrim: 1 };
  static readonly compactTitle: WidgetTextStyle = { size: 10, lineHeight: 11, leadingTrim: 1 };
  static readonly compactDetail: WidgetTextStyle = { size: 10, lineHeight: 10, leadingTrim: 0.5 };
  static readonly remaining: WidgetTextStyle = { size: 10, lineHeight: 10, leadingTrim: 0 };
}

// Measured from the primary and small Event variants in the Figma component
// library. Both columns share the same course spacing and event padding.
export class WidgetSpacing {
  static readonly cardInset: number = 18;
  static readonly columns: number = 10;
  static readonly headingToCourses: number = 8;
  static readonly courses: number = 4;
  static readonly primaryTitleToDetails: number = 6;
  // Balance the visible whitespace around remarks and keep the primary
  // course compact enough for a two-line title plus a three-line remark.
  static readonly primaryTitleToRemark: number = 2;
  static readonly remarkToDetails: number = 4;
  static readonly compactTitleToDetails: number = 4;
  static readonly detailRows: number = 2;
  static readonly compactDetails: number = 2;
  static readonly indicatorToContent: number = 2;
  static readonly eventHorizontalInset: number = 2;
  static readonly eventVerticalInset: number = 3;
  static readonly headingItems: number = 4;
}
