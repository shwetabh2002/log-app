import { User } from './types';

export function userHasLocation(user: Pick<User, 'locationLat' | 'locationLng' | 'hasLocation'>) {
  if (user.hasLocation) return true;
  return typeof user.locationLat === 'number' && typeof user.locationLng === 'number';
}

export type BrowseCoords = { lat: number; lng: number };

export function coordsFromUser(user: User): BrowseCoords | null {
  if (typeof user.locationLat === 'number' && typeof user.locationLng === 'number') {
    return { lat: user.locationLat, lng: user.locationLng };
  }
  return null;
}
