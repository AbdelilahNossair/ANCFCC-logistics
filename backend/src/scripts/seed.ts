import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool, { setupDatabase } from '../config/database.js';
import { generateBarcode, generateDeliveryReference, hashPassword } from '../utils/helpers.js';

// Sample data for Moroccan context
const warehousesData = [
  {
    warehouse_code: 'WH-CASA-01',
    warehouse_name: 'Entrepôt Principal Casablanca',
    address: 'Zone Industrielle Ain Sebaa, Rue 15',
    city: 'Casablanca',
    phone: '+212522456789'
  },
  {
    warehouse_code: 'WH-RAB-01',
    warehouse_name: 'Entrepôt Central Rabat',
    address: 'Quartier Administratif Agdal',
    city: 'Rabat',
    phone: '+212537654321'
  },
  {
    warehouse_code: 'WH-FES-01',
    warehouse_name: 'Entrepôt Régional Fès',
    address: 'Zone Industrielle Sidi Brahim',
    city: 'Fès',
    phone: '+212535789456'
  }
];

const zonesData = [
  // Casablanca warehouse zones
  { warehouse_id: 1, zone_code: 'ZONE-A1', zone_name: 'Zone Mobilier Bureau', zone_type: 'furniture', capacity: 500 },
  { warehouse_id: 1, zone_code: 'ZONE-A2', zone_name: 'Zone Équipement IT', zone_type: 'it_equipment', capacity: 300 },
  { warehouse_id: 1, zone_code: 'ZONE-A3', zone_name: 'Zone Fournitures', zone_type: 'office_supplies', capacity: 200 },
  { warehouse_id: 1, zone_code: 'ZONE-A4', zone_name: 'Zone Documents', zone_type: 'documents', capacity: 100 },
  
  // Rabat warehouse zones
  { warehouse_id: 2, zone_code: 'ZONE-B1', zone_name: 'Zone Mobilier Réception', zone_type: 'furniture', capacity: 300 },
  { warehouse_id: 2, zone_code: 'ZONE-B2', zone_name: 'Zone Informatique', zone_type: 'it_equipment', capacity: 200 },
  { warehouse_id: 2, zone_code: 'ZONE-B3', zone_name: 'Zone Stock Général', zone_type: 'office_supplies', capacity: 150 },
  
  // Fès warehouse zones
  { warehouse_id: 3, zone_code: 'ZONE-C1', zone_name: 'Zone Stockage Principal', zone_type: 'furniture', capacity: 400 },
  { warehouse_id: 3, zone_code: 'ZONE-C2', zone_name: 'Zone Matériel Technique', zone_type: 'it_equipment', capacity: 250 }
];

const departmentsData = [
  {
    department_code: 'MIN-INT',
    department_name: 'Ministère de l\'Intérieur',
    responsible_person: 'Ahmed Benali',
    phone: '+212537123456',
    email: 'contact@interieur.gov.ma'
  },
  {
    department_code: 'MIN-EDU',
    department_name: 'Ministère de l\'Éducation Nationale',
    responsible_person: 'Fatima El Mansouri',
    phone: '+212537234567',
    email: 'contact@men.gov.ma'
  },
  {
    department_code: 'MIN-SAN',
    department_name: 'Ministère de la Santé',
    responsible_person: 'Mohamed Cherif',
    phone: '+212537345678',
    email: 'contact@sante.gov.ma'
  },
  {
    department_code: 'REG-CAS',
    department_name: 'Région de Casablanca-Settat',
    responsible_person: 'Aicha Hadri',
    phone: '+212522456789',
    email: 'contact@casablanca-settat.ma'
  },
  {
    department_code: 'PREF-RAB',
    department_name: 'Préfecture de Rabat',
    responsible_person: 'Hassan Alaoui',
    phone: '+212537567890',
    email: 'contact@rabat.ma'
  }
];

