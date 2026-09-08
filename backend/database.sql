-- ====================================================================
-- SHOP EAZY E-COMMERCE DATABASE (FULL SQL SCHEMA & SEED DATA)
-- Compatible with MySQL 8.0+, MariaDB 10.5+, and modern relational engines
-- Character Set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- ====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP DATABASE IF EXISTS `shopeazy_db`;
CREATE DATABASE `shopeazy_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `shopeazy_db`;

-- --------------------------------------------------------------------
-- 1. Table: `users` (Abakiriya / Customers)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('customer', 'admin') DEFAULT 'customer',
  `phone` VARCHAR(30) NULL,
  `address` VARCHAR(255) NULL,
  `city` VARCHAR(100) NULL,
  `zip_code` VARCHAR(20) NULL,
  `country` VARCHAR(100) DEFAULT 'United States',
  `avatar` VARCHAR(500) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 2. Table: `admins` (Abayobozi / Administrators)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `admins`;
CREATE TABLE `admins` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'super_admin',
  `permissions` JSON NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 3. Table: `categories` (Ibyiciro by'Ibicuruzwa)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `categories`;
CREATE TABLE `categories` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `slug` VARCHAR(150) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image` VARCHAR(500) NULL,
  `icon` VARCHAR(50) DEFAULT 'Folder',
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_category_slug` (`slug`),
  INDEX `idx_category_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 4. Table: `products` (Ibicuruzwa / Products Catalog)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `products`;
