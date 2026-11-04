import { Address } from '../types';

/**
 * Formats a clean, readable location string for the digital card header.
 * Displays the exact storefront address and locality entered by the profile owner.
 */
export function formatCardLocation(address?: Address): string {
  if (!address) return 'Location on Request';

  const parts: string[] = [];

  const shop = address.shopNumber?.trim();
  const area = address.areaLocality?.trim();
  const city = address.city?.trim();
  const state = address.state?.trim();

  // 1. Include shop or building if entered
  if (shop) {
    parts.push(shop);
  }

  // 2. Include area / locality / market if entered and not redundant
  if (area) {
    const isRedundant = parts.some((p) => p.toLowerCase().includes(area.toLowerCase()));
    if (!isRedundant) {
      parts.push(area);
    }
  }

  // 3. Include city if entered and not redundant
  if (city) {
    const isRedundant = parts.some((p) => p.toLowerCase().includes(city.toLowerCase()));
    if (!isRedundant) {
      parts.push(city);
    }
  }

  // 4. Include state if entered, not redundant with city or previous parts
  if (state) {
    const isDuplicateCity = city && state.toLowerCase() === city.toLowerCase();
    const isRedundant = parts.some((p) => p.toLowerCase().includes(state.toLowerCase()));
    if (!isDuplicateCity && !isRedundant) {
      parts.push(state);
    }
  }

  if (parts.length > 0) {
    return parts.join(', ');
  }

  return 'Location on Request';
}

/**
 * Formats a clean single-line location for social sharing (WhatsApp, Telegram, etc.)
 */
export function formatShareLocation(address?: Address): string {
  if (!address) return '';
  return formatCardLocation(address);
}

/**
 * Formats the full address string used for Google Maps search queries and navigation
 */
export function formatFullAddressString(address?: Address): string {
  if (!address) return '';

  return [
    address.shopNumber?.trim(),
    address.areaLocality?.trim(),
    address.landmark?.trim() ? `Near ${address.landmark.trim()}` : '',
    [address.city?.trim(), address.state?.trim()].filter(Boolean).join(', '),
    address.pincode?.trim(),
  ]
    .filter(Boolean)
    .join(', ');
}