const recipientsData = [
  {
    first_name: 'Youssef',
    last_name: 'Benabdellah',
    cin: 'BE123456',
    department_id: 1,
    phone: '+212661234567',
    email: 'y.benabdellah@interieur.gov.ma',
    address: 'Hay Riad, Rabat'
  },
  {
    first_name: 'Khadija',
    last_name: 'El Fassi',
    cin: 'EF234567',
    department_id: 2,
    phone: '+212662345678',
    email: 'k.elfassi@men.gov.ma',
    address: 'Agdal, Rabat'
  },
  {
    first_name: 'Omar',
    last_name: 'Benjelloun',
    cin: 'BJ345678',
    department_id: 3,
    phone: '+212663456789',
    email: 'o.benjelloun@sante.gov.ma',
    address: 'Souissi, Rabat'
  },
  {
    first_name: 'Samira',
    last_name: 'Chraibi',
    cin: 'CH456789',
    department_id: 4,
    phone: '+212664567890',
    email: 's.chraibi@casablanca-settat.ma',
    address: 'Anfa, Casablanca'
  },
  {
    first_name: 'Rachid',
    last_name: 'Tazi',
    cin: 'TZ567890',
    department_id: 5,
    phone: '+212665678901',
    email: 'r.tazi@rabat.ma',
    address: 'Hassan, Rabat'
  }
];

const staffUsersData = [
  {
    username: 'admin',
    first_name: 'System',
    last_name: 'Administrator',
    role: 'admin',
    phone: '+212600000000',
    email: 'admin@ancfcc.ma',
    password_hash: hashPassword('admin123')
  },
  {
    username: 'manager.casa',
    first_name: 'Abdelkarim',
    last_name: 'Sabiri',
    role: 'warehouse_manager',
    phone: '+212661111111',
    email: 'a.sabiri@ancfcc.ma',
    password_hash: hashPassword('manager123')
  },
  {
    username: 'operator.rabat',
    first_name: 'Laila',
    last_name: 'Moussaoui',
    role: 'operator',
    phone: '+212662222222',
    email: 'l.moussaoui@ancfcc.ma',
    password_hash: hashPassword('operator123')
  }
];

const assetCategoriesData = [
  {
    category_code: 'MOB-BUR',
    category_name: 'Mobilier de Bureau',
    category_type: 'furniture'
  },
  {
    category_code: 'MOB-ACC',
    category_name: 'Mobilier d\'Accueil',
    category_type: 'furniture'
  },
  {
    category_code: 'IT-ORD',
    category_name: 'Ordinateurs',
    category_type: 'it_equipment'
  },
  {
    category_code: 'IT-IMP',
    category_name: 'Imprimantes',
    category_type: 'it_equipment'
  },
  {
    category_code: 'IT-RES',
    category_name: 'Matériel Réseau',
    category_type: 'it_equipment'
  },
  {
    category_code: 'FOUR-BUR',
    category_name: 'Fournitures de Bureau',
    category_type: 'office_supplies'
  },
  {
    category_code: 'DOC-ADM',
    category_name: 'Documents Administratifs',
    category_type: 'documents'
  }
];

