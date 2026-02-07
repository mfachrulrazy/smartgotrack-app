export interface Item {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  image?: string;
}

export interface Store {
  id: string;
  name: string;
  location?: string;
}

export interface Purchase {
  id: string;
  itemId: string;
  itemName: string; // Denormalized for display ease
  storeId: string;
  storeName: string; // Denormalized for display ease
  date: string; // ISO Date string
  price: number;
  quantity: number;
  unit: string;
  total: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: number;
  // If the message contains parsed purchase data to confirm
  pendingPurchase?: Partial<Purchase>;
}

export interface AppState {
  items: Item[];
  stores: Store[];
  purchases: Purchase[];
}

export type AppContextType = {
  state: AppState;
  addPurchase: (purchase: Purchase) => void;
  updatePurchase: (purchase: Purchase) => void;
  getHistoryForItem: (itemId: string) => Purchase[];
  getSpendingStats: () => { total: number; trend: number; topCategory: string };
};