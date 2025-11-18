// ============================================================
// MASTER DATA TYPES
// ============================================================

export interface ItemCategory {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'discontinued';
  created_at: string;
  updated_at: string;
  product_count?: number; // Joined field
}

export type Concepto = 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';

export interface CeramicProduct {
  id: number;
  name: string;
  description?: string;
  item_category_id: number;
  concepto: Concepto; // Single stage value (not array)
  size_cm?: number; // Physical size in cm
  capacity_ml?: number; // Capacity in ml
  size_description?: string; // Human-readable size description
  enamel_color_id?: number; // Required if concepto is ESMALTADO
  status: 'active' | 'discontinued';
  created_at: string;
  updated_at: string;
  // Joined fields
  item_category_name?: string;
  enamel_color_name?: string;
  enamel_color_hex?: string;
}

// CeramicSize interface removed - sizes are now stored in products table
// (size_cm, capacity_ml, size_description)

export interface CeramicEnamelColor {
  id: number;
  color_name: string;
  color_code?: string;
  hex_code?: string;
  status: 'active' | 'discontinued';
  created_at: string;
  updated_at: string;
}

// ============================================================
// INVENTORY & TRANSACTION TYPES - DEPRECATED
// ============================================================
// Inventory and transaction types removed as we're now using
// simple product catalog (not 3-stage inventory tracking)

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ItemCategoriesResponse {
  categories: ItemCategory[];
  total: number;
}

export interface ProductsResponse {
  products: CeramicProduct[];
  total: number;
}

// SizesResponse removed - sizes are now part of products

export interface ColorsResponse {
  colors: CeramicEnamelColor[];
  total: number;
}

// Inventory and analytics response types removed

// ============================================================
// FORM DATA TYPES (For API requests)
// ============================================================

export interface CreateProductData {
  name: string;
  description?: string;
  item_category_id: number;
  concepto: Concepto;
  size_cm?: number;
  capacity_ml?: number;
  size_description?: string;
  enamel_color_id?: number; // Required if concepto is ESMALTADO
}

export interface UpdateProductData {
  name?: string;
  description?: string;
  item_category_id?: number;
  concepto?: Concepto;
  size_cm?: number;
  capacity_ml?: number;
  size_description?: string;
  enamel_color_id?: number;
  status?: 'active' | 'discontinued';
}

// ============================================================
// UI STATE TYPES
// ============================================================

export interface ProductFilter {
  search?: string;
  item_category_id?: number;
  concepto?: Concepto;
}
