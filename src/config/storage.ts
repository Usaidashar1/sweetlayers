// src/config/storage.ts
import { STORAGE_ACCOUNT, CONTAINERS } from "./app";

export interface StorageConfig {
  account: string;
  sasToken: string;
}

export function getStorageConfig(): StorageConfig | null {
  const raw = localStorage.getItem("bakery-admin-storage");
  return raw ? JSON.parse(raw) : null;
}

export function setStorageConfig(config: StorageConfig) {
  localStorage.setItem("bakery-admin-storage", JSON.stringify(config));
}

export function clearStorageConfig() {
  localStorage.removeItem("bakery-admin-storage");
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

export async function fetchProductsFromCloud(): Promise<any[] | null> {
  try {
    const res = await fetch(
      `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/products.json`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}