import { Request, Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '../config/database.js';
import { 
  Recipient, 
  CreateRecipientRequest,
  ApiResponse,
  PaginatedResponse 
} from '../types/index.js';
import { generatePagination, validateCIN, validatePhone } from '../utils/helpers.js';

/**
 * Get all recipients with pagination
 */
export const getRecipients = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      department_id
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(r.first_name LIKE ? OR r.last_name LIKE ? OR r.cin LIKE ? OR r.phone LIKE ?)');
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (department_id) {
      conditions.push('r.department_id = ?');
      params.push(department_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM recipients r 
      ${whereClause}
    `;
    const [countRows] = await pool.execute<RowDataPacket[]>(countQuery, params);
    const total = countRows[0].total;

    // Get recipients with department details
    const query = `
      SELECT 
        r.*,
        d.department_name,
        d.department_code
      FROM recipients r
      LEFT JOIN departments d ON r.department_id = d.department_id
      ${whereClause}
      ORDER BY r.last_name, r.first_name
      LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(
      query, 
      [...params, Number(limit), offset]
    );

    const pagination = generatePagination(Number(page), Number(limit), total);

    const response: PaginatedResponse<any> = {
      success: true,
      data: rows,
      pagination
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recipients:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipients'
    });
  }
};

/**
 * Get recipient by ID
 */
export const getRecipientById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        r.*,
        d.department_name,
        d.department_code
      FROM recipients r
      LEFT JOIN departments d ON r.department_id = d.department_id
      WHERE r.recipient_id = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [id]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: rows[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recipient'
    });
  }
};

/**
 * Create new recipient
 */
export const createRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const recipientData: CreateRecipientRequest = req.body;

    // Validate CIN if provided
    if (recipientData.cin && !validateCIN(recipientData.cin)) {
      res.status(400).json({
        success: false,
        error: 'Invalid CIN format'
      });
      return;
    }

    // Validate phone number
    if (!validatePhone(recipientData.phone)) {
      res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
      return;
    }

    const query = `
      INSERT INTO recipients (
        first_name, last_name, cin, department_id, 
        phone, email, address
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      recipientData.first_name,
      recipientData.last_name,
      recipientData.cin || null,
      recipientData.department_id || null,
      recipientData.phone,
      recipientData.email || null,
      recipientData.address || null
    ];

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    // Fetch the created recipient with department details
    const [newRecipient] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        r.*,
        d.department_name,
        d.department_code
      FROM recipients r
      LEFT JOIN departments d ON r.department_id = d.department_id
      WHERE r.recipient_id = ?`,
      [result.insertId]
    );

    const response: ApiResponse = {
      success: true,
      data: newRecipient[0],
      message: 'Recipient created successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating recipient:', error);
    
    if (error instanceof Error && error.message.includes('Duplicate entry')) {
      res.status(409).json({
        success: false,
        error: 'CIN already exists'
      });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to create recipient'
    });
  }
};

/**
 * Update recipient
 */
export const updateRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate CIN if provided
    if (updateData.cin && !validateCIN(updateData.cin)) {
      res.status(400).json({
        success: false,
        error: 'Invalid CIN format'
      });
      return;
    }

    // Validate phone number if provided
    if (updateData.phone && !validatePhone(updateData.phone)) {
      res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
      return;
    }

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];

    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined && ['first_name', 'last_name', 'cin', 'department_id', 'phone', 'email', 'address'].includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No valid fields to update'
      });
      return;
    }

    values.push(id);

    const query = `
      UPDATE recipients 
      SET ${updateFields.join(', ')}
      WHERE recipient_id = ?
    `;

    const [result] = await pool.execute<ResultSetHeader>(query, values);

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
      return;
    }

    // Fetch updated recipient
    const [updatedRecipient] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        r.*,
        d.department_name,
        d.department_code
      FROM recipients r
      LEFT JOIN departments d ON r.department_id = d.department_id
      WHERE r.recipient_id = ?`,
      [id]
    );

    const response: ApiResponse = {
      success: true,
      data: updatedRecipient[0],
      message: 'Recipient updated successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update recipient'
    });
  }
};

/**
 * Delete recipient
 */
export const deleteRecipient = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check if recipient has associated deliveries
    const [deliveries] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM amana_deliveries WHERE recipient_id = ?',
      [id]
    );

    if (deliveries[0].count > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete recipient with existing deliveries'
      });
      return;
    }

    const query = 'DELETE FROM recipients WHERE recipient_id = ?';
    const [result] = await pool.execute<ResultSetHeader>(query, [id]);

    if (result.affectedRows === 0) {
      res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      message: 'Recipient deleted successfully'
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting recipient:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recipient'
    });
  }
};

/**
 * Search recipients by CIN
 */
export const searchRecipientByCIN = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cin } = req.params;

    const query = `
      SELECT 
        r.*,
        d.department_name,
        d.department_code
      FROM recipients r
      LEFT JOIN departments d ON r.department_id = d.department_id
      WHERE r.cin = ?
    `;

    const [rows] = await pool.execute<RowDataPacket[]>(query, [cin]);

    if (rows.length === 0) {
      res.status(404).json({
        success: false,
        error: 'Recipient not found'
      });
      return;
    }

    const response: ApiResponse = {
      success: true,
      data: rows[0]
    };

    res.json(response);
  } catch (error) {
    console.error('Error searching recipient by CIN:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search recipient'
    });
  }
};
