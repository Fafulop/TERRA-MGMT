# Terracotta E-Commerce Frontend

E-commerce frontend for Terracotta artisan products, integrated with Shopify Buy Button SDK.

## Features

- 🛍️ Shopify Buy Button integration
- 🎨 Custom terracotta-themed design with Tailwind CSS
- 📱 Fully responsive
- 🇲🇽 Spanish language support
- ⚡ Built with Vite + React + TypeScript

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Copy `.env.example` to `.env.local` and update with your Shopify credentials:
```
VITE_SHOPIFY_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your-storefront-access-token
```

3. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5174`

## Project Structure

```
ecommerce-frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ShopifyProduct.tsx
│   ├── config/           # Configuration files
│   │   └── shopify.ts    # Shopify SDK configuration
│   ├── hooks/            # Custom React hooks
│   │   └── useShopifyBuyButton.ts
│   ├── pages/            # Page components
│   │   ├── Home.tsx
│   │   └── Products.tsx
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── index.html           # HTML template
└── package.json         # Dependencies
```

## Adding Products

To add more products to the catalog:

1. Get the product ID from your Shopify admin
2. Add the ID to the `productIds` array in `src/pages/Products.tsx`:

```typescript
const productIds = [
  '8299395809420', // Existing product
  'YOUR_NEW_PRODUCT_ID', // New product
];
```

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Customization

### Colors
Terracotta color palette is defined in `tailwind.config.js`. Modify the `terracotta` color values to match your brand.

### Shopify Styles
Shopify Buy Button styling is configured in `src/config/shopify.ts`. Adjust the `SHOPIFY_UI_OPTIONS` object to customize button colors, fonts, and layout.

## Technologies

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Shopify Buy Button SDK** - E-commerce functionality
