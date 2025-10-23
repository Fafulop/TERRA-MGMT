# Shopify Buy Button Integration Guide

Complete guide for managing and customizing Shopify Buy Buttons in the Terracotta e-commerce frontend.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Adding New Products](#adding-new-products)
4. [⚠️ IMPORTANT: Extracting Product IDs from Shopify Code](#important-extracting-product-ids-from-shopify-code)
5. [Product Variants (Colors, Sizes, etc.)](#product-variants)
6. [Customization Options](#customization-options)
7. [Configuration Reference](#configuration-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

This e-commerce frontend uses **Shopify Buy Button JS** to embed products from your Shopify store. The implementation provides:

- Automatic product display with images, prices, and descriptions
- Variant selection (colors, sizes, etc.)
- Shared shopping cart across all products
- Secure Shopify-hosted checkout
- Spanish language support
- Terracotta-themed styling

**Key Files:**
- `src/config/shopify.ts` - Configuration and styling
- `src/hooks/useShopifyBuyButton.ts` - SDK integration logic
- `src/components/ShopifyProduct.tsx` - Reusable product component
- `src/pages/Products.tsx` - Product listing page

---

## How It Works

### Architecture

```
┌─────────────────────────────────────────┐
│  Products.tsx                            │
│  ├─ Array of Product IDs                │
│  └─ Maps to ShopifyProduct components   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  ShopifyProduct.tsx                      │
│  ├─ Receives productId prop             │
│  ├─ Uses useShopifyBuyButton hook       │
│  └─ Renders container for Shopify UI    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  useShopifyBuyButton.ts                  │
│  ├─ Loads Shopify SDK dynamically       │
│  ├─ Initializes client                  │
│  ├─ Creates product component           │
│  └─ Applies configuration from config   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  shopify.ts                              │
│  ├─ Store credentials                   │
│  ├─ UI styling options                  │
│  ├─ Spanish translations                │
│  └─ Cart configuration                  │
└─────────────────────────────────────────┘
```

### SDK Loading Process

1. Component mounts and calls `useShopifyBuyButton` hook
2. Hook checks if Shopify SDK is already loaded
3. If not, dynamically injects script tag to load SDK
4. Once loaded, initializes client with store credentials
5. Creates product component with configuration
6. Shopify renders product UI in the container

### Shared Cart

All products share **one global shopping cart**:
- Adding items from Product A and Product B puts them in the same cart
- Cart state is managed by Shopify SDK
- Cart persists across page navigation
- Checkout processes all items together

---

## Adding New Products

### Step 1: Get Product ID from Shopify

1. Log in to your Shopify Admin
2. Go to **Products**
3. Click on the product you want to add
4. Look at the URL: `admin.shopify.com/store/YOUR-STORE/products/PRODUCT_ID`
5. Copy the **PRODUCT_ID** (e.g., `8299447058572`)

### Step 2: Add to Products Array

Edit `src/pages/Products.tsx`:

```typescript
const productIds = [
  '8299395809420', // Existing product
  '8299447058572', // New product - ADD HERE
  'YOUR_NEW_PRODUCT_ID', // Add as many as needed
];
```

### Step 3: Test

```bash
npm run dev
```

Visit `http://localhost:5174/products` to see your products.

**That's it!** The component automatically:
- Fetches product data from Shopify
- Displays images, title, price, description
- Handles variants (if configured in Shopify)
- Adds to shared cart

---

## ⚠️ IMPORTANT: Extracting Product IDs from Shopify Code

### When You Receive Shopify Buy Button Code

When you generate a Buy Button from Shopify Admin, you'll get a large block of code like this:

```html
<div id='product-component-1761250993109'></div>
<script type="text/javascript">
(function () {
  var client = ShopifyBuy.buildClient({
    domain: 'terracotta-terracotta.myshopify.com',
    storefrontAccessToken: '8257db8788d371eaa8cd1632df42b5fa',
  });
  ShopifyBuy.UI.onReady(client).then(function (ui) {
    ui.createComponent('product', {
      id: '8299447058572',  // ← THIS IS WHAT YOU NEED
      node: document.getElementById('product-component-1761250993109'),
      moneyFormat: '%24%20%7B%7Bamount%7D%7D',
      options: {
        "product": { /* 100+ lines of styling */ },
        "cart": { /* 50+ lines of cart config */ },
        "toggle": { /* more config */ }
      }
    });
  });
})();
</script>
```

### ⚠️ DO NOT Copy the Entire Code Block!

**❌ WRONG APPROACH:**
- Copying all the cart configuration
- Duplicating styling options
- Creating separate cart instances

**✅ CORRECT APPROACH:**
Extract **ONLY** the product ID and add it to your array.

### Step-by-Step: Extract Product ID Only

1. **Locate the Product ID**
   Look for this line in the Shopify code:
   ```javascript
   id: '8299447058572',  // ← PRODUCT ID
   ```

2. **Copy Only the ID Number**
   - Just the numeric string: `'8299447058572'`
   - Ignore everything else in the code block

3. **Add to Products Array**
   ```typescript
   // src/pages/Products.tsx
   const productIds = [
     '8299395809420',
     '8299447058572', // ← NEW PRODUCT ID ONLY
   ];
   ```

4. **Done!**
   - Do NOT copy the cart config
   - Do NOT copy the styling options
   - Do NOT copy the domain/token (already in config)

### Why This Matters

**Our implementation uses a SHARED CART:**

```
┌─────────────┐
│  Product 1  │──┐
└─────────────┘  │
                 ├──→ ┌──────────────┐
┌─────────────┐  │    │  SHARED CART │
│  Product 2  │──┘    └──────────────┘
└─────────────┘
```

**If you duplicate cart configuration:**
- ❌ Multiple cart instances created
- ❌ Products can't share the same cart
- ❌ Checkout breaks or shows multiple carts
- ❌ Conflicting styling and behavior

**With our centralized config:**
- ✅ ONE cart shared by all products
- ✅ ONE checkout for all items
- ✅ Consistent styling across all products
- ✅ Easy to update cart settings in one place

### What's Already Configured

Everything from the Shopify code is already in `src/config/shopify.ts`:

| Shopify Code Section | Our Config Location |
|---------------------|---------------------|
| `domain` | `SHOPIFY_CONFIG.domain` |
| `storefrontAccessToken` | `SHOPIFY_CONFIG.storefrontAccessToken` |
| `moneyFormat` | `MONEY_FORMAT` |
| `options.product` | `SHOPIFY_UI_OPTIONS.product` |
| `options.cart` | `SHOPIFY_UI_OPTIONS.cart` |
| `options.toggle` | `SHOPIFY_UI_OPTIONS.toggle` |
| `options.modalProduct` | `SHOPIFY_UI_OPTIONS.modalProduct` |

**You only need the product ID because everything else is already set up!**

### Example: Correct vs Incorrect

**❌ INCORRECT (duplicating everything):**
```typescript
// DON'T DO THIS
ui.createComponent('product', {
  id: '8299447058572',
  options: {
    cart: {
      text: {
        title: 'Carrito de Compras', // Already in config!
        button: 'Proceder al Pago',   // Already in config!
      }
    }
  }
});
```

**✅ CORRECT (using shared config):**
```typescript
// In src/pages/Products.tsx
const productIds = [
  '8299395809420',
  '8299447058572', // Just add the ID
];

// The ShopifyProduct component automatically uses
// the shared config from src/config/shopify.ts
```

### Future Reference Checklist

When adding products in the future:

- [ ] Get Shopify Buy Button code
- [ ] Find the `id: 'XXXXXXXXXX'` line
- [ ] Copy ONLY the product ID number
- [ ] Add to `productIds` array in `Products.tsx`
- [ ] Ignore all cart/styling config in Shopify code
- [ ] Test that product appears with shared cart

### Summary

**Remember:** Our architecture centralizes all configuration in `src/config/shopify.ts`. When you receive Shopify Buy Button code, you're only looking for the **product ID** - everything else is already configured and shared across all products.

---

## Product Variants

### What Are Variants?

Variants are different versions of the same product:
- **Colors**: Negro, Blanco, Azul, Rojo
- **Sizes**: Chico, Mediano, Grande
- **Materials**: Cerámica, Terracota
- **Custom options**: Any option you configure in Shopify

### How Variants Display

With the current configuration:

1. **Variant Selector Dropdown**
   - Label showing option name (e.g., "Color:")
   - Dropdown with all available options
   - Styled with clear borders and padding

2. **Variant Title Display**
   - Shows currently selected variant (e.g., "Negro")
   - Displayed in bold near product info
   - Updates when customer changes selection

3. **Single "Añadir al Carrito" Button**
   - One button per product
   - Adds the currently selected variant to cart
   - Button is always active (no multiple buttons per variant)

### Configuration for Variants

In `src/config/shopify.ts`:

```typescript
contents: {
  variantTitle: true,  // ✅ Shows selected variant name
  options: true,       // ✅ Shows variant selector dropdown
},
```

**Styling Options:**

```typescript
styles: {
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
  },
  optionSelect: {
    'font-size': '15px',
    'padding': '8px 12px',
    'border': '1px solid #ccc',
    'border-radius': '4px',
  },
}
```

### Creating Variants in Shopify

1. Go to Shopify Admin → Products → [Your Product]
2. Scroll to **Variants** section
3. Click "Add variant"
4. Add option name (e.g., "Color") and values (e.g., "Negro", "Blanco")
5. Set price, SKU, inventory for each variant
6. Save product

The Buy Button automatically detects and displays these variants!

---

## Customization Options

### Available Content Options

Control which elements appear:

```typescript
contents: {
  img: false,              // Static image
  imgWithCarousel: true,   // Image carousel (multiple images)
  title: true,             // Product title
  variantTitle: true,      // Selected variant name
  price: true,             // Product price
  compareAt: true,         // Compare at price (sale)
  unitPrice: true,         // Unit pricing
  description: true,       // Product description
  button: true,            // Add to cart button
  quantity: true,          // Quantity selector
  quantityIncrement: true, // + button
  quantityDecrement: true, // - button
  quantityInput: true,     // Manual quantity input
  options: true,           // Variant selectors
}
```

### Text Customization

Change button and cart text:

```typescript
text: {
  button: 'añadir al carrito',  // "Add to cart" button
  outOfStock: 'Agotado',        // Out of stock message
  unavailable: 'No disponible', // Unavailable message
}
```

**Cart Text:**

```typescript
cart: {
  text: {
    title: 'Carrito de Compras',
    total: 'Subtotal',
    empty: 'Tu carrito está vacío.',
    notice: 'Los productos son artesanales y pueden variar en tonos y forma.\nLos precios están en MXN.',
    button: 'Proceder al Pago',
  }
}
```

### Styling Options

All styles use CSS properties in JavaScript object format:

```typescript
styles: {
  product: {
    'max-width': '100%',
    'text-align': 'left',
  },
  title: {
    'font-size': '26px',
    'color': '#333',
  },
  button: {
    'background-color': '#999999',
    ':hover': {
      'background-color': '#8a8a8a',
    },
    'border-radius': '6px',
    'padding': '12px 24px',
  },
}
```

### Layout Options

Change product display layout:

```typescript
layout: 'horizontal',  // Product info next to image
// OR
layout: 'vertical',    // Product info below image
```

### Product Width

```typescript
width: '100%',        // Full container width
// OR
width: '500px',       // Fixed width
```

---

## Configuration Reference

### Environment Variables

Create `.env.local`:

```env
VITE_SHOPIFY_DOMAIN=your-store.myshopify.com
VITE_SHOPIFY_STOREFRONT_TOKEN=your-storefront-access-token
```

**Where to find these:**

1. Shopify Admin → Apps → Develop apps
2. Create a custom app (if not already created)
3. Configure **Storefront API** scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
4. Install app
5. Copy **Storefront access token**
6. Domain is your store URL

### Money Format

Currency display format (URL encoded):

```typescript
MONEY_FORMAT = '%24%20%7B%7Bamount%7D%7D'
// Decodes to: "$ {{amount}}"
```

**Common formats:**
- `'${{amount}}'` - US Dollar: $10.00
- `'{{amount}} MXN'` - Mexican Peso: 200.00 MXN
- `'€{{amount}}'` - Euro: €10.00

### Cart Configuration

```typescript
cart: {
  popup: false,  // false = side drawer, true = popup modal
  styles: {
    button: { /* checkout button styles */ },
  },
  text: {
    title: 'Carrito de Compras',
    total: 'Subtotal',
    button: 'Proceder al Pago',
  }
}
```

### Toggle Button

The floating cart icon:

```typescript
toggle: {
  styles: {
    toggle: {
      'background-color': '#999999',
      ':hover': {
        'background-color': '#8a8a8a',
      }
    }
  }
}
```

---

## Troubleshooting

### Products Not Displaying

**Issue**: Empty container or loading spinner forever

**Solutions:**

1. **Check Product ID**
   - Verify ID is correct (numeric string)
   - Product must be published in "Online Store" channel

2. **Check Storefront Access Token**
   - Token must have correct permissions
   - Verify token in `.env.local`

3. **Check Browser Console**
   ```javascript
   // Open DevTools (F12) → Console
   // Look for errors starting with "ShopifyBuy"
   ```

4. **Verify Product Channel**
   - Shopify Admin → Products → [Product]
   - Under "Product availability"
   - Make sure "Online Store" is checked

### Cart Not Opening

**Issue**: Click cart icon, nothing happens

**Solutions:**

1. **Check SDK Load**
   ```javascript
   console.log(window.ShopifyBuy) // Should show object
   ```

2. **Check Configuration**
   - Verify `cart: { popup: false }` is set
   - Check for JavaScript errors in console

3. **Clear Cart**
   ```javascript
   // In console:
   localStorage.clear()
   location.reload()
   ```

### Variants Not Showing

**Issue**: No color/size selector appears

**Solutions:**

1. **Enable in Config**
   ```typescript
   contents: {
     options: true,       // Must be true
     variantTitle: true,  // Shows selected variant
   }
   ```

2. **Check Shopify Product**
   - Product must have variants configured
   - Variants must be published
   - At least 2 variants needed for selector

3. **Verify Product Has Variants**
   - Shopify Admin → Products → [Product]
   - Look for "Variants" section
   - Should show multiple options

### Spanish Text Not Appearing

**Issue**: Text still in English

**Solutions:**

1. **Check Configuration**
   ```typescript
   text: {
     button: 'añadir al carrito',  // Spanish
   }
   ```

2. **Clear Browser Cache**
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear localStorage and reload

3. **Verify All Text Objects**
   - Check `product.text`
   - Check `cart.text`
   - Check `modalProduct.text`

### Styling Not Applied

**Issue**: Buttons/text don't match your styles

**Solutions:**

1. **Check CSS Property Names**
   ```typescript
   // ✅ Correct
   'background-color': '#999999'

   // ❌ Wrong
   backgroundColor: '#999999'
   ```

2. **Check Nested Structure**
   ```typescript
   styles: {
     button: {        // Element name
       'color': 'red' // CSS property
     }
   }
   ```

3. **Use Browser DevTools**
   - Inspect Buy Button iframe
   - Check if styles are applied
   - Look for CSS conflicts

### Cart Shows Wrong Currency

**Issue**: Prices showing in USD instead of MXN

**Solutions:**

1. **Check Shopify Store Settings**
   - Shopify Admin → Settings → Store details
   - Store currency should be MXN

2. **Update Money Format**
   ```typescript
   moneyFormat: '%24%20%7B%7Bamount%7D%7D'
   ```

3. **Verify Product Prices**
   - Check prices are set in correct currency
   - Update products in Shopify if needed

---

## Advanced: Direct SDK Usage

If you need more control, you can bypass the component and use the SDK directly:

```typescript
// Load SDK
const script = document.createElement('script');
script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
document.head.appendChild(script);

script.onload = () => {
  const client = ShopifyBuy.buildClient({
    domain: 'your-store.myshopify.com',
    storefrontAccessToken: 'your-token',
  });

  ShopifyBuy.UI.onReady(client).then((ui) => {
    ui.createComponent('product', {
      id: '8299447058572',
      node: document.getElementById('product-container'),
      moneyFormat: '%24%20%7B%7Bamount%7D%7D',
      options: {
        // Your configuration here
      }
    });
  });
};
```

---

## Additional Resources

- **Official Documentation**: https://shopify.github.io/buy-button-js/
- **GitHub Repository**: https://github.com/Shopify/buy-button-js
- **Shopify Dev Docs**: https://shopify.dev/docs/storefronts/headless/additional-sdks/buy-button
- **Customization Guide**: https://github.com/Shopify/buy-button-js/blob/main/docs/customization/index.md

---

## Summary: Quick Reference

### Add a Product
```typescript
// src/pages/Products.tsx
const productIds = ['8299395809420', 'NEW_ID_HERE'];
```

### Change Button Text
```typescript
// src/config/shopify.ts
text: { button: 'Comprar Ahora' }
```

### Show/Hide Elements
```typescript
contents: {
  description: true,   // Show description
  quantity: false,     // Hide quantity selector
}
```

### Style Elements
```typescript
styles: {
  button: {
    'background-color': '#ff0000',
    'font-size': '18px',
  }
}
```

### Enable Variants
```typescript
contents: {
  options: true,        // Show variant selector
  variantTitle: true,   // Show selected variant
}
```

---

**Last Updated**: October 2025
**Version**: 1.0.0
