// src/config/app.ts
// 🔧 EDIT THESE VALUES BEFORE DEPLOYING

/** Your Azure Storage Account name (lowercase, no spaces) */
export const STORAGE_ACCOUNT = "slstorageacnt";

/** Your WhatsApp Business number with country code, NO + sign */
export const WHATSAPP_NUMBER = "9172522376";

/** Shop branding */
export const SHOP_NAME = "Golden Crust Bakery";
export const CURRENCY = "$";

export const CONTAINERS = {
  data: "bakery-data",
  images: "bakery-images",
} as const;

/** Public URL where products.json is served (no SAS needed for read) */
export const PRODUCTS_JSON_URL = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/products.json`;