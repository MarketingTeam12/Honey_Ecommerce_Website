import { API_URL } from '@/app/utils/api';
import { buildHeaders } from '@/app/utils/buildHeaders';

/**
 * Downloads the official invoice for an order. The server builds it from the
 * stored order (amounts, address, invoice number), so every copy is identical.
 */
export async function downloadOrderInvoice(orderId: string, orderNumber?: string) {
  const response = await fetch(`${API_URL}/orders/${encodeURIComponent(orderId)}/invoice`, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || 'Invoice is not available right now');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice-${orderNumber || orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
