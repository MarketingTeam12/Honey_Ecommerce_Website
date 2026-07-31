/**
 * Zoho Payments is the exclusive payment gateway.
 * This module provides a consistent interface for checking gateway status.
 */

export type PaymentGateway = 'zoho_payments';

/**
 * Always returns zoho_payments as it's the only supported gateway
 */
export async function getActivePaymentGateway(): Promise<PaymentGateway> {
  console.log('✅ Using Zoho Payments gateway (exclusive)');
  return 'zoho_payments';
}

/**
 * Check if Zoho Payments is configured
 */
export async function isGatewayConfigured(): Promise<boolean> {
  try {
    const { getZohoPaymentsConfig } = await import('./paymentGateways');
    const config = await getZohoPaymentsConfig();
    return !!config;
  } catch {
    return false;
  }
}
