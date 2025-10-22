// ============================================================
// ITEMS CATALOG (Master Data)
// ============================================================

export interface InventarioItem {
  id: number;
  internal_id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost_per_unit?: number;
  area?: string;
  subarea?: string;
  notes?: string;
  tags?: string[];
  status: 'active' | 'discontinued' | 'archived';
  created_by: number;
  created_by_username?: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  updated_at: string;
}

export interface InventarioItemFormData {
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost_per_unit?: number;
  area?: string;
  subarea?: string;
  notes?: string;
  tags?: string[];
}

export interface ItemFilters {
  category?: string;
  status?: string;
  area?: string;
  subarea?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// INVENTORY COUNTS (Transactions)
// ============================================================

export interface InventarioCount {
  id: number;
  item_id: number;
  count_date: string;
  quantity: number;
  status: string;
  counted_by: number;
  counted_by_username?: string;
  notes?: string;
  session_id?: number;
  session_name?: string;
  created_at: string;
  updated_at: string;
  // Joined fields from item
  item_name?: string;
  item_internal_id?: string;
  category?: string;
  unit?: string;
}

export interface CountFormData {
  item_id: number;
  count_date: string;
  quantity: number;
  notes?: string;
  session_id?: number;
}

export interface BatchCountData {
  counts: CountFormData[];
  session_id?: number;
}

export interface CountFilters {
  item_id?: number;
  from_date?: string;
  to_date?: string;
  counted_by?: number;
  session_id?: number;
  limit?: number;
  offset?: number;
}

// ============================================================
// COUNT SESSIONS (Batch Counting)
// ============================================================

export interface CountSession {
  id: number;
  session_name: string;
  count_date: string;
  counted_by: number;
  counted_by_username?: string;
  notes?: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  counts_in_session?: number;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface CountSessionFormData {
  session_name?: string;
  count_date: string;
  notes?: string;
}

export interface SessionFilters {
  status?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

// ============================================================
// CURRENT INVENTORY (Dashboard View)
// ============================================================

export interface CurrentInventoryItem {
  item_id: number;
  internal_id: string;
  name: string;
  description?: string;
  category: string;
  unit: string;
  cost_per_unit?: number;
  area?: string;
  subarea?: string;
  tags?: string[];
  item_status: 'active' | 'discontinued' | 'archived';
  count_id?: number;
  quantity?: number;
  count_date?: string;
  counted_by?: number;
  counted_by_username?: string;
  count_notes?: string;
  total_value?: number;
}

export interface CurrentInventoryResponse {
  inventory: CurrentInventoryItem[];
  summary: {
    total_items: number;
    total_value: number;
    items_with_counts: number;
    items_without_counts: number;
  };
}

// ============================================================
// API RESPONSE TYPES
// ============================================================

export interface ItemsResponse {
  items: InventarioItem[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

export interface CountsResponse {
  counts: InventarioCount[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface SessionsResponse {
  sessions: CountSession[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface SessionDetailResponse {
  session: CountSession;
  counts: InventarioCount[];
}

export interface ItemHistoryResponse {
  item_id: number;
  counts: InventarioCount[];
  total_counts: number;
}

export interface CountsByDateResponse {
  count_dates: Array<{
    count_date: string;
    items_counted: number;
    total_counts: number;
    total_value: number;
    counted_by_users: string[];
    sessions: string[];
  }>;
}
