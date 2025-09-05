import crypto from 'crypto';

/**
 * Generate a unique 10-digit barcode
 */
export const generateBarcode = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return (timestamp.slice(-6) + random).slice(0, 10);
};

/**
 * Generate a unique delivery reference
 */
export const generateDeliveryReference = (): string => {
  const prefix = 'AMANA';
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * Validate Moroccan CIN (Carte d'Identité Nationale)
 */
export const validateCIN = (cin: string): boolean => {
  // Basic CIN validation - should be 8-12 characters alphanumeric
  const cinRegex = /^[A-Z0-9]{8,12}$/;
  return cinRegex.test(cin.toUpperCase());
};

/**
 * Validate phone number (Moroccan format)
 */
export const validatePhone = (phone: string): boolean => {
  // Moroccan phone number format: +212XXXXXXXXX or 0XXXXXXXXX
  const phoneRegex = /^(\+212|0)[5-7][0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'currency',
    currency: 'MAD'
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('fr-MA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Sanitize string input
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, '');
};

/**
 * Generate pagination metadata
 */
export const generatePagination = (
  page: number, 
  limit: number, 
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Build SQL WHERE clause for search and filters
 */
export const buildSearchQuery = (
  searchTerm?: string,
  filters: Record<string, any> = {}
): { whereClause: string; params: any[] } => {
  const conditions: string[] = [];
  const params: any[] = [];

  if (searchTerm) {
    conditions.push('(asset_name LIKE ? OR barcode LIKE ? OR description LIKE ?)');
    const searchPattern = `%${searchTerm}%`;
    params.push(searchPattern, searchPattern, searchPattern);
  }

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      conditions.push(`${key} = ?`);
      params.push(value);
    }
  });

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  
  return { whereClause, params };
};

/**
 * Validate asset status transitions
 */
export const validateStatusTransition = (
  currentStatus: string, 
  newStatus: string
): boolean => {
  const validTransitions: Record<string, string[]> = {
    'available': ['assigned', 'in_transit', 'archived'],
    'assigned': ['in_transit', 'available', 'archived'],
    'in_transit': ['delivered', 'available'],
    'delivered': ['archived'],
    'archived': ['available']
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

/**
 * Hash password using crypto
 */
export const hashPassword = (password: string): string => {
  return crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512').toString('hex');
};

/**
 * Verify password
 */
export const verifyPassword = (password: string, hash: string): boolean => {
  const hashVerify = crypto.pbkdf2Sync(password, 'salt', 10000, 64, 'sha512').toString('hex');
  return hash === hashVerify;
};
