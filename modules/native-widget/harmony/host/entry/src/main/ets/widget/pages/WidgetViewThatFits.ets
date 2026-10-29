// Measure the real ArkUI children in preference order, like SwiftUI's
// ViewThatFits. Text wrapping and system font scaling must affect the decision.
@Component
export struct WidgetViewThatFits {
  @Prop horizontal: boolean = false;
  @BuilderParam content: () => void;
  private selectedIndex: number = 0;

  onMeasureSize(info: GeometryInfo, children: Measurable[], constraint: ConstraintSizeOptions): SizeResult {
    const width = Math.max(0, Number(constraint.maxWidth));
    const height = Math.max(0, Number(constraint.maxHeight));
    let selected: SizeResult = { width: 0, height: 0 };
    this.selectedIndex = children.length - 1;
    for (let index = 0; index < children.length; index++) {
      // Release only the axis being tested. The last horizontal candidate is
      // the stacked fallback, whose individual lines may use ellipses.
      selected = children[index].measure({
        minWidth: this.horizontal ? 0 : width,
        maxWidth: this.horizontal && index < children.length - 1 ? 100000 : width,
        minHeight: 0,
        maxHeight: 100000,
      });
      if (this.horizontal ? selected.width <= width : selected.height <= height) {
        this.selectedIndex = index;
        break;
      }
    }
    return {
      width,
      height: Math.max(Number(constraint.minHeight ?? 0), Math.min(selected.height, height)),
    };
  }

  onPlaceChildren(info: GeometryInfo, children: Layoutable[], constraint: ConstraintSizeOptions): void {
    for (let index = 0; index < children.length; index++) {
      // Keep rejected candidates outside the clipped content area. Do not
      // change @State during measurement or depend on a second render pass.
      children[index].layout({ x: index === this.selectedIndex ? 0 : 100000, y: 0 });
    }
  }

  build() {
    this.content()
  }
}
