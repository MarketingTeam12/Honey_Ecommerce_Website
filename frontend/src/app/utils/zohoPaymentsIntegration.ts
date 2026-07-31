import { API_URL, API_BASE_URL } from '@/app/utils/api';

/**
 * Zoho Payments Integration
 * Exclusive payment gateway for Honey Translation Services
 */

const API_BASE = `${API_URL}`;
const LOCAL_BACKEND_BASE = API_BASE_URL;
const ZOHO_WIDGET_SCRIPT_ID = 'zoho-zpayments-script';
const ZOHO_WIDGET_SCRIPT_SRC = 'https://static.zohocdn.com/zpay/zpay-js/v1/zpayments.js';

declare global {
  interface Window {
    ZPayments?: any;
  }
}

type ZohoWidgetSessionResponse = {
  success: boolean;
  payments_session_id: string;
  amount: number;
  currency_code: string;
  description: string;
  invoice_number?: string;
  reference_number?: string;
  widget_config: {
    account_id: string;
    domain: string;
    is_test_mode?: boolean;
    api_key: string;
  };
};

/**
 * Create Zoho Payment order on backend and get hosted checkout URL
 */
export async function createZohoPaymentOrder(orderData: {
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: any[];
  subtotal?: number;
  discount?: number;
  tax?: number;
}): Promise<{ paymentUrl: string | null; hostedpageId: string; orderId: string; demo?: boolean }> {
  const response = await fetch(`${API_BASE}/payment/zoho/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('❌ [Zoho Pay] Create order failed:', error);
    throw new Error(error.error || 'Failed to create Zoho payment order');
  }

  return response.json();
}

export async function createZohoWidgetSession(payload: {
  amount: number;
  currencyCode: string;
  description: string;
  invoiceNumber?: string;
  referenceNumber?: string;
  name?: string;
  email?: string;
  phone?: string;
}): Promise<ZohoWidgetSessionResponse> {
  const response = await fetch(`${LOCAL_BACKEND_BASE}/api/payments/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount: payload.amount,
      currency_code: payload.currencyCode,
      description: payload.description,
      invoice_number: payload.invoiceNumber,
      reference_number: payload.referenceNumber,
      address: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
      },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.payments_session_id || !data?.widget_config) {
    const detailMessage =
      data?.details?.error_description ||
      data?.details?.message ||
      data?.details?.error ||
      '';
    const message = detailMessage || data?.error || 'Unable to create Zoho widget session';
    throw new Error(message);
  }

  return data as ZohoWidgetSessionResponse;
}

async function ensureZohoWidgetScriptLoaded(): Promise<void> {
  if (window.ZPayments) return;

  const existingScript = document.getElementById(ZOHO_WIDGET_SCRIPT_ID) as HTMLScriptElement | null;
  if (existingScript) {
    await new Promise<void>((resolve, reject) => {
      if (window.ZPayments) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Zoho widget script')), { once: true });
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.id = ZOHO_WIDGET_SCRIPT_ID;
    script.src = ZOHO_WIDGET_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Zoho widget script'));
    document.body.appendChild(script);
  });
}

export async function openZohoCheckoutWidget(params: {
  session: ZohoWidgetSessionResponse;
  name?: string;
  email?: string;
  phone?: string;
}): Promise<any> {
  await ensureZohoWidgetScriptLoaded();

  if (!window.ZPayments) {
    throw new Error('Zoho widget SDK is not available');
  }

  const { session } = params;
  const currencyCode = String(session.currency_code || 'INR').toUpperCase();

  const address: Record<string, string> = {};
  if (params.name && params.name.trim()) address.name = params.name.trim();
  if (params.email && params.email.includes('@')) address.email = params.email.trim();
  if (params.phone) {
    const sanitizedPhone = params.phone.replace(/[^\d+]/g, '');
    if (sanitizedPhone.length >= 8) address.phone = sanitizedPhone;
  }

  const instance = new window.ZPayments({
    account_id: session.widget_config.account_id,
    domain: session.widget_config.domain || 'IN',
    otherOptions: {
      api_key: session.widget_config.api_key,
      is_test_mode: Boolean(session.widget_config.is_test_mode),
    },
  });

  try {
    const options: Record<string, any> = {
      amount: Number(session.amount).toFixed(2),
      transaction_type: 'payment',
      currency_code: currencyCode,
      payments_session_id: session.payments_session_id,
      description: session.description,
    };

    if (session.invoice_number && /^[A-Za-z0-9\-_/]{3,50}$/.test(session.invoice_number)) {
      options.invoice_number = session.invoice_number;
    }
    if (session.reference_number && /^[A-Za-z0-9\-_/]{3,50}$/.test(session.reference_number)) {
      options.reference_number = session.reference_number;
    }
    if (Object.keys(address).length) options.address = address;

    const result = await instance.requestPaymentMethod(options);
    return result;
  } catch (error) {
    const message = String((error as any)?.message || '');
    if (/not an authorized user/i.test(message)) {
      throw new Error(
        'Zoho widget authorization failed. Check that ZOHO_ACCOUNT_ID, ZOHO_WIDGET_API_KEY, and ZOHO_IS_TEST_MODE all belong to the same Zoho Payments account.'
      );
    }
    throw error;
  } finally {
    if (typeof instance.close === 'function') {
      await instance.close();
    }
  }
}

export async function verifyZohoWidgetPayment(payload: {
  paymentId?: string;
  paymentsSessionId: string;
}): Promise<{ success: boolean; status: string; payment_id?: string; source?: string }> {
  const response = await fetch(`${LOCAL_BACKEND_BASE}/api/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_id: payload.paymentId,
      payments_session_id: payload.paymentsSessionId,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data?.success) {
    const message =
      data?.details?.error_description ||
      data?.details?.message ||
      data?.error ||
      'Failed to verify Zoho payment';
    throw new Error(message);
  }

  return data;
}

/**
 * Verify Zoho payment after redirect
 */
export async function verifyZohoPayment(paymentData: {
  hostedpage_id?: string;
  zoho_order_id?: string;
  payment_id?: string;
  orderId?: string;
}): Promise<{ verified: boolean; paymentStatus: string; demo?: boolean }> {
  const response = await fetch(`${API_BASE}/payment/zoho/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });

  if (!response.ok) {
    console.error('❌ [Zoho Pay] Verification failed:', response.status);
    throw new Error('Payment verification failed');
  }

  return response.json();
}

