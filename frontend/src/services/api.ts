// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API response types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Asset types
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
  acquisition_date?: string;
  acquisition_value?: number;
  current_zone_id?: number;
  status: 'available' | 'assigned' | 'in_transit' | 'delivered' | 'archived';
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_type?: string;
  zone_name?: string;
  warehouse_name?: string;
}

export interface Movement {
  movement_id: number;
  asset_id: number;
  movement_type: 'reception' | 'storage' | 'preparation' | 'handover_amana' | 'delivery' | 'return';
  from_zone_id?: number;
  to_zone_id?: number;
  recipient_id?: number;
  user_id: number;
  movement_date: string;
  notes?: string;
  asset_name?: string;
  asset_barcode?: string;
  from_zone_name?: string;
  to_zone_name?: string;
  recipient_name?: string;
  user_name?: string;
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
  created_at: string;
  department_name?: string;
  department_code?: string;
}

export interface Warehouse {
  warehouse_id: number;
  warehouse_code: string;
  warehouse_name: string;
  address: string;
  city: string;
  phone?: string;
  created_at: string;
  zone_count?: number;
  asset_count?: number;
}

export interface Department {
  department_id: number;
  department_code: string;
  department_name: string;
  responsible_person?: string;
  phone?: string;
  email?: string;
  recipient_count?: number;
}

export interface AssetCategory {
  category_id: number;
  category_code: string;
  category_name: string;
  category_type: 'furniture' | 'it_equipment' | 'office_supplies' | 'documents';
  asset_count?: number;
}

export interface DashboardStats {
  totalAssets: number;
  inTransit: number;
  delivered: number;
  pending: number;
  totalMovements: number;
  assetsByStatus: Array<{ status: string; count: number }>;
  recentMovements: number;
  pendingDeliveries: number;
  movementsByType: Array<{ movement_type: string; count: number }>;
  zoneOccupancy: Array<{ zone_name: string; asset_count: number; capacity: number }>;
}

export interface ReportStats {
  quickStats: Array<{
    label: string;
    value: string;
    change: string;
    color: string;
  }>;
  assetsByCategory: Array<{ category_name: string; category_type: string; count: number }>;
  movementTrends: Array<{ movement_type: string; count: number; date: string }>;
  deliveryStats: Array<{ delivery_status: string; count: number; avg_delivery_days?: number }>;
  period: string;
}

export interface ArchivedAsset extends Asset {
  archived_by?: string;
  archive_reason?: string;
}

// Generic API helper
async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

// Assets API
export const assetsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: number;
    status?: string;
    condition?: string;
    zone_id?: number;
  }): Promise<PaginatedResponse<Asset>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return apiRequest(`/assets${query ? `?${query}` : ''}`);
  },

  getById: (id: number): Promise<ApiResponse<Asset>> => 
    apiRequest(`/assets/${id}`),

  getByBarcode: (barcode: string): Promise<ApiResponse<Asset>> => 
    apiRequest(`/assets/barcode/${barcode}`),

  create: (asset: Partial<Asset>): Promise<ApiResponse<Asset>> =>
    apiRequest('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    }),

  update: (id: number, asset: Partial<Asset>): Promise<ApiResponse<Asset>> =>
    apiRequest(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    }),

  delete: (id: number): Promise<ApiResponse> =>
    apiRequest(`/assets/${id}`, {
      method: 'DELETE',
    }),

  getMovements: (id: number): Promise<ApiResponse<Movement[]>> =>
    apiRequest(`/assets/${id}/movements`),
};

// Movements API
export const movementsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    asset_id?: number;
    movement_type?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResponse<Movement>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return apiRequest(`/movements${query ? `?${query}` : ''}`);
  },

  create: (movement: {
    asset_id: number;
    movement_type: string;
    from_zone_id?: number;
    to_zone_id?: number;
    recipient_id?: number;
    notes?: string;
  }): Promise<ApiResponse<Movement>> =>
    apiRequest('/movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    }),

  getById: (id: number): Promise<ApiResponse<Movement>> =>
    apiRequest(`/movements/${id}`),
};

