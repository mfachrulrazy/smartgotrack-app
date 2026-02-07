import { Item, Purchase, Store } from '../types';

// Mock Initial Data
const INITIAL_ITEMS: Item[] = [
  { id: '1', name: 'Milk', category: 'Dairy', defaultUnit: 'gallon' },
  { id: '2', name: 'Eggs', category: 'Dairy', defaultUnit: 'dozen' },
  { id: '3', name: 'Rice', category: 'Pantry', defaultUnit: 'kg' },
  { id: '4', name: 'Chicken Breast', category: 'Meat', defaultUnit: 'lb' },
  { id: '5', name: 'Bananas', category: 'Produce', defaultUnit: 'lb' },
];

const INITIAL_STORES: Store[] = [
  { id: 's1', name: 'Walmart' },
  { id: 's2', name: 'Target' },
  { id: 's3', name: 'Whole Foods' },
  { id: 's4', name: 'Costco' },
  { id: 's5', name: 'Kroger' },
];

// Generate some history
const generateHistory = (): Purchase[] => {
  const history: Purchase[] = [];
  const now = new Date();
  
  // Add some purchases over the last 30 days
  for (let i = 0; i < 15; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const item = INITIAL_ITEMS[Math.floor(Math.random() * INITIAL_ITEMS.length)];
    const store = INITIAL_STORES[Math.floor(Math.random() * INITIAL_STORES.length)];
    const price = Math.round((Math.random() * 10 + 2) * 100) / 100;
    const quantity = Math.floor(Math.random() * 3) + 1;

    history.push({
      id: `p-${Math.random().toString(36).substr(2, 9)}`,
      itemId: item.id,
      itemName: item.name,
      storeId: store.id,
      storeName: store.name,
      date: date,
      price: price,
      quantity: quantity,
      unit: item.defaultUnit,
      total: price * quantity
    });
  }
  
  return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

const INITIAL_PURCHASES = generateHistory();

export const loadData = () => {
  // In a real app, load from localStorage or API
  return {
    items: INITIAL_ITEMS,
    stores: INITIAL_STORES,
    purchases: INITIAL_PURCHASES
  };
};

export const savePurchase = (purchase: Purchase) => {
  // In real app, save to API
  console.log('Saved purchase:', purchase);
};
