import React from 'react';
import { ImageCarousel } from './ImageCarousel';
import { ShopifyProduct } from './ShopifyProduct';

interface ProductCardProps {
  productId: string;
  images: string[];
  productName?: string;
  className?: string;
}

/**
 * Product Card Component
 * Combines custom image carousel with Shopify Buy Button
 * Carousel and button are independent - no layout conflicts
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  productId,
  images,
  productName = 'Product',
  className = ''
}) => {
  return (
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

      {/* Shopify Buy Button - Bottom Section */}
      <div className="p-6">
        <ShopifyProduct
          productId={productId}
          className="w-full"
        />
      </div>
    </div>
  );
};
