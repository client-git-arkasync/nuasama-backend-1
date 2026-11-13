import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const prisma = new PrismaClient();

async function resetAndSeed() {
  console.log('--- 1. Resetting Database ---');
  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');

  const tables = [
    'payment_verifications',
    'order_items',
    'orders',
    'cart_items',
    'user_vouchers',
    'vouchers',
    'menu_items',
    'dapurs',
    'users',
    'app_settings',
    'menus',
    'categories'
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE \`${table}\`;`);
      console.log(`  ✓ Truncated ${table}`);
    } catch (e: any) {
      console.warn(`  ! Warning on ${table}:`, e.message);
    }
  }

  await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
  console.log('Database cleared.\n');

  console.log('--- 2. Seeding Users ---');
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const userPasswordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.users.create({
    data: {
      name: 'Administrator',
      email: 'admin@nuasama.com',
      password_hash: adminPasswordHash,
      role: 'admin',
    }
  });
  console.log(`  ✓ Admin: ${admin.email} (Password: admin123)`);

  const customer = await prisma.users.create({
    data: {
      name: 'User Nuasama',
      email: 'user@nuasama.com',
      password_hash: userPasswordHash,
      phone_number: '081234567890',
      role: 'pelanggan',
      nuasama_point: 120,
    }
  });
  console.log(`  ✓ Pelanggan: ${customer.email} (Password: password123, Poin: 120)`);

  console.log('\n--- 3. Seeding App Settings ---');
  await prisma.app_settings.createMany({
    data: [
      { key: 'ppn', value: '11' },
      { key: 'use_ppn', value: 'true' },
      {
        key: 'aksesori_tipe_list',
        value: JSON.stringify([
          { id: 'tipe_1', name: 'Kaos' },
          { id: 'tipe_2', name: 'Topi' },
          { id: 'tipe_3', name: 'Tote Bag' }
        ])
      }
    ]
  });
  console.log('  ✓ App settings (PPN 11%, Aksesori Categories) created.');

  console.log('\n--- 4. Seeding Dapurs (Tenants) ---');
  const dapurNusantara = await prisma.dapur.create({
    data: {
      name: 'Dapur Rasa Nusantara',
      logo_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80',
    }
  });

  const dapurKopi = await prisma.dapur.create({
    data: {
      name: 'Kopi & Minuman Nuasama',
      logo_url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=200&q=80',
    }
  });

  const dapurSnack = await prisma.dapur.create({
    data: {
      name: 'Snack Corner Gurih',
      logo_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80',
    }
  });

  const dapurMerch = await prisma.dapur.create({
    data: {
      name: 'Nuasama Merch Official',
      logo_url: '/logo-circle.png',
    }
  });
  console.log('  ✓ 4 Dapurs created.');

  console.log('\n--- 5. Seeding Menu Items (F&B & Aksesoris) ---');
  const menuItemsData = [
    // --- Makanan ---
    {
      name: 'Nasi Goreng Spesial Nuasama',
      description: 'Nasi goreng bumbu rempah khas Nuasama dengan telur mata sapi, sate ayam, dan kerupuk renyah.',
      price: 35000,
      discount_price: 30000,
      category: 'makanan',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurNusantara.id,
      photo_url: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Ayam Bakar Madu Pedas',
      description: 'Ayam bakar pilihan dengan olesan madu murni dan siraman sambal terasi segar mantap.',
      price: 38000,
      discount_price: null,
      category: 'makanan',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurNusantara.id,
      photo_url: 'https://images.unsplash.com/photo-1598103442097-8b74394b95c6?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Mie Goreng Mamak',
      description: 'Mie telur kenyal dimasak dengan bumbu gurih khas street food dan taburan bawang goreng harum.',
      price: 28000,
      discount_price: null,
      category: 'makanan',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurNusantara.id,
      photo_url: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Sate Ayam Madura (10 Tusuk)',
      description: 'Sate daging ayam empuk dengan siraman bumbu kacang kental gurih dan kecap manis.',
      price: 32000,
      discount_price: null,
      category: 'makanan',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurNusantara.id,
      photo_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    },

    // --- Minuman ---
    {
      name: 'Es Kopi Susu Gula Aren',
      description: 'Espresso robusta & arabica blend dengan susu segar dan manis legit gula aren murni.',
      price: 22000,
      discount_price: 18000,
      category: 'minuman',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurKopi.id,
      photo_url: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Teh Tarik Klasik Dingin',
      description: 'Teh hitam pekat berbusa lembut dengan paduan susu kental manis menyegarkan dahaga.',
      price: 16000,
      discount_price: null,
      category: 'minuman',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurKopi.id,
      photo_url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Matcha Latte Creamy',
      description: 'Matcha bubuk premium dipadu dengan susu full cream yang lembut dan creamy.',
      price: 26000,
      discount_price: null,
      category: 'minuman',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurKopi.id,
      photo_url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Es Jeruk Peras Murni',
      description: 'Perasan jeruk segar asli tanpa pemanis buatan, manis alami dan kaya vitamin C.',
      price: 15000,
      discount_price: null,
      category: 'minuman',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurKopi.id,
      photo_url: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=800&q=80',
    },

    // --- Cemilan (snack) ---
    {
      name: 'Pisang Goreng Keju Karamel',
      description: 'Pisang kepok manis krispi dengan taburan keju parut melimpah dan drizzle saus karamel.',
      price: 20000,
      discount_price: null,
      category: 'snack',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurSnack.id,
      photo_url: 'https://images.unsplash.com/photo-1528736235302-52922df5c122?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Tahu Walik Krispi Sambal Colok',
      description: 'Tahu goreng renyah isi olahan ayam gurih, disajikan hangat dengan sambal kecap pedas.',
      price: 18000,
      discount_price: null,
      category: 'snack',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurSnack.id,
      photo_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'French Fries Garlic Butter',
      description: 'Kentang goreng impor renyah berbalur mentega bawang putih dan taburan parsley.',
      price: 22000,
      discount_price: null,
      category: 'snack',
      product_type: 'fnb',
      stock_status: 'aktif',
      use_stock: false,
      stock_quantity: 0,
      dapur_id: dapurSnack.id,
      photo_url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    },

    // --- Aksesoris & Merchandise ---
    {
      name: 'Kaos Nuasama Signature - Black',
      description: 'Kaos katun combed 24s premium dengan sablon logo Nuasama eksklusif. Nyaman dan sejuk dipakai.',
      price: 125000,
      discount_price: 110000,
      category: 'Kaos',
      product_type: 'aksesori',
      stock_status: 'aktif',
      use_stock: true,
      stock_quantity: 25,
      dapur_id: dapurMerch.id,
      photo_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Topi Snapback Nuasama Casual',
      description: 'Topi snapback dengan bordir timbul kualitas tinggi, strap belakang mudah disesuaikan.',
      price: 85000,
      discount_price: null,
      category: 'Topi',
      product_type: 'aksesori',
      stock_status: 'aktif',
      use_stock: true,
      stock_quantity: 15,
      dapur_id: dapurMerch.id,
      photo_url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80',
    },
    {
      name: 'Canvas Tote Bag Nuasama',
      description: 'Tote bag bahan kanvas tebal ramah lingkungan dengan kantong resleting dalam.',
      price: 65000,
      discount_price: null,
      category: 'Tote Bag',
      product_type: 'aksesori',
      stock_status: 'aktif',
      use_stock: true,
      stock_quantity: 30,
      dapur_id: dapurMerch.id,
      photo_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const createdMenuItems: any[] = [];
  for (const item of menuItemsData) {
    const mi = await prisma.menuItem.create({ data: item });
    createdMenuItems.push(mi);
  }
  console.log(`  ✓ ${createdMenuItems.length} Menu items created.`);

  console.log('\n--- 6. Seeding Vouchers ---');
  const voucher1 = await prisma.vouchers.create({
    data: {
      code: 'HEMAT10K',
      discount_amount: 10000,
      point_cost: 20,
      min_purchase: 40000,
      applicable_product: 'all',
      applicable_order_type: 'all',
      is_active: true,
    }
  });

  const voucher2 = await prisma.vouchers.create({
    data: {
      code: 'MAKANPUAS',
      discount_amount: 20000,
      point_cost: 35,
      min_purchase: 60000,
      applicable_product: 'fnb',
      applicable_order_type: 'dine_in',
      is_active: true,
    }
  });

  const voucher3 = await prisma.vouchers.create({
    data: {
      code: 'TAKEAWAY25',
      discount_amount: 25000,
      point_cost: 45,
      min_purchase: 75000,
      applicable_product: 'all',
      applicable_order_type: 'take_away',
      is_active: true,
    }
  });

  const voucher4 = await prisma.vouchers.create({
    data: {
      code: 'MERCH15K',
      discount_amount: 15000,
      point_cost: 25,
      min_purchase: 50000,
      applicable_product: 'aksesori',
      applicable_order_type: 'take_away',
      is_active: true,
    }
  });
  console.log('  ✓ 4 Vouchers created.');

  // Berikan voucher HEMAT10K ke customer agar siap dipakai saat checkout
  await prisma.user_vouchers.create({
    data: {
      user_id: customer.id,
      voucher_id: voucher1.id,
      is_used: false,
    }
  });
  console.log('  ✓ 1 Voucher (HEMAT10K) claimed for User Nuasama.');

  console.log('\n--- 7. Seeding Sample Orders ---');
  // Order 1: Selesai (Dine In) oleh customer
  const nasiGoreng = createdMenuItems[0];
  const kopiSusu = createdMenuItems[4];
  const pisangGoreng = createdMenuItems[8];

  const order1Price = 30000 + 18000 + Math.round((30000 + 18000) * 0.11);
  const order1 = await prisma.orders.create({
    data: {
      display_id: 'NSM-001',
      user_id: customer.id,
      order_type: 'dine_in',
      dine_in_date: new Date(),
      dine_in_time: '12:30',
      total_price: order1Price,
      status: 'selesai',
    }
  });
  await prisma.order_items.createMany({
    data: [
      { order_id: order1.id, menu_item_id: nasiGoreng.id, qty: 1, price_at_order: 30000 },
      { order_id: order1.id, menu_item_id: kopiSusu.id, qty: 1, price_at_order: 18000 },
    ]
  });
  await prisma.payment_verifications.create({
    data: {
      order_id: order1.id,
      verified_by: admin.id,
      status: 'disetujui',
    }
  });

  // Order 2: Diproses (Dine In) oleh customer
  const ayamBakar = createdMenuItems[1];
  const tehTarik = createdMenuItems[5];
  const order2Price = 38000 + 16000 + Math.round((38000 + 16000) * 0.11);
  const order2 = await prisma.orders.create({
    data: {
      display_id: 'NSM-002',
      user_id: customer.id,
      order_type: 'dine_in',
      dine_in_date: new Date(),
      dine_in_time: '13:00',
      total_price: order2Price,
      status: 'diproses',
    }
  });
  await prisma.order_items.createMany({
    data: [
      { order_id: order2.id, menu_item_id: ayamBakar.id, qty: 1, price_at_order: 38000 },
      { order_id: order2.id, menu_item_id: tehTarik.id, qty: 1, price_at_order: 16000 },
    ]
  });
  await prisma.payment_verifications.create({
    data: {
      order_id: order2.id,
      verified_by: admin.id,
      status: 'disetujui',
    }
  });

  // Order 3: Menunggu Verifikasi (Take Away) oleh customer
  const kaosMerch = createdMenuItems[11];
  const order3Price = 110000 + Math.round(110000 * 0.11);
  const order3 = await prisma.orders.create({
    data: {
      display_id: 'NSM-003',
      user_id: customer.id,
      order_type: 'take_away',
      total_price: order3Price,
      status: 'menunggu_verifikasi',
      payment_proof_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
    }
  });
  await prisma.order_items.createMany({
    data: [
      { order_id: order3.id, menu_item_id: kaosMerch.id, qty: 1, price_at_order: 110000 },
    ]
  });

  console.log('  ✓ 3 Sample orders created (NSM-001: selesai, NSM-002: diproses, NSM-003: menunggu_verifikasi).');
  console.log('\n========================================');
  console.log('RESET & SEEDING COMPLETED SUCCESSFULLY!');
  console.log('========================================');
}

resetAndSeed()
  .catch((e) => {
    console.error('Fatal error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
