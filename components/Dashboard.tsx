import React, { useContext, useMemo, useState } from 'react';
import { AppContext } from '../App';
import { Link } from 'react-router-dom';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip as RechartsTooltip } from 'recharts';
import { Purchase } from '../types';

const Dashboard: React.FC = () => {
  const { state, addPurchase, updatePurchase } = useContext(AppContext);
  const { purchases } = state;

  const totalSpent = purchases.reduce((sum, p) => sum + p.total, 0);
  const recentPurchases = purchases.slice(0, 5);

  // Calculate generic daily spending for the chart (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => ({
    name: date.slice(5), // MM-DD
    amount: purchases
      .filter(p => p.date.startsWith(date))
      .reduce((sum, p) => sum + p.total, 0)
  }));

  // --- Favorites Logic ---
  // Identify most frequent items to show in Quick Add
  const favorites = useMemo(() => {
    const counts: Record<string, number> = {};
    const latest: Record<string, Purchase> = {};

    purchases.forEach(p => {
      counts[p.itemName] = (counts[p.itemName] || 0) + 1;
      // Track the most recent purchase for default values
      if (!latest[p.itemName] || new Date(p.date) > new Date(latest[p.itemName].date)) {
        latest[p.itemName] = p;
      }
    });

    // Sort by frequency and take top 4
    return Object.keys(counts)
      .sort((a, b) => counts[b] - counts[a])
      .slice(0, 4)
      .map(name => latest[name]);
  }, [purchases]);

  // --- Bottom Sheet State ---
  const [editingItem, setEditingItem] = useState<Purchase | null>(null);
  const [sheetMode, setSheetMode] = useState<'create' | 'update'>('create');
  const [formData, setFormData] = useState({
    price: '',
    quantity: '',
    storeName: '',
    date: ''
  });

  const handleFavoriteClick = (item: Purchase) => {
    setEditingItem(item);
    setSheetMode('create');
    setFormData({
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      storeName: item.storeName,
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleEditClick = (item: Purchase) => {
    setEditingItem(item);
    setSheetMode('update');
    setFormData({
      price: item.price.toString(),
      quantity: item.quantity.toString(),
      storeName: item.storeName,
      date: item.date.split('T')[0] // Ensure we grab YYYY-MM-DD
    });
  };

  const handleCloseSheet = () => {
    setEditingItem(null);
  };

  const handleSheetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const price = parseFloat(formData.price) || 0;
    const quantity = parseFloat(formData.quantity) || 1;

    if (sheetMode === 'create') {
        const newPurchase: Purchase = {
            id: `p-${Date.now()}`,
            itemId: editingItem.itemId,
            itemName: editingItem.itemName,
            storeId: editingItem.storeId, // In a real app, might want to resolve storeId from name
            storeName: formData.storeName,
            date: formData.date,
            price: price,
            quantity: quantity,
            unit: editingItem.unit,
            total: price * quantity
        };
        addPurchase(newPurchase);
    } else {
        const updatedPurchase: Purchase = {
            ...editingItem,
            storeName: formData.storeName,
            date: formData.date,
            price: price,
            quantity: quantity,
            total: price * quantity
        };
        updatePurchase(updatedPurchase);
    }
    
    handleCloseSheet();
  };

  return (
    <div className="p-4 space-y-6 pb-20 relative min-h-screen">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Hi, Jessica!</h2>
        <p className="text-emerald-50 text-sm mb-4">You've tracked {purchases.length} items this month.</p>
        
        <div className="flex justify-between items-end">
          <div>
            <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider">Total Spend</p>
            <p className="text-3xl font-bold">${totalSpent.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <span className="bg-white/20 px-2 py-1 rounded text-xs backdrop-blur-sm">
               <i className="fas fa-arrow-down mr-1"></i> 12% vs last mo
             </span>
          </div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Spending Activity</h3>
        <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                    <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                        cursor={{ fill: '#F3F4F6' }}
                    />
                    <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-gray-800">Recent History</h3>
          <Link to="/reports" className="text-sm text-primary font-medium hover:underline">View All</Link>
        </div>
        
        <div className="space-y-3">
            {recentPurchases.length === 0 ? (
                <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-400 mb-2">No purchases yet</p>
                    <Link to="/chat" className="text-primary font-medium">Add your first item</Link>
                </div>
            ) : (
                recentPurchases.map(purchase => (
                    <div key={purchase.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                <i className="fas fa-shopping-bag"></i>
                            </div>
                            <div>
                                <h4 className="font-semibold text-gray-800">{purchase.itemName}</h4>
                                <p className="text-xs text-gray-500">{purchase.storeName} • {new Date(purchase.date).toLocaleDateString()}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="font-bold text-gray-800">${purchase.total.toFixed(2)}</p>
                                <p className="text-xs text-gray-400">{purchase.quantity} {purchase.unit}</p>
                            </div>
                            <button 
                                onClick={() => handleEditClick(purchase)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                                <i className="fas fa-pencil-alt text-sm"></i>
                            </button>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Quick Favorites (Dynamic) */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">Quick Add Favorites</h3>
        {favorites.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">
                Add purchases to see your favorites here!
            </div>
        ) : (
            <div className="grid grid-cols-2 gap-3">
                {favorites.map((fav) => (
                    <button 
                        key={fav.itemName}
                        onClick={() => handleFavoriteClick(fav)}
                        className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-left group active:scale-[0.98]"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <span className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 group-hover:bg-blue-100 transition-colors">
                                <i className="fas fa-history text-xs"></i>
                            </span>
                            <i className="fas fa-plus-circle text-gray-200 group-hover:text-emerald-500 text-xl transition-colors"></i>
                        </div>
                        <p className="font-bold text-gray-700 text-sm truncate">{fav.itemName}</p>
                        <p className="text-xs text-gray-400">Usually ${fav.price.toFixed(2)}</p>
                    </button>
                ))}
            </div>
        )}
      </div>

      {/* Bottom Sheet for Quick Add / Edit */}
      {editingItem && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={handleCloseSheet}
              ></div>
              
              {/* Sheet */}
              <div className="bg-white w-full max-w-md rounded-t-3xl p-6 shadow-2xl relative z-10 animate-[slide-up_0.3s_ease-out]">
                  <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>
                  
                  <div className="flex justify-between items-center mb-6">
                      <div>
                          <h3 className="text-xl font-bold text-gray-800">
                              {sheetMode === 'create' ? `Quick Add ${editingItem.itemName}` : `Edit Transaction`}
                          </h3>
                          <p className="text-sm text-gray-500">
                              {sheetMode === 'create' ? 'Confirm purchase details' : `Updating ${editingItem.itemName}`}
                          </p>
                      </div>
                      <button 
                        onClick={handleCloseSheet}
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                      >
                          <i className="fas fa-times"></i>
                      </button>
                  </div>

                  <form onSubmit={handleSheetSubmit} className="space-y-5">
                      {/* Store & Date */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Store</label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><i className="fas fa-store"></i></span>
                                <input 
                                    type="text" 
                                    value={formData.storeName}
                                    onChange={(e) => setFormData({...formData, storeName: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Date</label>
                              <input 
                                  type="date" 
                                  value={formData.date}
                                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              />
                          </div>
                      </div>

                      {/* Price & Quantity */}
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Price</label>
                              <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                                  <input 
                                      type="number" 
                                      step="0.01"
                                      value={formData.price}
                                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-3 font-bold text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                              </div>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Quantity</label>
                              <div className="relative">
                                  <input 
                                      type="number" 
                                      step="0.1"
                                      value={formData.quantity}
                                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                                      className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-4 pr-12 py-3 font-bold text-gray-800 text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                  />
                                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">{editingItem.unit}</span>
                              </div>
                          </div>
                      </div>

                      <button 
                        type="submit" 
                        className={`w-full text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center gap-2 ${
                            sheetMode === 'create' ? 'bg-primary shadow-emerald-200' : 'bg-blue-500 shadow-blue-200'
                        }`}
                      >
                          <span>{sheetMode === 'create' ? 'Save Transaction' : 'Update Transaction'}</span>
                          <span className={`${sheetMode === 'create' ? 'bg-emerald-600' : 'bg-blue-600'} px-2 py-0.5 rounded text-sm`}>
                            ${(parseFloat(formData.price || '0') * parseFloat(formData.quantity || '0')).toFixed(2)}
                          </span>
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