CREATE TABLE `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `category_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NOT NULL,
  `short_description` VARCHAR(500) NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `discount_price` DECIMAL(10,2) NULL,
  `stock_quantity` INT UNSIGNED DEFAULT 0,
  `sku` VARCHAR(60) NOT NULL UNIQUE,
  `rating` DECIMAL(3,2) DEFAULT 5.00,
  `review_count` INT UNSIGNED DEFAULT 0,
  `image` VARCHAR(500) NOT NULL,
  `gallery` JSON NULL,
  `tags` JSON NULL,
  `specifications` JSON NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_product_category` (`category_id`),
  INDEX `idx_product_price` (`price`),
  INDEX `idx_product_featured` (`is_featured`),
  INDEX `idx_product_active` (`is_active`),
  INDEX `idx_product_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 5. Table: `cart` (Ibitebo by'Abaguzi / Shopping Carts)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cart`;
CREATE TABLE `cart` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NULL,
  `session_id` VARCHAR(100) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_cart_user` (`user_id`),
  INDEX `idx_cart_session` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 6. Table: `cart_items` (Ibyo mu Gitebo / Cart Line Items)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `cart_items`;
CREATE TABLE `cart_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `cart_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED DEFAULT 1,
  `price` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cart_id`) REFERENCES `cart`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_cart_items_cart` (`cart_id`),
  INDEX `idx_cart_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 7. Table: `orders` (Amakuru y'Ibyaguzwe / Customer Orders)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT UNSIGNED NOT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_email` VARCHAR(191) NOT NULL,
  `customer_phone` VARCHAR(30) NULL,
  `shipping_street` VARCHAR(255) NOT NULL,
  `shipping_city` VARCHAR(100) NOT NULL,
  `shipping_state` VARCHAR(100) NOT NULL,
  `shipping_zip` VARCHAR(20) NOT NULL,
  `shipping_country` VARCHAR(100) DEFAULT 'United States',
  `shipping_method` VARCHAR(100) NOT NULL,
  `payment_method` VARCHAR(100) NOT NULL,
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  `shipping_status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  `subtotal` DECIMAL(10,2) NOT NULL,
  `discount` DECIMAL(10,2) DEFAULT 0.00,
  `tax` DECIMAL(10,2) DEFAULT 0.00,
  `shipping_fee` DECIMAL(10,2) DEFAULT 0.00,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `tracking_number` VARCHAR(100) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT,
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_status` (`shipping_status`),
  INDEX `idx_orders_payment` (`payment_status`),
  INDEX `idx_orders_tracking` (`tracking_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 8. Table: `order_items` (Ibintu biri mu Itumizwa / Order Line Items)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `order_items`;
CREATE TABLE `order_items` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT UNSIGNED NOT NULL,
  `product_id` INT UNSIGNED NOT NULL,
  `product_name` VARCHAR(255) NOT NULL,
  `product_image` VARCHAR(500) NULL,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT UNSIGNED DEFAULT 1,
  `total` DECIMAL(10,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT,
  INDEX `idx_order_items_order` (`order_id`),
  INDEX `idx_order_items_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 9. Table: `reviews` (Ibitekerezo by'Abakiriya / Product Reviews)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `reviews`;
CREATE TABLE `reviews` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `user_id` INT UNSIGNED NOT NULL,
  `user_name` VARCHAR(120) NOT NULL,
  `rating` TINYINT UNSIGNED NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment` TEXT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_reviews_product` (`product_id`),
  INDEX `idx_reviews_rating` (`rating`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------------------
-- 10. Table: `coupons` (Imigabane yo Kugabanyirizwa / Discount Coupons)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS `coupons`;
CREATE TABLE `coupons` (
  `code` VARCHAR(50) PRIMARY KEY,
  `discount_type` ENUM('percentage', 'fixed') NOT NULL,
  `discount_value` DECIMAL(10,2) NOT NULL,
  `min_spend` DECIMAL(10,2) DEFAULT 0.00,
  `description` VARCHAR(255) NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_coupon_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;


-- ====================================================================
-- SEED DATA (AMAKURU Y'INGEZENZI / DEMO & INITIAL DATA)
-- ====================================================================

-- 1. Users Seed
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `role`, `phone`, `address`, `city`, `zip_code`, `country`, `avatar`, `created_at`) VALUES
(1, 'John Doe', 'john@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+1 (555) 234-5678', '742 Evergreen Terrace', 'Springfield', '97477', 'United States', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80', '2026-01-15 08:30:00'),
(2, 'Sarah Jenkins', 'sarah@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+1 (555) 876-5432', '123 Main Boulevard, Apt 4B', 'Seattle', '98101', 'United States', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80', '2026-02-01 10:15:00'),
(3, 'Michael Chang', 'michael@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'customer', '+1 (555) 345-9876', '456 Oakway Road', 'Austin', '78701', 'United States', 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80', '2026-02-18 14:45:00');

-- 2. Admins Seed
INSERT INTO `admins` (`id`, `username`, `email`, `password_hash`, `role`, `permissions`, `created_at`) VALUES
(1, 'admin', 'admin@shopeazy.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', '["all", "products", "orders", "customers", "categories", "analytics"]', '2026-01-01 00:00:00');

-- 3. Categories Seed
INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`, `icon`, `is_active`, `created_at`) VALUES
(1, 'Electronics & Gadgets', 'electronics', 'High-performance audio, smart wearables, monitors, and modern tech essentials.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80', 'Headphones', 1, '2026-01-05 00:00:00'),
(2, 'Fashion & Apparel', 'fashion', 'Contemporary minimal streetwear, premium coats, and comfortable daily wear.', 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80', 'Shirt', 1, '2026-01-05 00:00:00'),
(3, 'Home & Living', 'home-living', 'Artisanal ceramics, acoustic lamps, minimalist desk organization, and decor.', 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80', 'Home', 1, '2026-01-05 00:00:00'),
(4, 'Sports & Fitness', 'sports-fitness', 'Smart hydration gear, yoga accessories, and fitness tracking essentials.', 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80', 'Activity', 1, '2026-01-05 00:00:00'),
(5, 'Beauty & Wellness', 'beauty-wellness', 'Organic botanical skincare, aromatherapy diffusers, and luxury grooming.', 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80', 'Sparkles', 1, '2026-01-05 00:00:00'),
(6, 'Accessories & Bags', 'accessories', 'Full-grain leather wallets, waterproof commuter backpacks, and minimalist watches.', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 'Briefcase', 1, '2026-01-05 00:00:00');

-- 4. Products Seed
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `short_description`, `price`, `discount_price`, `stock_quantity`, `sku`, `rating`, `review_count`, `image`, `gallery`, `tags`, `specifications`, `is_featured`, `is_active`, `created_at`) VALUES
(1, 1, 'Aura Sound Pro Wireless ANC Headphones', 'aura-sound-pro-wireless-headphones', 
 'Engineered with 40mm custom planar drivers, active noise cancellation up to -38dB, and ultra-plush memory foam earcups. Delivers 45 hours of battery life with ultra-low latency audio codecs.',
 'Studio-grade wireless headphones with adaptive ANC and 45h playtime.', 
 249.99, 199.99, 42, 'AUD-ANC-001', 4.90, 128, 
 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', 
 '["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80"]', 
 '["Wireless", "Audio", "Noise Cancelling", "Bestseller"]', 
 '{"Driver Size": "40mm Titanium Planar", "Weight": "250g", "Battery Life": "45 hours (ANC off) / 32 hours (ANC on)", "Connectivity": "Bluetooth 5.3 + 3.5mm Aux", "Warranty": "2 Years Manufacturer Warranty"}', 
 1, 1, '2026-01-10 00:00:00'),

(2, 1, 'Chronos Horizon Smart Fitness Watch', 'chronos-horizon-smart-fitness-watch',
 '1.43-inch AMOLED crystal display with sapphire glass, ECG heart monitoring, SpO2 sensor, built-in dual-frequency GPS, and 5ATM water resistance.',
 'Ultra-thin AMOLED smartwatch with GPS and health tracking.',
 189.00, 159.00, 18, 'WCH-CHR-002', 4.80, 94,
 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"]',
 '["Smartwatch", "Fitness", "AMOLED", "Waterproof"]',
 '{"Display": "1.43\\" AMOLED 466x466", "Battery": "Up to 14 Days", "Sensors": "Heart Rate, SpO2, Accelerometer, Barometer", "Water Resistance": "5ATM (50m)"}',
 1, 1, '2026-01-12 00:00:00'),

(3, 2, 'Merino Wool Relaxed Overshirt', 'merino-wool-relaxed-overshirt',
 'Tailored from 100% fine Australian Merino wool with natural temperature regulation, horn buttons, and twin chest patch pockets for versatile layering.',
 'Luxurious pure merino wool overshirt with structured drape.',
 135.00, 119.00, 25, 'FAS-OVR-003', 4.70, 56,
 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"]',
 '["Apparel", "Merino Wool", "Sustainable", "Autumn"]',
 '{"Fit": "Relaxed Tailored", "Care": "Dry clean or hand wash cold", "Origin": "Portugal", "Material": "100% Extrafine Merino Wool (280gsm)"}',
 1, 1, '2026-01-14 00:00:00'),

(4, 6, 'Nomad Transit Weatherproof Commuter Backpack', 'nomad-transit-weatherproof-commuter-backpack',
 'Crafted from 840D recycled ballistic nylon with sealed YKK Aquaguard zippers, magnetic Fidlock buckle, dedicated padded 16\" laptop compartment, and luggage pass-through.',
 '24L ergonomic tech backpack with weatherproof protection.',
 155.00, NULL, 30, 'BAG-NMD-004', 4.90, 88,
 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80"]',
 '["Travel", "Waterproof", "Backpack", "Tech"]',
 '{"Capacity": "24 Liters", "Material": "Recycled 840D Ballistic Cordura", "Dimensions": "48 x 30 x 16 cm", "Laptop Sleeve": "Fits up to 16\\" MacBook Pro"}',
 1, 1, '2026-01-15 00:00:00'),

(5, 3, 'Nordic Minimalist Ceramic Coffee Dripper & Carafe', 'nordic-ceramic-coffee-dripper-carafe',
 'Handcrafted matte ceramic pour-over set with heat-resistant borosilicate glass server (600ml) and precision thermal retention grooves.',
 'Artisan matte ceramic pour-over brewing kit with 600ml carafe.',
 68.00, 54.00, 15, 'HOM-COF-005', 4.90, 42,
 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80"]',
 '["Coffee", "Ceramic", "Kitchen", "Artisan"]',
 '{"Material": "Stoneware Ceramic + Borosilicate Glass", "Carafe Volume": "600 ml (2-4 cups)", "Dishwasher Safe": "Yes", "Filter Compatibility": "Standard Cone 02 Filters"}',
 0, 1, '2026-01-20 00:00:00'),

(6, 5, 'Botanical Restorative Face Serum & Oil Complex', 'botanical-restorative-face-serum',
 'Cold-pressed rosehip seed, squalane, bakuchiol, and niacinamide formula for deep hydration, skin barrier repair, and radiant cellular renewal.',
 'Pure botanical face elixir with Bakuchiol and organic Rosehip.',
 52.00, NULL, 65, 'BEA-SER-006', 4.80, 110,
 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1608248597359-bb4743c4a24f?w=800&auto=format&fit=crop&q=80"]',
 '["Organic", "Skincare", "Vegan", "Cruelty-Free"]',
 '{"Size": "50 ml / 1.7 fl.oz", "Packaging": "UV-protective amber glass with dropper", "Key Actives": "Bakuchiol 1%, Squalane 10%, Niacinamide 3%", "Skin Types": "All skin types including sensitive"}',
 0, 1, '2026-01-22 00:00:00'),

(7, 4, 'HydraTherm Smart Vacuum Insulated Flask', 'hydratherm-smart-vacuum-insulated-flask',
 'Double-wall vacuum insulation keeps cold for 36 hours or hot for 18 hours. Features an LED touch temperature cap and durable powder-coat finish.',
 '750ml thermal bottle with real-time digital temperature display.',
 44.00, 36.00, 52, 'SPT-FLK-007', 4.60, 38,
 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"]',
 '["Hydration", "Fitness", "Stainless Steel", "BPA Free"]',
 '{"Capacity": "750 ml (25 oz)", "Material": "18/8 Food-Grade Stainless Steel", "BPA Free": "100%", "Insulation": "Double-Wall Vacuum with Copper Lining"}',
 0, 1, '2026-01-25 00:00:00'),

(8, 1, 'Lumina Ergo 4K OLED Ultra-Slim Monitor', 'lumina-ergo-4k-oled-monitor',
 '27-inch 4K UHD 120Hz OLED display with 99% DCI-P3 color gamut, 0.1ms response time, 90W USB-C Power Delivery, and magnetic auto-pivot stand.',
 '27\" 4K 120Hz OLED professional monitor with 90W USB-C PD.',
 649.00, 579.00, 8, 'ELC-MON-008', 4.90, 47,
 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80", "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80"]',
 '["Monitor", "OLED", "4K", "Creator", "High-End"]',
 '{"Ports": "2x HDMI 2.1, 1x DP 1.4, 1x USB-C (90W PD)", "Panel Type": "True OLED 10-bit", "Resolution": "3840 x 2160 (4K UHD)", "Refresh Rate": "120Hz"}',
 1, 1, '2026-01-28 00:00:00'),

(9, 2, 'Everyday Structured Heavyweight Cotton Tee', 'everyday-structured-heavyweight-cotton-tee',
 'Crafted with 260 GSM organic combed cotton, ribbed crew collar, and pre-shrunk boxy cut designed to retain shape wash after wash.',
 '260 GSM organic combed cotton premium relaxed tee.',
 38.00, NULL, 90, 'FAS-TEE-009', 4.70, 79,
 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"]',
 '["Cotton", "Basics", "Streetwear", "Essential"]',
 '{"Fit": "Boxy Contemporary Fit", "Fabric": "100% Organic Ring-Spun Cotton (260 GSM)", "Pre-shrunk": "Yes", "Certification": "GOTS Certified"}',
 0, 1, '2026-02-02 00:00:00'),

(10, 3, 'Solid Walnut MagSafe Charging Station & Organizer', 'solid-walnut-magsafe-charging-station',
 'Carved from sustainably harvested American black walnut with integrated dual 15W Qi2 wireless charging pads and soft micro-suede tray.',
 'Precision CNC American walnut 3-in-1 fast charging station.',
 110.00, 95.00, 19, 'HOM-DSK-010', 4.80, 51,
 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"]',
 '["Desk", "Woodwork", "Wireless Charger", "Minimalist"]',
 '{"Wood": "FSC-Certified Solid American Walnut", "Finish": "Natural Beeswax Oil", "Cable Included": "2m Braided USB-C Cable", "Charging Speed": "Dual 15W Qi2 MagSafe + 5W Watch charger"}',
 0, 1, '2026-02-05 00:00:00'),

(11, 6, 'Heritage Horween Leather Bifold Wallet', 'heritage-horween-leather-bifold-wallet',
 'Hand-stitched full grain Horween Chromexcel leather with 6 card slots, 2 hidden compartments, and RFID blocking lining.',
 'Full grain Horween leather slim bifold with RFID shield.',
 75.00, NULL, 4, 'ACC-WLT-011', 4.90, 63,
 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"]',
 '["Leather", "Wallet", "Handmade", "Everyday Carry"]',
 '{"Stitching": "Waxed Japanese Polyester Thread", "Leather Type": "Full-Grain Horween Chromexcel (USA)", "Card Capacity": "Up to 12 cards + flat bills", "RFID Protection": "Yes"}',
 0, 1, '2026-02-08 00:00:00'),

(12, 4, 'EcoCork Non-Slip High Density Yoga Mat', 'ecocork-non-slip-high-density-yoga-mat',
 'Natural organic cork top surface with recycled tree rubber base. Non-slip grip enhances as you sweat, naturally antimicrobial and easy to clean.',
 '5mm organic cork and natural tree rubber alignment mat.',
 85.00, 72.00, 28, 'SPT-MAT-012', 4.80, 39,
 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80',
 '["https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80"]',
 '["Yoga", "Eco-friendly", "Fitness", "Cork"]',
 '{"Weight": "2.4 kg", "Thickness": "5mm High Density", "Materials": "Organic Cork + Natural Natural Rubber", "Dimensions": "183 x 66 cm (72\\" x 26\\")"}',
 0, 1, '2026-02-10 00:00:00');

-- 5. Coupons Seed
INSERT INTO `coupons` (`code`, `discount_type`, `discount_value`, `min_spend`, `description`, `is_active`) VALUES
('EAZY10', 'percentage', 10.00, 50.00, '10% off on all orders over $50', 1),
('SAVE20', 'fixed', 20.00, 100.00, '$20 off on orders over $100', 1),
('FREESHIP', 'fixed', 15.00, 75.00, 'Free shipping discount on orders over $75', 1);

-- 6. Orders Seed
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `shipping_street`, `shipping_city`, `shipping_state`, `shipping_zip`, `shipping_country`, `shipping_method`, `payment_method`, `payment_status`, `shipping_status`, `subtotal`, `discount`, `tax`, `shipping_fee`, `total_amount`, `tracking_number`, `notes`, `created_at`, `updated_at`) VALUES
(101, 'ORD-2026-8910', 1, 'John Doe', 'john@example.com', '+1 (555) 234-5678', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'United States', 'Express Courier (2-3 days)', 'Credit Card (Visa ending in 4242)', 'paid', 'delivered', 358.99, 35.90, 25.85, 12.00, 360.94, 'TRK-EXP-992147', 'Leave at front door porch', '2026-02-10 11:20:00', '2026-02-13 16:40:00'),
(102, 'ORD-2026-8911', 2, 'Sarah Jenkins', 'sarah@example.com', '+1 (555) 876-5432', '123 Main Boulevard, Apt 4B', 'Seattle', 'WA', '98101', 'United States', 'Standard Ground (3-5 days)', 'PayPal', 'paid', 'shipped', 155.00, 0.00, 12.40, 0.00, 167.40, 'TRK-GND-551029', '', '2026-02-14 09:15:00', '2026-02-15 14:10:00'),
(103, 'ORD-2026-8912', 3, 'Michael Chang', 'michael@example.com', '+1 (555) 345-9876', '456 Oakway Road', 'Austin', 'TX', '78701', 'United States', 'Standard Ground (3-5 days)', 'Credit Card (Mastercard ending in 8891)', 'paid', 'processing', 214.00, 20.00, 15.52, 0.00, 209.52, 'TRK-GND-882310', 'Ring bell upon arrival', '2026-02-16 13:40:00', '2026-02-16 15:00:00'),
(104, 'ORD-2026-8913', 1, 'John Doe', 'john@example.com', '+1 (555) 234-5678', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'United States', 'Standard Ground (3-5 days)', 'Credit Card (Visa ending in 4242)', 'pending', 'pending', 579.00, 0.00, 46.32, 0.00, 625.32, 'TRK-GND-pending', '', '2026-02-17 10:05:00', '2026-02-17 10:05:00');

-- 7. Order Items Seed
INSERT INTO `order_items` (`id`, `order_id`, `product_id`, `product_name`, `product_image`, `price`, `quantity`, `total`, `created_at`) VALUES
(1, 101, 1, 'Aura Sound Pro Wireless ANC Headphones', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80', 199.99, 1, 199.99, '2026-02-10 11:20:00'),
(2, 101, 2, 'Chronos Horizon Smart Fitness Watch', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80', 159.00, 1, 159.00, '2026-02-10 11:20:00'),
(3, 102, 4, 'Nomad Transit Weatherproof Commuter Backpack', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80', 155.00, 1, 155.00, '2026-02-14 09:15:00'),
(4, 103, 3, 'Merino Wool Relaxed Overshirt', 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80', 119.00, 1, 119.00, '2026-02-16 13:40:00'),
(5, 103, 10, 'Solid Walnut MagSafe Charging Station & Organizer', 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80', 95.00, 1, 95.00, '2026-02-16 13:40:00'),
(6, 104, 8, 'Lumina Ergo 4K OLED Ultra-Slim Monitor', 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80', 579.00, 1, 579.00, '2026-02-17 10:05:00');

-- 8. Reviews Seed
INSERT INTO `reviews` (`id`, `product_id`, `user_id`, `user_name`, `rating`, `comment`, `created_at`) VALUES
(1, 1, 1, 'John Doe', 5, 'Exceptional audio fidelity and top-notch active noise cancellation! The battery lasts me the entire work week without needing a recharge.', '2026-02-11 14:20:00'),
(2, 1, 2, 'Sarah Jenkins', 5, 'Extremely comfortable on long flights. The planar drivers produce deep, crystal clear bass without overpowering mids.', '2026-02-12 09:45:00'),
(3, 4, 2, 'Sarah Jenkins', 5, 'Best commuter backpack I\'ve ever owned. The water resistance is genuine, survived a heavy Seattle downpour with my laptop completely dry.', '2026-02-16 18:10:00');

-- 9. Cart & Cart Items Demo
INSERT INTO `cart` (`id`, `user_id`, `session_id`, `created_at`) VALUES
(1, 1, NULL, '2026-02-18 09:00:00');

INSERT INTO `cart_items` (`id`, `cart_id`, `product_id`, `quantity`, `price`, `created_at`) VALUES
(1, 1, 5, 1, 54.00, '2026-02-18 09:05:00');


-- ====================================================================
-- HELPFUL ANALYTICAL VIEWS FOR E-COMMERCE QUERIES & DASHBOARD
-- ====================================================================

-- View 1: Active Catalog with Category Info
CREATE OR REPLACE VIEW `v_active_catalog` AS
SELECT 
  p.id,
  p.name AS product_name,
  p.slug,
  p.sku,
  c.name AS category_name,
  COALESCE(p.discount_price, p.price) AS current_price,
  p.price AS original_price,
  p.stock_quantity,
  p.rating,
  p.review_count,
  p.is_featured
FROM `products` p
JOIN `categories` c ON p.category_id = c.id
WHERE p.is_active = 1 AND c.is_active = 1;

-- View 2: Sales by Category Report
CREATE OR REPLACE VIEW `v_sales_by_category` AS
SELECT 
  c.name AS category_name,
  COUNT(DISTINCT oi.order_id) AS total_orders,
  SUM(oi.quantity) AS total_units_sold,
  SUM(oi.total) AS total_revenue
FROM `order_items` oi
JOIN `products` p ON oi.product_id = p.id
JOIN `categories` c ON p.category_id = c.id
JOIN `orders` o ON oi.order_id = o.id
WHERE o.payment_status = 'paid'
GROUP BY c.id, c.name;

-- View 3: Low Stock Alert
CREATE OR REPLACE VIEW `v_low_stock_inventory` AS
SELECT 
  id,
  sku,
  name,
  stock_quantity
FROM `products`
WHERE stock_quantity < 10 AND is_active = 1;
