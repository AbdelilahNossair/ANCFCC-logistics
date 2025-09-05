import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');
const db = new Database(dbPath);

console.log('🔍 Testing database and foreign key constraints...');

try {
  // Check current foreign keys setting
  const fkStatus = db.pragma('foreign_keys');
  console.log('Current foreign_keys setting:', fkStatus);

  // Check if warehouses table exists and has data
  const warehouseCount = db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as any;
  console.log('Current warehouses count:', warehouseCount.count);

  // List all warehouses
  const warehouses = db.prepare('SELECT warehouse_id, warehouse_code FROM warehouses').all();
  console.log('Current warehouses:', warehouses);

  // Test inserting a zone manually
  db.pragma('foreign_keys = OFF');
  console.log('Foreign keys disabled');

  // Try to insert a test zone
  const insertZone = db.prepare(`
    INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) 
    VALUES (?, ?, ?, ?, ?)
  `);

  try {
    const result = insertZone.run(1, 'TEST-ZONE', 'Test Zone', 'test', 100);
    console.log('✅ Test zone inserted successfully:', result);
    
    // Clean up test data
    db.prepare('DELETE FROM zones WHERE zone_code = ?').run('TEST-ZONE');
    console.log('✅ Test zone cleaned up');
  } catch (error) {
    console.error('❌ Test zone insertion failed:', error);
  }

  db.pragma('foreign_keys = ON');
  console.log('Foreign keys re-enabled');

} catch (error) {
  console.error('❌ Error:', error);
} finally {
  db.close();
}
