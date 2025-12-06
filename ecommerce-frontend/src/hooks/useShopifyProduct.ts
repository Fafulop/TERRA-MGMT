import { useEffect, useState } from 'react';
import { SHOPIFY_CONFIG } from '../config/shopify';

// Type definitions for Shopify Buy Button SDK
declare global {
  interface Window {
    ShopifyBuy?: {
      buildClient: (config: { domain: string; storefrontAccessToken: string }) => any;
    };
  }
}

interface ShopifyImage {
  src: string;
  altText?: string;
}

interface ShopifyProductData {
  id: string;
  title: string;
  images: ShopifyImage[];
  description: string;
}

interface UseShopifyProductResult {
  product: ShopifyProductData | null;
  images: string[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch Shopify product data including images
 * Uses the Shopify Buy SDK to fetch product information
 */
export const useShopifyProduct = (productId: string): UseShopifyProductResult => {
  const [product, setProduct] = useState<ShopifyProductData | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadShopifySDK = () => {
      // Check if SDK is already loaded
      if (window.ShopifyBuy) {
        fetchProduct();
      } else {
        loadScript();
      }
    };

    const loadScript = () => {
      // Check if script is already in DOM
      const existingScript = document.querySelector('script[src*="buy-button-storefront"]');

      if (existingScript) {
        existingScript.addEventListener('load', fetchProduct);
        return;
      }

      const script = document.createElement('script');
      script.async = true;
      script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
      script.onload = fetchProduct;
      script.onerror = () => {
        if (isMounted) {
          setError('Failed to load Shopify SDK');
          setIsLoading(false);
        }
      };

      const head = document.getElementsByTagName('head')[0];
      const body = document.getElementsByTagName('body')[0];
      (head || body).appendChild(script);
    };

    const fetchProduct = async () => {
      try {
        if (!window.ShopifyBuy) {
          throw new Error('ShopifyBuy not available');
        }

        const client = window.ShopifyBuy.buildClient({
          domain: SHOPIFY_CONFIG.domain,
          storefrontAccessToken: SHOPIFY_CONFIG.storefrontAccessToken,
        });

        // Convert numeric ID to GraphQL ID format if needed
        const graphqlId = productId.startsWith('gid://')
          ? productId
          : `gid://shopify/Product/${productId}`;

        console.log('[useShopifyProduct] Fetching product:', productId, '→', graphqlId);

        // Fetch product by ID
        const fetchedProduct = await client.product.fetch(graphqlId);

        console.log('[useShopifyProduct] Fetched product:', fetchedProduct);

        if (!isMounted) return;

        if (fetchedProduct) {
          console.log('[useShopifyProduct] Product images:', fetchedProduct.images);

          const productData: ShopifyProductData = {
            id: fetchedProduct.id,
            title: fetchedProduct.title,
            description: fetchedProduct.description,
            images: fetchedProduct.images.map((img: any) => ({
              src: img.src,
              altText: img.altText,
            })),
          };

          const imageUrls = fetchedProduct.images.map((img: any) => img.src);
          console.log('[useShopifyProduct] Image URLs:', imageUrls);

          setProduct(productData);
          setImages(imageUrls);
          setIsLoading(false);
        } else {
          throw new Error('Product not found');
        }
      } catch (err) {
        console.error('[useShopifyProduct] Error fetching product:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch product');
          setIsLoading(false);
        }
      }
    };

    loadShopifySDK();

    return () => {
      isMounted = false;
    };
  }, [productId]);

  return { product, images, isLoading, error };
};
