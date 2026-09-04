import { Platform } from 'react-native';
import { check, PERMISSIONS, request, RESULTS, type Permission } from 'react-native-permissions';

function currentPlatformLocationPermission(): Permission | null {
  if (Platform.OS === 'ios') return PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
  if (Platform.OS === 'android') return PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
  return null;
}

export async function hasLocationPermission(): Promise<boolean> {
  const permission = currentPlatformLocationPermission();
  if (!permission) return true;
  return (await check(permission)) === RESULTS.GRANTED;
}

export async function requestLocationPermission(): Promise<boolean> {
  const permission = currentPlatformLocationPermission();
  if (!permission) return true;
  return (await request(permission)) === RESULTS.GRANTED;
}
