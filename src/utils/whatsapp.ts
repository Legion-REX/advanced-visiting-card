/**
 * WhatsApp Integration Utilities
 * Ensures Indian (+91) and international phone numbers conform to WhatsApp E.164 specifications,
 * completely eliminating the "Phone number shared via url is invalid" error.
 */

/**
 * Standardizes a phone number into WhatsApp's required international digits format:
 * - Strips all non-digit characters (+, spaces, hyphens, parentheses, etc.)
 * - Strips leading zeroes (e.g. 09876543210 -> 9876543210, 0091... -> 91...)
 * - If 10 digits (standard Indian mobile numbers starting with 6, 7, 8, or 9), automatically prepends Indian country code '91'
 * - If 13 digits starting with '910', strips erroneous 0 trunk prefix -> 91 + 10 digits
 * - Handles existing 12-digit numbers already prefixed with 91
 */
export function formatWhatsAppNumber(phone: string | undefined | null): string {
  if (!phone || typeof phone !== 'string') return '';

  // 1. Extract only digits
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';

  // 2. Strip leading zeros (common in Indian trunk dialing: 09876543210 or 0091...)
  while (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  // 3. Standard 10-digit Indian phone number (WhatsApp ALWAYS requires country code 91)
  if (digits.length === 10) {
    return `91${digits}`;
  }

  // 4. Case where user entered "+91 09876543210" resulting in "9109876543210" (13 digits)
  if (digits.startsWith('910') && digits.length === 13) {
    return `91${digits.slice(3)}`;
  }

  // 5. Already 12-digit Indian number (91 followed by 10 digits)
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }

  // 6. International phone numbers (already >= 10 digits with country code)
  return digits;
}

/**
 * Generates an official, valid WhatsApp deep link URL:
 * https://wa.me/<number>?text=<encodedMessage>
 */
export function generateWhatsAppUrl(phone: string | undefined | null, message?: string): string {
  const formattedPhone = formatWhatsAppNumber(phone);
  if (!formattedPhone) return '';

  const textParam = message && message.trim() ? `?text=${encodeURIComponent(message.trim())}` : '';
  return `https://wa.me/${formattedPhone}${textParam}`;
}

/**
 * Robust cross-platform launcher for WhatsApp links:
 * - On Mobile devices: Direct location dispatch triggers the native WhatsApp app smoothly
 * - On Desktop / Laptop: Opens in a new tab without being killed by popup blockers
 */
export function launchWhatsAppUrl(url: string): boolean {
  if (typeof window === 'undefined' || !url) return false;

  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

  try {
    if (isMobile) {
      // Direct window location triggers Android / iOS WhatsApp app immediately
      window.location.href = url;
      return true;
    }

    // On Desktop, attempt popup tab first
    const win = window.open(url, '_blank', 'noopener,noreferrer');
    if (win && !win.closed) {
      return true;
    }

    // Fallback if popup was blocked by browser
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
      } catch {}
    }, 500);
    return true;
  } catch (err) {
    console.warn('launchWhatsAppUrl exception:', err);
    try {
      window.location.href = url;
      return true;
    } catch {
      return false;
    }
  }
}
