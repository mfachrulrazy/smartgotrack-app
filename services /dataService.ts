import { Item, Purchase, Store } from '../types';
import { db } from './firebase';
import { collection, query, orderBy, getDocs, setDoc, doc } from 'firebase/firestore';

// Default Catalog Data (kept for UI consistency, not persisted per user yet)
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

/**
 * Fetches the user's purchase history from Firestore.
 * Returns the purchase list + static catalog data.
 */
export const fetchUserData = async (userId: string) => {
  try {
    const purchasesRef = collection(db, "users", userId, "purchases");
    const q = query(purchasesRef, orderBy("date", "desc"));
    
    const querySnapshot = await getDocs(q);
    const purchases: Purchase[] = [];
    
    querySnapshot.forEach((doc) => {
      // We assume the stored data matches the Purchase interface
      purchases.push(doc.data() as Purchase);
    });

    return {
      items: INITIAL_ITEMS,
      stores: INITIAL_STORES,
      purchases: purchases
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    // Return empty purchases on error to prevent app crash
    return {
      items: INITIAL_ITEMS,
      stores: INITIAL_STORES,
      purchases: []
    };
  }
};

/**
 * Saves a new purchase to the user's Firestore collection.
 */
export const saveUserPurchase = async (userId: string, purchase: Purchase) => {
  try {
    const purchaseRef = doc(db, "users", userId, "purchases", purchase.id);
    await setDoc(purchaseRef, purchase);
    console.log('Saved purchase to Firestore:', purchase.id);
  } catch (error) {
    console.error("Error saving purchase:", error);
  }
};

/**
 * Updates an existing purchase in the user's Firestore collection.
 */
export const updateUserPurchase = async (userId: string, purchase: Purchase) => {
  try {
    const purchaseRef = doc(db, "users", userId, "purchases", purchase.id);
    await setDoc(purchaseRef, purchase, { merge: true });
    console.log('Updated purchase in Firestore:', purchase.id);
  } catch (error) {
    console.error("Error updating purchase:", error);
  }
};
