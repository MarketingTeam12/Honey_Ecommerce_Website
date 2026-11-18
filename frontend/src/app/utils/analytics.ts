/**
 * Google Analytics & Performance Event Tracking Utility
 * Safely dispatches GA4/GTM custom events without external dependency lock.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export function trackEvent(
  action: string,
  params?: Record<string, string | number | boolean | null | undefined>
): void {
  try {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      window.gtag('event', action, params);
    } else if (typeof window !== 'undefined' && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: action, ...params });
    }
  } catch (err) {
    console.debug('Analytics trackEvent error (non-blocking):', err);
  }
}

export function trackPurchase(orderNumber: string, value: number, currency = 'INR'): void {
  trackEvent('purchase', {
    transaction_id: orderNumber,
    value,
    currency,
  });
}

export function trackLead(serviceName: string, formName = 'contact_form'): void {
  trackEvent('generate_lead', {
    lead_source: formName,
    service_interest: serviceName,
  });
}

export function trackAddToCart(itemName: string, price: number, quantity = 1): void {
  trackEvent('add_to_cart', {
    item_name: itemName,
    price,
    quantity,
    currency: 'INR',
  });
}
