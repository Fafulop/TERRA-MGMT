// Master data types
export interface Tipo {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Size {
  id: number;
  size_cm: number;
  created_at: string;
  updated_at: string;
}

export interface Capacity {
  id: number;
  capacity_ml: number;
  created_at: string;
  updated_at: string;
}

export interface EsmalteColor {
  id: number;
  color: string;
  hex_code?: string;
  created_at: string;
  updated_at: string;
}

// Product types
export interface Product {
  id: number;
  name: string;
  stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';
  tipo_id: number;
  tipo_name: string;
  size_id: number;
  size_cm: number;
  capacity_id: number;
  capacity_ml: number;
  esmalte_color_id: number;
  esmalte_color: string;
  esmalte_hex_code?: string;
  peso_crudo?: number;
  peso_esmaltado?: number;
  costo_pasta?: number;
  costo_mano_obra?: number;
  cantidad_esmalte?: number;
  costo_esmalte?: number;
  costo_horneado?: number;
  costo_h_sancocho?: number;
  notes?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';
  tipo_id: number;
  size_id: number;
  capacity_id: number;
  esmalte_color_id: number;
  peso_crudo?: number;
  peso_esmaltado?: number;
  costo_pasta?: number;
  costo_mano_obra?: number;
  cantidad_esmalte?: number;
  costo_esmalte?: number;
  costo_horneado?: number;
  costo_h_sancocho?: number;
  notes?: string;
}

// Inventory types
export interface InventoryRecord {
  id: number;
  product_id: number;
  product_name: string;
  tipo_id: number;
  tipo_name: string;
  stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';
  esmalte_color_id: number | null;
  esmalte_color: string | null;
  esmalte_hex_code: string | null;
  quantity: number;
  apartados: number;
  vendidos: number;
  costo_pasta: number;
  costo_mano_obra: number;
  costo_esmalte: number;
  costo_horneado: number;
  costo_h_sancocho: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name: string;
  tipo_name: string;
  movement_type: 'CRUDO_INPUT' | 'SANCOCHADO_PROCESS' | 'ESMALTADO_PROCESS' | 'ADJUSTMENT' | 'MERMA';
  from_stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO' | null;
  to_stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO' | null;
  from_color_id: number | null;
  to_color_id: number | null;
  from_color: string | null;
  to_color: string | null;
  quantity: number;
  notes: string | null;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface CrudoInputFormData {
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface SanchoProcessFormData {
  product_id: number;
  quantity: number;
  notes?: string;
}

export interface EsmaltadoProcessFormData {
  product_id: number;
  quantity: number;
  esmalte_color_id: number;
  notes?: string;
}

export interface AdjustmentFormData {
  product_id: number;
  stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';
  esmalte_color_id?: number;
  quantity: number;
  notes?: string;
}

export interface MermaFormData {
  product_id: number;
  stage: 'CRUDO' | 'SANCOCHADO' | 'ESMALTADO';
  esmalte_color_id?: number;
  quantity: number;
  notes?: string;
}
