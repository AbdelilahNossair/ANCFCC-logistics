import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('🌱 Starting database seeding...');

try {
  // Clear existing data
  console.log('🧹 Clearing existing data...');
  db.exec('DELETE FROM amana_deliveries');
  db.exec('DELETE FROM stock_movements');
  db.exec('DELETE FROM assets');
  db.exec('DELETE FROM asset_categories');
  db.exec('DELETE FROM staff_users');
  db.exec('DELETE FROM recipients');
  db.exec('DELETE FROM departments');
  db.exec('DELETE FROM zones');
  db.exec('DELETE FROM warehouses');

  // Insert warehouses
  console.log('📦 Inserting warehouses...');
  const insertWarehouse = db.prepare(`
    INSERT INTO warehouses (warehouse_code, warehouse_name, address, city, phone) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertWarehouse.run('WH-CASA-01', 'Entrepôt Principal Casablanca', 'Zone Industrielle Ain Sebaa', 'Casablanca', '+212522456789');
  insertWarehouse.run('WH-RAB-01', 'Entrepôt Central Rabat', 'Quartier Administratif Agdal', 'Rabat', '+212537654321');
  insertWarehouse.run('WH-FES-01', 'Entrepôt Régional Fès', 'Zone Industrielle Sidi Brahim', 'Fès', '+212535789456');

  // Insert zones
  console.log('🏗️ Inserting zones...');
  const insertZone = db.prepare(`
    INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertZone.run(1, 'ZONE-A1', 'Zone Mobilier Bureau', 'furniture', 500);
  insertZone.run(1, 'ZONE-A2', 'Zone Équipement IT', 'it_equipment', 300);
  insertZone.run(1, 'ZONE-A3', 'Zone Fournitures', 'office_supplies', 200);
  insertZone.run(2, 'ZONE-B1', 'Zone Mobilier Réception', 'furniture', 300);
  insertZone.run(2, 'ZONE-B2', 'Zone Informatique', 'it_equipment', 200);
  insertZone.run(3, 'ZONE-C1', 'Zone Stockage Principal', 'furniture', 400);

  // Insert departments
  console.log('🏛️ Inserting departments...');
  const insertDepartment = db.prepare(`
    INSERT INTO departments (department_code, department_name, responsible_person, phone, email) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertDepartment.run('MIN-INT', 'Ministère de l\'Intérieur', 'Ahmed Benali', '+212537123456', 'contact@interieur.gov.ma');
  insertDepartment.run('MIN-EDU', 'Ministère de l\'Éducation Nationale', 'Fatima El Mansouri', '+212537234567', 'contact@men.gov.ma');
  insertDepartment.run('MIN-SAN', 'Ministère de la Santé', 'Mohamed Cherif', '+212537345678', 'contact@sante.gov.ma');

  // Insert recipients
  console.log('👥 Inserting recipients...');
  const insertRecipient = db.prepare(`
    INSERT INTO recipients (first_name, last_name, cin, department_id, phone, email, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertRecipient.run('Youssef', 'Benabdellah', 'BE123456', 1, '+212661234567', 'y.benabdellah@interieur.gov.ma', 'Hay Riad, Rabat');
  insertRecipient.run('Khadija', 'El Fassi', 'EF234567', 2, '+212662345678', 'k.elfassi@men.gov.ma', 'Agdal, Rabat');
  insertRecipient.run('Omar', 'Benjelloun', 'BJ345678', 3, '+212663456789', 'o.benjelloun@sante.gov.ma', 'Souissi, Rabat');

  // Insert staff users
  console.log('👨‍💼 Inserting staff users...');
  const insertUser = db.prepare(`
    INSERT INTO staff_users (username, first_name, last_name, role, phone, email, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  insertUser.run('admin', 'System', 'Administrator', 'admin', '+212600000000', 'admin@ancfcc.ma', 'admin123');
  insertUser.run('manager.casa', 'Abdelkarim', 'Sabiri', 'warehouse_manager', '+212661111111', 'a.sabiri@ancfcc.ma', 'manager123');
  insertUser.run('operator.rabat', 'Laila', 'Moussaoui', 'operator', '+212662222222', 'l.moussaoui@ancfcc.ma', 'operator123');

  // Insert asset categories
  console.log('📂 Inserting asset categories...');
  const insertCategory = db.prepare(`
    INSERT INTO asset_categories (category_code, category_name, category_type) 
    VALUES (?, ?, ?)
  `);
  
  insertCategory.run('MOB-BUR', 'Mobilier de Bureau', 'furniture');
  insertCategory.run('MOB-ACC', 'Mobilier d\'Accueil', 'furniture');
  insertCategory.run('IT-ORD', 'Ordinateurs', 'it_equipment');
  insertCategory.run('IT-IMP', 'Imprimantes', 'it_equipment');
  insertCategory.run('IT-RES', 'Matériel Réseau', 'it_equipment');
  insertCategory.run('FOUR-BUR', 'Fournitures de Bureau', 'office_supplies');

  // Insert assets
  console.log('📦 Inserting assets...');
  const insertAsset = db.prepare(`
    INSERT INTO assets (barcode, category_id, asset_name, description, brand, model, 
    serial_number, condition_state, acquisition_date, acquisition_value, current_zone_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAsset.run('1234567890', 1, 'Bureau Exécutif Chêne', 'Bureau de direction en chêne massif', 'Steelcase', 'Executive Desk', 'ST001234', 'new', '2024-01-15', 8500.00, 1, 'available');
  insertAsset.run('1234567891', 1, 'Chaise de Bureau Ergonomique', 'Chaise ergonomique avec support lombaire', 'Herman Miller', 'Aeron', 'HM567890', 'good', '2024-02-10', 1200.00, 1, 'assigned');
  insertAsset.run('1234567892', 2, 'Canapé d\'Accueil 3 Places', 'Canapé en cuir pour zone d\'accueil', 'Knoll', 'Florence Sofa', 'KN123456', 'good', '2024-01-20', 3500.00, 4, 'available');
  insertAsset.run('1234567893', 3, 'Ordinateur Dell OptiPlex', 'PC de bureau Dell OptiPlex avec Windows 11', 'Dell', 'OptiPlex 7090', 'DL789012', 'new', '2024-03-01', 850.00, 2, 'in_transit');
  insertAsset.run('1234567894', 3, 'Laptop HP EliteBook', 'Ordinateur portable HP EliteBook 850', 'HP', 'EliteBook 850 G9', 'HP345678', 'new', '2024-03-15', 1200.00, 5, 'delivered');
  insertAsset.run('1234567895', 4, 'Imprimante Laser HP', 'Imprimante laser couleur HP LaserJet', 'HP', 'LaserJet Pro M454dn', 'HP901234', 'good', '2024-02-20', 450.00, 2, 'available');
  insertAsset.run('1234567896', 6, 'Lot Fournitures Bureau', 'Lot de fournitures de bureau diverses', 'Office Depot', 'Pack Standard', null, 'new', '2024-04-01', 125.00, 3, 'available');

  // Insert some movements
  console.log('🚚 Creating sample movements...');
  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (asset_id, movement_type, to_zone_id, user_id, notes) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  insertMovement.run(1, 'reception', 1, 1, 'Réception initiale du mobilier');
  insertMovement.run(2, 'storage', 1, 2, 'Stockage en zone mobilier');
  insertMovement.run(4, 'preparation', null, 1, 'Préparation pour livraison');
  insertMovement.run(5, 'delivery', null, 1, 'Livraison au Ministère de l\'Intérieur');

  console.log('✅ Database seeding completed successfully!');
  console.log(`
📊 Summary:
   - 3 warehouses
   - 6 zones  
   - 3 departments
   - 3 recipients
   - 3 staff users
   - 6 asset categories
   - 7 assets
   - 4 movements
  `);

} catch (error) {
  console.error('❌ Error seeding database:', error);
} finally {
  db.close();
}
