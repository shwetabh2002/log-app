import { Href } from 'expo-router';
import { User } from './types';
import { userHasLocation } from './userLocation';

type AppRouter = { replace: (href: Href) => void; push?: (href: Href) => void };

/** Route after login or when restoring a saved session (matches web app logic). */
export function routeAfterAuth(user: User, router: AppRouter) {
  if (user.role === 'admin' || user.role === 'super_admin') {
    router.replace('/dashboard');
    return;
  }
  if (!user.subscriptionActive) {
    router.replace('/billing' as Href);
    return;
  }
  if (!userHasLocation(user)) {
    router.replace('/location-setup' as Href);
    return;
  }
  router.replace('/dashboard');
}

export function billingHref(): Href {
  return '/billing' as Href;
}

export function locationSetupHref(): Href {
  return '/location-setup' as Href;
}
