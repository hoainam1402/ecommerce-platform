import * as bcrypt from 'bcryptjs'
import { DataSource } from 'typeorm'

const AppDataSource = new DataSource({
  type:        'postgres',
  host:        process.env.DB_HOST     || 'localhost',
  port:        Number(process.env.DB_PORT) || 5432,
  username:    process.env.DB_USER     || 'ecom_user',
  password:    process.env.DB_PASSWORD || 'ecom_pass_local',
  database:    process.env.DB_NAME     || 'ecom_db',
  synchronize: false,
  logging:     false,
})

async function seed() {
  await AppDataSource.initialize()
  const db = AppDataSource
  console.log('🌱 Bắt đầu seed data...\n')

  // ── 1. USERS ──────────────────────────────────────────────
  console.log('👤 Tạo users...')
  const passwordHash = await bcrypt.hash('Admin@123', 12)
  const customerHash = await bcrypt.hash('Customer@123', 12)

  await db.query(`
    INSERT INTO users (id, email, phone, full_name, status, role, email_verified)
    VALUES
      (gen_random_uuid(), 'admin@ecom.vn',             '0901000001', 'Super Admin',       'active', 'super_admin', true),
      (gen_random_uuid(), 'operator@ecom.vn',          '0901000002', 'Nhan vien van hanh','active', 'operator',    true),
      (gen_random_uuid(), 'nguyen.van.a@gmail.com',    '0901234567', 'Nguyen Van A',      'active', 'customer',    true),
      (gen_random_uuid(), 'tran.thi.b@gmail.com',      '0907654321', 'Tran Thi B',        'active', 'customer',    true),
      (gen_random_uuid(), 'le.van.c@gmail.com',        '0912345678', 'Le Van C',          'active', 'customer',    true)
    ON CONFLICT (email) DO NOTHING
  `)

  const adminId    = (await db.query(`SELECT id FROM users WHERE email = 'admin@ecom.vn'`))[0].id
  const customerId = (await db.query(`SELECT id FROM users WHERE email = 'nguyen.van.a@gmail.com'`))[0].id

  await db.query(`
    INSERT INTO user_auth_providers (id, user_id, provider, provider_uid)
    SELECT gen_random_uuid(), id, 'email', $1
    FROM users WHERE email = 'admin@ecom.vn'
    ON CONFLICT (provider, provider_uid) DO NOTHING
  `, [passwordHash])

  await db.query(`
    INSERT INTO user_auth_providers (id, user_id, provider, provider_uid)
    SELECT gen_random_uuid(), id, 'email', $1
    FROM users WHERE email = 'nguyen.van.a@gmail.com'
    ON CONFLICT (provider, provider_uid) DO NOTHING
  `, [customerHash])

  await db.query(`
    INSERT INTO user_loyalty_points (id, user_id, points, tier, total_earned, total_spent)
    SELECT gen_random_uuid(), id,
      CASE role WHEN 'super_admin' THEN 5000 ELSE 250 END,
      CASE role WHEN 'super_admin' THEN 'gold'::user_loyalty_points_tier_enum
                ELSE 'bronze'::user_loyalty_points_tier_enum END,
      CASE role WHEN 'super_admin' THEN 5000 ELSE 250 END, 0
    FROM users
    ON CONFLICT DO NOTHING
  `)

  await db.query(`
    INSERT INTO user_addresses (id, user_id, label, recipient_name, recipient_phone,
      province, district, ward, street_address, is_default)
    VALUES (gen_random_uuid(), $1, 'Nha', 'Nguyen Van A', '0901234567',
      'TP. Ho Chi Minh', 'Quan 1', 'Phuong Ben Nghe', '123 Nguyen Hue', true)
  `, [customerId])

  console.log('   ✅ Users done')

  // ── 2. CATEGORIES ─────────────────────────────────────────
  console.log('📂 Tạo categories...')

  await db.query(`
    INSERT INTO categories (id, name, slug, sort_order, is_active)
    VALUES
      (gen_random_uuid(), 'Dien tu',    'dien-tu',    1, true),
      (gen_random_uuid(), 'Thoi trang', 'thoi-trang', 2, true),
      (gen_random_uuid(), 'Nha bep',    'nha-bep',    3, true),
      (gen_random_uuid(), 'The thao',   'the-thao',   4, true),
      (gen_random_uuid(), 'Sach',       'sach',       5, true)
    ON CONFLICT (slug) DO NOTHING
  `)

  const catDienTu    = (await db.query(`SELECT id FROM categories WHERE slug = 'dien-tu'`))[0].id
  const catThoiTrang = (await db.query(`SELECT id FROM categories WHERE slug = 'thoi-trang'`))[0].id
  const catTheThao   = (await db.query(`SELECT id FROM categories WHERE slug = 'the-thao'`))[0].id

  await db.query(`
    INSERT INTO categories (id, parent_id, name, slug, sort_order, is_active)
    VALUES
      (gen_random_uuid(), $1, 'Dien thoai',    'dien-thoai',     1, true),
      (gen_random_uuid(), $1, 'Laptop',         'laptop',          2, true),
      (gen_random_uuid(), $1, 'May tinh bang',  'may-tinh-bang',  3, true),
      (gen_random_uuid(), $2, 'Thoi trang nam', 'thoi-trang-nam', 1, true),
      (gen_random_uuid(), $2, 'Thoi trang nu',  'thoi-trang-nu',  2, true)
    ON CONFLICT (slug) DO NOTHING
  `, [catDienTu, catThoiTrang])

  const catDienThoai = (await db.query(`SELECT id FROM categories WHERE slug = 'dien-thoai'`))[0].id
  const catLaptop    = (await db.query(`SELECT id FROM categories WHERE slug = 'laptop'`))[0].id
  const catNam       = (await db.query(`SELECT id FROM categories WHERE slug = 'thoi-trang-nam'`))[0].id
  const catNu        = (await db.query(`SELECT id FROM categories WHERE slug = 'thoi-trang-nu'`))[0].id

  console.log('   ✅ Categories done')

  // ── 3. BRANDS ─────────────────────────────────────────────
  console.log('🏷️  Tạo brands...')
  await db.query(`
    INSERT INTO brands (id, name, slug, is_active)
    VALUES
      (gen_random_uuid(), 'Apple',   'apple',   true),
      (gen_random_uuid(), 'Samsung', 'samsung', true),
      (gen_random_uuid(), 'Xiaomi',  'xiaomi',  true),
      (gen_random_uuid(), 'Nike',    'nike',    true),
      (gen_random_uuid(), 'Adidas',  'adidas',  true),
      (gen_random_uuid(), 'Dell',    'dell',    true),
      (gen_random_uuid(), 'Asus',    'asus',    true),
      (gen_random_uuid(), 'Generic', 'generic', true)
    ON CONFLICT (slug) DO NOTHING
  `)

  const bApple   = (await db.query(`SELECT id FROM brands WHERE slug = 'apple'`))[0].id
  const bSamsung = (await db.query(`SELECT id FROM brands WHERE slug = 'samsung'`))[0].id
  const bXiaomi  = (await db.query(`SELECT id FROM brands WHERE slug = 'xiaomi'`))[0].id
  const bNike    = (await db.query(`SELECT id FROM brands WHERE slug = 'nike'`))[0].id
  const bAdidas  = (await db.query(`SELECT id FROM brands WHERE slug = 'adidas'`))[0].id
  const bDell    = (await db.query(`SELECT id FROM brands WHERE slug = 'dell'`))[0].id
  const bAsus    = (await db.query(`SELECT id FROM brands WHERE slug = 'asus'`))[0].id
  const bGeneric = (await db.query(`SELECT id FROM brands WHERE slug = 'generic'`))[0].id

  console.log('   ✅ Brands done')

  // ── 4. PRODUCTS ───────────────────────────────────────────
  console.log('📦 Tạo products...')

  const products = [
    {
      brandId: bApple, sku: 'IP15-PRO-128', name: 'iPhone 15 Pro 128GB',
      slug: 'iphone-15-pro-128gb',
      shortDesc: 'iPhone 15 Pro chip A17 Pro, camera 48MP, khung Titanium',
      desc: 'iPhone 15 Pro la chiec dien thoai cao cap nhat cua Apple.',
      basePrice: 29990000, salePrice: 27990000, isFeatured: true,
      avgRating: 4.8, reviewCount: 234, soldCount: 1205,
      tags: ['iphone','apple','flagship'],
      categoryId: catDienThoai,
      attributes: { Chip: 'A17 Pro', RAM: '8GB', OS: 'iOS 17' },
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=600',
    },
    {
      brandId: bSamsung, sku: 'SS-S24U-256', name: 'Samsung Galaxy S24 Ultra 256GB',
      slug: 'samsung-galaxy-s24-ultra-256gb',
      shortDesc: 'Galaxy S24 Ultra but S Pen tich hop, camera 200MP',
      desc: 'Samsung Galaxy S24 Ultra dinh cao dong Galaxy.',
      basePrice: 33990000, salePrice: 30990000, isFeatured: true,
      avgRating: 4.7, reviewCount: 189, soldCount: 876,
      tags: ['samsung','android','flagship'],
      categoryId: catDienThoai,
      attributes: { Chip: 'Snapdragon 8 Gen 3', RAM: '12GB' },
      imageUrl: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600',
    },
    {
      brandId: bXiaomi, sku: 'XM-14-256', name: 'Xiaomi 14 256GB',
      slug: 'xiaomi-14-256gb',
      shortDesc: 'Xiaomi 14 Leica camera, Snapdragon 8 Gen 3',
      desc: 'Xiaomi 14 mang den nhieu anh dang cap voi Leica.',
      basePrice: 19990000, salePrice: null, isFeatured: false,
      avgRating: 4.5, reviewCount: 98, soldCount: 432,
      tags: ['xiaomi','android'],
      categoryId: catDienThoai,
      attributes: { Chip: 'Snapdragon 8 Gen 3', RAM: '12GB' },
      imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600',
    },
    {
      brandId: bApple, sku: 'MBP-M3-14', name: 'MacBook Pro 14 inch M3 Pro',
      slug: 'macbook-pro-14-m3-pro',
      shortDesc: 'MacBook Pro 14 inch chip M3 Pro, man hinh Liquid Retina XDR',
      desc: 'MacBook Pro 14 inch M3 Pro, pin 18 gio.',
      basePrice: 52990000, salePrice: 49990000, isFeatured: true,
      avgRating: 4.9, reviewCount: 156, soldCount: 342,
      tags: ['macbook','apple','laptop'],
      categoryId: catLaptop,
      attributes: { Chip: 'Apple M3 Pro', RAM: '18GB', SSD: '512GB' },
      imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600',
    },
    {
      brandId: bDell, sku: 'DELL-XPS15-I7', name: 'Dell XPS 15 Core i7',
      slug: 'dell-xps-15-core-i7',
      shortDesc: 'Dell XPS 15 Core i7 Gen 13, OLED 3.5K, RTX 4060',
      desc: 'Dell XPS 15 man hinh OLED 3.5K tuyet dep.',
      basePrice: 45990000, salePrice: 41990000, isFeatured: false,
      avgRating: 4.6, reviewCount: 87, soldCount: 198,
      tags: ['dell','laptop'],
      categoryId: catLaptop,
      attributes: { CPU: 'Core i7-13700H', RAM: '16GB', GPU: 'RTX 4060' },
      imageUrl: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600',
    },
    {
      brandId: bAsus, sku: 'ASUS-ROG-G16', name: 'Asus ROG Strix G16 Core i9',
      slug: 'asus-rog-strix-g16-i9',
      shortDesc: 'Laptop gaming ROG Strix G16, Core i9, RTX 4080, 240Hz',
      desc: 'Asus ROG Strix G16 gaming dinh cao.',
      basePrice: 65990000, salePrice: 59990000, isFeatured: true,
      avgRating: 4.8, reviewCount: 67, soldCount: 89,
      tags: ['asus','rog','gaming'],
      categoryId: catLaptop,
      attributes: { CPU: 'Core i9-13980HX', RAM: '32GB', GPU: 'RTX 4080 12GB' },
      imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600',
    },
    {
      brandId: bNike, sku: 'NK-AM270-WHT', name: 'Nike Air Max 270 Trang',
      slug: 'nike-air-max-270-trang',
      shortDesc: 'Giay the thao Nike Air Max 270',
      desc: 'Nike Air Max 270 de Air lon nhat, em ai.',
      basePrice: 3490000, salePrice: 2990000, isFeatured: true,
      avgRating: 4.7, reviewCount: 312, soldCount: 1567,
      tags: ['nike','giay','the-thao'],
      categoryId: catTheThao,
      attributes: { 'Chat lieu': 'Mesh', De: 'Air Max 270' },
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600',
    },
    {
      brandId: bAdidas, sku: 'ADI-UB22-BLK', name: 'Adidas Ultraboost 22 Den',
      slug: 'adidas-ultraboost-22-den',
      shortDesc: 'Giay chay bo Adidas Ultraboost 22 BOOST',
      desc: 'Adidas Ultraboost 22 nang luong hoan tra toi da.',
      basePrice: 4290000, salePrice: 3490000, isFeatured: false,
      avgRating: 4.6, reviewCount: 201, soldCount: 876,
      tags: ['adidas','giay','chay-bo'],
      categoryId: catTheThao,
      attributes: { 'Chat lieu': 'Primeknit+', De: 'BOOST' },
      imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=600',
    },
    {
      brandId: bGeneric, sku: 'POLO-NAM-COTTON', name: 'Ao Polo Nam Cotton',
      slug: 'ao-polo-nam-cotton-100',
      shortDesc: 'Ao polo nam cotton 100%, thoang mat',
      desc: 'Ao polo nam cotton 100% cao cap.',
      basePrice: 450000, salePrice: 350000, isFeatured: false,
      avgRating: 4.4, reviewCount: 445, soldCount: 2341,
      tags: ['ao-polo','thoi-trang-nam'],
      categoryId: catNam,
      attributes: { 'Chat lieu': 'Cotton 100%' },
      imageUrl: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600',
    },
    {
      brandId: bGeneric, sku: 'DAM-MIDI-BLUE', name: 'Dam Midi Nu Hoa Nhi Xanh',
      slug: 'dam-midi-nu-hoa-nhi-xanh',
      shortDesc: 'Dam midi nu hoa nhi xanh, diu dang',
      desc: 'Dam midi hoa nhi xanh, chat voan mem mai.',
      basePrice: 680000, salePrice: 520000, isFeatured: false,
      avgRating: 4.5, reviewCount: 287, soldCount: 1123,
      tags: ['dam-nu','thoi-trang-nu'],
      categoryId: catNu,
      attributes: { 'Chat lieu': 'Voan', Mua: 'He' },
      imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600',
    },
  ]

  const productIds: Record<string, string> = {}

  for (const p of products) {
    const result = await db.query(`
      INSERT INTO products (id, brand_id, sku, name, slug, short_description, description,
        base_price, sale_price, status, is_featured, avg_rating, review_count, sold_count,
        tags, attributes)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8,
        'active', $9, $10, $11, $12, $13::text[], $14::jsonb)
      ON CONFLICT (slug) DO UPDATE SET updated_at = NOW()
      RETURNING id
    `, [
      p.brandId, p.sku, p.name, p.slug, p.shortDesc, p.desc,
      p.basePrice, p.salePrice, p.isFeatured,
      p.avgRating, p.reviewCount, p.soldCount,
      `{${p.tags.map((t: string) => `"${t}"`).join(',')}}`,
      JSON.stringify(p.attributes),
    ])

    const productId = result[0].id
    productIds[p.slug] = productId

    await db.query(`
      INSERT INTO product_categories (product_id, category_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [productId, p.categoryId])

    await db.query(`
      INSERT INTO product_images (id, product_id, url, sort_order, is_primary)
      VALUES (gen_random_uuid(), $1, $2, 0, true)
      ON CONFLICT DO NOTHING
    `, [productId, p.imageUrl])
  }

  console.log('   ✅ Products done')

  // ── 5. VARIANTS ───────────────────────────────────────────
  console.log('🎨 Tạo variants...')

  const iphoneId = productIds['iphone-15-pro-128gb']
  for (const c of ['Titan Tu Nhien','Titan Den','Titan Trang','Titan Xanh']) {
    await db.query(`
      INSERT INTO product_variants (id, product_id, sku, name, attributes, price, stock_quantity, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, 27990000, $5, true)
      ON CONFLICT (sku) DO NOTHING
    `, [iphoneId, `IP15-${c.replace(/\s/g,'')}`, `128GB / ${c}`, JSON.stringify({ mau: c, dung_luong: '128GB' }), Math.floor(Math.random()*40)+10])
  }

  const nikeId = productIds['nike-air-max-270-trang']
  for (const [size, stock] of [['38',20],['39',25],['40',30],['41',28],['42',22],['43',15],['44',8]]) {
    await db.query(`
      INSERT INTO product_variants (id, product_id, sku, name, attributes, price, stock_quantity, is_active)
      VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, 2990000, $5, true)
      ON CONFLICT (sku) DO NOTHING
    `, [nikeId, `NK-AM270-${size}`, `Trang / Size ${size}`, JSON.stringify({ mau: 'Trang', size }), stock])
  }

  const poloId = productIds['ao-polo-nam-cotton-100']
  for (const color of ['Trang','Den','Xanh navy']) {
    for (const size of ['S','M','L','XL']) {
      await db.query(`
        INSERT INTO product_variants (id, product_id, sku, name, attributes, price, stock_quantity, is_active)
        VALUES (gen_random_uuid(), $1, $2, $3, $4::jsonb, 350000, $5, true)
        ON CONFLICT (sku) DO NOTHING
      `, [poloId, `POLO-${color.replace(/\s/g,'')}-${size}`, `${color} / ${size}`, JSON.stringify({ mau: color, size }), Math.floor(Math.random()*40)+5])
    }
  }

  console.log('   ✅ Variants done')

  // ── 6. PROMOTIONS ─────────────────────────────────────────
  console.log('🎁 Tạo promotions...')
  await db.query(`
    INSERT INTO promotions (id, code, name, type, status, discount_value, max_discount,
      min_order_value, usage_limit, usage_per_user, used_count, starts_at, expires_at, created_by)
    VALUES
      (gen_random_uuid(),'WELCOME50','Chao mung thanh vien moi','fixed_amount','active',50000,null,200000,1000,1,0,NOW(),NOW()+INTERVAL '30 days',$1),
      (gen_random_uuid(),'SUMMER20','Sale He 2026','percentage','active',20,200000,500000,500,2,45,NOW(),NOW()+INTERVAL '60 days',$1),
      (gen_random_uuid(),'FREESHIP','Mien phi van chuyen','free_shipping','active',0,null,150000,2000,3,123,NOW(),NOW()+INTERVAL '90 days',$1),
      (gen_random_uuid(),'FLASH30','Flash Sale Cuoi Tuan','percentage','active',30,300000,300000,200,1,12,NOW(),NOW()+INTERVAL '2 days',$1),
      (gen_random_uuid(),'TECH500','Khuyen mai dien tu','fixed_amount','active',500000,null,5000000,100,1,5,NOW(),NOW()+INTERVAL '14 days',$1)
    ON CONFLICT (code) DO NOTHING
  `, [adminId])
  console.log('   ✅ Promotions done')

  // Reviews skipped (table not yet created)

  // ── SUMMARY ───────────────────────────────────────────────
  const [u, p, v, c, pr] = await Promise.all([
    db.query('SELECT COUNT(*) FROM users'),
    db.query('SELECT COUNT(*) FROM products'),
    db.query('SELECT COUNT(*) FROM product_variants'),
    db.query('SELECT COUNT(*) FROM categories'),
    db.query('SELECT COUNT(*) FROM promotions'),
  ])

  console.log('\n✅ Seed hoàn tất!')
  console.log('──────────────────────────────')
  console.log(`👤 Users:      ${u[0].count}`)
  console.log(`📦 Products:   ${p[0].count}`)
  console.log(`🎨 Variants:   ${v[0].count}`)
  console.log(`📂 Categories: ${c[0].count}`)
  console.log(`🎁 Promotions: ${pr[0].count}`)
  console.log('──────────────────────────────')
  console.log('\n🔑 Test accounts:')
  console.log('   Admin:    admin@ecom.vn         / Admin@123')
  console.log('   Customer: nguyen.van.a@gmail.com / Customer@123')
  console.log('\n🎟️  Vouchers: WELCOME50, SUMMER20, FREESHIP, FLASH30, TECH500')

  await AppDataSource.destroy()
}

seed().catch(err => {
  console.error('❌ Seed thất bại:', err.message)
  process.exit(1)
})