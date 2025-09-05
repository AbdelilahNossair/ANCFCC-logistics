import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { 
  Asset, 
  AssetWithDetails, 
  CreateAssetRequest, 
  UpdateAssetRequest, 
  AssetQueryParams,
  ApiResponse,
  PaginatedResponse 
} from '../types/index.js';
import { generateBarcode, generatePagination, buildSearchQuery } from '../utils/helpers.js';

/**
 * Get all assets with filtering and pagination
 */
export const getAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      category_id,
      status,
      condition,
      zone_id,
      sort_by = 'created_at',
      sort_order = 'DESC'
    } = req.query as AssetQueryParams;

    const offset = (Number(page) - 1) * Number(limit);
    
    const filters: Record<string, any> = {};
    if (category_id) filters['a.category_id'] = category_id;
    if (status) filters['a.status'] = status;
    if (condition) filters['a.condition_state'] = condition;
    if (zone_id) filters['a.current_zone_id'] = zone_id;

    const { whereClause, params } = buildSearchQuery(search as string, filters);

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM assets a 
      ${whereClause}
    `;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Get assets with details
    const query = `
      SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      ${whereClause}
      ORDER BY a.${sort_by} ${sort_order}
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(
      query, 
      [...params, Number(limit), offset]
    );

    const pagination = generatePagination(Number(page), Number(limit), total);

    const response: PaginatedResponse<AssetWithDetails> = {
      success: true,
      data: rows as AssetWithDetails[],
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch assets'
    });
  }
};

/**
 * Get asset by ID
 */
export const getAssetById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      WHERE a.asset_id = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
      return;
    }

    const response: ApiResponse<AssetWithDetails> = {
      success: true,
      data: rows[0] as AssetWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset'
    });
  }
};

/**
 * Get asset by barcode
 */
export const getAssetByBarcode = async (req: Request, res: Response): Promise<void> => {
  try {
    const { barcode } = req.params;

    const query = `
      SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      WHERE a.barcode = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [barcode]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
      return;
    }

    const response: ApiResponse<AssetWithDetails> = {
      success: true,
      data: rows[0] as AssetWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching asset by barcode:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset'
    });
  }
};

/**
 * Create new asset
 */
export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const assetData: CreateAssetRequest = req.body;
    const barcode = generateBarcode();

    const query = `
      INSERT INTO assets (
        barcode, category_id, asset_name, description, brand, model, 
        serial_number, marche_info, condition_state, acquisition_date, 
        acquisition_value, current_zone_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'available')
    `;

    const values = [
      barcode,
      assetData.category_id,
      assetData.asset_name,
      assetData.description || null,
      assetData.brand || null,
      assetData.model || null,
      assetData.serial_number || null,
      assetData.marche_info || null,
      assetData.condition_state,
      assetData.acquisition_date || null,
      assetData.acquisition_value || null,
      assetData.current_zone_id || null
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    // Create initial movement record
    if (assetData.current_zone_id && req.user) {
      const movementQuery = `
        INSERT INTO stock_movements (
          asset_id, movement_type, to_zone_id, user_id, notes
        ) VALUES (?, 'reception', ?, ?, 'Initial asset reception')
      `;
      
      await pool.execute(movementQuery, [
        result.insertId,
        assetData.current_zone_id,
        req.user.user_id
      ]);
    }

    // Fetch the created asset with details
    const [newAsset] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      WHERE a.asset_id = ?`,
      [result.insertId]
    );

    const response: ApiResponse<AssetWithDetails> = {
      success: true,
      data: newAsset[0] as AssetWithDetails,
      message: 'Asset created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create asset'
    });
  }
};

/**
 * Update asset
 */
export const updateAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData: UpdateAssetRequest = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
      return;
    }

    values.push(id);

    const query = `
      UPDATE assets 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE asset_id = ?
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
      return;
    }

    // Fetch updated asset
    const [updatedAsset] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        a.*,
        ac.category_name,
        ac.category_type,
        z.zone_name,
        w.warehouse_name
      FROM assets a
      LEFT JOIN asset_categories ac ON a.category_id = ac.category_id
      LEFT JOIN zones z ON a.current_zone_id = z.zone_id
      LEFT JOIN warehouses w ON z.warehouse_id = w.warehouse_id
      WHERE a.asset_id = ?`,
      [id]
    );

    const response: ApiResponse<AssetWithDetails> = {
      success: true,
      data: updatedAsset[0] as AssetWithDetails,
      message: 'Asset updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update asset'
    });
  }
};

/**
 * Delete asset
 */
export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM assets WHERE asset_id = ?';
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Asset not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Asset deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete asset'
    });
  }
};

/**
 * Get asset movements
 */
export const getAssetMovements = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        sm.*,
        fz.zone_name as from_zone_name,
        tz.zone_name as to_zone_name,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM stock_movements sm
      LEFT JOIN zones fz ON sm.from_zone_id = fz.zone_id
      LEFT JOIN zones tz ON sm.to_zone_id = tz.zone_id
      LEFT JOIN recipients r ON sm.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON sm.user_id = u.user_id
      WHERE sm.asset_id = ?
      ORDER BY sm.movement_date DESC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching asset movements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch asset movements'
    });
  }
};
