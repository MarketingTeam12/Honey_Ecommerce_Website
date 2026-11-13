import { useEffect } from 'react';
import { scheduleAfterLoad } from '@/app/utils/deferredLoad';
import { useCookieConsent } from '@/app/context/CookieConsentContext';

const SALESIQ_SCRIPT_ID = 'zsiqscript';
const SALESIQ_WIDGET_SRC =
  'https://salesiq.zohopublic.in/widget?wc=siq960e3fbd46ca7601a7e601b5fd3e4fe04b4c8d84be343d3c5a8b4ac0310d11a0';

declare global {
  interface Window {
    $zoho?: {
      salesiq?: {
        ready?: () => void;
        floatbutton?: {
          visible?: (state: 'show' | 'hide') => void;
        };
      };
    };
  }
}

function showSalesIQWidget() {
  window.$zoho?.salesiq?.floatbutton?.visible?.('show');
}

export function SalesIQWidget() {
  const { hasConsented } = useCookieConsent();

  useEffect(() => {
    if (!hasConsented) {
      window.$zoho?.salesiq?.floatbutton?.visible?.('hide');
      return;
    }

    let retry: number | undefined;
    let stopRetry: number | undefined;

    const cancelSchedule = scheduleAfterLoad(() => {
      window.$zoho = window.$zoho || {};
      window.$zoho.salesiq = window.$zoho.salesiq || {};

      const existingReady = window.$zoho.salesiq.ready;
      window.$zoho.salesiq.ready = () => {
        existingReady?.();
        showSalesIQWidget();
      };

      const existingScript = document.getElementById(SALESIQ_SCRIPT_ID) as HTMLScriptElement | null;

      if (!existingScript) {
        const script = document.createElement('script');
        script.id = SALESIQ_SCRIPT_ID;
        script.src = SALESIQ_WIDGET_SRC;
        script.defer = true;
        script.onload = showSalesIQWidget;
        document.body.appendChild(script);
      } else if (!existingScript.src.includes('salesiq.zohopublic.in/widget')) {
        existingScript.src = SALESIQ_WIDGET_SRC;
      }

      retry = window.setInterval(showSalesIQWidget, 1500);
      stopRetry = window.setTimeout(() => {
        if (retry !== undefined) window.clearInterval(retry);
      }, 15000);
    }, 1500);

    return () => {
      cancelSchedule();
      if (retry !== undefined) window.clearInterval(retry);
      if (stopRetry !== undefined) window.clearTimeout(stopRetry);
    };
  }, [hasConsented]);

  return null;
}

export default SalesIQWidget;
