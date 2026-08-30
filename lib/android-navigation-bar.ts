import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

export async function setAndroidNavigationBar(theme: 'light' | 'dark') {
  if (Platform.OS !== 'android') return;
  NavigationBar.NavigationBar.setStyle(theme === 'dark' ? 'light' : 'dark');
}
