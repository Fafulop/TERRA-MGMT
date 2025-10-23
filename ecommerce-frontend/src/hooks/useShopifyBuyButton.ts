import { useEffect, useRef, useState } from 'react';
import { SHOPIFY_CONFIG, SHOPIFY_UI_OPTIONS, MONEY_FORMAT } from '../config/shopify';

// Type definitions for Shopify Buy Button SDK
declare global {
  interface Window {
    ShopifyBuy?: {
      buildClient: (config: { domain: string; storefrontAccessToken: string }) => any;
      UI?: {
        onReady: (client: any) => Promise<any>;
      };
    };
  }
}

interface UseShopifyBuyButtonProps {
  productId: string;
  containerId: string;
}

/**
 * React Hook for integrating Shopify Buy Button SDK
 * Handles SDK loading, client initialization, and component creation
 */
export const useShopifyBuyButton = ({ productId, containerId }: UseShopifyBuyButtonProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    const loadShopifySDK = () => {
      // Check if SDK is already loaded
      if (window.ShopifyBuy) {
        if (window.ShopifyBuy.UI) {
          initializeShopifyUI();
        } else {
          loadScript();
        }
      } else {
        loadScript();
      }
    };

    const loadScript = () => {
      if (scriptLoadedRef.current) return;

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
      script.onload = () => {
        scriptLoadedRef.current = true;
        initializeShopifyUI();
      };
      script.onerror = () => {
        setError('Failed to load Shopify SDK');
        setIsLoading(false);
      };

      const head = document.getElementsByTagName('head')[0];
      const body = document.getElementsByTagName('body')[0];
      (head || body).appendChild(script);
    };

    const initializeShopifyUI = () => {
      try {
        if (!window.ShopifyBuy) {
          throw new Error('ShopifyBuy not available');
        }

        const client = window.ShopifyBuy.buildClient({
          domain: SHOPIFY_CONFIG.domain,
          storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
        });

        if (window.ShopifyBuy.UI) {
          window.ShopifyBuy.UI.onReady(client).then((ui: any) => {
            const container = document.getElementById(containerId);
            if (!container) {
              throw new Error(`Container with id "${containerId}" not found`);
            }

            ui.createComponent('product', {
              id: productId,
              node: container,
              moneyFormat: MONEY_FORMAT,
              options: SHOPIFY_UI_OPTIONS,
            });

            setIsLoading(false);
          }).catch((err: Error) => {
            setError(err.message);
            setIsLoading(false);
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setIsLoading(false);
      }
    };

    loadShopifySDK();

    // Cleanup function
    return () => {
      const container = document.getElementById(containerId);
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [productId, containerId]);

  return { isLoading, error };
};
