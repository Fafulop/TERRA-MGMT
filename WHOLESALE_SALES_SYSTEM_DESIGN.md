# Wholesale Sales System Design (Ventas Mayoreo)

## Overview
Complete sales workflow system for wholesale ceramic sales, from quote creation to order fulfillment.

---

## Business Workflow

### Phase 1: Quote Creation (Cotización)
1. **Seller creates quote**
   - Selects customer (from contacts)
   - Browses and adds products from `produccion_products` catalog
   - Sets quantities, unit prices, and discounts
   - Adds notes and terms
   - Saves as DRAFT

2. **Quote Management**
   - Can edit/update quote while in DRAFT
   - Can export quote to PDF
   - Can send quote to customer
   - Quote statuses: DRAFT → SENT → ACCEPTED/REJECTED/EXPIRED

### Phase 2: Order Creation (from accepted quote)
1. **Convert quote to order**
   - When quote is ACCEPTED
   - System checks inventory availability (ESMALTADO stage only)
   - Creates sales order
   - Reserves inventory

2. **Order Processing**
   - Order statuses: PENDING → CONFIRMED → IN_PREPARATION → READY_FOR_DELIVERY → DELIVERED → COMPLETED
   - Can track partial deliveries
   - Records payments
   - Updates inventory upon delivery

---

## Database Schema

### 1. Sales Quotes Table (ventas_quotes)
```sql
CREATE TABLE ventas_quotes (
  id SERIAL PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: Q-2024-0001
  customer_id INTEGER NOT NULL REFERENCES contacts(id),

  -- Quote Details
  status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    -- DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED_TO_ORDER

  valid_until DATE, -- Quote expiration date
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00, -- Overall discount
  discount_amount DECIMAL(10, 2) DEFAULT 0.00, -- Fixed discount amount

  -- Calculations (auto-calculated)
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00, -- IVA 16%
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Additional Info
  currency VARCHAR(3) DEFAULT 'MXN', -- MXN or USD
  notes TEXT,
  terms_and_conditions TEXT,
  internal_notes TEXT, -- Private notes for sellers

  -- Metadata
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_quotes_customer ON ventas_quotes(customer_id);
CREATE INDEX idx_ventas_quotes_status ON ventas_quotes(status);
CREATE INDEX idx_ventas_quotes_created_by ON ventas_quotes(created_by);
CREATE INDEX idx_ventas_quotes_quote_number ON ventas_quotes(quote_number);
CREATE INDEX idx_ventas_quotes_created_at ON ventas_quotes(created_at);
```

### 2. Quote Line Items (ventas_quote_items)
```sql
CREATE TABLE ventas_quote_items (
  id SERIAL PRIMARY KEY,
  quote_id INTEGER NOT NULL REFERENCES ventas_quotes(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id),

  -- Line Item Details
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL, -- Price per unit
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00, -- Item-level discount

  -- Auto-calculated fields
  subtotal DECIMAL(10, 2) NOT NULL, -- quantity * unit_price
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(10, 2) NOT NULL, -- subtotal - discount_amount

  -- Product snapshot (in case product details change later)
  product_name VARCHAR(255) NOT NULL,
  product_tipo VARCHAR(100),
  product_size VARCHAR(50),
  product_capacity VARCHAR(50),
  product_color VARCHAR(100),

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_quote_items_quote ON ventas_quote_items(quote_id);
CREATE INDEX idx_ventas_quote_items_product ON ventas_quote_items(product_id);
```

