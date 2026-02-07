import React, { useState, createContext, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import Reports from './components/Reports';
import Compare from './components/Compare';
import { AppState, AppContextType, Purchase } from './types';
import { loadData, savePurchase } from './services/dataService';

// Initial Context State
export const AppContext = createContext<AppContextType>({
  state: { items: [], stores: [], purchases: [] },
  addPurchase: () => {},
  updatePurchase: () => {},
  getHistoryForItem: () => [],
  getSpendingStats: () => ({ total: 0, trend: 0, topCategory: '' }),
});

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    items: [],
    stores: [],
    purchases: [],
  });

  useEffect(() => {
    // Load initial data
    const data = loadData();
    setState(data);
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
    savePurchase(purchase); // Persist
  };

  const updatePurchase = (purchase: Purchase) => {
    setState(prev => ({
        ...prev,
        purchases: prev.purchases.map(p => p.id === purchase.id ? purchase : p)
    }));
    // In real app, you would also call an API to update the record
    console.log('Updated purchase:', purchase);
  };

  const getHistoryForItem = (itemId: string) => {
      return state.purchases.filter(p => p.itemId === itemId);
  };

  const getSpendingStats = () => {
      // Basic mock stats
      const total = state.purchases.reduce((acc, p) => acc + p.total, 0);
      return { total, trend: -5, topCategory: 'Groceries' };
  };

  return (
    <AppContext.Provider value={{ state, addPurchase, updatePurchase, getHistoryForItem, getSpendingStats }}>
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