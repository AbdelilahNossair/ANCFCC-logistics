import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/ancfcc_warehouse.db');
const db = new Database(dbPath);

// Utility functions
let barcodeCounter = 1;
const generateBarcode = (): string => {
  const timestamp = Date.now().toString();
  const counter = barcodeCounter.toString().padStart(4, '0');
  barcodeCounter++;
  return `${timestamp}${counter}`.slice(-12);
};

const generateDeliveryReference = (): string => {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `AMANA-${timestamp}-${random}`;
};

const getRandomDate = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString().slice(0, 10);
};

const getRandomDateTime = (startDate: Date, endDate: Date): string => {
  const start = startDate.getTime();
  const end = endDate.getTime();
  const randomTime = start + Math.random() * (end - start);
  return new Date(randomTime).toISOString().replace('T', ' ').slice(0, 19);
};

console.log('🌱 Populating database with valid data (respecting constraints)...');

try {
  // Disable foreign keys for faster insertion
  db.pragma('foreign_keys = OFF');
  console.log('🔧 Foreign keys disabled for data insertion');
  
  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // Clear existing data in correct order
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

  // Reset sqlite_sequence for autoincrement tables if it exists
  const sequenceTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sqlite_sequence'").get();
  if (sequenceTableExists) {
    db.exec(`
      UPDATE sqlite_sequence SET seq = 0 WHERE name IN (
        'warehouses', 'zones', 'departments', 'recipients', 
        'staff_users', 'asset_categories', 'assets', 
        'stock_movements', 'amana_deliveries'
      );
    `);
  }

  // 1. Insert warehouses first (no dependencies)
  console.log('📦 Inserting warehouses...');
  const insertWarehouse = db.prepare(`
    INSERT INTO warehouses (warehouse_code, warehouse_name, address, city, phone) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const warehouseData = [
    ['WH-CASA-01', 'Entrepôt Principal Casablanca', 'Zone Industrielle Ain Sebaa, Rue 15', 'Casablanca', '+212522456789'],
    ['WH-RAB-01', 'Entrepôt Central Rabat', 'Quartier Administratif Agdal', 'Rabat', '+212537654321'],
    ['WH-FES-01', 'Entrepôt Régional Fès', 'Zone Industrielle Sidi Brahim', 'Fès', '+212535789456'],
    ['WH-MAR-01', 'Entrepôt Marrakech', 'Zone Industrielle Sidi Ghanem', 'Marrakech', '+212524567890'],
    ['WH-TAN-01', 'Entrepôt Tanger', 'Zone Franche de Tanger', 'Tanger', '+212539123456']
  ];

  const warehouseIds: number[] = [];
  for (const warehouse of warehouseData) {
    const result = insertWarehouse.run(...warehouse);
    warehouseIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Warehouses inserted with IDs:', warehouseIds);

  // 2. Insert zones (depends on warehouses)
  console.log('🏗️ Inserting zones...');
  const insertZone = db.prepare(`
    INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const zoneIds: number[] = [];
  
  // Casablanca warehouse zones (warehouseIds[0])
  const casaZones = [
    [warehouseIds[0], 'ZONE-A1', 'Zone Mobilier Bureau', 'furniture', 500],
    [warehouseIds[0], 'ZONE-A2', 'Zone Équipement IT', 'it_equipment', 300],
    [warehouseIds[0], 'ZONE-A3', 'Zone Fournitures', 'office_supplies', 200],
    [warehouseIds[0], 'ZONE-A4', 'Zone Documents', 'documents', 100]
  ];
  
  // Rabat warehouse zones (warehouseIds[1])
  const rabatZones = [
    [warehouseIds[1], 'ZONE-B1', 'Zone Mobilier Réception', 'furniture', 300],
    [warehouseIds[1], 'ZONE-B2', 'Zone Informatique', 'it_equipment', 200],
    [warehouseIds[1], 'ZONE-B3', 'Zone Stock Général', 'office_supplies', 150]
  ];
  
  // Fès warehouse zones (warehouseIds[2])
  const fesZones = [
    [warehouseIds[2], 'ZONE-C1', 'Zone Stockage Principal', 'furniture', 400],
    [warehouseIds[2], 'ZONE-C2', 'Zone Matériel Technique', 'it_equipment', 250]
  ];
  
  // Marrakech warehouse zones (warehouseIds[3])
  const marrakechZones = [
    [warehouseIds[3], 'ZONE-D1', 'Zone Mobilier Standard', 'furniture', 350],
    [warehouseIds[3], 'ZONE-D2', 'Zone Équipement Bureau', 'office_supplies', 180]
  ];
  
  // Tanger warehouse zones (warehouseIds[4])
  const tangerZones = [
    [warehouseIds[4], 'ZONE-E1', 'Zone Import/Export', 'furniture', 600],
    [warehouseIds[4], 'ZONE-E2', 'Zone Transit IT', 'it_equipment', 400]
  ];

  const allZones = [...casaZones, ...rabatZones, ...fesZones, ...marrakechZones, ...tangerZones];
  
  for (const zone of allZones) {
    const result = insertZone.run(...zone);
    zoneIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Zones inserted with IDs:', zoneIds);

  // 3. Insert departments (no dependencies)
  console.log('🏛️ Inserting departments...');
  const insertDepartment = db.prepare(`
    INSERT INTO departments (department_code, department_name, responsible_person, phone, email) 
    VALUES (?, ?, ?, ?, ?)
  `);

  const departmentData = [
    ['MIN-INT', 'Ministère de l\'Intérieur', 'Ahmed Benali', '+212537123456', 'contact@interieur.gov.ma'],
    ['MIN-EDU', 'Ministère de l\'Éducation Nationale', 'Fatima El Mansouri', '+212537234567', 'contact@men.gov.ma'],
    ['MIN-SAN', 'Ministère de la Santé', 'Mohamed Cherif', '+212537345678', 'contact@sante.gov.ma'],
    ['REG-CAS', 'Région de Casablanca-Settat', 'Aicha Hadri', '+212522456789', 'contact@casablanca-settat.ma'],
    ['PREF-RAB', 'Préfecture de Rabat', 'Hassan Alaoui', '+212537567890', 'contact@rabat.ma'],
    ['MIN-JUS', 'Ministère de la Justice', 'Laila Bennani', '+212537678901', 'contact@justice.gov.ma'],
    ['MIN-FIN', 'Ministère des Finances', 'Omar Zaki', '+212537789012', 'contact@finances.gov.ma'],
    ['REG-RAB', 'Région de Rabat-Salé-Kénitra', 'Zineb Alami', '+212537890123', 'contact@rabat-sale-kenitra.ma']
  ];

  const departmentIds: number[] = [];
  for (const department of departmentData) {
    const result = insertDepartment.run(...department);
    departmentIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Departments inserted with IDs:', departmentIds);

  // 4. Insert recipients (depends on departments)
  console.log('👥 Inserting recipients...');
  const insertRecipient = db.prepare(`
    INSERT INTO recipients (first_name, last_name, cin, department_id, phone, email, address) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const recipientData = [
    ['Youssef', 'Benabdellah', 'BE123456', departmentIds[0], '+212661234567', 'y.benabdellah@interieur.gov.ma', 'Hay Riad, Rabat'],
    ['Khadija', 'El Fassi', 'EF234567', departmentIds[1], '+212662345678', 'k.elfassi@men.gov.ma', 'Agdal, Rabat'],
    ['Omar', 'Benjelloun', 'BJ345678', departmentIds[2], '+212663456789', 'o.benjelloun@sante.gov.ma', 'Souissi, Rabat'],
    ['Samira', 'Chraibi', 'CH456789', departmentIds[3], '+212664567890', 's.chraibi@casablanca-settat.ma', 'Anfa, Casablanca'],
    ['Rachid', 'Tazi', 'TZ567890', departmentIds[4], '+212665678901', 'r.tazi@rabat.ma', 'Hassan, Rabat'],
    ['Amina', 'Semlali', 'SE678901', departmentIds[5], '+212666789012', 'a.semlali@justice.gov.ma', 'Oudayas, Rabat'],
    ['Hassan', 'Kadiri', 'KA789012', departmentIds[6], '+212667890123', 'h.kadiri@finances.gov.ma', 'Hay Saada, Rabat'],
    ['Nadia', 'Bennani', 'BE890123', departmentIds[7], '+212668901234', 'n.bennani@rabat-sale-kenitra.ma', 'Aviation, Rabat'],
    ['Karim', 'Alaoui', 'AL901234', departmentIds[0], '+212669012345', 'k.alaoui@interieur.gov.ma', 'Akkari, Rabat'],
    ['Fatima', 'Zahra', 'ZA012345', departmentIds[1], '+212670123456', 'f.zahra@men.gov.ma', 'Hay El Fath, Rabat']
  ];

  const recipientIds: number[] = [];
  for (const recipient of recipientData) {
    const result = insertRecipient.run(...recipient);
    recipientIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Recipients inserted with IDs:', recipientIds);

  // 5. Insert staff users (no dependencies)
  console.log('👨‍💼 Inserting staff users...');
  const insertStaff = db.prepare(`
    INSERT INTO staff_users (username, first_name, last_name, role, phone, email, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const staffData = [
    ['admin', 'System', 'Administrator', 'admin', '+212600000000', 'admin@ancfcc.ma', '$2b$10$hashedpassword1'],
    ['manager.casa', 'Abdelkarim', 'Sabiri', 'warehouse_manager', '+212661111111', 'a.sabiri@ancfcc.ma', '$2b$10$hashedpassword2'],
    ['operator.rabat', 'Laila', 'Moussaoui', 'operator', '+212662222222', 'l.moussaoui@ancfcc.ma', '$2b$10$hashedpassword3'],
    ['manager.fes', 'Said', 'Berrada', 'warehouse_manager', '+212663333333', 's.berrada@ancfcc.ma', '$2b$10$hashedpassword4'],
    ['operator.casa', 'Khalid', 'Ziani', 'operator', '+212664444444', 'k.ziani@ancfcc.ma', '$2b$10$hashedpassword5'],
    ['supervisor.mar', 'Aicha', 'Benali', 'supervisor', '+212665555555', 'a.benali@ancfcc.ma', '$2b$10$hashedpassword6']
  ];

  const staffIds: number[] = [];
  for (const staff of staffData) {
    const result = insertStaff.run(...staff);
    staffIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Staff users inserted with IDs:', staffIds);

  // 6. Insert asset categories (no dependencies)
  console.log('📂 Inserting asset categories...');
  const insertCategory = db.prepare(`
    INSERT INTO asset_categories (category_code, category_name, category_type) 
    VALUES (?, ?, ?)
  `);

  const categoryData = [
    ['MOB-BUR', 'Mobilier de Bureau', 'furniture'],
    ['MOB-ACC', 'Mobilier d\'Accueil', 'furniture'],
    ['IT-ORD', 'Ordinateurs', 'it_equipment'],
    ['IT-IMP', 'Imprimantes', 'it_equipment'],
    ['IT-RES', 'Matériel Réseau', 'it_equipment'],
    ['FOUR-BUR', 'Fournitures de Bureau', 'office_supplies'],
    ['DOC-ADM', 'Documents Administratifs', 'documents'],
    ['MOB-CONF', 'Mobilier de Conférence', 'furniture'],
    ['IT-SCAN', 'Scanners', 'it_equipment'],
    ['FOUR-ARCH', 'Fournitures Archivage', 'office_supplies']
  ];

  const categoryIds: number[] = [];
  for (const category of categoryData) {
    const result = insertCategory.run(...category);
    categoryIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Asset categories inserted with IDs:', categoryIds);

  // 7. Insert assets (depends on categories and zones)
  console.log('📦 Inserting assets...');
  const insertAsset = db.prepare(`
    INSERT INTO assets (barcode, category_id, asset_name, description, brand, model, serial_number, condition_state, acquisition_date, acquisition_value, current_zone_id, status) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Date range for acquisitions (last 6 months)
  const startDate = new Date('2024-01-01');
  const endDate = new Date('2024-06-30');

  const assetData = [
    // Furniture assets (using actual category and zone IDs)
    [generateBarcode(), categoryIds[0], 'Bureau Exécutif Chêne', 'Bureau de direction en chêne massif avec tiroirs', 'Steelcase', 'Executive Desk', 'ST001234', 'new', getRandomDate(startDate, endDate), 8500.00, zoneIds[0], 'available'],
    [generateBarcode(), categoryIds[0], 'Chaise de Bureau Ergonomique', 'Chaise ergonomique avec support lombaire', 'Herman Miller', 'Aeron', 'HM567890', 'good', getRandomDate(startDate, endDate), 1200.00, zoneIds[0], 'assigned'],
    [generateBarcode(), categoryIds[1], 'Canapé d\'Accueil 3 Places', 'Canapé en cuir pour zone d\'accueil', 'Knoll', 'Florence Sofa', 'KN123456', 'good', getRandomDate(startDate, endDate), 3500.00, zoneIds[4], 'available'],
    [generateBarcode(), categoryIds[7], 'Table de Réunion', 'Table de réunion pour 8 personnes', 'IKEA', 'Conference Table', 'IK789123', 'good', getRandomDate(startDate, endDate), 750.00, zoneIds[0], 'available'],
    [generateBarcode(), categoryIds[0], 'Armoire de Bureau', 'Armoire métallique avec serrure', 'Bisley', 'Office Cabinet', 'BS456789', 'new', getRandomDate(startDate, endDate), 650.00, zoneIds[4], 'available'],
    
    // IT Equipment (using actual category and zone IDs)
    [generateBarcode(), categoryIds[2], 'Ordinateur Dell OptiPlex', 'PC de bureau Dell OptiPlex avec Windows 11', 'Dell', 'OptiPlex 7090', 'DL789012', 'new', getRandomDate(startDate, endDate), 850.00, zoneIds[1], 'in_transit'],
    [generateBarcode(), categoryIds[2], 'Laptop HP EliteBook', 'Ordinateur portable HP EliteBook 850', 'HP', 'EliteBook 850 G9', 'HP345678', 'new', getRandomDate(startDate, endDate), 1200.00, zoneIds[5], 'delivered'],
    [generateBarcode(), categoryIds[2], 'MacBook Pro', 'MacBook Pro 16 pouces M2', 'Apple', 'MacBook Pro 16', 'AP456789', 'new', getRandomDate(startDate, endDate), 2500.00, zoneIds[1], 'assigned'],
    [generateBarcode(), categoryIds[3], 'Imprimante Laser HP', 'Imprimante laser couleur HP LaserJet', 'HP', 'LaserJet Pro M454dn', 'HP901234', 'good', getRandomDate(startDate, endDate), 450.00, zoneIds[1], 'available'],
    [generateBarcode(), categoryIds[8], 'Scanner Canon', 'Scanner haute résolution Canon', 'Canon', 'imageFORMULA', 'CN123789', 'good', getRandomDate(startDate, endDate), 320.00, zoneIds[1], 'available'],
    [generateBarcode(), categoryIds[4], 'Switch Réseau', 'Switch 24 ports Gigabit', 'Cisco', 'Catalyst 2960', 'CS789456', 'new', getRandomDate(startDate, endDate), 890.00, zoneIds[8], 'available'],
    [generateBarcode(), categoryIds[4], 'Routeur WiFi', 'Routeur WiFi 6 professionnel', 'Ubiquiti', 'UniFi Dream Machine', 'UB123456', 'new', getRandomDate(startDate, endDate), 380.00, zoneIds[8], 'available'],
    
    // Office Supplies (using actual category and zone IDs)
    [generateBarcode(), categoryIds[5], 'Lot Fournitures Bureau', 'Lot de fournitures de bureau diverses', 'Office Depot', 'Pack Standard', null, 'new', getRandomDate(startDate, endDate), 125.00, zoneIds[2], 'available'],
    [generateBarcode(), categoryIds[9], 'Classeurs Archivage', 'Lot de 50 classeurs pour archivage', 'Esselte', 'Lever Arch File', 'ES789012', 'new', getRandomDate(startDate, endDate), 85.00, zoneIds[6], 'available'],
    [generateBarcode(), categoryIds[5], 'Papeterie Complete', 'Kit complet de papeterie de bureau', 'Papyrus', 'Office Kit Pro', 'PY345678', 'new', getRandomDate(startDate, endDate), 95.00, zoneIds[10], 'available'],
    
    // More furniture for different warehouses (using actual zone IDs)
    [generateBarcode(), categoryIds[0], 'Bureau Standard', 'Bureau standard avec caisson', 'Gautier Office', 'Standard Desk', 'GO567890', 'good', getRandomDate(startDate, endDate), 450.00, zoneIds[9], 'available'],
    [generateBarcode(), categoryIds[1], 'Fauteuil Visiteur', 'Fauteuil pour visiteur en tissu', 'Steelcase', 'Please Chair', 'ST234567', 'good', getRandomDate(startDate, endDate), 285.00, zoneIds[9], 'available'],
    [generateBarcode(), categoryIds[7], 'Table Ronde Réunion', 'Table ronde pour 6 personnes', 'Herman Miller', 'Round Meeting Table', 'HM890123', 'new', getRandomDate(startDate, endDate), 1200.00, zoneIds[11], 'available'],
    
    // Additional IT equipment (using actual zone IDs)
    [generateBarcode(), categoryIds[2], 'PC Portable Lenovo', 'ThinkPad X1 Carbon', 'Lenovo', 'ThinkPad X1 Carbon', 'LV456789', 'new', getRandomDate(startDate, endDate), 1500.00, zoneIds[12], 'available'],
    [generateBarcode(), categoryIds[3], 'Imprimante 3D', 'Imprimante 3D professionnelle', 'Ultimaker', 'S3', 'UM678901', 'new', getRandomDate(startDate, endDate), 3200.00, zoneIds[8], 'available']
  ];

  const assetIds: number[] = [];
  for (const asset of assetData) {
    const result = insertAsset.run(...asset);
    assetIds.push(result.lastInsertRowid as number);
  }
  console.log('✅ Assets inserted with IDs:', assetIds);

  // 8. Insert stock movements (depends on assets, zones, recipients, staff)
  console.log('🚚 Inserting stock movements...');
  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (asset_id, movement_type, from_zone_id, to_zone_id, recipient_id, user_id, movement_date, notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const movementData = [
    // Reception movements (using actual IDs)
    [assetIds[0], 'reception', null, zoneIds[0], null, staffIds[0], getRandomDateTime(startDate, endDate), 'Réception initiale du mobilier exécutif'],
    [assetIds[1], 'reception', null, zoneIds[0], null, staffIds[1], getRandomDateTime(startDate, endDate), 'Réception chaise ergonomique'],
    [assetIds[5], 'reception', null, zoneIds[1], null, staffIds[2], getRandomDateTime(startDate, endDate), 'Réception ordinateur Dell'],
    [assetIds[6], 'reception', null, zoneIds[5], null, staffIds[3], getRandomDateTime(startDate, endDate), 'Réception laptop HP'],
    [assetIds[7], 'reception', null, zoneIds[1], null, staffIds[0], getRandomDateTime(startDate, endDate), 'Réception MacBook Pro'],
    
    // Storage movements
    [assetIds[1], 'storage', zoneIds[0], zoneIds[0], null, staffIds[1], getRandomDateTime(startDate, endDate), 'Stockage en zone mobilier'],
    [assetIds[8], 'storage', zoneIds[1], zoneIds[1], null, staffIds[2], getRandomDateTime(startDate, endDate), 'Stockage imprimante laser'],
    [assetIds[9], 'storage', zoneIds[1], zoneIds[1], null, staffIds[2], getRandomDateTime(startDate, endDate), 'Stockage scanner'],
    
    // Preparation movements
    [assetIds[5], 'preparation', zoneIds[1], null, null, staffIds[0], getRandomDateTime(startDate, endDate), 'Préparation pour livraison Dell'],
    [assetIds[6], 'preparation', zoneIds[5], null, null, staffIds[3], getRandomDateTime(startDate, endDate), 'Préparation laptop HP'],
    
    // Delivery movements
    [assetIds[6], 'delivery', null, null, recipientIds[0], staffIds[0], getRandomDateTime(startDate, endDate), 'Livraison laptop au Ministère de l\'Intérieur'],
    [assetIds[7], 'delivery', null, null, recipientIds[1], staffIds[1], getRandomDateTime(startDate, endDate), 'Livraison MacBook au Ministère de l\'Éducation'],
    
    // Transfer movements
    [assetIds[12], 'transfer', zoneIds[2], zoneIds[6], null, staffIds[4], getRandomDateTime(startDate, endDate), 'Transfert fournitures vers archivage'],
    [assetIds[15], 'transfer', zoneIds[9], zoneIds[11], null, staffIds[5], getRandomDateTime(startDate, endDate), 'Transfert mobilier entre zones']
  ];

  for (const movement of movementData) {
    insertMovement.run(...movement);
  }

  // 9. Insert Amana deliveries (depends on assets, recipients, staff)
  console.log('🚛 Inserting Amana deliveries...');
  const insertDelivery = db.prepare(`
    INSERT INTO amana_deliveries (delivery_reference, asset_id, recipient_id, handover_date, handover_user_id, amana_agent_name, amana_agent_phone, delivery_status, delivery_date, feedback_notes) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deliveryData = [
    [generateDeliveryReference(), assetIds[6], recipientIds[0], getRandomDateTime(startDate, endDate), staffIds[0], 'Mohamed Bennani', '+212670123456', 'delivered', getRandomDateTime(startDate, endDate), 'Livraison effectuée avec succès - Laptop HP reçu en parfait état'],
    [generateDeliveryReference(), assetIds[7], recipientIds[1], getRandomDateTime(startDate, endDate), staffIds[1], 'Fatima Zahra', '+212671234567', 'delivered', getRandomDateTime(startDate, endDate), 'MacBook Pro livré et configuré'],
    [generateDeliveryReference(), assetIds[5], recipientIds[2], getRandomDateTime(startDate, endDate), staffIds[2], 'Hassan Alami', '+212672345678', 'pending', null, null],
    [generateDeliveryReference(), assetIds[8], recipientIds[3], getRandomDateTime(startDate, endDate), staffIds[0], 'Aicha Semlali', '+212673456789', 'in_transit', null, null],
    [generateDeliveryReference(), assetIds[18], recipientIds[4], getRandomDateTime(startDate, endDate), staffIds[3], 'Omar Kadiri', '+212674567890', 'pending', null, null]
  ];

  for (const delivery of deliveryData) {
    insertDelivery.run(...delivery);
  }

  // Commit transaction and re-enable foreign keys
  db.exec('COMMIT');
  db.pragma('foreign_keys = ON');
  console.log('✅ Foreign keys re-enabled');

  console.log('✅ Database populated successfully with valid data!');
  
  // Show summary with actual counts
  const counts = {
    warehouses: (db.prepare('SELECT COUNT(*) as count FROM warehouses').get() as any).count,
    zones: (db.prepare('SELECT COUNT(*) as count FROM zones').get() as any).count,
    departments: (db.prepare('SELECT COUNT(*) as count FROM departments').get() as any).count,
    recipients: (db.prepare('SELECT COUNT(*) as count FROM recipients').get() as any).count,
    staff_users: (db.prepare('SELECT COUNT(*) as count FROM staff_users').get() as any).count,
    asset_categories: (db.prepare('SELECT COUNT(*) as count FROM asset_categories').get() as any).count,
    assets: (db.prepare('SELECT COUNT(*) as count FROM assets').get() as any).count,
    movements: (db.prepare('SELECT COUNT(*) as count FROM stock_movements').get() as any).count,
    deliveries: (db.prepare('SELECT COUNT(*) as count FROM amana_deliveries').get() as any).count
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

  // Verify data integrity with foreign keys enabled
  console.log('🔍 Verifying data integrity...');
  
  // Check foreign key constraints
  const fkChecks = [
    { child: 'zones', parent: 'warehouses', fk: 'warehouse_id', pk: 'warehouse_id' },
    { child: 'recipients', parent: 'departments', fk: 'department_id', pk: 'department_id' },
    { child: 'assets', parent: 'asset_categories', fk: 'category_id', pk: 'category_id' },
    { child: 'assets', parent: 'zones', fk: 'current_zone_id', pk: 'zone_id' },
    { child: 'stock_movements', parent: 'assets', fk: 'asset_id', pk: 'asset_id' },
    { child: 'stock_movements', parent: 'staff_users', fk: 'user_id', pk: 'user_id' },
    { child: 'amana_deliveries', parent: 'assets', fk: 'asset_id', pk: 'asset_id' },
    { child: 'amana_deliveries', parent: 'recipients', fk: 'recipient_id', pk: 'recipient_id' },
    { child: 'amana_deliveries', parent: 'staff_users', fk: 'handover_user_id', pk: 'user_id' }
  ];

  let hasBrokenFKs = false;
  for (const check of fkChecks) {
    const result = db.prepare(`
      SELECT COUNT(*) as count 
      FROM ${check.child} c 
      LEFT JOIN ${check.parent} p ON c.${check.fk} = p.${check.pk}
      WHERE c.${check.fk} IS NOT NULL AND p.${check.pk} IS NULL
    `).get() as any;
    
    if (result.count > 0) {
      console.error(`❌ Found ${result.count} broken foreign key references in ${check.child}.${check.fk}`);
      hasBrokenFKs = true;
    }
  }

  if (!hasBrokenFKs) {
    console.log('✅ Data integrity verification passed - all foreign key constraints are satisfied!');
  } else {
    console.error('❌ Data integrity verification failed - foreign key constraint violations found!');
  }

} catch (error) {
  console.error('❌ Error populating database:', error);
  // Rollback transaction on error
  try {
    db.exec('ROLLBACK');
  } catch (rollbackError) {
    console.error('❌ Error rolling back transaction:', rollbackError);
  }
} finally {
  db.close();
}
