export type UserRole = 'shipper' | 'carrier' | 'admin' | 'super_admin';

export interface User {
  id: string;
  email: string;
  username: string;
  name: string;
  phone?: string;
  role: UserRole;
  subscriptionActive: boolean;
  subscriptionPlan?: string;
  subscriptionExpiresAt?: string;
  locationLabel?: string;
  locationLat?: number;
  locationLng?: number;
  locationPlaceId?: string;
  profilePhotoUrl?: string;
  bio?: string;
  hasLocation?: boolean;
  welcomePassword?: string;
}

export interface Shipment {
  _id: string;
  itemName?: string;
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
  /** Legacy field — prefer weightLbs */
  weightKg?: number;
  dimensions?: string;
  fragile?: boolean;
  preferredPickupDate?: string;
  status: string;
  isManualSubmission?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  pickupLat?: number;
  pickupLng?: number;
  dropLat?: number;
  dropLng?: number;
  pickupPlaceId?: string;
  dropPlaceId?: string;
  distanceKm?: number | null;
  shipperId?: {
    _id: string;
    name: string;
    phone?: string;
    email: string;
    profilePhotoUrl?: string;
  };
  assignedCarrierId?: {
    _id: string;
    name: string;
    phone?: string;
    email: string;
    profilePhotoUrl?: string;
    bio?: string;
    locationLabel?: string;
  };
}

export interface CarrierListing {
  _id: string;
  vehicleType: string;
  serviceArea: string;
  serviceAreaLat?: number;
  serviceAreaLng?: number;
  serviceAreaPlaceId?: string;
  availability: string;
  price: number;
  notes?: string;
  distanceKm?: number;
  carrierId: {
    _id: string;
    name: string;
    phone?: string;
    email: string;
    profilePhotoUrl?: string;
  };
}

export interface InterestRecord {
  _id: string;
  interestedUserId: {
    _id: string;
    name: string;
    phone?: string;
    email: string;
    role: UserRole;
    profilePhotoUrl?: string;
    bio?: string;
    locationLabel?: string;
  };
  createdAt: string;
}

export interface CarrierProfile {
  user: {
    id: string;
    name: string;
    phone?: string;
    email: string;
    role: UserRole;
    profilePhotoUrl?: string;
    bio?: string;
    locationLabel?: string;
    createdAt?: string;
  };
  stats: {
    completedDeliveries: number;
    inProgressDeliveries: number;
    totalInterests: number;
    vehicleListings: number;
  };
  reviewSummary: {
    averageRating: number;
    count: number;
  };
  recentReviews: ReviewRecord[];
}

export interface MyInterestRecord {
  _id: string;
  listingType: 'shipment' | 'carrier';
  listingId: string;
  createdAt: string;
  listing: Shipment | CarrierListing | null;
}

export interface ReviewRecord {
  _id: string;
  rating: number;
  comment?: string;
  reviewerId: { name: string; role: string };
  createdAt: string;
}
