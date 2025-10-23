# E-Commerce Frontend Setup Guide

## ✅ What's Been Built

A complete e-commerce frontend integrated with Shopify Buy Button SDK for your Terracotta artisan products store.

### Key Features
- ✨ Shopify Buy Button SDK integration (no manual script tags!)
- 🛒 Shopping cart functionality (handled by Shopify)
- 💳 Checkout flow (redirects to Shopify secure checkout)
- 🎨 Custom terracotta-themed design
- 📱 Fully responsive layout
- 🇲🇽 Spanish language interface
- ⚡ Fast Vite development server

## 🚀 Getting Started

### 1. Install Dependencies

From the project root:
```bash
cd ecommerce-frontend
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Or from the root directory:
```bash
npm run dev:ecommerce
```

The app will be available at: **http://localhost:5174**

### 3. Run All Apps Together (Optional)

To run the task manager + e-commerce together:
```bash
npm run dev:all
```

This starts:
- Backend: http://localhost:5000
- Task Manager Frontend: http://localhost:5173
- E-commerce Frontend: http://localhost:5174

## 📁 Project Structure

```
ecommerce-frontend/
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Navigation header
│   │   ├── Footer.tsx              # Footer with info
│   │   └── ShopifyProduct.tsx      # Reusable product component
│   ├── config/
│   │   └── shopify.ts              # Shopify configuration & styling
│   ├── hooks/
│   │   └── useShopifyBuyButton.ts  # Hook for SDK integration
│   ├── pages/
│   │   ├── Home.tsx                # Landing page
│   │   └── Products.tsx            # Product catalog
│   ├── App.tsx                     # Main app with routing
│   ├── main.tsx                    # Entry point
│   └── index.css                   # Global styles + Tailwind
├── .env.local                      # Environment variables (already configured)
├── index.html
├── package.json
└── vite.config.ts
```

## 🛍️ How It Works

### Shopify Integration Architecture

```
┌─────────────────────────────────────────┐
│   E-Commerce Frontend (React)           │
│   - Displays products                   │
│   - Shopify Buy Button SDK embedded     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Shopify Buy Button SDK                │
│   - Loads product data                  │
│   - Manages cart state                  │
│   - Renders "Add to Cart" buttons       │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Shopify Hosted Checkout               │
│   - Secure payment processing           │
│   - Delivery information                │
│   - Order confirmation                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│   Shopify Webhooks (Future)             │
│   - Sends order data to your backend    │
│   - POST /api/shopify/webhooks/orders   │
└─────────────────────────────────────────┘
```

### Current Product Configuration

Your product from the Shopify code is already configured:
- **Product ID**: `8299395809420`
- **Domain**: `terracotta-terracotta.myshopify.com`
- **Access Token**: Configured in `.env.local`

## 📝 Adding More Products

### Step 1: Get Product ID from Shopify
1. Go to your Shopify Admin
2. Navigate to Products
3. Click on a product
4. Get the Buy Button code or find the product ID

### Step 2: Add to Products Page

Edit `src/pages/Products.tsx`:

```typescript
const productIds = [
  '8299395809420', // Existing product
  'YOUR_NEW_PRODUCT_ID', // Add here
  'ANOTHER_PRODUCT_ID', // And here
];
```

That's it! The `ShopifyProduct` component handles the rest.

## 🎨 Customization

### Change Colors

Edit `tailwind.config.js` to modify the terracotta color palette:

```javascript
terracotta: {
  600: '#a18072', // Primary color
  700: '#977669', // Darker shade
  // ... etc
}
```

### Modify Shopify Button Styles

Edit `src/config/shopify.ts` - the `SHOPIFY_UI_OPTIONS` object contains all styling:

```typescript
button: {
  'background-color': '#999999', // Change button color
  'border-radius': '6px',        // Change button roundness
  // ... etc
}
```

### Change Text/Language

All Spanish text can be modified in:
- `src/config/shopify.ts` - Cart and button text
- `src/pages/Home.tsx` - Homepage content
- `src/pages/Products.tsx` - Product page content

## 🔧 Environment Variables

Located in `.env.local` (already configured):

```
VITE_SHOPIFY_DOMAIN=terracotta-terracotta.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=8257db8788d371eaa8cd1632df42b5fa
```

**Note**: These are already set based on your Shopify code. Only change if you switch stores.

## 🚢 Building for Production

```bash
npm run build
```

Output will be in `dist/` directory, ready to deploy to:
- Vercel
- Netlify
- GitHub Pages
- Any static hosting service

## 📊 Next Steps: Backend Integration

To capture order data in your own backend:

1. **Create Shopify Webhook in Shopify Admin**
   - Go to Settings → Notifications → Webhooks
   - Create webhook for "Order creation"
   - Point to: `https://yourdomain.com/api/shopify/webhooks/orders`

2. **We'll add backend endpoint** (next phase):
   - Create `shopify_orders` table in PostgreSQL
   - Build webhook handler to receive order data
   - Store customer info, items, totals in your database

## 🆘 Troubleshooting

### Products not loading?
- Check console for errors
- Verify product ID is correct
- Ensure Shopify token has proper permissions

### Styles look broken?
- Run `npm install` to ensure Tailwind is installed
- Check that `index.css` imports Tailwind directives

### Cart not working?
- Cart is managed by Shopify SDK
- Ensure SDK loaded successfully (check network tab)

## 📚 Documentation Links

- [Shopify Buy Button SDK Docs](https://shopify.dev/docs/custom-storefronts/building-with-the-storefront-api/getting-started)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Documentation](https://react.dev/)