/**
 * Initiate Zoho payment flow - creates order and redirects to Zoho checkout
 */
export async function initiateZohoPayment({
  amount,
  currency,
  orderId,
  orderNumber,
  trackingNumber,
  userId,
  userEmail,
  userName,
  items,
  subtotal,
  discount,
  tax,
  onSuccess,
  onError
}: {
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
  trackingNumber: string;
  userId: string;
  userEmail: string;
  userName: string;
  items: any[];
  subtotal?: number;
  discount?: number;
  tax?: number;
  onSuccess?: (data: any) => void;
  onError: (error: Error) => void;
}) {
  try {
    console.log('💳 [Zoho Pay] Initiating payment...');
    console.log('💰 Amount:', amount, currency);
    console.log('📦 Order:', orderNumber);
    
    // Create payment order on backend
    const result = await createZohoPaymentOrder({
      amount,
      currency,
      orderId,
      orderNumber,
      trackingNumber,
      userId,
      userEmail,
      userName,
      items,
      subtotal,
      discount,
      tax
    });

    console.log('✅ [Zoho Pay] Order created:', result);

    if (result.paymentUrl) {
      // Redirect to Zoho hosted checkout page
      console.log('🔗 [Zoho Pay] Redirecting to:', result.paymentUrl);
      window.location.href = result.paymentUrl;
    } else if (onSuccess) {
      // No payment URL (demo mode) - call success callback
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    console.error('❌ [Zoho Pay] Payment initiation error:', error);
    onError(error as Error);
  }
}

/**
 * Fetch all Zoho payment transactions (Admin)
 */
export async function getZohoTransactions(): Promise<any[]> {
  try {
    const response = await fetch(`${API_BASE}/payment/zoho/transactions`, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();
    return data.transactions || [];
  } catch (error) {
    console.error('❌ [Zoho Pay] Fetch transactions error:', error);
    return [];
  }
}

/**
 * Process refund via Zoho Payments (Admin)
 */
export async function processZohoRefund(refundData: {
  orderId: string;
  hostedpageId?: string;
  amount: number;
  reason?: string;
}): Promise<{ success: boolean; refundId?: string; demo?: boolean }> {
  const response = await fetch(`${API_BASE}/payment/zoho/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(refundData)
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || 'Failed to process refund');
  }

  return response.json();
}

/**
 * Download invoice PDF
 */
export async function downloadInvoicePdf(invoiceId: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}/zoho/invoice/${invoiceId}/download`);

  if (!response.ok) {
    throw new Error('Failed to download invoice PDF');
  }

  return response.blob();
}
