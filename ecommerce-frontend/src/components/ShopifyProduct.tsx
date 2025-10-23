import { useShopifyBuyButton } from '../hooks/useShopifyBuyButton';

interface ShopifyProductProps {
  productId: string;
  instanceId?: string;  // Unique identifier for this instance (e.g., 'card' or 'modal')
  className?: string;
}

/**
 * Reusable component for displaying a Shopify product with Buy Button
 * Automatically handles SDK initialization and product rendering
 * instanceId ensures unique containers when same product appears multiple times
 */
export const ShopifyProduct: React.FC<ShopifyProductProps> = ({
  productId,
  instanceId = 'default',
  className = ''
}) => {
  const containerId = `shopify-product-${productId}-${instanceId}`;
  const { isLoading, error } = useShopifyBuyButton({ productId, containerId });

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
        <p className="text-red-800 font-medium">Error al cargar el producto</p>
        <p className="text-red-600 text-sm mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="flex flex-col items-center space-y-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-terracotta-600"></div>
            <p className="text-terracotta-700 font-medium">Cargando producto...</p>
          </div>
        </div>
      )}
      <div id={containerId} className="shopify-product-container" />
    </div>
  );
};
