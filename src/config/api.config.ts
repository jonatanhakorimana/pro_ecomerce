/**
 * SHOP EAZY - BACKEND API CONFIGURATION (Igenamiterere rya Backend API)
 *
 * Ubu buryo bugufasha guhuza Frontend ya React na Backend yawe (PHP REST API, Node.js, Laravel, etc.)
 *
 * UBURYO 2 BWO GUHINDURA BACKEND API URL:
 * 1. Muri .env file: Shyiramo VITE_API_BASE_URL="http://localhost/shopeazy-api/api" cyangwa "http://localhost:8000/api"
 * 2. Muri iyi file cyangwa mu gishushanyo cy'ibikoresho (UI Settings)
 */

export const getApiBaseUrl = (): string => {
  // 1. Check if user configured a custom URL in localStorage
  if (typeof window !== "undefined") {
    const customUrl = localStorage.getItem("shopeazy_custom_api_url");
    if (customUrl) return customUrl;
  }

  // 2. Check environment variable from Vite
  const envBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBaseUrl) {
    return envBaseUrl;
  }

  // 3. Default fallback
  return "/api";
};

export const setApiBaseUrl = (url: string): void => {
  if (typeof window !== "undefined") {
    localStorage.setItem("shopeazy_custom_api_url", url);
  }
};

export const resetApiBaseUrl = (): void => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("shopeazy_custom_api_url");
  }
};

/**
 * URUTONDE RW'AMA ENDPOINTS YA BACKEND API (PHP REST API Endpoints Map)
 *
 * Igihe ukora Backend muri PHP, ibi nibyo byangombwa Frontend ikenera:
 *
 * AUTHENTICATION:
 * POST /api/auth/register    -> Kwiyandikisha (name, email, password, phone, address, city, zipCode)
 * POST /api/auth/login       -> Kwinjira (email, password, role) => Returns { token, user }
 * GET  /api/auth/me          -> Gusoma umwirondoro (Headers: Authorization: Bearer <token>)
 * PUT  /api/auth/profile     -> Guhindura umwirondoro (name, phone, address, city, zipCode)
 *
 * PRODUCTS (IBICURUZWA):
 * GET  /api/products         -> Gusoma ibicuruzwa byose (support query params: category, search, minPrice, maxPrice, sort)
 * GET  /api/products/:id     -> Gusoma igicuruzwa kimwe n'ibijyanye nacyo
 * POST /api/products/:id/reviews -> Kongeramo review (rating, comment, userName)
 *
 * CATEGORIES (IBYICIRO):
 * GET  /api/categories       -> Gusoma ibyiciro by'ibicuruzwa
 *
 * CART (INTEBE Y'IBIGUZWE):
 * GET    /api/cart           -> Gusoma ibiri mu kagare
 * POST   /api/cart/items     -> Kongeramo igicuruzwa (productId, quantity)
 * PUT    /api/cart/items/:id -> Guhindura umubare (quantity)
 * DELETE /api/cart/items/:id -> Gukuramo igicuruzwa kimwe
 * DELETE /api/cart/clear     -> Gusiba ibiri mu kagare byose
 * POST   /api/coupons/validate -> Kugenzura coupon code
 *
 * ORDERS (AMATUMIZA):
 * POST /api/orders           -> Gukora order (customerName, shippingAddress, items, total, etc.)
 * GET  /api/orders           -> Gusoma amatumiza y'umukiriya (filter by email)
 * GET  /api/orders/:id       -> Gusoma details za order
 * GET  /api/orders/track/:trackingNumber -> Gukurikirana aho ipaki igeze
 *
 * ADMIN PORTAL:
 * GET    /api/admin/dashboard   -> Imibare y'ubucuruzi (Revenue, total orders, customers)
 * GET    /api/admin/products    -> Gusoma ibicuruzwa byose byo gucunga
 * POST   /api/admin/products    -> Kongeramo igicuruzwa gishya
 * PUT    /api/admin/products/:id-> Guhindura igicuruzwa
 * DELETE /api/admin/products/:id-> Gusiba igicuruzwa
 * GET    /api/admin/categories  -> Gusoma ibyiciro
 * POST   /api/admin/categories  -> Kurema icyiciro gishya
 * PUT    /api/admin/categories/:id -> Guhindura icyiciro
 * DELETE /api/admin/categories/:id -> Gusiba icyiciro
 * GET    /api/admin/orders      -> Gusoma amatumiza yose
 * PUT    /api/admin/orders/:id/status -> Guhindura shippingStatus na trackingNumber
 * GET    /api/admin/users       -> Gusoma abakiriya biyandikishije
 */
