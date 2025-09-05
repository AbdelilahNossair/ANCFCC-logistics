import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');
const db = new Database(dbPath);

console.log('🌱 Populating database with dummy data...');

try {
  // Disable foreign keys temporarily
  db.pragma('foreign_keys = OFF');

  // Clear existing data
  console.log('🧹 Clearing existing data...');
  db.exec(`
    DELETE FROM amana_deliveries;
    DELETE FROM stock_movements;
    DELETE FROM assets;
    DELETE FROM asset_categories;
    DELETE FROM staff_users;
    DELETE FROM recipients;
    DELETE FROM departments;
    DELETE FROM zones;
    DELETE FROM warehouses;
  `);

  // Insert warehouses
  console.log('📦 Inserting warehouses...');
  const insertWarehouse = db.prepare(`
    INSERT INTO warehouses (warehouse_code, warehouse_name, address, city, phone) 
    VALUES (?, ?, ?, ?, ?)
  `);

  insertWarehouse.run('WH-CASA-01', 'Entrepôt Principal Casablanca', 'Zone Industrielle Ain Sebaa, Rue 15', 'Casablanca', '+212522456789');
  insertWarehouse.run('WH-RAB-01', 'Entrepôt Central Rabat', 'Quartier Administratif Agdal', 'Rabat', '+212537654321');
  insertWarehouse.run('WH-FES-01', 'Entrepôt Régional Fès', 'Zone Industrielle Sidi Brahim', 'Fès', '+212535789456');

  // Insert zones
  console.log('🏗️ Inserting zones...');
  const insertZone = db.prepare(`
    INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) 
    VALUES (?, ?, ?, ?, ?)
  `);

  // Casablanca warehouse zones
  insertZone.run(1, 'ZONE-A1', 'Zone Mobilier Bureau', 'furniture', 500);
  insertZone.run(1, 'ZONE-A2', 'Zone Équipement IT', 'it_equipment', 300);
  insertZone.run(1, 'ZONE-A3', 'Zone Fournitures', 'office_supplies', 200);
  insertZone.run(1, 'ZONE-A4', 'Zone Documents', 'documents', 100);
  
  // Rabat warehouse zones
  insertZone.run(2, 'ZONE-B1', 'Zone Mobilier Réception', 'furniture', 300);
  insertZone.run(2, 'ZONE-B2', 'Zone Informatique', 'it_equipment', 200);
  insertZone.run(2, 'ZONE-B3', 'Zone Stock Général', 'office_supplies', 150);
  
  // Fès warehouse zones
  insertZone.run(3, 'ZONE-C1', 'Zone Stockage Principal', 'furniture', 400);
  insertZone.run(3, 'ZONE-C2', 'Zone Matériel Technique', 'it_equipment', 250);

  // Insert departments
  console.log('🏛️ Inserting departments...');
  const insertDepartment = db.prepare(`
    INSERT INTO departments (department_code, department_name, responsible_person, phone, email) 
    VALUES (?, ?, ?, ?, ?)
  `);

  insertDepartment.run('MIN-INT', 'Ministère de l\'Intérieur', 'Ahmed Benali', '+212537123456', 'contact@interieur.gov.ma');
  insertDepartment.run('MIN-EDU', 'Ministère de l\'Éducation Nationale', 'Fatima El Mansouri', '+212537234567', 'contact@men.gov.ma');
  insertDepartment.run('MIN-SAN', 'Ministère de la Santé', 'Mohamed Cherif', '+212537345678', 'contact@sante.gov.ma');
  insertDepartment.run('REG-CAS', 'Région de Casablanca-Settat', 'Aicha Hadri', '+212522456789', 'contact@casablanca-settat.ma');
  insertDepartment.run('PREF-RAB', 'Préfecture de Rabat', 'Hassan Alaoui', '+212537567890', 'contact@rabat.ma');

  // Insert recipients
  console.log('👥 Inserting recipients...');
  const insertRecipient = db.prepare(`
    INSERT INTO recipients (first_name, last_name, cin, department_id, phone, email, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertRecipient.run('Youssef', 'Benabdellah', 'BE123456', 1, '+212661234567', 'y.benabdellah@interieur.gov.ma', 'Hay Riad, Rabat');
  insertRecipient.run('Khadija', 'El Fassi', 'EF234567', 2, '+212662345678', 'k.elfassi@men.gov.ma', 'Agdal, Rabat');
  insertRecipient.run('Omar', 'Benjelloun', 'BJ345678', 3, '+212663456789', 'o.benjelloun@sante.gov.ma', 'Souissi, Rabat');
  insertRecipient.run('Samira', 'Chraibi', 'CH456789', 4, '+212664567890', 's.chraibi@casablanca-settat.ma', 'Anfa, Casablanca');
  insertRecipient.run('Rachid', 'Tazi', 'TZ567890', 5, '+212665678901', 'r.tazi@rabat.ma', 'Hassan, Rabat');

  // Insert staff users
  console.log('👨‍💼 Inserting staff users...');
  const insertStaff = db.prepare(`
    INSERT INTO staff_users (username, first_name, last_name, role, phone, email, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertStaff.run('admin', 'System', 'Administrator', 'admin', '+212600000000', 'admin@ancfcc.ma', 'hashed_password');
  insertStaff.run('manager.casa', 'Abdelkarim', 'Sabiri', 'warehouse_manager', '+212661111111', 'a.sabiri@ancfcc.ma', 'hashed_password');
  insertStaff.run('operator.rabat', 'Laila', 'Moussaoui', 'operator', '+212662222222', 'l.moussaoui@ancfcc.ma', 'hashed_password');

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
  insertCategory.run('DOC-ADM', 'Documents Administratifs', 'documents');

  // Insert assets
  console.log('📦 Inserting assets...');
  const insertAsset = db.prepare(`
    INSERT INTO assets (barcode, category_id, asset_name, description, brand, model, serial_number, condition_state, acquisition_date, acquisition_value, current_zone_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate some barcodes
  const generateBarcode = () => Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

  insertAsset.run(generateBarcode(), 1, 'Bureau Exécutif Chêne', 'Bureau de direction en chêne massif avec tiroirs', 'Steelcase', 'Executive Desk', 'ST001234', 'new', '2024-01-15', 8500.00, 1, 'available');
  insertAsset.run(generateBarcode(), 1, 'Chaise de Bureau Ergonomique', 'Chaise ergonomique avec support lombaire', 'Herman Miller', 'Aeron', 'HM567890', 'good', '2024-02-10', 1200.00, 1, 'assigned');
  insertAsset.run(generateBarcode(), 2, 'Canapé d\'Accueil 3 Places', 'Canapé en cuir pour zone d\'accueil', 'Knoll', 'Florence Sofa', 'KN123456', 'good', '2024-01-20', 3500.00, 5, 'available');
  insertAsset.run(generateBarcode(), 3, 'Ordinateur Dell OptiPlex', 'PC de bureau Dell OptiPlex avec Windows 11', 'Dell', 'OptiPlex 7090', 'DL789012', 'new', '2024-03-01', 850.00, 2, 'in_transit');
  insertAsset.run(generateBarcode(), 3, 'Laptop HP EliteBook', 'Ordinateur portable HP EliteBook 850', 'HP', 'EliteBook 850 G9', 'HP345678', 'new', '2024-03-15', 1200.00, 6, 'delivered');
  insertAsset.run(generateBarcode(), 4, 'Imprimante Laser HP', 'Imprimante laser couleur HP LaserJet', 'HP', 'LaserJet Pro M454dn', 'HP901234', 'good', '2024-02-20', 450.00, 2, 'available');
  insertAsset.run(generateBarcode(), 6, 'Lot Fournitures Bureau', 'Lot de fournitures de bureau diverses', 'Office Depot', 'Pack Standard', null, 'new', '2024-04-01', 125.00, 3, 'available');
  insertAsset.run(generateBarcode(), 1, 'Table de Réunion', 'Table de réunion pour 8 personnes', 'IKEA', 'Conference Table', 'IK789123', 'good', '2024-01-25', 750.00, 1, 'available');
  insertAsset.run(generateBarcode(), 3, 'MacBook Pro', 'MacBook Pro 16 pouces M2', 'Apple', 'MacBook Pro 16', 'AP456789', 'new', '2024-04-10', 2500.00, 2, 'assigned');
  insertAsset.run(generateBarcode(), 4, 'Scanner Canon', 'Scanner haute résolution Canon', 'Canon', 'imageFORMULA', 'CN123789', 'good', '2024-03-05', 320.00, 2, 'available');

  // Insert some movements
  console.log('🚚 Inserting movements...');
  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (asset_id, movement_type, from_zone_id, to_zone_id, recipient_id, user_id, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertMovement.run(1, 'reception', null, 1, null, 1, 'Réception initiale du mobilier');
  insertMovement.run(2, 'storage', 1, 1, null, 2, 'Stockage en zone mobilier');
  insertMovement.run(4, 'preparation', 2, null, null, 1, 'Préparation pour livraison');
  insertMovement.run(5, 'delivery', null, null, 1, 1, 'Livraison au Ministère de l\'Intérieur');
  insertMovement.run(9, 'reception', null, 2, null, 1, 'Réception MacBook Pro');
  insertMovement.run(9, 'storage', 2, 2, null, 2, 'Stockage en zone IT');

  // Insert some deliveries
  console.log('🚛 Inserting deliveries...');
  const insertDelivery = db.prepare(`
    INSERT INTO amana_deliveries (delivery_reference, asset_id, recipient_id, handover_date, handover_user_id, amana_agent_name, amana_agent_phone, delivery_status, delivery_date, feedback_notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const generateDeliveryRef = () => 'AMANA-' + Date.now().toString().slice(-8) + '-' + Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  insertDelivery.run(generateDeliveryRef(), 5, 1, '2024-04-15 10:00:00', 1, 'Mohamed Bennani', '+212670123456', 'delivered', '2024-04-15 14:30:00', 'Livraison effectuée avec succès');
  insertDelivery.run(generateDeliveryRef(), 4, 2, '2024-04-20 09:00:00', 2, 'Fatima Zahra', '+212671234567', 'pending', null, null);

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');

  console.log('✅ Database populated successfully!');
  
  // Show summary
  const counts = {
    warehouses: db.prepare('SELECT COUNT(*) as count FROM warehouses').get().count,
    zones: db.prepare('SELECT COUNT(*) as count FROM zones').get().count,
    departments: db.prepare('SELECT COUNT(*) as count FROM departments').get().count,
    recipients: db.prepare('SELECT COUNT(*) as count FROM recipients').get().count,
    staff_users: db.prepare('SELECT COUNT(*) as count FROM staff_users').get().count,
    asset_categories: db.prepare('SELECT COUNT(*) as count FROM asset_categories').get().count,
    assets: db.prepare('SELECT COUNT(*) as count FROM assets').get().count,
    movements: db.prepare('SELECT COUNT(*) as count FROM stock_movements').get().count,
    deliveries: db.prepare('SELECT COUNT(*) as count FROM amana_deliveries').get().count
  };

  console.log(`
📊 Summary:
   - ${counts.warehouses} warehouses
   - ${counts.zones} zones  
   - ${counts.departments} departments
   - ${counts.recipients} recipients
   - ${counts.staff_users} staff users
   - ${counts.asset_categories} asset categories
   - ${counts.assets} assets
   - ${counts.movements} movements
   - ${counts.deliveries} deliveries
  `);

} catch (error) {
  console.error('❌ Error populating database:', error);
} finally {
  db.close();
}
