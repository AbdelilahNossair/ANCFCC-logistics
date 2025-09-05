import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { 
  AmanaDelivery,
  DeliveryWithDetails,
  CreateDeliveryRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types/index.js';
import { generateDeliveryReference, generatePagination } from '../utils/helpers.js';

/**
 * Get all deliveries with pagination
 */
export const getDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      recipient_id,
      start_date,
      end_date
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push('ad.delivery_status = ?');
      params.push(status);
    }

    if (recipient_id) {
      conditions.push('ad.recipient_id = ?');
      params.push(recipient_id);
    }

    if (start_date) {
      conditions.push('DATE(ad.handover_date) >= ?');
      params.push(start_date);
    }

    if (end_date) {
      conditions.push('DATE(ad.handover_date) <= ?');
      params.push(end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM amana_deliveries ad 
      ${whereClause}
    `;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Get deliveries with details
    const query = `
      SELECT 
        ad.*,
        a.asset_name,
        a.barcode as asset_barcode,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        r.phone as recipient_phone,
        r.address as recipient_address,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM amana_deliveries ad
      LEFT JOIN assets a ON ad.asset_id = a.asset_id
      LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON ad.handover_user_id = u.user_id
      ${whereClause}
      ORDER BY ad.handover_date DESC
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(
      query, 
      [...params, Number(limit), offset]
    );

    const pagination = generatePagination(Number(page), Number(limit), total);

    const response: PaginatedResponse<DeliveryWithDetails> = {
      success: true,
      data: rows as DeliveryWithDetails[],
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch deliveries'
    });
  }
};

/**
 * Get delivery by ID
 */
export const getDeliveryById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        ad.*,
        a.asset_name,
        a.barcode as asset_barcode,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        r.phone as recipient_phone,
        r.address as recipient_address,
        CONCAT(u.first_name, ' ', u.last_name) as user_name
      FROM amana_deliveries ad
      LEFT JOIN assets a ON ad.asset_id = a.asset_id
      LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
      LEFT JOIN staff_users u ON ad.handover_user_id = u.user_id
      WHERE ad.delivery_id = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Delivery not found'
      });
      return;
    }

    const response: ApiResponse<DeliveryWithDetails> = {
      success: true,
      data: rows[0] as DeliveryWithDetails
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery'
    });
  }
};

/**
 * Create new delivery
 */
