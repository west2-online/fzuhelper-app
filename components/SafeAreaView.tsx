import {
  Platform,
  SafeAreaView as SafeAreaViewRN,
  StatusBar,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

interface SafeAreaViewProps {
  style?: StyleProp<ViewStyle>;
}

const SafeAreaView: React.FC<React.PropsWithChildren<SafeAreaViewProps>> = ({ children, style }) => {
  return <SafeAreaViewRN style={[styles.container, style]}>{children}</SafeAreaViewRN>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});

export { SafeAreaView };
