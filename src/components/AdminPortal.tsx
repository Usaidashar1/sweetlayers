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
    const cacheBuster = Date.now();
    const res = await fetch(`https://${STORAGE_ACCOUNT}.blob.core.windows.net/${CONTAINERS.data}/products.json?cb=${cacheBuster}`, { cache: "no-store" });
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
  if (error) return <ErrorFallback error={error} reset={() => setError(null)} />;
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
  const [showSas, setShowSas] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const cfg = getStorageConfig();
    setConfigState(cfg);
    setSasInput(cfg?.sasToken ?? "");
    async function load() {
      try {
        const cloud = await fetchProductsFromCloud();
        setProducts(cloud && cloud.length > 0 ? cloud : defaultProducts);
      } catch (e) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleLogin = async () => {
    try {
      const hash = await sha256(password);
      if (hash === ADMIN_PASSWORD_HASH) {
        setIsAuthenticated(true);
        localStorage.setItem("bakery-admin-auth", "1");
        toast.success("Welcome!");
      } else {
        toast.error("Incorrect password");
      }
    } catch (e) {
      toast.error("Login error");
    }
  };

  useEffect(() => {
    if (localStorage.getItem("bakery-admin-auth") === "1") setIsAuthenticated(true);
  }, []);

  // FIX: Don't clear SAS token on logout!
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("bakery-admin-auth");
    // Keep storage config (SAS token) so it's still there on next login
    setConfigState(getStorageConfig());
  };

  const resetForm = useCallback(() => {
    setFormName(""); setFormDesc(""); setFormPrice(""); setFormOfferPrice("");
    setFormCategory("bread"); setFormTags(""); setFormAllergens("");
    setFormCalories(""); setFormIsNew(false); setFormIsBestseller(false);
    setImageFile(null); setImagePreview(""); setEditingProduct(null);
  }, []);

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setFormName(product.name);
    setFormDesc(product.description);
    setFormPrice(product.price.toString());
    setFormOfferPrice(product.offerPrice?.toString() ?? "");
    setFormCategory(product.category);
    setFormTags(product.tags.join(", "));
    setFormAllergens(product.allergens?.join(", ") ?? "");
    setFormCalories(product.calories?.toString() ?? "");
    setFormIsNew(product.isNew ?? false);
    setFormIsBestseller(product.isBestseller ?? false);
    setImagePreview(product.image);
    setImageFile(null);
    setShowProductForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProduct = async () => {
    if (!formName.trim() || !formPrice.trim()) { toast.error("Name and price required"); return; }
    if (!config?.sasToken) { toast.error("Configure SAS token in Settings first"); setActiveTab("settings"); return; }

    setSaving(true);
    try {
      let imageUrl = editingProduct?.image ?? "";
      if (imageFile) {
        const blobName = `products/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "-")}`;
        await uploadBlob(CONTAINERS.images, blobName, imageFile, config.sasToken, imageFile.type);
        imageUrl = getImageUrl(blobName);
      }
      const productData: Product = {
        id: editingProduct?.id ?? generateId(formName),
        name: formName.trim(),
        description: formDesc.trim(),
        price: parseFloat(formPrice),
        offerPrice: formOfferPrice ? parseFloat(formOfferPrice) : undefined,
        category: formCategory as Product["category"],
        image: imageUrl,
        tags: formTags.split(",").map(t => t.trim()).filter(Boolean),
        isNew: formIsNew,
        isBestseller: formIsBestseller,
        allergens: formAllergens ? formAllergens.split(",").map(t => t.trim()).filter(Boolean) : undefined,
        calories: formCalories ? parseInt(formCalories) : undefined,
        createdAt: editingProduct?.createdAt ?? new Date().toISOString(),
      };
      const updatedProducts = editingProduct
        ? products.map((p) => (p.id === editingProduct.id ? productData : p))
        : [...products, productData];
      await uploadBlob(CONTAINERS.data, "products.json", JSON.stringify(updatedProducts, null, 2), config.sasToken, "application/json");
      setProducts(updatedProducts);
      setShowProductForm(false);
      resetForm();
      toast.success(editingProduct ? "Updated!" : "Added!");
    } catch (err: any) {
      toast.error("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    if (!config?.sasToken) { toast.error("SAS token not configured"); return; }
    try {
      const updated = products.filter((p) => p.id !== product.id);
      await uploadBlob(CONTAINERS.data, "products.json", JSON.stringify(updated, null, 2), config.sasToken, "application/json");
      setProducts(updated);
      toast.success("Deleted");
    } catch (err: any) {
      toast.error("Delete failed: " + err.message);
    }
  };

  const saveSettings = () => {
    const trimmed = sasInput.trim();
    if (!trimmed) { toast.error("Please paste a SAS token"); return; }
    setStorageConfig({ account: STORAGE_ACCOUNT, sasToken: trimmed });
    setConfigState({ account: STORAGE_ACCOUNT, sasToken: trimmed });
    toast.success("Settings saved!");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="flex items-center gap-2 justify-center mb-6">
            <ChefHat className="h-8 w-8 text-amber-700" />
            <span className="text-xl font-bold text-stone-800">{SHOP_NAME} Admin</span>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input type="password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} className="pl-9" />
            </div>
            <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white" onClick={handleLogin}>Unlock</Button>
          </div>
          <p className="text-xs text-stone-400 text-center mt-4">Restricted to authorized staff only.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-amber-700" />
            <span className="font-bold text-stone-800">{SHOP_NAME} Admin</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={activeTab === "products" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("products")} className={activeTab === "products" ? "bg-amber-700 text-white" : ""}>Products</Button>
            <Button variant={activeTab === "settings" ? "default" : "ghost"} size="sm" onClick={() => setActiveTab("settings")} className={activeTab === "settings" ? "bg-amber-700 text-white" : ""}><Settings className="h-4 w-4 mr-1" /> Settings</Button>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-red-600 hover:text-red-700 hover:bg-red-50"><LogOut className="h-4 w-4 mr-1" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "products" && (
            <motion.div key="products" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-stone-800">Products</h1>
                  <p className="text-stone-500 text-sm">Manage your bakery menu items</p>
                </div>
                <Button onClick={() => { resetForm(); setShowProductForm(true); }} className="bg-amber-700 hover:bg-amber-800 text-white gap-2"><Plus className="h-4 w-4" /> Add Product</Button>
              </div>

              {loading ? (
                <div className="text-center py-20 text-stone-400">Loading products...</div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <div key={product.id} className="bg-white rounded-xl border border-stone-200 p-4 flex gap-4 hover:shadow-md transition-shadow">
                      <img src={product.image} alt={product.name} className="h-24 w-24 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-bold text-stone-800 truncate">{product.name}</h3>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-amber-700" onClick={() => openEdit(product)}><Edit3 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-stone-400 hover:text-red-600" onClick={() => handleDelete(product)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 mb-2">{product.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-700 font-bold">${product.offerPrice?.toFixed(2) ?? product.price.toFixed(2)}</span>
                          {product.offerPrice && <span className="text-xs text-stone-400 line-through">${product.price.toFixed(2)}</span>}
                        </div>
                        <div className="flex gap-1 mt-2">
                          {product.isNew && <Badge className="text-xs bg-green-100 text-green-700">New</Badge>}
                          {product.isBestseller && <Badge className="text-xs bg-amber-100 text-amber-700">Best Seller</Badge>}
                          {product.offerPrice && <Badge className="text-xs bg-red-100 text-red-700">Sale</Badge>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-xl">
              <h1 className="text-2xl font-bold text-stone-800 mb-6">Settings</h1>
              <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-6">
                <div>
                  <Label className="text-stone-700 font-semibold">Azure Storage Account</Label>
                  <Input value={STORAGE_ACCOUNT} disabled className="mt-1 bg-stone-50 text-stone-500" />
                  <p className="text-xs text-stone-400 mt-1">Edit src/config/app.ts to change.</p>
                </div>
                <div>
                  <Label className="text-stone-700 font-semibold">SAS Token (Write Access)</Label>
                  <div className="relative mt-1">
                    <Input type={showSas ? "text" : "password"} value={sasInput} onChange={(e) => setSasInput(e.target.value)} placeholder="Paste SAS token here..." className="pr-10" />
                    <button onClick={() => setShowSas(!showSas)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">{showSas ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">Stored in browser only. Get it from Azure Portal → Storage Account → Shared access signature.</p>
                </div>
                <Button onClick={saveSettings} className="bg-amber-700 hover:bg-amber-800 text-white gap-2"><Save className="h-4 w-4" /> Save Settings</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Dialog open={showProductForm} onOpenChange={(open) => { if (!open) { setShowProductForm(false); resetForm(); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
            <DialogDescription>Fill details below. Photos upload directly to Azure Blob Storage.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Product Photo</Label>
              <div className="mt-1 border-2 border-dashed border-stone-300 rounded-xl p-6 text-center hover:border-amber-400 hover:bg-amber-50 transition-colors cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {imagePreview ? <img src={imagePreview} alt="Preview" className="h-48 mx-auto object-contain rounded-lg" /> : <div className="py-8"><ImageIcon className="h-10 w-10 text-stone-300 mx-auto mb-2" /><p className="text-stone-500 font-medium">Click to upload photo</p><p className="text-stone-400 text-xs">JPG, PNG, WEBP up to 5MB</p></div>}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>
              {imagePreview && <Button variant="ghost" size="sm" className="mt-2 text-red-600" onClick={() => { setImageFile(null); setImagePreview(editingProduct?.image ?? ""); }}><X className="h-3 w-3 mr-1" /> Remove</Button>}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Product Name *</Label><Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Butter Croissant" /></div>
              <div>
                <Label>Category *</Label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full h-9 rounded-md border border-stone-300 px-3 text-sm bg-white">
                  {categories.filter((c) => c.id !== "all").map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div><Label>Description</Label><textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe the product..." rows={3} className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" /></div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div><Label>Price ($) *</Label><Input type="number" step="0.01" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} placeholder="0.00" /></div>
              <div><Label>Offer Price ($)</Label><Input type="number" step="0.01" value={formOfferPrice} onChange={(e) => setFormOfferPrice(e.target.value)} placeholder="Sale price (optional)" /></div>
              <div><Label>Calories</Label><Input type="number" value={formCalories} onChange={(e) => setFormCalories(e.target.value)} placeholder="e.g. 250" /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div><Label>Tags (comma separated)</Label><Input value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="vegan, organic, best-seller" /></div>
              <div><Label>Allergens (comma separated)</Label><Input value={formAllergens} onChange={(e) => setFormAllergens(e.target.value)} placeholder="gluten, dairy, nuts" /></div>
            </div>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formIsNew} onChange={(e) => setFormIsNew(e.target.checked)} className="h-4 w-4" /><span className="text-sm">Mark as New</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formIsBestseller} onChange={(e) => setFormIsBestseller(e.target.checked)} className="h-4 w-4" /><span className="text-sm">Best Seller</span></label>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" className="flex-1" onClick={() => { setShowProductForm(false); resetForm(); }}>Cancel</Button>
            <Button className="flex-1 bg-amber-700 hover:bg-amber-800 text-white gap-2" onClick={handleSaveProduct} disabled={saving}>{saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? "Saving..." : (editingProduct ? "Update" : "Add")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
