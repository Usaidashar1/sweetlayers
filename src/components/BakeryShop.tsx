// src/components/BakeryShop.tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Search, X, Plus, Minus, ChefHat, Star, Leaf, Clock,
  MapPin, Phone, Instagram, Facebook, ArrowRight, Heart, Flame,
  Sparkles, Tag, MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { useProductStore } from "@/hooks/useProductStore";
import { categories } from "@/data/products";
import { WHATSAPP_NUMBER, SHOP_NAME, CURRENCY } from "@/config/app";
import type { Product } from "@/data/products";

function generateWhatsAppLink(cart: { product: Product; quantity: number }[], total: number): string {
  const items = cart
    .map((item) => {
      const price = item.product.offerPrice ?? item.product.price;
      const lineTotal = price * item.quantity;
      const priceLabel = item.product.offerPrice
        ? `~${CURRENCY}${item.product.price.toFixed(2)}~ ${CURRENCY}${item.product.offerPrice.toFixed(2)}`
        : `${CURRENCY}${item.product.price.toFixed(2)}`;
      return `• ${item.product.name} (x${item.quantity}) @ ${priceLabel} = ${CURRENCY}${lineTotal.toFixed(2)}`;
    })
    .join("\n");

  const savings = cart.reduce((sum, item) => {
    if (item.product.offerPrice) {
      return sum + (item.product.price - item.product.offerPrice) * item.quantity;
    }
    return sum;
  }, 0);

  let message = `🥐 *Order from ${SHOP_NAME}*\n\n`;
  message += `📋 *My Order:*\n${items}\n\n`;
  message += `💵 *Total: ${CURRENCY}${total.toFixed(2)}*`;
  if (savings > 0) {
    message += `\n🎉 *You saved: ${CURRENCY}${savings.toFixed(2)}!*`;
  }
  message += `\n\nPlease confirm my order. Thank you! 🙏`;

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function BakeryShop() {
  const {
    filteredProducts, loading,
    selectedCategory, setSelectedCategory,
    searchQuery, setSearchQuery,
    cart, addToCart, removeFromCart, updateQuantity, clearCart,
    cartTotal, cartCount,
  } = useProductStore();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <ChefHat className="h-12 w-12 text-amber-600 mx-auto mb-4 animate-bounce" />
          <p className="text-stone-600 font-medium">Loading fresh goodies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Announcement Bar */}
      <div className="bg-amber-900 text-amber-50 text-center py-2 text-sm font-medium">
        🥖 Free delivery on orders over $50 • Fresh baked daily at 5 AM
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <ChefHat className="h-8 w-8 text-amber-700" />
              <span className="text-2xl font-bold text-stone-800 tracking-tight">{SHOP_NAME}</span>
            </div>

            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-stone-600">
              <a href="#menu" className="hover:text-amber-700 transition-colors">Menu</a>
              <a href="#about" className="hover:text-amber-700 transition-colors">About</a>
              <a href="#contact" className="hover:text-amber-700 transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  placeholder="Search pastries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64 bg-stone-100 border-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="relative border-stone-300 hover:bg-amber-50">
                    <ShoppingCart className="h-5 w-5 text-stone-700" />
                    {cartCount > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 bg-amber-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-md bg-stone-50">
                  <SheetHeader>
                    <SheetTitle className="flex items-center gap-2 text-stone-800">
                      <ShoppingCart className="h-5 w-5" /> Your Cart
                    </SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col h-[calc(100vh-180px)]">
                    {cart.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-stone-400">
                        <ShoppingCart className="h-16 w-16 mb-4 opacity-30" />
                        <p className="text-lg font-medium">Your cart is empty</p>
                        <p className="text-sm">Add some delicious items!</p>
                      </div>
                    ) : (
                      <>
                        <ScrollArea className="flex-1 -mx-6 px-6">
                          {cart.map((item) => {
                            const price = item.product.offerPrice ?? item.product.price;
                            return (
                              <div key={item.product.id} className="flex gap-4 py-4 border-b border-stone-200">
                                <img src={item.product.image} alt={item.product.name} className="h-20 w-20 object-cover rounded-lg" />
                                <div className="flex-1">
                                  <h4 className="font-semibold text-stone-800">{item.product.name}</h4>
                                  <div className="flex items-center gap-2">
                                    <span className="text-amber-700 font-bold">{CURRENCY}{(price * item.quantity).toFixed(2)}</span>
                                    {item.product.offerPrice && (
                                      <span className="text-xs text-stone-400 line-through">{CURRENCY}{(item.product.price * item.quantity).toFixed(2)}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>
                                      <Minus className="h-3 w-3" />
                                    </Button>
                                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>
                                      <Plus className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 ml-auto text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => removeFromCart(item.product.id)}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </ScrollArea>
                        <div className="pt-4 space-y-4">
                          <Separator />
                          <div className="flex justify-between text-lg font-bold text-stone-800">
                            <span>Total</span>
                            <span>{CURRENCY}{cartTotal.toFixed(2)}</span>
                          </div>
                          <a
                            href={generateWhatsAppLink(cart, cartTotal)}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setIsCartOpen(false)}
                          >
                            <Button className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg gap-2">
                              <MessageCircle className="h-5 w-5" />
                              Order on WhatsApp
                            </Button>
                          </a>
                          <Button variant="ghost" className="w-full text-stone-500" onClick={clearCart}>
                            Clear Cart
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-stone-100 py-20 lg:py-32">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 text-6xl animate-bounce">🥐</div>
          <div className="absolute top-20 right-20 text-5xl animate-pulse">🍞</div>
          <div className="absolute bottom-20 left-1/4 text-4xl animate-bounce delay-700">🥖</div>
          <div className="absolute bottom-10 right-1/3 text-5xl animate-pulse delay-500">🧁</div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8 }}>
              <Badge className="mb-4 bg-amber-100 text-amber-800 hover:bg-amber-200"><Flame className="h-3 w-3 mr-1" /> Est. 1985</Badge>
              <h1 className="text-5xl lg:text-7xl font-bold text-stone-900 leading-tight mb-6">
                Artisan Baked<span className="text-amber-700"> Perfection</span>
              </h1>
              <p className="text-xl text-stone-600 mb-8 leading-relaxed">
                Handcrafted with love, baked with tradition. Every loaf tells a story of passion, patience, and the finest organic ingredients.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-amber-700 hover:bg-amber-800 text-white px-8" onClick={() => document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" })}>
                  Explore Menu <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-6 mt-10 text-sm text-stone-500">
                <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600" /><span>100% Organic</span></div>
                <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /><span>Baked Fresh Daily</span></div>
                <div className="flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /><span>Made with Love</span></div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=800&h=600&fit=crop" alt="Fresh baked goods" className="w-full h-auto" />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                  <p className="text-white font-semibold text-lg">Today's Special: Butter Croissant</p>
                  <p className="text-white/80 text-sm">27 layers of pure buttery perfection</p>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-4 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-amber-600 fill-amber-600" />
                  </div>
                  <div>
                    <p className="font-bold text-stone-800">4.9/5</p>
                    <p className="text-xs text-stone-500">2,000+ Reviews</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Clock className="h-8 w-8" />, title: "Fresh Daily", desc: "Baked every morning at 4 AM with the finest ingredients" },
              { icon: <Leaf className="h-8 w-8" />, title: "Organic & Local", desc: "Sourced from local farms, 100% organic flour and dairy" },
              { icon: <Sparkles className="h-8 w-8" />, title: "Handcrafted", desc: "Each item shaped by hand with decades of expertise" },
            ].map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center p-6 rounded-2xl bg-stone-50 hover:bg-amber-50 transition-colors">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-amber-100 text-amber-700 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-stone-800 mb-2">{feature.title}</h3>
                <p className="text-stone-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-amber-100 text-amber-800">Our Menu</Badge>
            <h2 className="text-4xl font-bold text-stone-900 mb-4">Fresh From The Oven</h2>
            <p className="text-stone-600 max-w-2xl mx-auto">Explore our selection of artisan breads, delicate pastries, and decadent cakes.</p>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-full px-6 ${selectedCategory === cat.id ? "bg-amber-700 hover:bg-amber-800 text-white" : "border-stone-300 text-stone-600 hover:bg-amber-50"}`}
              >
                <span className="mr-2">{cat.icon}</span>{cat.name}
              </Button>
            ))}
          </div>

          {/* Mobile Search */}
          <div className="sm:hidden mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <Input placeholder="Search pastries..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 bg-white border-stone-200" />
            </div>
          </div>

          {/* Products Grid */}
          <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}
                  className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-stone-100"
                >
                  <div className="relative overflow-hidden cursor-pointer" onClick={() => setSelectedProduct(product)}>
                    <img src={product.image} alt={product.name} className="w-full h-52 object-cover group-hover:scale-110 transition-transform duration-500" />
                    {product.isNew && <Badge className="absolute top-3 left-3 bg-green-500 text-white">New</Badge>}
                    {product.isBestseller && <Badge className="absolute top-3 right-3 bg-amber-500 text-white"><Star className="h-3 w-3 mr-1 fill-white" /> Best Seller</Badge>}
                    {product.offerPrice && (
                      <Badge className="absolute bottom-3 left-3 bg-red-500 text-white gap-1">
                        <Tag className="h-3 w-3" /> SALE
                      </Badge>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-stone-800 text-lg">{product.name}</h3>
                      <div className="text-right">
                        <span className="text-amber-700 font-bold text-lg">{CURRENCY}{product.offerPrice?.toFixed(2) ?? product.price.toFixed(2)}</span>
                        {product.offerPrice && <span className="block text-xs text-stone-400 line-through">{CURRENCY}{product.price.toFixed(2)}</span>}
                      </div>
                    </div>
                    <p className="text-stone-500 text-sm mb-4 line-clamp-2">{product.description}</p>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {product.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-stone-100 text-stone-600 rounded-full">{tag}</span>
                      ))}
                    </div>
                    <Button className="w-full bg-amber-700 hover:bg-amber-800 text-white" onClick={() => { addToCart(product); setIsCartOpen(true); }}>
                      <Plus className="h-4 w-4 mr-2" /> Add to Cart
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <Search className="h-16 w-16 mx-auto text-stone-300 mb-4" />
              <p className="text-xl text-stone-500">No items found</p>
            </div>
          )}
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1556217477-d325251ece38?w=400&h=500&fit=crop" alt="Baker at work" className="rounded-2xl shadow-lg" />
              <img src="https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=400&h=500&fit=crop" alt="Fresh bread" className="rounded-2xl shadow-lg mt-8" />
            </div>
            <div>
              <Badge className="mb-4 bg-amber-100 text-amber-800">Our Story</Badge>
              <h2 className="text-4xl font-bold text-stone-900 mb-6">Baking Tradition Since 1985</h2>
              <p className="text-stone-600 mb-4 leading-relaxed">
                Founded by Master Baker Antonio Rossi, Golden Crust began as a small corner bakery. Every morning at 4 AM, our bakers hand-shape each loaf using techniques passed down through generations.
              </p>
              <div className="grid grid-cols-3 gap-6 mt-8">
                {[{ num: "38+", label: "Years" }, { num: "15", label: "Bakers" }, { num: "50K+", label: "Customers" }].map((s) => (
                  <div key={s.label} className="text-center">
                    <p className="text-3xl font-bold text-amber-700">{s.num}</p>
                    <p className="text-sm text-stone-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-stone-900 text-stone-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <ChefHat className="h-8 w-8 text-amber-500" />
                <span className="text-2xl font-bold text-white">{SHOP_NAME}</span>
              </div>
              <p className="text-stone-400 mb-6 max-w-md">Handcrafted artisan breads and pastries baked fresh daily with organic ingredients.</p>
              <div className="flex gap-4">
                <Button variant="outline" size="icon" className="border-stone-700 text-stone-400 hover:text-white"><Instagram className="h-5 w-5" /></Button>
                <Button variant="outline" size="icon" className="border-stone-700 text-stone-400 hover:text-white"><Facebook className="h-5 w-5" /></Button>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Visit Us</h4>
              <div className="space-y-3">
                <div className="flex items-start gap-3"><MapPin className="h-5 w-5 text-amber-500 mt-0.5" /><span>123 Baker Street, Downtown<br />New York, NY 10001</span></div>
                <div className="flex items-center gap-3"><Phone className="h-5 w-5 text-amber-500" /><span>(555) 123-4567</span></div>
              </div>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#menu" className="hover:text-amber-500 transition-colors">Our Menu</a></li>
                <li><a href="#about" className="hover:text-amber-500 transition-colors">About Us</a></li>
              </ul>
            </div>
          </div>
          <Separator className="bg-stone-800" />
          <div className="pt-8 text-center text-stone-500 text-sm">© 2026 {SHOP_NAME}. All rights reserved.</div>
        </div>
      </footer>

      {/* Product Detail Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProduct && (
            <>
              <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-64 object-cover rounded-lg mb-4" />
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  {selectedProduct.isNew && <Badge className="bg-green-500 text-white">New</Badge>}
                  {selectedProduct.isBestseller && <Badge className="bg-amber-500 text-white">Best Seller</Badge>}
                  {selectedProduct.offerPrice && <Badge className="bg-red-500 text-white">SALE</Badge>}
                </div>
                <DialogTitle className="text-2xl">{selectedProduct.name}</DialogTitle>
                <DialogDescription className="text-lg text-amber-700 font-bold">
                  {CURRENCY}{selectedProduct.offerPrice?.toFixed(2) ?? selectedProduct.price.toFixed(2)}
                  {selectedProduct.offerPrice && <span className="ml-2 text-sm text-stone-400 line-through font-normal">{CURRENCY}{selectedProduct.price.toFixed(2)}</span>}
                </DialogDescription>
              </DialogHeader>
              <p className="text-stone-600 leading-relaxed">{selectedProduct.description}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {selectedProduct.tags.map((tag) => <Badge key={tag} variant="secondary" className="bg-stone-100 text-stone-700">{tag}</Badge>)}
              </div>
              {selectedProduct.allergens && (
                <div classApp="mt-4 p-4 bg-red-50 rounded-lg border border-red-100">
                  <p className="text-sm text-red-700 font-medium">⚠️ Contains: {selectedProduct.allergens.join(", ")}</p>
                </div>
              )}
              <Button className="w-full mt-6 bg-amber-700 hover:bg-amber-800 text-white h-12 text-lg" onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); setIsCartOpen(true); }}>
                <Plus className="h-5 w-5 mr-2" /> Add to Cart
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}