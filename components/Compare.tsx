import React, { useContext } from 'react';
import { AppContext } from '../App';
import { Purchase } from '../types';

const Compare: React.FC = () => {
  const { state } = useContext(AppContext);
  const { purchases } = state;

  // Group purchases by Item Name
  const groupedItems = React.useMemo(() => {
      const groups: Record<string, Purchase[]> = {};
      purchases.forEach(p => {
          if (!groups[p.itemName]) groups[p.itemName] = [];
          groups[p.itemName].push(p);
      });
      return groups;
  }, [purchases]);

  return (
    <div className="p-4 pb-20 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Price History</h2>

      <div className="space-y-4">
        {Object.entries(groupedItems).map(([itemName, history]: [string, Purchase[]]) => {
            // Find lowest price
            const lowest = Math.min(...history.map(p => p.price));
            const distinctStores = new Set(history.map(p => p.storeName)).size;
            
            if (history.length < 2) return null; // Only show items with history

            return (
                <div key={itemName} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-gray-800">{itemName}</h3>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">{distinctStores} stores</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {history.map(p => (
                            <div key={p.id} className="px-4 py-3 flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">{p.storeName}</p>
                                    <p className="text-xs text-gray-400">{new Date(p.date).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${p.price === lowest ? 'text-emerald-500' : 'text-gray-800'}`}>
                                        ${p.price.toFixed(2)}
                                        {p.price === lowest && <i className="fas fa-check-circle ml-1 text-xs"></i>}
                                    </p>
                                    <p className="text-xs text-gray-400">/{p.unit}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        })}
        {Object.keys(groupedItems).filter(k => groupedItems[k].length >= 2).length === 0 && (
             <div className="text-center py-10">
                 <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                     <i className="fas fa-balance-scale text-2xl"></i>
                 </div>
                 <h3 className="text-gray-800 font-medium">Not enough data</h3>
                 <p className="text-gray-400 text-sm mt-1">Keep adding purchases to see price comparisons.</p>
             </div>
        )}
      </div>
    </div>
  );
};

export default Compare;
