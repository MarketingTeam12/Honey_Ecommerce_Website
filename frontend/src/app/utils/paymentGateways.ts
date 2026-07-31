import { publicAnonKey } from '@/app/utils/backendInfo';
import { API_URL } from '@/app/utils/api';

export interface PaymentGatewayKeys {
  zoho_payments?: {
    client_id?: string;
    client_secret?: string;
    test_mode?: boolean;
  };
  zoho_books?: {
    organization_id?: string;
    client_id?: string;
    client_secret?: string;
    refresh_token?: string;
  };
}

/**
 * Fetch Zoho payment gateway API keys from the backend
 */
export async function getPaymentGatewayKeys(): Promise<PaymentGatewayKeys> {
  try {
    const response = await fetch(
      `${API_URL}/admin/api-keys`,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch payment gateway keys');
    }

    const keys: PaymentGatewayKeys = await response.json();
    return keys;
  } catch (error) {
    console.error('Error fetching payment gateway keys:', error);
    return {};
  }
}

/**
 * Check if Zoho Payments is configured
 */
export async function isZohoPaymentsConfigured(): Promise<boolean> {
  const keys = await getPaymentGatewayKeys();
  const zohoKeys = keys.zoho_payments;
  
  if (!zohoKeys || !zohoKeys.client_id || !zohoKeys.client_secret) {
    return false;
  }
  
  return true;
}

/**
 * Get Zoho Payments configuration
 */
export async function getZohoPaymentsConfig() {
  const keys = await getPaymentGatewayKeys();
  const zohoPayments = keys.zoho_payments;
  
  if (!zohoPayments || !zohoPayments.client_id || !zohoPayments.client_secret) {
    console.warn('Zoho Payments is not configured properly');
    return null;
  }
  
  return {
    client_id: zohoPayments.client_id,
    client_secret: zohoPayments.client_secret,
    test_mode: zohoPayments.test_mode ?? true
  };
}

/**
 * Get Zoho Books configuration
 */
export async function getZohoBooksConfig() {
  const keys = await getPaymentGatewayKeys();
  const zohoBooks = keys.zoho_books;
  
  if (!zohoBooks || !zohoBooks.organization_id || !zohoBooks.client_id || 
      !zohoBooks.client_secret || !zohoBooks.refresh_token) {
    console.warn('Zoho Books is not configured properly');
    return null;
  }
  
  return {
    organization_id: zohoBooks.organization_id,
    client_id: zohoBooks.client_id,
    client_secret: zohoBooks.client_secret,
    refresh_token: zohoBooks.refresh_token
  };
}

/**
 * Get list of configured payment gateways (only Zoho)
 */
export async function getConfiguredPaymentGateways(): Promise<string[]> {
  const configured: string[] = [];
  
  if (await isZohoPaymentsConfigured()) {
    configured.push('Zoho Payments');
  }
  
  return configured;
}
