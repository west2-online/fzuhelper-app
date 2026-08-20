import {
  CourseSelectedIcon,
  CourseSelectedWhiteIcon,
  CourseUnselectedIcon,
  CourseUnselectedWhiteIcon,
  QRCodeSelectedIcon,
  QRCodeSelectedWhiteIcon,
  QRCodeUnselectedIcon,
  QRCodeUnselectedWhiteIcon,
  ToolboxSelectedIcon,
  ToolboxSelectedWhiteIcon,
  ToolboxUnselectedIcon,
  ToolboxUnselectedWhiteIcon,
  UserSelectedIcon,
  UserSelectedWhiteIcon,
  UserUnselectedIcon,
  UserUnselectedWhiteIcon,
} from '@/components/navbar-icons';
import { ComponentType } from 'react';

interface TabBarIconProps {
  isSelected: boolean;
  isDark: boolean;
}

type IconComponent = ComponentType<{ width?: string; height?: string }>;

interface IconSet {
  selected: IconComponent;
  selectedWhite: IconComponent;
  unselected: IconComponent;
  unselectedWhite: IconComponent;
}

function createTabBarIcon({ selected, selectedWhite, unselected, unselectedWhite }: IconSet) {
  return function Icon({ isSelected, isDark }: TabBarIconProps) {
    const IconComponent = isSelected ? (isDark ? selectedWhite : selected) : isDark ? unselectedWhite : unselected;

    return <IconComponent width="26px" height="26px" />;
  };
}

export const CourseTabBarIcon = createTabBarIcon({
  selected: CourseSelectedIcon,
  selectedWhite: CourseSelectedWhiteIcon,
  unselected: CourseUnselectedIcon,
  unselectedWhite: CourseUnselectedWhiteIcon,
});

export const QRCodeTabBarIcon = createTabBarIcon({
  selected: QRCodeSelectedIcon,
  selectedWhite: QRCodeSelectedWhiteIcon,
  unselected: QRCodeUnselectedIcon,
  unselectedWhite: QRCodeUnselectedWhiteIcon,
});

export const ToolboxTabBarIcon = createTabBarIcon({
  selected: ToolboxSelectedIcon,
  selectedWhite: ToolboxSelectedWhiteIcon,
  unselected: ToolboxUnselectedIcon,
  unselectedWhite: ToolboxUnselectedWhiteIcon,
});

export const UserTabBarIcon = createTabBarIcon({
  selected: UserSelectedIcon,
  selectedWhite: UserSelectedWhiteIcon,
  unselected: UserUnselectedIcon,
  unselectedWhite: UserUnselectedWhiteIcon,
});
