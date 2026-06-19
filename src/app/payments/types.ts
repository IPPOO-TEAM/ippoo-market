export type PayMethod = "wallet" | "mobile" | "card" | "cod" | "qr";

export type MobileProvider = "mtn" | "moov" | "celtis" | "wave" | "orange";

export const MOBILE_PROVIDER_LABEL: Record<MobileProvider, string> = {
  mtn: "MTN Money",
  moov: "Moov Money",
  celtis: "Celtis Cash",
  wave: "Wave",
  orange: "Orange Money",
};

export type CartItem = {
  id: number | string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  unit?: string;
  seller: string;
  moq?: number;
  uid?: string;
  category?: string;
  vendorId?: string;
  vendorName?: string;
};

export type OrderStatus =
  | "preparation"
  | "expedition"
  | "livree"
  | "cloturee"
  | "litige"
  | "annulee";

export type EscrowStatus = "held" | "released" | "refunded" | "n/a";

export type Order = {
  id: string;
  createdAt: number;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  address: {
    name: string;
    phone: string;
    city: string;
    line: string;
    note?: string;
  };
  shippingMode: "std" | "express";
  payMethod: PayMethod;
  status: OrderStatus;
  paid: boolean;
  txnId?: string;
  invoiceId?: string;
  escrowStatus: EscrowStatus;
  idempotencyKey?: string;
  dispute?: { reason: string; details?: string; openedAt: number; status: "open" | "resolved" };
};

export type Transaction = {
  id: string;
  type: "credit" | "debit";
  label: string;
  amount: number;
  date: string;
  time: string;
  method: string;
  status: "success" | "pending" | "failed";
  ref: string;
  ts: number;
};

export type InvoiceLine = {
  productId: number | string;
  uid: string;
  name: string;
  category?: string;
  unit?: string;
  quantity: number;
  unitPrice: number;
  total: number;
  vendorId?: string;
  vendorName?: string;
};

export type Invoice = {
  id: string;
  orderId: string;
  total: number;
  date: string;
  status: "paid" | "pending";
  ts: number;
  lines?: InvoiceLine[];
  vendorRefs?: { vendorId: string; vendorName: string; subtotal: number }[];
  buyer?: { name: string; phone?: string; city?: string; line?: string };
  payMethod?: PayMethod;
};

export type StockMovement = {
  id: string;
  productId: number | string;
  uid: string;
  vendorId?: string;
  vendorName?: string;
  delta: number;
  reason: "sale" | "restock" | "adjustment";
  ref?: string;
  ts: number;
  date: string;
};

export type Subscription = {
  planId: "monthly" | "quarterly" | "yearly";
  label: string;
  price: number;
  startedAt: number;
  expiresAt: number;
  autoRenew: boolean;
};

export type State = {
  cart: CartItem[];
  promoCode: string | null;
  promoDiscount: number;
  walletBalance: number;
  walletBlocked: number;
  pinHash: string | null;
  pinSalt: string;
  pinFailures: number;
  pinLockedUntil: number | null;
  walletActivated: boolean;
  walletKeyHash: string;
  orders: Order[];
  transactions: Transaction[];
  invoices: Invoice[];
  subscription: Subscription | null;
  stock: Record<string, number>;
  movements: StockMovement[];
  processedKeys: Record<string, { orderId: string; txnId: string; invoiceId?: string; ts: number }>;
  schemaVersion: number;
};
