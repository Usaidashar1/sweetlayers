// src/config/storage.ts
import { STORAGE_ACCOUNT } from "./app";

export const CONTAINERS = {
  data: "bakery-data",
  images: "bakery-images",
} as const;

export interface StorageConfig {
  account: string;
  sasToken: string;
}

export function getStorageConfig(): StorageConfig | null {
  try {
    const raw = localStorage.getItem("bakery-admin-storage");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStorageConfig(config: StorageConfig) {
  try {
    localStorage.setItem("bakery-admin-storage", JSON.stringify(config));
  } catch {}
}

export function clearStorageConfig() {
  try {
    localStorage.removeItem("bakery-admin-storage");
  } catch {}
}

export function getImageUrl(blobName: string): string {
  return `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.images}/${blobName}`;
}

export function getDataUrl(blobName: string, sasToken?: string): string {
  const base = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/${blobName}`;
  return sasToken ? `${base}?${sasToken}` : base;
}

export async function uploadBlob(
  container: string,
  blobName: string,
  file: File | string,
  sasToken: string,
  contentType: string
): Promise<void> {
  const url = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${container}/${blobName}?${sasToken}`;
  const body = typeof file === "string" ? new Blob([file]) : file;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": contentType,
      "x-ms-blob-cache-control": "max-age=31536000, immutable",
    },
    body,
  });

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
  }
}

// FIX: Added cache-busting so we always get the latest products.json
export async function fetchProductsFromCloud(): Promise<any[] | null> {
  try {
    const cacheBuster = Date.now();
    const res = await fetch(
      `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/products.json?cb=${cacheBuster}`,
      { cache: "no-store" }
    );
    if (!res.ok) {
      console.log("products.json not found in cloud, using defaults");
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("Failed to fetch products:", err);
    return null;
  }
}
