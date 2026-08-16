export function formatStatus(status: string) {
  switch (status) {
    case 'open':
      return 'Open';
    case 'in_progress':
      return 'In Progress';
    case 'closed':
      return 'Closed';
    default:
      return status;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCurrencyMonthly(amount: number): string {
  return `${formatCurrency(amount)}/mo`;
}

export function formatPlanName(planId?: string): string {
  if (!planId) return 'No plan selected';
  return planId
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatSubscriptionExpiry(iso?: string): string {
  if (!iso) return 'No expiry date on file';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'No expiry date on file';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDistanceMiles(km: number | null | undefined): string {
  if (km == null) return '';
  const miles = km / 1.60934;
  return `${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

export function milesToKm(miles: number): number {
  return miles * 1.60934;
}

export function formatLocationDetails(details?: string): string | undefined {
  const trimmed = details?.trim();
  return trimmed || undefined;
}

export function getShipmentContact(shipment: {
  shipperId?: { name: string; phone?: string; email: string };
  isManualSubmission?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
}) {
  if (shipment.shipperId) {
    const phone = shipment.shipperId.phone?.trim();
    const email = shipment.shipperId.email?.trim();
    if (!phone && !email) return null;
    return {
      name: shipment.shipperId.name,
      phone: phone || undefined,
      email: email || undefined,
    };
  }
  if (shipment.isManualSubmission) {
    const phone = shipment.contactPhone?.trim();
    const email = shipment.contactEmail?.trim();
    const name = shipment.contactName?.trim();
    if (!phone && !email && !name) return null;
    return {
      name: name || 'Shipper',
      phone: phone || undefined,
      email: email || undefined,
    };
  }
  return null;
}

export function itemIcon(label: string): string {
  const lower = label.toLowerCase();
  if (lower.includes('parcel') || lower.includes('package') || lower.includes('document')) return '📦';
  if (lower.includes('fridge') || lower.includes('refrigerator') || lower.includes('appliance')) return '🧊';
  if (lower.includes('furniture') || lower.includes('office')) return '🪑';
  if (lower.includes('electronic') || lower.includes('tv') || lower.includes('laptop')) return '📱';
  if (lower.includes('motor') || lower.includes('bike') || lower.includes('vehicle')) return '🏍️';
  if (lower.includes('construction') || lower.includes('lumber')) return '🧱';
  if (lower.includes('truck') || lower.includes('box')) return '🚛';
  if (lower.includes('van') || lower.includes('cargo')) return '🛻';
  if (lower.includes('hotshot') || lower.includes('pickup')) return '🛻';
  if (lower.includes('courier')) return '📦';
  return '📍';
}
