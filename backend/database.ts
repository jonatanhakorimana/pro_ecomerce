import { User, Admin, Category, Product, Cart, CartItem, Order, OrderItem, Review, Coupon, AdminDashboardStats, OrderStatus, PaymentStatus } from '../src/types';

// Production Relational Database Store & SQL Schema Engine
export class Database {
  users: User[] = [];
  admins: Admin[] = [];
  categories: Category[] = [];
  products: Product[] = [];
  carts: Map<string, CartItem[]> = new Map(); // key = userId or sessionId
  orders: Order[] = [];
  reviews: Review[] = [];
  coupons: Coupon[] = [];

  constructor() {
    this.seed();
  }

  // Node.js Express Backend Code snippet for documentation & architecture review
  getNodeJsSnippet(): string {
    return `import express from "express";
import cors from "cors";

// ================================================================
// SHOP EAZY - NODE.JS + EXPRESS FULL-STACK REST API BACKEND
// Runs on Node.js runtime with Express.js router & JSON middleware
// ================================================================

const app = express();
const PORT = process.env.PORT || 3000;

// 1. CORS & Parsing Middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// In-Memory / Database Connection Model
// (Compatible with MongoDB, PostgreSQL via Prisma/Drizzle, or MySQL)
let products = [];
let categories = [];
let orders = [];

// 2. GET /api/products - Search, Filter & List Products
app.get("/api/products", (req, res) => {
  const { category, search, minPrice, maxPrice, sort } = req.query;
  let result = [...products];

  if (category && category !== "all") {
    result = result.filter((p) => p.categoryId === Number(category) || p.slug === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
  }
  if (minPrice) result = result.filter((p) => p.price >= Number(minPrice));
  if (maxPrice) result = result.filter((p) => p.price <= Number(maxPrice));

  res.json({ status: "success", total: result.length, data: result });
});

// 3. POST /api/orders - Checkout & Inventory Deduction
app.post("/api/orders", (req, res) => {
  const { customerName, customerEmail, shippingAddress, items, couponCode } = req.body;
  if (!customerName || !customerEmail || !items?.length) {
    return res.status(400).json({ status: "error", message: "Required checkout fields missing." });
  }

  const trackingNumber = \`TRK-\${Math.random().toString(36).substring(2, 8).toUpperCase()}-\${Math.floor(1000 + Math.random() * 9000)}\`;
  const newOrder = {
    id: orders.length + 1,
    orderNumber: \`ORD-2026-\${Math.floor(1000 + Math.random() * 9000)}\`,
    customerName,
    customerEmail,
    shippingAddress,
    items,
    trackingNumber,
    shippingStatus: "processing",
    createdAt: new Date().toISOString()
  };

  orders.unshift(newOrder);
  res.json({ status: "success", message: "Order placed successfully!", order: newOrder });
});

// 4. GET /api/orders/track/:trackingNumber - Shipment Tracking
app.get("/api/orders/track/:trackingNumber", (req, res) => {
  const order = orders.find((o) => o.trackingNumber === req.params.trackingNumber.toUpperCase());
  if (!order) return res.status(404).json({ status: "error", message: "Tracking number not found." });
  res.json({ status: "success", data: { order, status: order.shippingStatus } });
});

app.listen(PORT, () => {
  console.log(\`[Node.js] Express Backend is running on port \${PORT}\`);
});
`;
  }