### 3. Sales Orders Table (ventas_orders)
```sql
CREATE TABLE ventas_orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL, -- Auto-generated: O-2024-0001
  quote_id INTEGER REFERENCES ventas_quotes(id), -- NULL if order created without quote
  customer_id INTEGER NOT NULL REFERENCES contacts(id),

  -- Order Status
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    -- PENDING, CONFIRMED, IN_PREPARATION, READY_FOR_DELIVERY,
    -- PARTIALLY_DELIVERED, DELIVERED, COMPLETED, CANCELLED

  -- Delivery Info
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(100),
  delivery_postal_code VARCHAR(20),
  delivery_contact_name VARCHAR(255),
  delivery_contact_phone VARCHAR(100),
  expected_delivery_date DATE,
  actual_delivery_date DATE,

  -- Financial Info
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  discount_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  tax_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  shipping_cost DECIMAL(10, 2) DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  amount_paid DECIMAL(10, 2) DEFAULT 0.00,
  amount_due DECIMAL(10, 2) DEFAULT 0.00,
  payment_status VARCHAR(50) DEFAULT 'PENDING', -- PENDING, PARTIAL, PAID, OVERDUE

  currency VARCHAR(3) DEFAULT 'MXN',

  -- Additional Info
  notes TEXT,
  internal_notes TEXT,

  -- Metadata
  created_by INTEGER NOT NULL REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_orders_customer ON ventas_orders(customer_id);
CREATE INDEX idx_ventas_orders_quote ON ventas_orders(quote_id);
CREATE INDEX idx_ventas_orders_status ON ventas_orders(status);
CREATE INDEX idx_ventas_orders_payment_status ON ventas_orders(payment_status);
CREATE INDEX idx_ventas_orders_created_by ON ventas_orders(created_by);
CREATE INDEX idx_ventas_orders_order_number ON ventas_orders(order_number);
```

### 4. Order Line Items (ventas_order_items)
```sql
CREATE TABLE ventas_order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES ventas_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES produccion_products(id),
  inventory_id INTEGER REFERENCES produccion_inventory(id), -- Link to specific inventory

  -- Line Item Details
  quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
  quantity_reserved INTEGER DEFAULT 0, -- Reserved from inventory
  quantity_delivered INTEGER DEFAULT 0, -- Actually delivered
  unit_price DECIMAL(10, 2) NOT NULL,
  discount_percentage DECIMAL(5, 2) DEFAULT 0.00,

  -- Calculated fields
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  line_total DECIMAL(10, 2) NOT NULL,

  -- Product snapshot
  product_name VARCHAR(255) NOT NULL,
  product_tipo VARCHAR(100),
  product_size VARCHAR(50),
  product_capacity VARCHAR(50),
  product_color VARCHAR(100),

  -- Inventory tracking
  esmalte_color_id INTEGER REFERENCES produccion_esmalte_color(id),

  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_order_items_order ON ventas_order_items(order_id);
CREATE INDEX idx_ventas_order_items_product ON ventas_order_items(product_id);
CREATE INDEX idx_ventas_order_items_inventory ON ventas_order_items(inventory_id);
```

### 5. Order Deliveries (ventas_deliveries)
```sql
CREATE TABLE ventas_deliveries (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES ventas_orders(id) ON DELETE CASCADE,
  delivery_number VARCHAR(50) UNIQUE NOT NULL, -- D-2024-0001

  delivery_date DATE NOT NULL,
  delivery_time TIME,

  -- Delivery details
  delivered_by VARCHAR(255), -- Driver/person name
  tracking_number VARCHAR(255),
  notes TEXT,

  -- Metadata
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_deliveries_order ON ventas_deliveries(order_id);
```

### 6. Delivery Line Items (ventas_delivery_items)
```sql
CREATE TABLE ventas_delivery_items (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER NOT NULL REFERENCES ventas_deliveries(id) ON DELETE CASCADE,
  order_item_id INTEGER NOT NULL REFERENCES ventas_order_items(id),

  quantity_delivered INTEGER NOT NULL CHECK (quantity_delivered > 0),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_delivery_items_delivery ON ventas_delivery_items(delivery_id);
CREATE INDEX idx_ventas_delivery_items_order_item ON ventas_delivery_items(order_item_id);
```

### 7. Payments (ventas_payments)
```sql
CREATE TABLE ventas_payments (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES ventas_orders(id) ON DELETE CASCADE,

  payment_date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'MXN',

  payment_method VARCHAR(50), -- CASH, TRANSFER, CHECK, CARD, etc.
  reference_number VARCHAR(255),

  notes TEXT,

  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_payments_order ON ventas_payments(order_id);
CREATE INDEX idx_ventas_payments_payment_date ON ventas_payments(payment_date);
```

