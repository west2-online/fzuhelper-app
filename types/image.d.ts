declare module '*.png' {
  import { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

declare module '*.webp' {
  import { ImageSourcePropType } from 'react-native';
  const value: ImageSourcePropType;
  export default value;
}

// 可以直接作为组件使用
declare module '*.svg' {
  import { SvgProps } from 'react-native-svg';
  const value: React.FC<SvgProps>;
  export default value;
}
