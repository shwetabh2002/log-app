export function roleLabel(role: string) {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'admin') return 'Admin';
  if (role === 'shipper') return 'Shipper';
  if (role === 'carrier') return 'Carrier';
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function shipmentTitle(shipment: { itemName?: string; itemType: string }) {
  return shipment.itemName?.trim() || shipment.itemType;
}
