// Database entity types

export interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  address: string;
  city: string;
  phone?: string;
  created_at: Date;
}

export interface Zone {
  zone_id: number;
  warehouse_id: number;
  zone_code: string;
  zone_name: string;
  zone_type?: string;
  capacity?: number;
}

export interface Department {
  department_id: number;
  department_code: string;
  department_name: string;
  responsible_person?: string;
  phone?: string;
  email?: string;
}

export interface Recipient {
  recipient_id: number;
  first_name: string;
  last_name: string;
  cin?: string;
  department_id?: number;
  phone: string;
  email?: string;
  address?: string;
  created_at: Date;
}

export interface StaffUser {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  role: 'warehouse_manager' | 'operator' | 'admin';
  phone?: string;
  email: string;
  password_hash: string;
  is_active: boolean;
  created_at: Date;
}

export interface AssetCategory {
  category_id: number;
  category_code: string;
  category_name: string;
  category_type: 'furniture' | 'it_equipment' | 'office_supplies' | 'documents';
}

export interface Asset {
  asset_id: number;
  barcode: string;
  category_id: number;
  asset_name: string;
  description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  marche_info?: string;
  condition_state: 'new' | 'good' | 'fair' | 'poor' | 'damaged';
  acquisition_date?: Date;
  acquisition_value?: number;
  current_zone_id?: number;
  status: 'available' | 'assigned' | 'in_transit' | 'delivered' | 'archived';
  created_at: Date;
  updated_at: Date;
}

export interface StockMovement {
  movement_id: number;
  asset_id: number;
  movement_type: 'reception' | 'storage' | 'preparation' | 'handover_amana' | 'delivery' | 'return';
  from_zone_id?: number;
  to_zone_id?: number;
  recipient_id?: number;
  user_id: number;
  movement_date: Date;
  notes?: string;
}

export interface AmanaDelivery {
  delivery_id: number;
  delivery_reference: string;
  asset_id: number;
  recipient_id: number;
  handover_date: Date;
  handover_user_id: number;
  amana_agent_name?: string;
  amana_agent_phone?: string;
  delivery_status: 'pending' | 'in_transit' | 'delivered' | 'failed';
  delivery_date?: Date;
  delivery_proof?: string;
  feedback_notes?: string;
  created_at: Date;
}

// Request/Response types
export interface CreateAssetRequest {
  category_id: number;
  asset_name: string;
  description?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  marche_info?: string;
  condition_state: Asset['condition_state'];
  acquisition_date?: string;
  acquisition_value?: number;
  current_zone_id?: number;
}

export interface UpdateAssetRequest extends Partial<CreateAssetRequest> {
  status?: Asset['status'];
}

export interface CreateMovementRequest {
  asset_id: number;
  movement_type: StockMovement['movement_type'];
  from_zone_id?: number;
  to_zone_id?: number;
  recipient_id?: number;
  notes?: string;
}

export interface CreateRecipientRequest {
  first_name: string;
  last_name: string;
  cin?: string;
  department_id?: number;
  phone: string;
  email?: string;
  address?: string;
}

export interface CreateDeliveryRequest {
  asset_id: number;
  recipient_id: number;
  amana_agent_name?: string;
  amana_agent_phone?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  stats?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Query parameters
export interface AssetQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category_id?: number;
  status?: Asset['status'];
  condition?: Asset['condition_state'];
  zone_id?: number;
  sort_by?: 'created_at' | 'asset_name' | 'acquisition_date';
  sort_order?: 'ASC' | 'DESC';
}

export interface MovementQueryParams {
  page?: number;
  limit?: number;
  asset_id?: number;
  movement_type?: StockMovement['movement_type'];
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

// Extended types with joins
export interface AssetWithDetails extends Asset {
  category_name?: string;
  category_type?: string;
  zone_name?: string;
  warehouse_name?: string;
}

export interface MovementWithDetails extends StockMovement {
  asset_name?: string;
  asset_barcode?: string;
  from_zone_name?: string;
  to_zone_name?: string;
  recipient_name?: string;
  user_name?: string;
}

export interface DeliveryWithDetails extends AmanaDelivery {
  asset_name?: string;
  asset_barcode?: string;
  recipient_name?: string;
  recipient_phone?: string;
  user_name?: string;
}
