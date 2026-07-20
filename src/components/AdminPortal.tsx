// src/components/AdminPortal.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChefHat, Upload, Save, Trash2, Edit3, Plus, X, Lock, Settings,
  ImageIcon, CheckCircle, AlertCircle, LogOut, Eye, EyeOff, RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { defaultProducts, categories, type Product } from "@/data/products";
import { STORAGE_ACCOUNT, SHOP_NAME } from "@/config/app";

// --- Storage helpers (inline to avoid import issues) ---
const CONTAINERS = { data: "bakery-data", images: "bakery-images" } as const;

interface StorageConfig { account: string; sasToken: string; }

function getStorageConfig(): StorageConfig | null {
  try { const raw = localStorage.getItem("bakery-admin-storage"); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function setStorageConfig(config: StorageConfig) {
  try { localStorage.setItem("bakery-admin-storage", JSON.stringify(config)); } catch {}
}
function clearStorageConfig() {
  try { localStorage.removeItem("bakery-admin-storage"); } catch {}
}

function getImageUrl(blobName: string): string {
  return `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.images}/${blobName}`;
}

async function uploadBlob(container: string, blobName: string, file: File | string, sasToken: string, contentType: string): Promise<void> {
  const url = `https://${STORAGE_ACCOUNT}.blob.core.windows.net/${container}/${blobName}?${sasToken}`;
  const body = typeof file === "string" ? new Blob([file]) : file;
  const response = await fetch(url, { method: "PUT", headers: { "x-ms-blob-type": "BlockBlob", "Content-Type": contentType }, body });
  if (!response.ok) throw new Error(`Upload failed: ${response.status}`);
}

async function fetchProductsFromCloud(): Promise<any[] | null> {
  try {
    const res = await fetch(`https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/products.json`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

// --- Password hash for "bakery123" ---
const ADMIN_PASSWORD_HASH = "075d9fa1fce3c8dbee6dc1b04d7b51bd96f90016b849598c28ae0e01fcd1a701";

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function generateId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") + "-" + Date.now().toString(36);
}

// --- Error Boundary ---
function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-stone-800 text-center mb-2">Something went wrong</h2>
        <p className="text-stone-500 text-sm text-center mb-4">{error.message}</p>
        <pre className="bg-stone-100 p-3 rounded-lg text-xs text-stone-700 overflow-auto max-h-40 mb-4">{error.stack}</pre>
        <Button onClick={reset} className="w-full bg-amber-700 hover:bg-amber-800 text-white">Try Again</Button>
      </div>
    </div>
  );
}

export function AdminPortal() {
  const [error, setError] = useState<Error | null>(null);

  if (error) {
    return <ErrorFallback error={error} reset={() => setError(null)} />;
  }

  return <AdminPortalInner onError={setError} />;
}

function AdminPortalInner({ onError }: { onError: (e: Error) => void }) {
  useEffect(() => {
    const handler = (e: ErrorEvent) => onError(e.error || new Error(e.message));
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, [onError]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState<"products" | "settings">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formOfferPrice, setFormOfferPrice] = useState("");
  const [formCategory, setFormCategory] = useState<string>("bread");
  const [formTags, setFormTags] = useState("");
  const [formAllergens, setFormAllergens] = useState("");
  const [formCalories, setFormCalories] = useState("");
  const [formIsNew, setFormIsNew] = useState(false);
  const [formIsBestseller, setFormIsBestseller] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [config, setConfigState] = useState<StorageConfig | null>(null);
  const [sasInput, setSasInput] = useState("");
  const [showSas, set
