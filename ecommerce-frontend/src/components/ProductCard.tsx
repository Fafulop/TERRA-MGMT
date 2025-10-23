import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { ShopifyProduct } from './ShopifyProduct';
import { ProductModal } from './ProductModal';

interface ProductCardProps {
  productId: string;
  images: string[];
  productName?: string;
  description?: string;
  className?: string;
}

/**
 * Product Card Component
 * Combines custom image carousel with Shopify Buy Button
 * Includes "Ver Detalles" button that opens modal with full description
 * Carousel and button are independent - no layout conflicts
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  images,
  productName = 'Product',
  description = '',
  className = ''
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className={`bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 ${className}`}>
        {/* Custom Image Carousel - Top Section */}
        <div className="p-4">
          <ImageCarousel
            images={images}
            alt={productName}
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Product Info & Actions - Bottom Section */}
        <div className="p-6 space-y-4">
          {/* Ver Detalles Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-terracotta-100 hover:bg-terracotta-200 text-terracotta-900 font-medium rounded-lg transition-colors duration-200"
          >
            <Info className="w-4 h-4" />
            Ver Detalles
          </button>

          {/* Shopify Buy Button */}
          <ShopifyProduct
            productId={productId}
            instanceId="card"
            className="w-full"
          />
        </div>
      </div>

      {/* Product Details Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productId={productId}
        productName={productName}
        images={images}
        description={description}
      />
    </>
  );
};