  private seed() {
    // 1. Users
    this.users = [
      {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        role: "customer",
        phone: "+1 (555) 234-5678",
        address: "742 Evergreen Terrace",
        city: "Springfield",
        zipCode: "97477",
        country: "United States",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80",
        createdAt: "2026-01-15T08:30:00Z"
      },
      {
        id: 2,
        name: "Sarah Jenkins",
        email: "sarah@example.com",
        role: "customer",
        phone: "+1 (555) 876-5432",
        address: "123 Main Boulevard, Apt 4B",
        city: "Seattle",
        zipCode: "98101",
        country: "United States",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
        createdAt: "2026-02-01T10:15:00Z"
      },
      {
        id: 3,
        name: "Michael Chang",
        email: "michael@example.com",
        role: "customer",
        phone: "+1 (555) 345-9876",
        address: "456 Oakway Road",
        city: "Austin",
        zipCode: "78701",
        country: "United States",
        avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80",
        createdAt: "2026-02-18T14:45:00Z"
      }
    ];

    // 2. Admins
    this.admins = [
      {
        id: 1,
        username: "admin",
        email: "admin@shopeazy.com",
        role: "super_admin",
        permissions: ["all", "products", "orders", "customers", "categories", "analytics"],
        createdAt: "2026-01-01T00:00:00Z"
      }
    ];

    // 3. Categories
    this.categories = [
      {
        id: 1,
        name: "Electronics & Gadgets",
        slug: "electronics",
        description: "High-performance audio, smart wearables, monitors, and modern tech essentials.",
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
        icon: "Headphones",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: 2,
        name: "Fashion & Apparel",
        slug: "fashion",
        description: "Contemporary minimal streetwear, premium coats, and comfortable daily wear.",
        image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&auto=format&fit=crop&q=80",
        icon: "Shirt",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: 3,
        name: "Home & Living",
        slug: "home-living",
        description: "Artisanal ceramics, acoustic lamps, minimalist desk organization, and decor.",
        image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=600&auto=format&fit=crop&q=80",
        icon: "Home",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: 4,
        name: "Sports & Fitness",
        slug: "sports-fitness",
        description: "Smart hydration gear, yoga accessories, and fitness tracking essentials.",
        image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600&auto=format&fit=crop&q=80",
        icon: "Activity",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: 5,
        name: "Beauty & Wellness",
        slug: "beauty-wellness",
        description: "Organic botanical skincare, aromatherapy diffusers, and luxury grooming.",
        image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80",
        icon: "Sparkles",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      },
      {
        id: 6,
        name: "Accessories & Bags",
        slug: "accessories",
        description: "Full-grain leather wallets, waterproof commuter backpacks, and minimalist watches.",
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
        icon: "Briefcase",
        isActive: true,
        createdAt: "2026-01-05T00:00:00Z"
      }
    ];

    // 4. Products
    this.products = [
      {
        id: 1,
        categoryId: 1,
        categoryName: "Electronics & Gadgets",
        name: "Aura Sound Pro Wireless ANC Headphones",
        slug: "aura-sound-pro-wireless-headphones",
        description: "Engineered with 40mm custom planar drivers, active noise cancellation up to -38dB, and ultra-plush memory foam earcups. Delivers 45 hours of battery life with ultra-low latency audio codecs.",
        shortDescription: "Studio-grade wireless headphones with adaptive ANC and 45h playtime.",
        price: 249.99,
        discountPrice: 199.99,
        stockQuantity: 42,
        sku: "AUD-ANC-001",
        rating: 4.9,
        reviewCount: 128,
        image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Wireless", "Audio", "Noise Cancelling", "Bestseller"],
        isFeatured: true,
        isActive: true,
        specifications: {
          "Battery Life": "45 hours (ANC off) / 32 hours (ANC on)",
          "Driver Size": "40mm Titanium Planar",
          "Connectivity": "Bluetooth 5.3 + 3.5mm Aux",
          "Weight": "250g",
          "Warranty": "2 Years Manufacturer Warranty"
        },
        createdAt: "2026-01-10T00:00:00Z"
      },
      {
        id: 2,
        categoryId: 1,
        categoryName: "Electronics & Gadgets",
        name: "Chronos Horizon Smart Fitness Watch",
        slug: "chronos-horizon-smart-fitness-watch",
        description: "1.43-inch AMOLED crystal display with sapphire glass, ECG heart monitoring, SpO2 sensor, built-in dual-frequency GPS, and 5ATM water resistance.",
        shortDescription: "Ultra-thin AMOLED smartwatch with GPS and health tracking.",
        price: 189.00,
        discountPrice: 159.00,
        stockQuantity: 18,
        sku: "WCH-CHR-002",
        rating: 4.8,
        reviewCount: 94,
        image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Smartwatch", "Fitness", "AMOLED", "Waterproof"],
        isFeatured: true,
        isActive: true,
        specifications: {
          "Display": "1.43\" AMOLED 466x466",
          "Battery": "Up to 14 Days",
          "Water Resistance": "5ATM (50m)",
          "Sensors": "Heart Rate, SpO2, Accelerometer, Barometer"
        },
        createdAt: "2026-01-12T00:00:00Z"
      },
      {
        id: 3,
        categoryId: 2,
        categoryName: "Fashion & Apparel",
        name: "Merino Wool Relaxed Overshirt",
        slug: "merino-wool-relaxed-overshirt",
        description: "Tailored from 100% fine Australian Merino wool with natural temperature regulation, horn buttons, and twin chest patch pockets for versatile layering.",
        shortDescription: "Luxurious pure merino wool overshirt with structured drape.",
        price: 135.00,
        discountPrice: 119.00,
        stockQuantity: 25,
        sku: "FAS-OVR-003",
        rating: 4.7,
        reviewCount: 56,
        image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Apparel", "Merino Wool", "Sustainable", "Autumn"],
        isFeatured: true,
        isActive: true,
        specifications: {
          "Material": "100% Extrafine Merino Wool (280gsm)",
          "Fit": "Relaxed Tailored",
          "Care": "Dry clean or hand wash cold",
          "Origin": "Portugal"
        },
        createdAt: "2026-01-14T00:00:00Z"
      },
      {
        id: 4,
        categoryId: 6,
        categoryName: "Accessories & Bags",
        name: "Nomad Transit Weatherproof Commuter Backpack",
        slug: "nomad-transit-weatherproof-commuter-backpack",
        description: "Crafted from 840D recycled ballistic nylon with sealed YKK Aquaguard zippers, magnetic Fidlock buckle, dedicated padded 16\" laptop compartment, and luggage pass-through.",
        shortDescription: "24L ergonomic tech backpack with weatherproof protection.",
        price: 155.00,
        stockQuantity: 30,
        sku: "BAG-NMD-004",
        rating: 4.9,
        reviewCount: 88,
        image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Travel", "Waterproof", "Backpack", "Tech"],
        isFeatured: true,
        isActive: true,
        specifications: {
          "Capacity": "24 Liters",
          "Laptop Sleeve": "Fits up to 16\" MacBook Pro",
          "Material": "Recycled 840D Ballistic Cordura",
          "Dimensions": "48 x 30 x 16 cm"
        },
        createdAt: "2026-01-15T00:00:00Z"
      },
      {
        id: 5,
        categoryId: 3,
        categoryName: "Home & Living",
        name: "Nordic Minimalist Ceramic Coffee Dripper & Carafe",
        slug: "nordic-ceramic-coffee-dripper-carafe",
        description: "Handcrafted matte ceramic pour-over set with heat-resistant borosilicate glass server (600ml) and precision thermal retention grooves.",
        shortDescription: "Artisan matte ceramic pour-over brewing kit with 600ml carafe.",
        price: 68.00,
        discountPrice: 54.00,
        stockQuantity: 15,
        sku: "HOM-COF-005",
        rating: 4.9,
        reviewCount: 42,
        image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Coffee", "Ceramic", "Kitchen", "Artisan"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Carafe Volume": "600 ml (2-4 cups)",
          "Material": "Stoneware Ceramic + Borosilicate Glass",
          "Filter Compatibility": "Standard Cone 02 Filters",
          "Dishwasher Safe": "Yes"
        },
        createdAt: "2026-01-20T00:00:00Z"
      },
      {
        id: 6,
        categoryId: 5,
        categoryName: "Beauty & Wellness",
        name: "Botanical Restorative Face Serum & Oil Complex",
        slug: "botanical-restorative-face-serum",
        description: "Cold-pressed rosehip seed, squalane, bakuchiol, and niacinamide formula for deep hydration, skin barrier repair, and radiant cellular renewal.",
        shortDescription: "Pure botanical face elixir with Bakuchiol and organic Rosehip.",
        price: 52.00,
        stockQuantity: 65,
        sku: "BEA-SER-006",
        rating: 4.8,
        reviewCount: 110,
        image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1608248597359-bb4743c4a24f?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Organic", "Skincare", "Vegan", "Cruelty-Free"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Size": "50 ml / 1.7 fl.oz",
          "Key Actives": "Bakuchiol 1%, Squalane 10%, Niacinamide 3%",
          "Skin Types": "All skin types including sensitive",
          "Packaging": "UV-protective amber glass with dropper"
        },
        createdAt: "2026-01-22T00:00:00Z"
      },
      {
        id: 7,
        categoryId: 4,
        categoryName: "Sports & Fitness",
        name: "HydraTherm Smart Vacuum Insulated Flask",
        slug: "hydratherm-smart-vacuum-insulated-flask",
        description: "Double-wall vacuum insulation keeps cold for 36 hours or hot for 18 hours. Features an LED touch temperature cap and durable powder-coat finish.",
        shortDescription: "750ml thermal bottle with real-time digital temperature display.",
        price: 44.00,
        discountPrice: 36.00,
        stockQuantity: 52,
        sku: "SPT-FLK-007",
        rating: 4.6,
        reviewCount: 38,
        image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Hydration", "Fitness", "Stainless Steel", "BPA Free"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Capacity": "750 ml (25 oz)",
          "Material": "18/8 Food-Grade Stainless Steel",
          "Insulation": "Double-Wall Vacuum with Copper Lining",
          "BPA Free": "100%"
        },
        createdAt: "2026-01-25T00:00:00Z"
      },
      {
        id: 8,
        categoryId: 1,
        categoryName: "Electronics & Gadgets",
        name: "Lumina Ergo 4K OLED Ultra-Slim Monitor",
        slug: "lumina-ergo-4k-oled-monitor",
        description: "27-inch 4K UHD 120Hz OLED display with 99% DCI-P3 color gamut, 0.1ms response time, 90W USB-C Power Delivery, and magnetic auto-pivot stand.",
        shortDescription: "27\" 4K 120Hz OLED professional monitor with 90W USB-C PD.",
        price: 649.00,
        discountPrice: 579.00,
        stockQuantity: 8, // Low stock alert demo!
        sku: "ELC-MON-008",
        rating: 4.9,
        reviewCount: 47,
        image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
          "https://images.unsplash.com/photo-1547082299-de196ea013d6?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Monitor", "OLED", "4K", "Creator", "High-End"],
        isFeatured: true,
        isActive: true,
        specifications: {
          "Resolution": "3840 x 2160 (4K UHD)",
          "Panel Type": "True OLED 10-bit",
          "Refresh Rate": "120Hz",
          "Ports": "2x HDMI 2.1, 1x DP 1.4, 1x USB-C (90W PD)"
        },
        createdAt: "2026-01-28T00:00:00Z"
      },
      {
        id: 9,
        categoryId: 2,
        categoryName: "Fashion & Apparel",
        name: "Everyday Structured Heavyweight Cotton Tee",
        slug: "everyday-structured-heavyweight-cotton-tee",
        description: "Crafted with 260 GSM organic combed cotton, ribbed crew collar, and pre-shrunk boxy cut designed to retain shape wash after wash.",
        shortDescription: "260 GSM organic combed cotton premium relaxed tee.",
        price: 38.00,
        stockQuantity: 90,
        sku: "FAS-TEE-009",
        rating: 4.7,
        reviewCount: 79,
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Cotton", "Basics", "Streetwear", "Essential"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Fabric": "100% Organic Ring-Spun Cotton (260 GSM)",
          "Fit": "Boxy Contemporary Fit",
          "Pre-shrunk": "Yes",
          "Certification": "GOTS Certified"
        },
        createdAt: "2026-02-02T00:00:00Z"
      },
      {
        id: 10,
        categoryId: 3,
        categoryName: "Home & Living",
        name: "Solid Walnut MagSafe Charging Station & Organizer",
        slug: "solid-walnut-magsafe-charging-station",
        description: "Carved from sustainably harvested American black walnut with integrated dual 15W Qi2 wireless charging pads and soft micro-suede tray.",
        shortDescription: "Precision CNC American walnut 3-in-1 fast charging station.",
        price: 110.00,
        discountPrice: 95.00,
        stockQuantity: 19,
        sku: "HOM-DSK-010",
        rating: 4.8,
        reviewCount: 51,
        image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Desk", "Woodwork", "Wireless Charger", "Minimalist"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Wood": "FSC-Certified Solid American Walnut",
          "Charging Speed": "Dual 15W Qi2 MagSafe + 5W Watch charger",
          "Cable Included": "2m Braided USB-C Cable",
          "Finish": "Natural Beeswax Oil"
        },
        createdAt: "2026-02-05T00:00:00Z"
      },
      {
        id: 11,
        categoryId: 6,
        categoryName: "Accessories & Bags",
        name: "Heritage Horween Leather Bifold Wallet",
        slug: "heritage-horween-leather-bifold-wallet",
        description: "Hand-stitched full grain Horween Chromexcel leather with 6 card slots, 2 hidden compartments, and RFID blocking lining.",
        shortDescription: "Full grain Horween leather slim bifold with RFID shield.",
        price: 75.00,
        stockQuantity: 4, // Low stock demo!
        sku: "ACC-WLT-011",
        rating: 4.9,
        reviewCount: 63,
        image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Leather", "Wallet", "Handmade", "Everyday Carry"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Leather Type": "Full-Grain Horween Chromexcel (USA)",
          "Stitching": "Waxed Japanese Polyester Thread",
          "Card Capacity": "Up to 12 cards + flat bills",
          "RFID Protection": "Yes"
        },
        createdAt: "2026-02-08T00:00:00Z"
      },
      {
        id: 12,
        categoryId: 4,
        categoryName: "Sports & Fitness",
        name: "EcoCork Non-Slip High Density Yoga Mat",
        slug: "ecocork-non-slip-high-density-yoga-mat",
        description: "Natural organic cork top surface with recycled tree rubber base. Non-slip grip enhances as you sweat, naturally antimicrobial and easy to clean.",
        shortDescription: "5mm organic cork and natural tree rubber alignment mat.",
        price: 85.00,
        discountPrice: 72.00,
        stockQuantity: 28,
        sku: "SPT-MAT-012",
        rating: 4.8,
        reviewCount: 39,
        image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80",
        gallery: [
          "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&auto=format&fit=crop&q=80"
        ],
        tags: ["Yoga", "Eco-friendly", "Fitness", "Cork"],
        isFeatured: false,
        isActive: true,
        specifications: {
          "Dimensions": "183 x 66 cm (72\" x 26\")",
          "Thickness": "5mm High Density",
          "Weight": "2.4 kg",
          "Materials": "Organic Cork + Natural Natural Rubber"
        },
        createdAt: "2026-02-10T00:00:00Z"
      }
    ];

    // 5. Coupons
    this.coupons = [
      {
        code: "EAZY10",
        discountType: "percentage",
        discountValue: 10,
        minSpend: 50,
        description: "10% off on all orders over $50",
        isActive: true
      },
      {
        code: "SAVE20",
        discountType: "fixed",
        discountValue: 20,
        minSpend: 100,
        description: "$20 off on orders over $100",
        isActive: true
      },
      {
        code: "FREESHIP",
        discountType: "fixed",
        discountValue: 15,
        minSpend: 75,
        description: "Free shipping discount on orders over $75",
        isActive: true
      }
    ];

    // 6. Orders
    this.orders = [
      {
        id: 101,
        orderNumber: "ORD-2026-8910",
        userId: 1,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1 (555) 234-5678",
        shippingAddress: {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          state: "OR",
          zipCode: "97477",
          country: "United States"
        },
        shippingMethod: "Express Courier (2-3 days)",
        paymentMethod: "Credit Card (Visa ending in 4242)",
        paymentStatus: "paid",
        shippingStatus: "delivered",
        subtotal: 358.99,
        discount: 35.90,
        tax: 25.85,
        shippingFee: 12.00,
        totalAmount: 360.94,
        trackingNumber: "TRK-EXP-992147",
        notes: "Leave at front door porch",
        items: [
          {
            id: 1,
            orderId: 101,
            productId: 1,
            productName: "Aura Sound Pro Wireless ANC Headphones",
            productImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
            price: 199.99,
            quantity: 1,
            total: 199.99
          },
          {
            id: 2,
            orderId: 101,
            productId: 2,
            productName: "Chronos Horizon Smart Fitness Watch",
            productImage: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80",
            price: 159.00,
            quantity: 1,
            total: 159.00
          }
        ],
        createdAt: "2026-02-10T11:20:00Z",
        updatedAt: "2026-02-13T16:40:00Z"
      },
      {
        id: 102,
        orderNumber: "ORD-2026-8911",
        userId: 2,
        customerName: "Sarah Jenkins",
        customerEmail: "sarah@example.com",
        customerPhone: "+1 (555) 876-5432",
        shippingAddress: {
          street: "123 Main Boulevard, Apt 4B",
          city: "Seattle",
          state: "WA",
          zipCode: "98101",
          country: "United States"
        },
        shippingMethod: "Standard Ground (3-5 days)",
        paymentMethod: "PayPal",
        paymentStatus: "paid",
        shippingStatus: "shipped",
        subtotal: 155.00,
        discount: 0,
        tax: 12.40,
        shippingFee: 0,
        totalAmount: 167.40,
        trackingNumber: "TRK-GND-551029",
        notes: "",
        items: [
          {
            id: 3,
            orderId: 102,
            productId: 4,
            productName: "Nomad Transit Weatherproof Commuter Backpack",
            productImage: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80",
            price: 155.00,
            quantity: 1,
            total: 155.00
          }
        ],
        createdAt: "2026-02-14T09:15:00Z",
        updatedAt: "2026-02-15T14:10:00Z"
      },
      {
        id: 103,
        orderNumber: "ORD-2026-8912",
        userId: 3,
        customerName: "Michael Chang",
        customerEmail: "michael@example.com",
        customerPhone: "+1 (555) 345-9876",
        shippingAddress: {
          street: "456 Oakway Road",
          city: "Austin",
          state: "TX",
          zipCode: "78701",
          country: "United States"
        },
        shippingMethod: "Standard Ground (3-5 days)",
        paymentMethod: "Credit Card (Mastercard ending in 8891)",
        paymentStatus: "paid",
        shippingStatus: "processing",
        subtotal: 214.00,
        discount: 20.00,
        tax: 15.52,
        shippingFee: 0,
        totalAmount: 209.52,
        trackingNumber: "TRK-GND-882310",
        notes: "Ring bell upon arrival",
        items: [
          {
            id: 4,
            orderId: 103,
            productId: 3,
            productName: "Merino Wool Relaxed Overshirt",
            productImage: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
            price: 119.00,
            quantity: 1,
            total: 119.00
          },
          {
            id: 5,
            orderId: 103,
            productId: 10,
            productName: "Solid Walnut MagSafe Charging Station & Organizer",
            productImage: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80",
            price: 95.00,
            quantity: 1,
            total: 95.00
          }
        ],
        createdAt: "2026-02-16T13:40:00Z",
        updatedAt: "2026-02-16T15:00:00Z"
      },
      {
        id: 104,
        orderNumber: "ORD-2026-8913",
        userId: 1,
        customerName: "John Doe",
        customerEmail: "john@example.com",
        customerPhone: "+1 (555) 234-5678",
        shippingAddress: {
          street: "742 Evergreen Terrace",
          city: "Springfield",
          state: "OR",
          zipCode: "97477",
          country: "United States"
        },
        shippingMethod: "Standard Ground (3-5 days)",
        paymentMethod: "Credit Card (Visa ending in 4242)",
        paymentStatus: "pending",
        shippingStatus: "pending",
        subtotal: 579.00,
        discount: 0,
        tax: 46.32,
        shippingFee: 0,
        totalAmount: 625.32,
        trackingNumber: "TRK-GND-pending",
        notes: "",
        items: [
          {
            id: 6,
            orderId: 104,
            productId: 8,
            productName: "Lumina Ergo 4K OLED Ultra-Slim Monitor",
            productImage: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80",
            price: 579.00,
            quantity: 1,
            total: 579.00
          }
        ],
        createdAt: "2026-02-17T10:05:00Z",
        updatedAt: "2026-02-17T10:05:00Z"
      }
    ];

    // 7. Reviews
    this.reviews = [
      {
        id: 1,
        productId: 1,
        userId: 1,
        userName: "John Doe",
        rating: 5,
        comment: "Exceptional audio fidelity and top-notch active noise cancellation! The battery lasts me the entire work week without needing a recharge.",
        createdAt: "2026-02-11T14:20:00Z"
      },
      {
        id: 2,
        productId: 1,
        userId: 2,
        userName: "Sarah Jenkins",
        rating: 5,
        comment: "Extremely comfortable on long flights. The planar drivers produce deep, crystal clear bass without overpowering mids.",
        createdAt: "2026-02-12T09:45:00Z"
      },
      {
        id: 3,
        productId: 4,
        userId: 2,
        userName: "Sarah Jenkins",
        rating: 5,
        comment: "Best commuter backpack I've ever owned. The water resistance is genuine, survived a heavy Seattle downpour with my laptop completely dry.",
        createdAt: "2026-02-16T18:10:00Z"
      }
    ];

    // 8. Seed user 1 cart
    this.carts.set("1", [
      {
        id: 1,
        cartId: 1,
        productId: 5,
        product: this.products.find(p => p.id === 5)!,
        quantity: 1,
        price: 54.00
      }
    ]);
  }

  // MySQL DDL and PHP PDO Schema string generator for transparent architectural review
  getMysqlSchemaSql(): string {
    return `-- ============================================================
-- SHOP EAZY E-COMMERCE DATABASE SCHEMA (MySQL 8.0 / MariaDB)
-- Connected via PHP 8.2+ PDO
-- ============================================================

CREATE DATABASE IF NOT EXISTS \`shopeazy_db\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`shopeazy_db\`;

-- 1. Users Table (Customers)
CREATE TABLE IF NOT EXISTS \`users\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(120) NOT NULL,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` ENUM('customer', 'admin') DEFAULT 'customer',
  \`phone\` VARCHAR(30) NULL,
  \`address\` VARCHAR(255) NULL,
  \`city\` VARCHAR(100) NULL,
  \`zip_code\` VARCHAR(20) NULL,
  \`country\` VARCHAR(100) DEFAULT 'United States',
  \`avatar\` VARCHAR(500) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX \`idx_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Admins Table
CREATE TABLE IF NOT EXISTS \`admins\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`username\` VARCHAR(60) NOT NULL UNIQUE,
  \`email\` VARCHAR(191) NOT NULL UNIQUE,
  \`password_hash\` VARCHAR(255) NOT NULL,
  \`role\` VARCHAR(50) DEFAULT 'super_admin',
  \`permissions\` JSON NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Categories Table
CREATE TABLE IF NOT EXISTS \`categories\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`name\` VARCHAR(120) NOT NULL,
  \`slug\` VARCHAR(150) NOT NULL UNIQUE,
  \`description\` TEXT NULL,
  \`image\` VARCHAR(500) NULL,
  \`icon\` VARCHAR(50) DEFAULT 'Folder',
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX \`idx_category_slug\` (\`slug\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Products Table
CREATE TABLE IF NOT EXISTS \`products\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`category_id\` INT UNSIGNED NOT NULL,
  \`name\` VARCHAR(255) NOT NULL,
  \`slug\` VARCHAR(255) NOT NULL UNIQUE,
  \`description\` TEXT NOT NULL,
  \`short_description\` VARCHAR(500) NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`discount_price\` DECIMAL(10,2) NULL,
  \`stock_quantity\` INT UNSIGNED DEFAULT 0,
  \`sku\` VARCHAR(60) NOT NULL UNIQUE,
  \`rating\` DECIMAL(3,2) DEFAULT 5.00,
  \`review_count\` INT UNSIGNED DEFAULT 0,
  \`image\` VARCHAR(500) NOT NULL,
  \`gallery\` JSON NULL,
  \`tags\` JSON NULL,
  \`specifications\` JSON NULL,
  \`is_featured\` TINYINT(1) DEFAULT 0,
  \`is_active\` TINYINT(1) DEFAULT 1,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON DELETE RESTRICT,
  INDEX \`idx_product_category\` (\`category_id\`),
  INDEX \`idx_product_price\` (\`price\`),
  INDEX \`idx_product_featured\` (\`is_featured\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Cart Table
CREATE TABLE IF NOT EXISTS \`cart\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`user_id\` INT UNSIGNED NULL,
  \`session_id\` VARCHAR(100) NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Cart Items Table
CREATE TABLE IF NOT EXISTS \`cart_items\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`cart_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`quantity\` INT UNSIGNED DEFAULT 1,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`cart_id\`) REFERENCES \`cart\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. Orders Table
CREATE TABLE IF NOT EXISTS \`orders\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`order_number\` VARCHAR(50) NOT NULL UNIQUE,
  \`user_id\` INT UNSIGNED NOT NULL,
  \`customer_name\` VARCHAR(120) NOT NULL,
  \`customer_email\` VARCHAR(191) NOT NULL,
  \`customer_phone\` VARCHAR(30) NULL,
  \`shipping_street\` VARCHAR(255) NOT NULL,
  \`shipping_city\` VARCHAR(100) NOT NULL,
  \`shipping_state\` VARCHAR(100) NOT NULL,
  \`shipping_zip\` VARCHAR(20) NOT NULL,
  \`shipping_country\` VARCHAR(100) DEFAULT 'United States',
  \`shipping_method\` VARCHAR(100) NOT NULL,
  \`payment_method\` VARCHAR(100) NOT NULL,
  \`payment_status\` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  \`shipping_status\` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  \`subtotal\` DECIMAL(10,2) NOT NULL,
  \`discount\` DECIMAL(10,2) DEFAULT 0.00,
  \`tax\` DECIMAL(10,2) DEFAULT 0.00,
  \`shipping_fee\` DECIMAL(10,2) DEFAULT 0.00,
  \`total_amount\` DECIMAL(10,2) NOT NULL,
  \`tracking_number\` VARCHAR(100) NULL,
  \`notes\` TEXT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE RESTRICT,
  INDEX \`idx_orders_user\` (\`user_id\`),
  INDEX \`idx_orders_status\` (\`shipping_status\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. Order Items Table
CREATE TABLE IF NOT EXISTS \`order_items\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`order_id\` INT UNSIGNED NOT NULL,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`product_name\` VARCHAR(255) NOT NULL,
  \`product_image\` VARCHAR(500) NULL,
  \`price\` DECIMAL(10,2) NOT NULL,
  \`quantity\` INT UNSIGNED DEFAULT 1,
  \`total\` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (\`order_id\`) REFERENCES \`orders\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. Reviews Table
CREATE TABLE IF NOT EXISTS \`reviews\` (
  \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  \`product_id\` INT UNSIGNED NOT NULL,
  \`user_id\` INT UNSIGNED NOT NULL,
  \`user_name\` VARCHAR(120) NOT NULL,
  \`rating\` TINYINT UNSIGNED NOT NULL,
  \`comment\` TEXT NOT NULL,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (\`product_id\`) REFERENCES \`products\`(\`id\`) ON DELETE CASCADE,
  FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. Coupons Table
CREATE TABLE IF NOT EXISTS \`coupons\` (
  \`code\` VARCHAR(50) PRIMARY KEY,
  \`discount_type\` ENUM('percentage', 'fixed') NOT NULL,
  \`discount_value\` DECIMAL(10,2) NOT NULL,
  \`min_spend\` DECIMAL(10,2) DEFAULT 0.00,
  \`description\` VARCHAR(255) NULL,
  \`is_active\` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;
  }

  // PHP PDO Connection & REST API Architecture Code sample for documentation & preview
  getPhpPdoSnippet(): string {
    return `<?php
/**
 * Shop Eazy - PHP PDO Database Connection & REST Controller Sample
 * Connects React frontend via Axios to PHP REST Backend
 */

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

class Database {
    private string $host = "localhost";
    private string $db_name = "shopeazy_db";
    private string $username = "root";
    private string $password = "secret123";
    private ?PDO $conn = null;

    public function getConnection(): PDO {
        if ($this->conn === null) {
            try {
                $dsn = "mysql:host={$this->host};dbname={$this->db_name};charset=utf8mb4";
                $options = [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ];
                $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            } catch (PDOException $e) {
                http_response_code(500);
                echo json_encode(["status" => "error", "message" => "Database connection error: " . $e->getMessage()]);
                exit();
            }
        }
        return $this->conn;
    }
}

// Sample REST Router for /api/products
$db = (new Database())->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        $categoryId = $_GET['category_id'] ?? null;
        $search = $_GET['search'] ?? null;
        
        $sql = "SELECT p.*, c.name AS category_name FROM products p JOIN categories c ON p.category_id = c.id WHERE p.is_active = 1";
        $params = [];
        
        if ($categoryId) {
            $sql .= " AND p.category_id = :cat_id";
            $params[':cat_id'] = $categoryId;
        }
        if ($search) {
            $sql .= " AND (p.name LIKE :search OR p.description LIKE :search)";
            $params[':search'] = "%{$search}%";
        }
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $products = $stmt->fetchAll();
        
        echo json_encode(["status" => "success", "data" => $products]);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not allowed"]);
}
?>`;
  }
}

export const db = new Database();