### 8. Quote/Order History (ventas_status_history)
```sql
CREATE TABLE ventas_status_history (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(20) NOT NULL, -- 'QUOTE' or 'ORDER'
  entity_id INTEGER NOT NULL, -- quote_id or order_id

  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,

  notes TEXT,

  changed_by INTEGER NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ventas_status_history_entity ON ventas_status_history(entity_type, entity_id);
```

---

## Frontend Features

### Main Dashboard (Ventas Mayoreo Page)

#### Tabs:
1. **Cotizaciones (Quotes)**
   - List all quotes with filters (status, customer, date range)
   - Quick actions: View, Edit, PDF, Send, Accept, Reject
   - Status badges with colors

2. **Órdenes (Orders)**
   - List all orders with filters
   - Order status tracking
   - Quick actions: View, Process, Deliver, Invoice

3. **Clientes (Customers)**
   - Quick view of customers from contacts table (where contact_type = 'client')
   - Add new customer button → redirects to Contactos page

4. **Reportes (Reports)**
   - Sales by period
   - Top customers
   - Product sales performance
   - Pending orders/payments

### Quote Creation Workflow:

**Step 1: Customer Selection**
- Search/select from existing customers
- Quick add new customer button

**Step 2: Product Selection**
- Browse `produccion_products` catalog
- Filterable by: tipo, size, capacity, color
- Show product image (if available)
- Show base cost (optional)
- Set unit price (can differ from cost)
- Set quantity
- Add to quote

**Step 3: Quote Details**
- Set valid until date (default: 30 days)
- Add overall discount (% or fixed amount)
- Add notes/terms
- Review line items
- Calculate totals (subtotal, discount, tax, total)

**Step 4: Actions**
- Save as DRAFT
- Send to customer (mark as SENT, record sent_at)
- Export PDF (generate PDF with logo, quote details, terms)

### Order Creation Workflow:

**From Quote:**
1. Click "Convert to Order" on ACCEPTED quote
2. System checks inventory for ESMALTADO products
3. Shows availability status for each line item
4. Allows adjusting quantities if insufficient stock
5. Creates order and reserves inventory

**Direct Order (without quote):**
1. Similar to quote creation
2. Directly checks inventory availability
3. Creates order immediately

### Order Processing:

**Order Detail View:**
- Customer info
- Line items with availability status
- Delivery information form
- Payment tracking
- Status timeline
- Actions based on status:
  - PENDING → Confirm Order
  - CONFIRMED → Mark as In Preparation
  - IN_PREPARATION → Mark as Ready for Delivery
  - READY_FOR_DELIVERY → Create Delivery
  - DELIVERED → Mark as Completed

**Delivery Creation:**
- Select which items to deliver (supports partial delivery)
- Enter delivery details
- Records inventory movement (decreases ESMALTADO inventory)
- Updates order status

**Payment Recording:**
- Add payment with date, amount, method
- Auto-updates payment status (PENDING → PARTIAL → PAID)
- Shows payment history

---

## Backend API Endpoints

### Quotes
- `GET /api/ventas/quotes` - List all quotes with filters
- `GET /api/ventas/quotes/:id` - Get quote details with items
- `POST /api/ventas/quotes` - Create new quote
- `PUT /api/ventas/quotes/:id` - Update quote
- `DELETE /api/ventas/quotes/:id` - Delete quote (only DRAFT)
- `POST /api/ventas/quotes/:id/send` - Mark as sent
- `POST /api/ventas/quotes/:id/accept` - Accept quote
- `POST /api/ventas/quotes/:id/reject` - Reject quote
- `GET /api/ventas/quotes/:id/pdf` - Generate PDF
- `POST /api/ventas/quotes/:id/convert-to-order` - Convert to order

