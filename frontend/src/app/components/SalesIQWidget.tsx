import { useEffect } from 'react';

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
  useEffect(() => {
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

    const retry = window.setInterval(showSalesIQWidget, 1500);
    const stopRetry = window.setTimeout(() => window.clearInterval(retry), 15000);

    return () => {
      window.clearInterval(retry);
      window.clearTimeout(stopRetry);
    };
  }, []);

  return null;
}

export default SalesIQWidget;
