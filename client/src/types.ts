export type ProductCategory = "CPU" | "GPU" | "MOTHERBOARD" | "RAM" | "SSD";

export type ProductCondition = "NEW" | "LIKE_NEW" | "USED" | "FOR_PARTS";

export type Product = {
  id: string;
  name: string;
  description: string;
  category: ProductCategory;
  priceRub: number;
  imageUrl: string;
  imageUrls?: string[];
  specs: unknown;
  stock: number;
  condition?: ProductCondition;
  city?: string | null;
  isHidden?: boolean;
  viewCount?: number;
  seller?: { id: string; name: string | null } | null;
  createdAt?: string;
};

export type SellerListingAnalyticsRow = {
  id: string;
  name: string;
  category: ProductCategory;
  priceRub: number;
  isHidden: boolean;
  viewCount: number;
  createdAt: string;
  soldUnits: number;
  conversations: number;
  conversionOrderPct: number;
  conversionMsgPct: number;
};

export type SellerAnalytics = {
  summary: {
    listings: number;
    activeListings: number;
    totalViews: number;
    soldUnits: number;
    conversations: number;
    revenueRub: number;
  };
  listings: SellerListingAnalyticsRow[];
  ordersByDay: Array<{ date: string; count: number; revenueRub: number }>;
  demandIdeas: Array<{ category: string; soldUnits30d: number; hint: string }>;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
};

export type SellerProfile = {
  user: { id: string; name: string | null; createdAt: string };
  stats: { reviewsCount: number; ratingAvg: number | null };
  products: Product[];
  reviews: Array<{
    id: string;
    rating: number;
    text: string | null;
    createdAt: string;
    buyer: { id: string; name: string | null };
  }>;
};

