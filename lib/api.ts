import type {
  CarrierListing,
  CarrierProfile,
  InterestRecord,
  MyInterestRecord,
  ReviewRecord,
  Shipment,
  User,
  UserRole,
} from './types';

export type {
  CarrierListing,
  CarrierProfile,
  InterestRecord,
  MyInterestRecord,
  ReviewRecord,
  Shipment,
  User,
  UserRole,
};

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  address: string;
  name?: string;
  lat?: number;
  lng?: number;
}

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(Array.isArray(error.message) ? error.message[0] : error.message);
  }
  return res.json();
}

export const api = {
  login: (body: { login: string; password: string }) =>
    request<{ accessToken: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  me: (token: string) => request<User & { welcomePassword?: string }>('/auth/me', {}, token),

  updateLocation: (
    token: string,
    body: {
      locationLabel: string;
      locationLat: number;
      locationLng: number;
      locationPlaceId?: string;
    },
  ) =>
    request<User>(
      '/auth/location',
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    ),

  updateProfile: (
    token: string,
    body: {
      name?: string;
      phone?: string;
      bio?: string;
      profilePhotoUrl?: string;
    },
  ) =>
    request<User>(
      '/auth/profile',
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    ),

  changePassword: (
    token: string,
    body: { currentPassword: string; newPassword: string },
  ) =>
    request<{ ok: boolean; message: string }>(
      '/auth/password',
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    ),

  createCheckout: (token: string, planId: string) =>
    request<{ url: string; mock?: boolean }>(
      '/payments/checkout',
      { method: 'POST', body: JSON.stringify({ planId }) },
      token,
    ),

  getShipments: (params?: {
    itemType?: string;
    location?: string;
    status?: string;
    lat?: string;
    lng?: string;
    maxDistanceKm?: string;
  }) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
      ) as Record<string, string>,
    ).toString();
    return request<Shipment[]>(`/shipments${query ? `?${query}` : ''}`);
  },

  getShipment: (id: string) => request<Shipment>(`/shipments/${id}`),

  getMyShipments: (token: string) =>
    request<Shipment[]>('/shipments/my', {}, token),

  createShipment: (
    token: string,
    body: {
      itemName: string;
      itemType: string;
      pickupLocation: string;
      pickupLocationDetails?: string;
      dropLocation: string;
      dropLocationDetails?: string;
      price: number;
      notes?: string;
      photos?: string[];
      quantity?: number;
      weightLbs?: number;
      dimensions?: string;
      fragile?: boolean;
      preferredPickupDate?: string;
      pickupLat: number;
      pickupLng: number;
      dropLat: number;
      dropLng: number;
      pickupPlaceId?: string;
      dropPlaceId?: string;
    },
  ) =>
    request('/shipments', { method: 'POST', body: JSON.stringify(body) }, token),

  presignUpload: (token: string, contentType: string, fileName?: string) =>
    request<{ uploadUrl: string; publicUrl: string; key: string }>(
      '/uploads/presign',
      { method: 'POST', body: JSON.stringify({ contentType, fileName }) },
      token,
    ),

  placesAutocomplete: (token: string, input: string, sessionToken?: string) => {
    const params = new URLSearchParams({ input });
    if (sessionToken) params.set('sessionToken', sessionToken);
    return request<PlaceSuggestion[]>(`/places/autocomplete?${params}`, {}, token);
  },

  placeDetails: (token: string, placeId: string, sessionToken?: string) => {
    const params = new URLSearchParams({ placeId });
    if (sessionToken) params.set('sessionToken', sessionToken);
    return request<PlaceDetails>(`/places/details?${params}`, {}, token);
  },

  updateShipmentStatus: (
    token: string,
    id: string,
    status: 'open' | 'in_progress' | 'closed',
  ) =>
    request(
      `/shipments/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    ),

  updateShipment: (
    token: string,
    id: string,
    body: {
      itemName?: string;
      itemType?: string;
      pickupLocation?: string;
      pickupLocationDetails?: string;
      dropLocation?: string;
      dropLocationDetails?: string;
      price?: number;
      notes?: string;
      photos?: string[];
      quantity?: number;
      weightLbs?: number;
      dimensions?: string;
      fragile?: boolean;
      preferredPickupDate?: string;
      pickupLat?: number;
      pickupLng?: number;
      dropLat?: number;
      dropLng?: number;
      pickupPlaceId?: string;
      dropPlaceId?: string;
    },
  ) =>
    request<Shipment>(
      `/shipments/${id}`,
      { method: 'PATCH', body: JSON.stringify(body) },
      token,
    ),

  getCarrierListings: (params?: {
    vehicleType?: string;
    location?: string;
    lat?: string;
    lng?: string;
    maxDistanceKm?: string;
  }) => {
    const query = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== ''),
      ) as Record<string, string>,
    ).toString();
    return request<CarrierListing[]>(
      `/carrier-listings${query ? `?${query}` : ''}`,
    );
  },

  getMyCarrierListings: (token: string) =>
    request<CarrierListing[]>('/carrier-listings/my', {}, token),

  createCarrierListing: (
    token: string,
    body: {
      vehicleType: string;
      serviceArea: string;
      serviceAreaLat: number;
      serviceAreaLng: number;
      serviceAreaPlaceId?: string;
      availability: string;
      price: number;
      notes?: string;
    },
  ) =>
    request('/carrier-listings', { method: 'POST', body: JSON.stringify(body) }, token),

  expressInterest: (
    token: string,
    body: { listingType: 'shipment' | 'carrier'; listingId: string },
  ) =>
    request('/interests', { method: 'POST', body: JSON.stringify(body) }, token),

  getShipmentInterests: (token: string, id: string) =>
    request<InterestRecord[]>(`/interests/shipment/${id}`, {}, token),

  getCarrierInterests: (token: string, id: string) =>
    request<InterestRecord[]>(`/interests/carrier/${id}`, {}, token),

  getMyInterests: (token: string) =>
    request<MyInterestRecord[]>('/interests/my', {}, token),

  createReview: (
    token: string,
    body: {
      revieweeId: string;
      rating: number;
      comment?: string;
      shipmentId?: string;
    },
  ) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(body) }, token),

  getUserReviews: (userId: string) =>
    request<ReviewRecord[]>(`/reviews/user/${userId}`),

  getUserReviewSummary: (userId: string) =>
    request<{ averageRating: number; count: number }>(
      `/reviews/user/${userId}/summary`,
    ),

  getCarrierProfile: (token: string, carrierId: string) =>
    request<CarrierProfile>(`/users/${carrierId}/carrier-profile`, {}, token),

  assignCarrierToShipment: (token: string, shipmentId: string, carrierId: string) =>
    request<Shipment>(
      `/shipments/${shipmentId}/assign-carrier`,
      { method: 'PATCH', body: JSON.stringify({ carrierId }) },
      token,
    ),
};