const assetsData = [
  // Furniture
  {
    barcode: generateBarcode(),
    category_id: 1,
    asset_name: 'Bureau Exécutif Chêne',
    description: 'Bureau de direction en chêne massif avec tiroirs',
    brand: 'Steelcase',
    model: 'Executive Desk',
    serial_number: 'ST001234',
    condition_state: 'new',
    acquisition_date: '2024-01-15',
    acquisition_value: 8500.00,
    current_zone_id: 1,
    status: 'available'
  },
  {
    barcode: generateBarcode(),
    category_id: 1,
    asset_name: 'Chaise de Bureau Ergonomique',
    description: 'Chaise ergonomique avec support lombaire',
    brand: 'Herman Miller',
    model: 'Aeron',
    serial_number: 'HM567890',
    condition_state: 'good',
    acquisition_date: '2024-02-10',
    acquisition_value: 1200.00,
    current_zone_id: 1,
    status: 'assigned'
  },
  {
    barcode: generateBarcode(),
    category_id: 2,
    asset_name: 'Canapé d\'Accueil 3 Places',
    description: 'Canapé en cuir pour zone d\'accueil',
    brand: 'Knoll',
    model: 'Florence Sofa',
    serial_number: 'KN123456',
    condition_state: 'good',
    acquisition_date: '2024-01-20',
    acquisition_value: 3500.00,
    current_zone_id: 5,
    status: 'available'
  },
  
  // IT Equipment
  {
    barcode: generateBarcode(),
    category_id: 3,
    asset_name: 'Ordinateur Dell OptiPlex',
    description: 'PC de bureau Dell OptiPlex avec Windows 11',
    brand: 'Dell',
    model: 'OptiPlex 7090',
    serial_number: 'DL789012',
    marche_info: 'Marché n°2024-IT-001',
    condition_state: 'new',
    acquisition_date: '2024-03-01',
    acquisition_value: 850.00,
    current_zone_id: 2,
    status: 'in_transit'
  },
  {
    barcode: generateBarcode(),
    category_id: 3,
    asset_name: 'Laptop HP EliteBook',
    description: 'Ordinateur portable HP EliteBook 850',
    brand: 'HP',
    model: 'EliteBook 850 G9',
    serial_number: 'HP345678',
    marche_info: 'Marché n°2024-IT-002',
    condition_state: 'new',
    acquisition_date: '2024-03-15',
    acquisition_value: 1200.00,
    current_zone_id: 6,
    status: 'delivered'
  },
  {
    barcode: generateBarcode(),
    category_id: 4,
    asset_name: 'Imprimante Laser HP',
    description: 'Imprimante laser couleur HP LaserJet',
    brand: 'HP',
    model: 'LaserJet Pro M454dn',
    serial_number: 'HP901234',
    marche_info: 'Marché n°2024-IT-003',
    condition_state: 'good',
    acquisition_date: '2024-02-20',
    acquisition_value: 450.00,
    current_zone_id: 2,
    status: 'available'
  },
  
  // Office Supplies
  {
    barcode: generateBarcode(),
    category_id: 6,
    asset_name: 'Lot Fournitures Bureau',
    description: 'Lot de fournitures de bureau diverses',
    brand: 'Office Depot',
    model: 'Pack Standard',
    condition_state: 'new',
    acquisition_date: '2024-04-01',
    acquisition_value: 125.00,
    current_zone_id: 3,
    status: 'available'
  }
];

/**
 * Seed the database with sample data
 */
