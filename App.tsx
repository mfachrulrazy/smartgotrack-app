import React, { useState, createContext, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './services/firebase';

import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Reports from './components/Reports';
import Compare from './components/Compare';
import Login from './components/Login';

import { AppState, AppContextType, Purchase, UserProfile } from './types';
import { fetchUserData, saveUserPurchase, updateUserPurchase as updateDbPurchase } from './services/dataService';

// Initial Context State
export const AppContext = createContext<AppContextType>({
  user: null,
  state: { items: [], stores: [], purchases: [] },
  addPurchase: () => {},
  updatePurchase: () => {},
  getHistoryForItem: () => [],
  getSpendingStats: () => ({ total: 0, trend: 0, topCategory: '' }),
  logout: async () => {},
});

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  
  const [state, setState] = useState<AppState>({
    items: [],
    stores: [],
    purchases: [],
  });

  useEffect(() => {
    // Auth Listener
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
            setUser({
                uid: currentUser.uid,
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL
            });
            
            // Fetch real data from Firestore
            try {
                const data = await fetchUserData(currentUser.uid);
                setState(data);
            } catch (err) {
                console.error("Failed to load user data", err);
                // Fallback to empty state
                setState({ items: [], stores: [], purchases: [] });
            }
        } else {
            setUser(null);
            setState({ items: [], stores: [], purchases: [] });
        }
        setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  const addPurchase = (purchase: Purchase) => {
    setState(prev => {
        // Optimistic update
        const newState = {
            ...prev,
            purchases: [purchase, ...prev.purchases] // Add to top
        };
        return newState;
    });
    
    // Persist to Firestore
    if (user?.uid) {
        saveUserPurchase(user.uid, purchase);
    }
  };

  const updatePurchase = (purchase: Purchase) => {
    setState(prev => ({
        ...prev,
        purchases: prev.purchases.map(p => p.id === purchase.id ? purchase : p)
    }));
    
    // Persist update to Firestore
    if (user?.uid) {
        updateDbPurchase(user.uid, purchase);
    }
  };

  const getHistoryForItem = (itemId: string) => {
      return state.purchases.filter(p => p.itemId === itemId);
  };

  const getSpendingStats = () => {
      const total = state.purchases.reduce((acc, p) => acc + p.total, 0);
      return { total, trend: -5, topCategory: 'Groceries' };
  };

  const logout = async () => {
      await signOut(auth);
  };

  // Loading Screen
  if (loadingAuth) {
      return (
          <div className="h-screen w-screen flex items-center justify-center bg-emerald-500">
              <div className="text-white text-center">
                  <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
                  <h2 className="font-bold text-xl">SmartGotrack</h2>
              </div>
          </div>
      );
  }

  // If not logged in, show Login
  if (!user) {
      return <Login />;
  }

  return (
    <AppContext.Provider value={{ user, state, addPurchase, updatePurchase, getHistoryForItem, getSpendingStats, logout }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/chat" element={<ChatInterface />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/compare" element={<Compare />} />
          </Routes>
        </Layout>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
