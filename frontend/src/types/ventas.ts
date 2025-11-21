// Simple Ventas Mayoreo Quotation types

export interface QuotationItem {
  id?: number;
  quotation_id?: number;
  product_id: number;
  product_name?: string;
  tipo_name?: string;
  esmalte_color_id?: number;
  esmalte_color?: string;
  esmalte_hex_code?: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  tax_percentage: number;
  subtotal?: number;
  discount_amount?: number;
  tax_amount?: number;
  total?: number;
  notes?: string;
}

export interface Quotation {
  id: number;
  quotation_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  subtotal: number;
  discount_total: number;
  tax_total: number;
  total: number;
  valid_until?: string;
  notes?: string;
  terms?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  items_count?: number;
  items?: QuotationItem[];
}

export interface QuotationFormData {
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  valid_until?: string;
  notes?: string;
  terms?: string;
  items: QuotationItemFormData[];
}

export interface QuotationItemFormData {
  product_id: number;
  esmalte_color_id?: number;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
  tax_percentage?: number;
  notes?: string;
}
