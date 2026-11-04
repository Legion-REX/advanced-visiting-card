import { Customer } from '../types';
import { getCustomerCardUrl } from './slug';

/**
 * Utility to generate and trigger the download of a standard RFC 6350 / vCard 3.0 file (.vcf)
 * Allows in-person or phone prospective clients to save digital contact directly to iOS / Android / Outlook.
 */
export function generateVCard(customer: Customer): string {
  const cardUrl = getCustomerCardUrl(customer);

  const formattedAddress = [
    '', // post office box
    customer.address.landmark || '', // extended address
    `${customer.address.shopNumber || ''}, ${customer.address.areaLocality || ''}`.trim(), // street address
    customer.address.city || '', // locality
    customer.address.state || '', // region
    customer.address.pincode || '', // postal code
    'India' // country
  ].join(';');

  let photoLine = '';
  const photoUrl = customer.avatarUrl || customer.logoUrl;
  if (photoUrl && photoUrl.startsWith('data:image/')) {
    // extract base64 data and mime type
    const match = photoUrl.match(/^data:(image\/[a-zA-Z]+);base64,(.+)$/);
    if (match && match.length === 3) {
      const mime = match[1].split('/')[1].toUpperCase(); // JPEG or PNG
      const b64 = match[2];
      photoLine = `PHOTO;ENCODING=b;TYPE=${mime}:${b64}`;
    }
  }

  // URL Entries:
  // 1. Digital Visiting Card Profile Link (Primary website saved in Phone Contacts)
  // 2. Custom external website if provided and different from cardUrl
  const urlEntries: string[] = [];
  if (cardUrl) {
    urlEntries.push(`URL;TYPE=PREF;TYPE=WORK:${cardUrl}`);
    urlEntries.push(`URL:${cardUrl}`);
  }
  if (customer.websiteUrl && customer.websiteUrl.trim() && customer.websiteUrl.trim() !== cardUrl) {
    urlEntries.push(`URL;TYPE=HOME:${customer.websiteUrl.trim()}`);
  }

  const noteSummary = [
    customer.businessName ? customer.businessName : '',
    customer.headline ? customer.headline : '',
    `Website Profile: ${cardUrl}`,
    customer.bio ? customer.bio.replace(/[\r\n]+/g, ' ') : ''
  ].filter(Boolean).join(' | ');

  const vcardLines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${customer.lastName || ''};${customer.firstName || 'Merchant'};;;`,
    `FN:${(customer.firstName + ' ' + (customer.lastName || '')).trim()}`,
    customer.businessName ? `ORG:${customer.businessName}` : '',
    customer.jobTitle ? `TITLE:${customer.jobTitle}` : '',
    photoLine,
    `TEL;TYPE=CELL,VOICE,PREF:${customer.phone}`,
    customer.whatsappNumber ? `TEL;TYPE=WORK,MSG:${customer.whatsappNumber}` : '',
    customer.email ? `EMAIL;TYPE=PREF,INTERNET:${customer.email}` : '',
    ...urlEntries,
    `ADR;TYPE=WORK,POSTAL,PARCEL:;;${customer.address.shopNumber || ''}, ${customer.address.areaLocality || ''}${customer.address.landmark ? ', near ' + customer.address.landmark : ''};${customer.address.city || ''};${customer.address.state || ''};${customer.address.pincode || ''};India`,
    `NOTE:${noteSummary}`,
    `X-SOCIALPROFILE;TYPE=digital_visiting_card:${cardUrl}`,
    'END:VCARD'
  ].filter(Boolean);

  return vcardLines.join('\r\n');
}

export async function downloadVCard(customer: Customer): Promise<boolean> {
  if (customer.status !== 'active') {
    console.warn(`[vCard] Download blocked: Profile for "${customer.businessName}" is inactive or pending admin activation.`);
    return false;
  }

  try {
    const vcardData = generateVCard(customer);
    const sanitizedName = `${customer.firstName || 'Merchant'}_${customer.lastName || 'Contact'}`.replace(/\s+/g, '_');
    const fileName = `${sanitizedName}.vcf`;

    // 1. Mobile Web Share API (Direct OS Contact Import on Android & iOS)
    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare) {
      try {
        const vcfFile = new File([vcardData], fileName, { type: 'text/vcard;charset=utf-8' });
        if (navigator.canShare({ files: [vcfFile] })) {
          await navigator.share({
            title: customer.businessName || `${customer.firstName} ${customer.lastName}`,
            text: `Contact details for ${customer.businessName || customer.firstName}`,
            files: [vcfFile],
          });
          return true;
        }
      } catch (shareErr: any) {
        // If user cancelled the share sheet, exit gracefully without throwing
        if (shareErr?.name === 'AbortError') {
          return true;
        }
        console.warn('[vCard] Web Share API failed or unsupported, falling back to download:', shareErr);
      }
    }

    // 2. Standard Blob Download with HTML5 <a> tag
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const blob = new Blob([vcardData], { type: 'text/vcard;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          try {
            if (link.parentNode) {
              link.parentNode.removeChild(link);
            }
            URL.revokeObjectURL(url);
          } catch {}
        }, 1500);

        return true;
      } catch (blobErr) {
        console.warn('[vCard] Blob download failed, attempting Data URI redirect:', blobErr);
      }

      // 3. Fallback for iOS Safari & WebViews: Data URI Navigation
      const dataUri = `data:text/vcard;charset=utf-8,${encodeURIComponent(vcardData)}`;
      const fallbackLink = document.createElement('a');
      fallbackLink.href = dataUri;
      fallbackLink.setAttribute('download', fileName);
      fallbackLink.target = '_blank';
      fallbackLink.rel = 'noopener noreferrer';
      document.body.appendChild(fallbackLink);
      fallbackLink.click();
      setTimeout(() => {
        try {
          if (fallbackLink.parentNode) {
            fallbackLink.parentNode.removeChild(fallbackLink);
          }
        } catch {}
      }, 1000);
      return true;
    }

    return false;
  } catch (err) {
    console.error('[vCard] Failed to generate/export vCard:', err);
    return false;
  }
}