### Orders
- `GET /api/ventas/orders` - List all orders with filters
- `GET /api/ventas/orders/:id` - Get order details
- `POST /api/ventas/orders` - Create new order
- `PUT /api/ventas/orders/:id` - Update order
- `PUT /api/ventas/orders/:id/status` - Update order status
- `GET /api/ventas/orders/:id/check-inventory` - Check inventory availability
- `POST /api/ventas/orders/:id/reserve-inventory` - Reserve inventory

### Deliveries
- `POST /api/ventas/orders/:orderId/deliveries` - Create delivery
- `GET /api/ventas/orders/:orderId/deliveries` - List deliveries for order

### Payments
- `POST /api/ventas/orders/:orderId/payments` - Record payment
- `GET /api/ventas/orders/:orderId/payments` - List payments for order

### Products & Inventory
- `GET /api/ventas/products` - Get products catalog (from produccion_products)
- `GET /api/ventas/inventory/available` - Get available ESMALTADO inventory
- `POST /api/ventas/inventory/check-availability` - Check if items are available

### Reports
- `GET /api/ventas/reports/sales-summary` - Sales summary
- `GET /api/ventas/reports/top-customers` - Top customers
- `GET /api/ventas/reports/product-performance` - Product sales

---

## PDF Export Features

### Quote PDF should include:
- Company logo and info
- Quote number and date
- Customer details
- Valid until date
- Line items table (product, qty, unit price, discount, total)
- Subtotal, discounts, tax, grand total
- Notes and terms & conditions
- Authorized signature line

### Order/Invoice PDF:
- Similar to quote
- Order number
- Delivery address
- Payment terms
- Payment status

---

## Additional Features to Consider

### 1. Pricing Management
- Different price lists for different customer types
- Volume-based discounts
- Seasonal pricing

### 2. Inventory Reservation
- When order is CONFIRMED, reserve inventory
- Auto-release if order cancelled
- Warning if trying to sell reserved inventory

### 3. Notifications
- Email when quote is created/sent
- Alert when quote expires soon
- Order status updates
- Low inventory alerts for popular items

### 4. Bulk Operations
- Bulk quote creation from template
- Bulk status updates
- Export to Excel

### 5. Analytics Dashboard
- Sales trends
- Conversion rate (quotes → orders)
- Average order value
- Customer lifetime value

---

## Database Migration Order

1. Create `ventas_quotes` table
2. Create `ventas_quote_items` table
3. Create `ventas_orders` table
4. Create `ventas_order_items` table
5. Create `ventas_deliveries` table
6. Create `ventas_delivery_items` table
7. Create `ventas_payments` table
8. Create `ventas_status_history` table
9. Create triggers for auto-updating timestamps
10. Create functions for auto-calculating totals

---

## Next Steps

1. **Phase 1 - Core Quote System**
   - Database migration
   - Quote CRUD APIs
   - Quote UI (list, create, edit)
   - PDF generation

2. **Phase 2 - Order Management**
   - Order CRUD APIs
   - Inventory integration
   - Order UI
   - Status tracking

3. **Phase 3 - Delivery & Payments**
   - Delivery tracking
   - Payment recording
   - Inventory decrements

4. **Phase 4 - Reports & Analytics**
   - Dashboard widgets
   - Sales reports
   - Export capabilities

---

## Technical Stack Recommendations

### PDF Generation:
- **jsPDF** or **pdfmake** for client-side PDF generation
- Or **Puppeteer** on backend for server-side PDF generation

### UI Components:
- Tables with sorting/filtering
- Status badges
- Modal forms
- Date pickers
- Autocomplete for customer/product selection

### Data Validation:
- Quote validation before sending
- Inventory availability before order creation
- Payment amount validation
- Delivery quantity validation

---

## Security Considerations

1. **Permissions**
   - Who can create quotes?
   - Who can accept quotes?
   - Who can create orders?
   - Who can record payments?
   - Who can mark as delivered?

2. **Data Integrity**
   - Prevent editing of SENT quotes
   - Prevent deletion of CONFIRMED orders
   - Audit trail for all status changes

3. **Financial Controls**
   - Payment amount cannot exceed order total
   - Delivery quantity cannot exceed ordered quantity
   - Inventory reservation prevents overselling