// Recipients API
export const recipientsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    department_id?: number;
  }): Promise<PaginatedResponse<Recipient>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return apiRequest(`/recipients${query ? `?${query}` : ''}`);
  },

  create: (recipient: Omit<Recipient, 'recipient_id' | 'created_at'>): Promise<ApiResponse<Recipient>> =>
    apiRequest('/recipients', {
      method: 'POST',
      body: JSON.stringify(recipient),
    }),

  update: (id: number, recipient: Partial<Recipient>): Promise<ApiResponse<Recipient>> =>
    apiRequest(`/recipients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipient),
    }),

  delete: (id: number): Promise<ApiResponse> =>
    apiRequest(`/recipients/${id}`, {
      method: 'DELETE',
    }),
};

// Warehouses API
export const warehousesApi = {
  getAll: (): Promise<ApiResponse<Warehouse[]>> =>
    apiRequest('/warehouses'),

  getById: (id: number): Promise<ApiResponse<Warehouse>> =>
    apiRequest(`/warehouses/${id}`),

  getZones: (id: number): Promise<ApiResponse<any[]>> =>
    apiRequest(`/warehouses/${id}/zones`),
};

// General API
export const generalApi = {
  getDashboardStats: (): Promise<ApiResponse<DashboardStats>> =>
    apiRequest('/dashboard/stats'),

  getDepartments: (): Promise<ApiResponse<Department[]>> =>
    apiRequest('/departments'),

  getCategories: (): Promise<ApiResponse<AssetCategory[]>> =>
    apiRequest('/categories'),

  getZones: (): Promise<ApiResponse<any[]>> =>
    apiRequest('/zones'),
};

// Reports API
export const reportsApi = {
  getReportStats: (period?: string): Promise<ApiResponse<ReportStats>> => {
    const params = period ? `?period=${period}` : '';
    return apiRequest(`/reports/stats${params}`);
  },

  getRecentReports: (period?: string, type?: string): Promise<ApiResponse<any[]>> => {
    const params = new URLSearchParams();
    if (period) params.append('period', period);
    if (type) params.append('type', type);
    const query = params.toString();
    return apiRequest(`/reports/recent${query ? `?${query}` : ''}`);
  },

  generateAssetSummaryReport: (period?: string): Promise<ApiResponse<any>> => {
    const params = period ? `?period=${period}` : '';
    return apiRequest(`/reports/generate/asset-summary${params}`);
  },

  generateMovementAnalysisReport: (period?: string): Promise<ApiResponse<any>> => {
    const params = period ? `?period=${period}` : '';
    return apiRequest(`/reports/generate/movement-analysis${params}`);
  },

  generateInventoryStatusReport: (period?: string): Promise<ApiResponse<any>> => {
    const params = period ? `?period=${period}` : '';
    return apiRequest(`/reports/generate/inventory-status${params}`);
  },

  generateDeliveryReport: (period?: string): Promise<ApiResponse<any>> => {
    const params = period ? `?period=${period}` : '';
    return apiRequest(`/reports/generate/delivery-report${params}`);
  },

  generateCustomAssetSummaryReport: (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return apiRequest(`/reports/generate/asset-summary/custom${query ? `?${query}` : ''}`);
  },

  generateCustomMovementAnalysisReport: (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return apiRequest(`/reports/generate/movement-analysis/custom${query ? `?${query}` : ''}`);
  },

  generateCustomInventoryStatusReport: (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return apiRequest(`/reports/generate/inventory-status/custom${query ? `?${query}` : ''}`);
  },

  generateCustomDeliveryReport: (startDate?: string, endDate?: string): Promise<ApiResponse<any>> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const query = params.toString();
    return apiRequest(`/reports/generate/delivery-report/custom${query ? `?${query}` : ''}`);
  },
};

// Archive API
export const archiveApi = {
  getArchivedAssets: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<PaginatedResponse<ArchivedAsset>> => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, value.toString());
        }
      });
    }
    
    const query = searchParams.toString();
    return apiRequest(`/archive/assets${query ? `?${query}` : ''}`);
  },

  restoreAsset: (id: number): Promise<ApiResponse> =>
    apiRequest(`/archive/assets/${id}/restore`, {
      method: 'PATCH',
    }),

  deleteAsset: (id: number): Promise<ApiResponse> =>
    apiRequest(`/archive/assets/${id}`, {
      method: 'DELETE',
    }),
};

// Export all APIs
export default {
  assets: assetsApi,
  movements: movementsApi,
  recipients: recipientsApi,
  warehouses: warehousesApi,
  general: generalApi,
  reports: reportsApi,
  archive: archiveApi,
};
