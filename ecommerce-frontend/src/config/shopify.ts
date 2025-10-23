// Shopify Buy Button SDK Configuration
// This file contains the configuration for integrating with Shopify's storefront

export const SHOPIFY_CONFIG = {
  domain: import.meta.env.VITE_SHOPIFY_DOMAIN || 'terracotta-terracotta.myshopify.com',
  storefrontAccessToken: import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || '8257db8788d371eaa8cd1632df42b5fa',
};

// Shopify UI Component Options - matching the provided code
export const SHOPIFY_UI_OPTIONS = {
  product: {
    styles: {
      product: {
        '@media (min-width: 601px)': {
          'max-width': '100%',
          'margin-left': '0',
          'margin-bottom': '50px',
        },
        'text-align': 'left',
      },
      title: {
        'font-size': '26px',
      },
      button: {
        ':hover': {
          'background-color': '#8a8a8a',
        },
        'background-color': '#999999',
        ':focus': {
          'background-color': '#8a8a8a',
        },
        'border-radius': '6px',
        'padding-left': '24px',
        'padding-right': '24px',
      },
      price: {
        'font-size': '18px',
      },
      compareAt: {
        'font-size': '15.3px',
      },
      unitPrice: {
        'font-size': '15.3px',
      },
      variantTitle: {
        'font-size': '18px',
        'font-weight': 'bold',
        'color': '#4c4c4c',
        'margin-top': '10px',
        'margin-bottom': '10px',
      },
      option: {
        'margin-bottom': '15px',
      },
      optionLabel: {
        'font-size': '16px',
        'font-weight': '600',
        'color': '#333',
        'margin-bottom': '8px',
      },
      optionSelect: {
        'font-size': '15px',
        'padding': '8px 12px',
        'border': '1px solid #ccc',
        'border-radius': '4px',
      },
    },
    layout: 'vertical',
    contents: {
      img: false,          // Hide images - using custom carousel instead
      imgWithCarousel: false,  // Hide Shopify carousel
      description: false,  // Hide description (keep it clean)
      variantTitle: true,  // Show the selected variant name (e.g., color)
      options: true,       // Show variant selector
      button: true,        // Show ONE "añadir al carrito" button
      buttonWithQuantity: false,  // Don't show button with quantity controls
      quantity: false,     // Don't show quantity selector separately
    },
    width: '100%',
    text: {
      button: 'añadir al carrito',
    },
  },
  productSet: {
    styles: {
      products: {
        '@media (min-width: 601px)': {
          'margin-left': '-20px',
        },
      },
    },
  },
  modalProduct: {
    contents: {
      img: false,
      imgWithCarousel: true,
      button: false,
      buttonWithQuantity: true,
    },
    styles: {
      product: {
        '@media (min-width: 601px)': {
          'max-width': '100%',
          'margin-left': '0px',
          'margin-bottom': '0px',
        },
      },
      button: {
        ':hover': {
          'background-color': '#8a8a8a',
        },
        'background-color': '#999999',
        ':focus': {
          'background-color': '#8a8a8a',
        },
        'border-radius': '6px',
        'padding-left': '24px',
        'padding-right': '24px',
      },
      title: {
        'font-family': 'Helvetica Neue, sans-serif',
        'font-weight': 'bold',
        'font-size': '26px',
        color: '#4c4c4c',
      },
      price: {
        'font-family': 'Helvetica Neue, sans-serif',
        'font-weight': 'normal',
        'font-size': '18px',
        color: '#4c4c4c',
      },
      compareAt: {
        'font-family': 'Helvetica Neue, sans-serif',
        'font-weight': 'normal',
        'font-size': '15.3px',
        color: '#4c4c4c',
      },
      unitPrice: {
        'font-family': 'Helvetica Neue, sans-serif',
        'font-weight': 'normal',
        'font-size': '15.3px',
        color: '#4c4c4c',
      },
    },
    text: {
      button: 'Add to cart',
    },
  },
  option: {},
  cart: {
    styles: {
      button: {
        ':hover': {
          'background-color': '#8a8a8a',
        },
        'background-color': '#999999',
        ':focus': {
          'background-color': '#8a8a8a',
        },
        'border-radius': '6px',
      },
    },
    text: {
      title: 'Carrito de Compras',
      total: 'Subtotal',
      empty: 'Tu carrito está vacío.',
      notice: 'Los productos son artesanales y pueden variar en tonos y forma.\nLos precios están en MXN.',
      button: 'Proceder al Pago',
    },
    popup: false,
  },
  toggle: {
    styles: {
      toggle: {
        'background-color': '#999999',
        ':hover': {
          'background-color': '#8a8a8a',
        },
        ':focus': {
          'background-color': '#8a8a8a',
        },
      },
    },
  },
};

// Money format configuration
export const MONEY_FORMAT = '%24%20%7B%7Bamount%7D%7D';
