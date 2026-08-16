import * as Location from 'expo-location';
import { PlaceValue } from '../components/PlaceAutocomplete';

export type LocationPermissionResult =
  | { granted: true }
  | { granted: false; reason: 'denied' | 'error' };

export async function requestAppLocationPermission(): Promise<LocationPermissionResult> {
  try {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') {
      return { granted: true };
    }
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      return { granted: true };
    }
    return { granted: false, reason: 'denied' };
  } catch {
    return { granted: false, reason: 'error' };
  }
}

export async function readCurrentPlace(): Promise<PlaceValue | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const [geo] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    const label = [geo?.name, geo?.city, geo?.region, geo?.country]
      .filter(Boolean)
      .join(', ');
    return {
      address:
        label ||
        `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  } catch {
    return null;
  }
}

export async function readCurrentCoords(): Promise<{ lat: number; lng: number } | null> {
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { lat: pos.coords.latitude, lng: pos.coords.longitude };
  } catch {
    return null;
  }
}
