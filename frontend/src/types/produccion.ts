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
  notes?: string;
}
