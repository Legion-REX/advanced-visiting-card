import { Customer } from '../types';

/**
 * Exports the filtered customer records to an Excel-compatible CSV file with UTF-8 BOM
 * Supports opened natively in Microsoft Excel, Google Sheets, Apple Numbers, etc.
 */
export function exportCustomersToExcel(customers: Customer[], filename: string = 'Registered_Customers_Export.csv'): void {
  // Column Headers
  const headers = [
    'Customer ID',
    'First Name',
    'Last Name',
    'Full Name',
    'Email',
    'Phone',
    'WhatsApp',
    'Business Name',
    'Business Category',
    'Job Title',
    'Headline',
    'Shop Number',
    'Area/Locality',
    'Landmark',
    'Pincode',
    'City',
    'State',
    'Business Hours',
    'Status',
    'Payment Status',
    'Payment Amount (INR)',
    'Payment Method',
    'Payment Date',
    'Portfolio Items Count',
    'Profile Views',
    'Inquiries Received',
    'Registered Date',
    'Website URL'
  ];

  const escapeCsv = (str: string | number | boolean | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const cleanStr = String(str).replace(/"/g, '""');
    return `"${cleanStr}"`;
  };

  const rows = customers.map(c => [
    escapeCsv(c.id),
    escapeCsv(c.firstName),
    escapeCsv(c.lastName),
    escapeCsv(`${c.firstName} ${c.lastName}`),
    escapeCsv(c.email),
    escapeCsv(c.phone),
    escapeCsv(c.whatsappNumber || c.phone),
    escapeCsv(c.businessName),
    escapeCsv(c.businessCategory),
    escapeCsv(c.jobTitle),
    escapeCsv(c.headline),
    escapeCsv(c.address.shopNumber),
    escapeCsv(c.address.areaLocality),
    escapeCsv(c.address.landmark || ''),
    escapeCsv(c.address.pincode),
    escapeCsv(c.address.city),
    escapeCsv(c.address.state),
    escapeCsv(c.businessHours),
    escapeCsv(c.status.toUpperCase()),
    escapeCsv(c.isPaid ? 'PAID / APPROVED' : 'PENDING PAYMENT'),
    escapeCsv(c.paymentAmount !== undefined ? c.paymentAmount : (c.isPaid ? 499 : 0)),
    escapeCsv(c.paymentMethod || (c.isPaid ? 'UPI' : 'None')),
    escapeCsv(c.paidAt ? new Date(c.paidAt).toLocaleDateString() : ''),
    escapeCsv(c.products?.length || 0),
    escapeCsv(c.viewCount || 0),
    escapeCsv(c.inquiriesCount || 0),
    escapeCsv(new Date(c.createdAt).toLocaleDateString()),
    escapeCsv(c.websiteUrl || '')
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\r\n');

  // \uFEFF is the UTF-8 Byte Order Mark (BOM) ensuring Excel displays unicode accents cleanly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