export const createDelivery = async (req: Request, res: Response): Promise<void> => {
  try {
    const deliveryData: CreateDeliveryRequest = req.body;
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Check if asset exists and is available for delivery
    const [assetRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM assets WHERE asset_id = ? AND status IN ("available", "assigned")',
      [deliveryData.asset_id]
    );

    if (assetRows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Asset not found or not available for delivery'
      });
      return;
    }

    // Check if recipient exists
    const [recipientRows] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM recipients WHERE recipient_id = ?',
      [deliveryData.recipient_id]
    );

    if (recipientRows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Recipient not found'
      });
      return;
    }

    const deliveryReference = generateDeliveryReference();

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create delivery record
      const deliveryQuery = `
        INSERT INTO amana_deliveries (
          delivery_reference, asset_id, recipient_id, handover_date,
          handover_user_id, amana_agent_name, amana_agent_phone
        ) VALUES (?, ?, ?, datetime('now'), ?, ?, ?)
      `;

      const [deliveryResult] = await connection.execute<ResultSetHeader>(
        deliveryQuery,
        [
          deliveryReference,
          deliveryData.asset_id,
          deliveryData.recipient_id,
          userId,
          deliveryData.amana_agent_name || null,
          deliveryData.amana_agent_phone || null
        ]
      );

      // Create movement record for handover to Amana
      const movementQuery = `
        INSERT INTO stock_movements (
          asset_id, movement_type, recipient_id, user_id, notes
        ) VALUES (?, 'handover_amana', ?, ?, 'Asset handed over to Amana for delivery')
      `;

      await connection.execute(movementQuery, [
        deliveryData.asset_id,
        deliveryData.recipient_id,
        userId
      ]);

      // Update asset status
      await connection.execute(
        'UPDATE assets SET status = "in_transit", updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?',
        [deliveryData.asset_id]
      );

      await connection.commit();

      // Fetch the created delivery with details
      const [newDelivery] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          ad.*,
          a.asset_name,
          a.barcode as asset_barcode,
          CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
          r.phone as recipient_phone,
          r.address as recipient_address,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM amana_deliveries ad
        LEFT JOIN assets a ON ad.asset_id = a.asset_id
        LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
        LEFT JOIN staff_users u ON ad.handover_user_id = u.user_id
        WHERE ad.delivery_id = ?`,
        [deliveryResult.insertId]
      );

      const response: ApiResponse<DeliveryWithDetails> = {
        success: true,
        data: newDelivery[0] as DeliveryWithDetails,
        message: 'Delivery created successfully'
      };

      res.status(201).json(response);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error creating delivery:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create delivery'
    });
  }
};

/**
 * Update delivery status
 */
export const updateDeliveryStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { delivery_status, delivery_proof, feedback_notes } = req.body;

    const validStatuses = ['pending', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(delivery_status)) {
      res.status(400).json({
        success: false,
        error: 'Invalid delivery status'
      });
      return;
    }

    // Start transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update delivery
      const updateDelivery = `
        UPDATE amana_deliveries 
        SET delivery_status = ?, 
            delivery_date = ${delivery_status === 'delivered' ? "datetime('now')" : 'delivery_date'},
            delivery_proof = ?,
            feedback_notes = ?
        WHERE delivery_id = ?
      `;

      const [result] = await connection.execute<ResultSetHeader>(
        updateDelivery,
        [delivery_status, delivery_proof || null, feedback_notes || null, id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
        res.status(404).json({
          success: false,
          error: 'Delivery not found'
        });
        return;
      }

      // If delivered, update asset status and create movement record
      if (delivery_status === 'delivered') {
        // Get delivery details for movement
        const [deliveryRows] = await connection.execute<RowDataPacket[]>(
          'SELECT asset_id, recipient_id FROM amana_deliveries WHERE delivery_id = ?',
          [id]
        );

        if (deliveryRows.length > 0) {
          const { asset_id, recipient_id } = deliveryRows[0];

          // Update asset status
          await connection.execute(
            'UPDATE assets SET status = "delivered", updated_at = CURRENT_TIMESTAMP WHERE asset_id = ?',
            [asset_id]
          );

          // Create delivery movement record
          await connection.execute(
            `INSERT INTO stock_movements (
              asset_id, movement_type, recipient_id, user_id, notes
            ) VALUES (?, 'delivery', ?, 1, 'Asset delivered by Amana')`,
            [asset_id, recipient_id]
          );
        }
      }

      await connection.commit();

      // Fetch updated delivery
      const [updatedDelivery] = await pool.execute<RowDataPacket[]>(
        `SELECT 
          ad.*,
          a.asset_name,
          a.barcode as asset_barcode,
          CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
          r.phone as recipient_phone,
          r.address as recipient_address,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM amana_deliveries ad
        LEFT JOIN assets a ON ad.asset_id = a.asset_id
        LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
        LEFT JOIN staff_users u ON ad.handover_user_id = u.user_id
        WHERE ad.delivery_id = ?`,
        [id]
      );

      const response: ApiResponse<DeliveryWithDetails> = {
        success: true,
        data: updatedDelivery[0] as DeliveryWithDetails,
        message: 'Delivery status updated successfully'
      };

      res.json(response);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update delivery status'
    });
  }
};

/**
 * Get pending deliveries
 */
export const getPendingDeliveries = async (req: Request, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        ad.*,
        a.asset_name,
        a.barcode as asset_barcode,
        CONCAT(r.first_name, ' ', r.last_name) as recipient_name,
        r.phone as recipient_phone,
        r.address as recipient_address
      FROM amana_deliveries ad
      LEFT JOIN assets a ON ad.asset_id = a.asset_id
      LEFT JOIN recipients r ON ad.recipient_id = r.recipient_id
      WHERE ad.delivery_status IN ('pending', 'in_transit')
      ORDER BY ad.handover_date ASC
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query);

    const response: ApiResponse<DeliveryWithDetails[]> = {
      success: true,
      data: rows as DeliveryWithDetails[]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching pending deliveries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending deliveries'
    });
  }
};

/**
 * Get delivery statistics
 */
export const getDeliveryStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const { days = 30 } = req.query;

    const query = `
      SELECT 
        delivery_status,
        COUNT(*) as count,
        DATE(handover_date) as date
      FROM amana_deliveries 
      WHERE handover_date >= datetime('now', '-' || ? || ' days')
      GROUP BY delivery_status, DATE(handover_date)
      ORDER BY date DESC, delivery_status
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [days]);

    const response: ApiResponse = {
      success: true,
      data: rows
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching delivery stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch delivery statistics'
    });
  }
};
