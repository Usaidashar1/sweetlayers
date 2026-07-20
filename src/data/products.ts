// src/data/products.ts

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number; // 💰 NEW: Discounted price
  category: "bread" | "pastry" | "cake" | "cookie" | "seasonal";
  image: string;
  tags: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  allergens?: string[];
  calories?: number;
  createdAt?: string;
}

export const categories = [
  { id: "all", name: "All Items", icon: "🥖" },
  { id: "bread", name: "Artisan Breads", icon: "🍞" },
  { id: "pastry", name: "Pastries", icon: "🥐" },
  { id: "cake", name: "Cakes", icon: "🎂" },
  { id: "cookie", name: "Cookies", icon: "🍪" },
  { id: "seasonal", name: "Seasonal", icon: "🎃" },
] as const;

export const defaultProducts: Product[] = [
  {
    id: "sourdough",
    name: "Classic Sourdough",
    description: "Our signature 48-hour fermented sourdough with a crispy crust and tangy, chewy interior. Made with organic flour and filtered water.",
    price: 8.50,
    category: "bread",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
    tags: ["vegan", "organic", "best-seller"],
    isBestseller: true,
    allergens: ["gluten"],
    calories: 185,
  },
  {
    id: "croissant",
    name: "Butter Croissant",
    description: "Flaky, golden layers of pure French butter folded into delicate pastry. 27 layers of laminated perfection.",
    price: 4.25,
    offerPrice: 3.50,
    category: "pastry",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038024a?w=600&h=400&fit=crop",
    tags: ["best-seller", "butter"],
    isBestseller: true,
    allergens: ["gluten", "dairy"],
    calories: 280,
  },
  {
    id: "chocolate-cake",
    name: "Decadent Chocolate Cake",
    description: "Triple-layer dark chocolate cake with ganache frosting and chocolate shavings. Made with 70% cacao Valrhona chocolate.",
    price: 42.00,
    offerPrice: 36.00,
    category: "cake",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop",
    tags: ["celebration", "chocolate"],
    allergens: ["gluten", "dairy", "eggs"],
    calories: 450,
  },
  {
    id: "chocolate-chip",
    name: "Sea Salt Chocolate Chip",
    description: "Crispy edges, chewy center, loaded with dark chocolate chunks and finished with flaky Maldon sea salt.",
    price: 3.50,
    category: "cookie",
    image: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=600&h=400&fit=crop",
    tags: ["best-seller", "classic"],
    isBestseller: true,
    allergens: ["gluten", "dairy", "eggs"],
    calories: 220,
  },
  {
    id: "macaron",
    name: "Assorted Macarons",
    description: "Delicate French almond meringue cookies in assorted flavors: pistachio, raspberry, salted caramel, and lavender.",
    price: 2.75,
    category: "cookie",
    image: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?w=600&h=400&fit=crop",
    tags: ["gluten-free", "elegant"],
    allergens: ["nuts", "dairy", "eggs"],
    calories: 90,
  },
  {
    id: "pumpkin-spice",
    name: "Pumpkin Spice Loaf",
    description: "Moist pumpkin bread with warm spices, topped with maple glaze and candied pecans. Fall in every bite.",
    price: 12.00,
    offerPrice: 9.99,
    category: "seasonal",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop",
    tags: ["seasonal", "spiced"],
    isNew: true,
    allergens: ["gluten", "dairy", "eggs", "nuts"],
    calories: 275,
  },
];