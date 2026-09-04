import { checkMultiple, requestMultiple, RESULTS, type Permission } from 'react-native-permissions';

const HARMONY_LOCATION_PERMISSIONS = [
  'ohos.permission.APPROXIMATELY_LOCATION' as Permission,
  'ohos.permission.LOCATION' as Permission,
];

export async function hasLocationPermission(): Promise<boolean> {
  const statuses = await checkMultiple(HARMONY_LOCATION_PERMISSIONS);

  return HARMONY_LOCATION_PERMISSIONS.every(permission => statuses[permission] === RESULTS.GRANTED);
}

export async function requestLocationPermission(): Promise<boolean> {
  const statuses = await requestMultiple(HARMONY_LOCATION_PERMISSIONS);

  return HARMONY_LOCATION_PERMISSIONS.every(permission => statuses[permission] === RESULTS.GRANTED);
}