const seedDatabase = async (): Promise<void> => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data (in reverse order of dependencies)
    console.log('🧹 Clearing existing data...');
    await pool.execute('DELETE FROM amana_deliveries');
    await pool.execute('DELETE FROM stock_movements');
    await pool.execute('DELETE FROM assets');
    await pool.execute('DELETE FROM asset_categories');
    await pool.execute('DELETE FROM staff_users');
    await pool.execute('DELETE FROM recipients');
    await pool.execute('DELETE FROM departments');
    await pool.execute('DELETE FROM zones');
    await pool.execute('DELETE FROM warehouses');

    // Reset auto-increment
    await pool.execute('ALTER TABLE warehouses AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE zones AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE departments AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE recipients AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE staff_users AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE asset_categories AUTO_INCREMENT = 1');
    await pool.execute('ALTER TABLE assets AUTO_INCREMENT = 1');

    // Insert warehouses
    console.log('📦 Inserting warehouses...');
    for (const warehouse of warehousesData) {
      await pool.execute(
        `INSERT INTO warehouses (warehouse_code, warehouse_name, address, city, phone) 
         VALUES (?, ?, ?, ?, ?)`,
        [warehouse.warehouse_code, warehouse.warehouse_name, warehouse.address, warehouse.city, warehouse.phone]
      );
    }

    // Insert zones
    console.log('🏗️ Inserting zones...');
    for (const zone of zonesData) {
      await pool.execute(
        `INSERT INTO zones (warehouse_id, zone_code, zone_name, zone_type, capacity) 
         VALUES (?, ?, ?, ?, ?)`,
        [zone.warehouse_id, zone.zone_code, zone.zone_name, zone.zone_type, zone.capacity]
      );
    }

    // Insert departments
    console.log('🏛️ Inserting departments...');
    for (const department of departmentsData) {
      await pool.execute(
        `INSERT INTO departments (department_code, department_name, responsible_person, phone, email) 
         VALUES (?, ?, ?, ?, ?)`,
        [department.department_code, department.department_name, department.responsible_person, department.phone, department.email]
      );
    }

    // Insert recipients
    console.log('👥 Inserting recipients...');
    for (const recipient of recipientsData) {
      await pool.execute(
        `INSERT INTO recipients (first_name, last_name, cin, department_id, phone, email, address) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [recipient.first_name, recipient.last_name, recipient.cin, recipient.department_id, 
         recipient.phone, recipient.email, recipient.address]
      );
    }

    // Insert staff users
    console.log('👨‍💼 Inserting staff users...');
    for (const user of staffUsersData) {
      await pool.execute(
        `INSERT INTO staff_users (username, first_name, last_name, role, phone, email, password_hash) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.username, user.first_name, user.last_name, user.role, user.phone, user.email, user.password_hash]
      );
    }

    // Insert asset categories
    console.log('📂 Inserting asset categories...');
    for (const category of assetCategoriesData) {
      await pool.execute(
        `INSERT INTO asset_categories (category_code, category_name, category_type) 
         VALUES (?, ?, ?)`,
        [category.category_code, category.category_name, category.category_type]
      );
    }

    // Insert assets
    console.log('📦 Inserting assets...');
    for (const asset of assetsData) {
      await pool.execute(
        `INSERT INTO assets (barcode, category_id, asset_name, description, brand, model, 
         serial_number, marche_info, condition_state, acquisition_date, acquisition_value, 
         current_zone_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [asset.barcode, asset.category_id, asset.asset_name, asset.description, asset.brand, 
         asset.model, asset.serial_number, asset.marche_info, asset.condition_state, 
         asset.acquisition_date, asset.acquisition_value, asset.current_zone_id, asset.status]
      );
    }

    // Create some sample movements
    console.log('🚚 Creating sample movements...');
    const movementsData = [
      { asset_id: 1, movement_type: 'reception', to_zone_id: 1, user_id: 1, notes: 'Réception initiale du mobilier' },
      { asset_id: 2, movement_type: 'storage', from_zone_id: 1, to_zone_id: 1, user_id: 2, notes: 'Stockage en zone mobilier' },
      { asset_id: 4, movement_type: 'preparation', from_zone_id: 2, user_id: 1, notes: 'Préparation pour livraison' },
      { asset_id: 5, movement_type: 'delivery', recipient_id: 1, user_id: 1, notes: 'Livraison au Ministère de l\'Intérieur' }
    ];

    for (const movement of movementsData) {
      await pool.execute(
        `INSERT INTO stock_movements (asset_id, movement_type, from_zone_id, to_zone_id, recipient_id, user_id, notes) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [movement.asset_id, movement.movement_type, movement.from_zone_id || null, 
         movement.to_zone_id || null, movement.recipient_id || null, movement.user_id, movement.notes]
      );
    }

    // Create sample deliveries
    console.log('🚛 Creating sample deliveries...');
    const deliveriesData = [
      {
        delivery_reference: generateDeliveryReference(),
        asset_id: 5,
        recipient_id: 1,
        handover_user_id: 1,
        amana_agent_name: 'Mohamed Bennani',
        amana_agent_phone: '+212670123456',
        delivery_status: 'delivered',
        delivery_date: new Date(),
        feedback_notes: 'Livraison effectuée avec succès'
      },
      {
        delivery_reference: generateDeliveryReference(),
        asset_id: 4,
        recipient_id: 2,
        handover_user_id: 2,
        amana_agent_name: 'Fatima Zahra',
        amana_agent_phone: '+212671234567',
        delivery_status: 'pending'
      }
    ];

    for (const delivery of deliveriesData) {
      await pool.execute(
        `INSERT INTO amana_deliveries (delivery_reference, asset_id, recipient_id, handover_date, 
         handover_user_id, amana_agent_name, amana_agent_phone, delivery_status, delivery_date, feedback_notes) 
         VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [delivery.delivery_reference, delivery.asset_id, delivery.recipient_id, delivery.handover_user_id,
         delivery.amana_agent_name, delivery.amana_agent_phone, delivery.delivery_status, 
         delivery.delivery_date || null, delivery.feedback_notes || null]
      );
    }

    console.log('✅ Database seeding completed successfully!');
    console.log(`
📊 Summary:
   - ${warehousesData.length} warehouses
   - ${zonesData.length} zones  
   - ${departmentsData.length} departments
   - ${recipientsData.length} recipients
   - ${staffUsersData.length} staff users
   - ${assetCategoriesData.length} asset categories
   - ${assetsData.length} assets
   - ${movementsData.length} movements
   - ${deliveriesData.length} deliveries
    `);

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 ANCFCC Warehouse Database Setup');
    
    // Setup database and tables
    await setupDatabase();
    
    // Seed with sample data
    await seedDatabase();
    
    console.log('🎉 Setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Setup failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { seedDatabase };
