import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { ImageCarousel } from './ImageCarousel';
import { ShopifyProduct } from './ShopifyProduct';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  images: string[];
  description: string;
}

/**
 * Full-screen modal for product details
 * Shows large carousel, description, and Shopify buy button
 * Closes on backdrop click, X button, or ESC key
 */
export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productId,
  productName,
  images,
  description,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      // Restore body scroll
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        {/* Close Button - Fixed Position */}
        <button
          onClick={onClose}
          className="fixed top-4 right-4 z-50 bg-white rounded-full p-3 shadow-2xl hover:bg-gray-100 transition-colors border border-gray-200"
          aria-label="Close modal"
        >
          <X className="w-6 h-6 text-gray-600" />
        </button>

        {/* Modal Content */}
        <div
          className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >

          {/* Modal Body */}
          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column - Carousel */}
              <div>
                <ImageCarousel
                  images={images}
                  alt={productName}
                  className="sticky top-0"
                />
              </div>

              {/* Right Column - Details */}
              <div className="space-y-6">
                {/* Product Title */}
                <div>
                  <h2 className="text-3xl font-bold text-terracotta-900 mb-2">
                    {productName}
                  </h2>
                </div>

                {/* Description */}
                <div className="prose prose-sm max-w-none">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Descripción
                  </h3>
                  <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {description}
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200" />

                {/* Shopify Buy Button Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Opciones de Compra
                  </h3>
                  <ShopifyProduct
                    productId={productId}
                    instanceId="modal"
                    className="w-full"
                  />
                </div>

                {/* Product Info */}
                <div className="bg-terracotta-50 rounded-lg p-4 text-sm text-gray-700">
                  <p className="font-semibold mb-2">Información del Producto:</p>
                  <ul className="space-y-1">
                    <li>• Productos artesanales hechos a mano</li>
                    <li>• Pueden variar en tonos y forma</li>
                    <li>• Envío a toda la República Mexicana</li>
                    <li>• Pago seguro procesado por Shopify</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
