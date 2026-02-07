import React, { useState, useEffect, useRef, useContext } from 'react';
import { AppContext } from '../App';
import { ChatMessage, Purchase } from '../types';
import { parseShoppingInput, getChatReply, ParsedPurchaseResponse } from '../services/geminiService';

const ChatInterface: React.FC = () => {
  const { addPurchase } = useContext(AppContext);
  
  // Mode State: 'manual' (default) or 'chat'
  const [mode, setMode] = useState<'manual' | 'chat'>('manual');

  // --- Chat State ---
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'system',
      content: 'Hi! I can help you track expenses. Just tell me what you bought.\n\nTry: "Bought 5lbs of apples at Walmart for $7"',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Manual Form State ---
  const [formData, setFormData] = useState({
    itemName: '',
    storeName: '',
    price: '',
    quantity: '1',
    unit: 'pcs',
    date: new Date().toISOString().split('T')[0]
  });
  const [showSuccess, setShowSuccess] = useState(false);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (mode === 'chat' && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, mode]);

  // --- Chat Handlers ---
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const parsedData = await parseShoppingInput(userMsg.content);

      if (parsedData) {
        const pendingPurchase: Partial<Purchase> = {
            id: `temp-${Date.now()}`,
            itemName: parsedData.itemName,
            storeName: parsedData.storeName,
            price: parsedData.price,
            quantity: parsedData.quantity,
            unit: parsedData.unit,
            date: parsedData.date,
            total: parsedData.price * parsedData.quantity
        };

        const confirmMsg: ChatMessage = {
            id: Date.now().toString() + '-ai',
            role: 'model',
            content: `I found a purchase! \n${pendingPurchase.quantity} ${pendingPurchase.unit} of ${pendingPurchase.itemName} from ${pendingPurchase.storeName} for $${pendingPurchase.price} each. \n\nSave this?`,
            timestamp: Date.now(),
            pendingPurchase: pendingPurchase
        };
        setMessages(prev => [...prev, confirmMsg]);
      } else {
        const reply = await getChatReply(
            messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            userMsg.content
        );
        
        const chatMsg: ChatMessage = {
            id: Date.now().toString() + '-ai',
            role: 'model',
            content: reply || "I'm not sure I understood that.",
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, chatMsg]);
      }

    } catch (error) {
      console.error("Chat Error", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'model',
        content: "Sorry, I had trouble processing that. Please check your internet connection.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleConfirmPurchase = (msgId: string, purchase: Partial<Purchase>) => {
     const newPurchase: Purchase = {
         id: `p-${Date.now()}`,
         itemId: purchase.itemName?.toLowerCase().replace(/\s/g, '-') || 'unknown-item',
         itemName: purchase.itemName || 'Item',
         storeId: purchase.storeName?.toLowerCase().replace(/\s/g, '-') || 'unknown-store',
         storeName: purchase.storeName || 'Store',
         date: purchase.date || new Date().toISOString(),
         price: purchase.price || 0,
         quantity: purchase.quantity || 1,
         unit: purchase.unit || 'unit',
         total: (purchase.price || 0) * (purchase.quantity || 1)
     };

     addPurchase(newPurchase);

     setMessages(prev => prev.map(m => {
         if (m.id === msgId) {
             return { ...m, content: "✅ Saved!", pendingPurchase: undefined };
         }
         return m;
     }));
  };

  // --- Manual Form Handlers ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemName || !formData.price) return;

    const price = parseFloat(formData.price);
    const quantity = parseFloat(formData.quantity);

    const newPurchase: Purchase = {
        id: `p-${Date.now()}`,
        itemId: formData.itemName.toLowerCase().trim().replace(/\s/g, '-'),
        itemName: formData.itemName,
        storeId: formData.storeName.toLowerCase().trim().replace(/\s/g, '-') || 'unknown',
        storeName: formData.storeName || 'Unknown Store',
        date: formData.date,
        price: price,
        quantity: quantity,
        unit: formData.unit,
        total: price * quantity
    };

    addPurchase(newPurchase);

    // Show Success
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);

    // Reset Form
    setFormData({
        itemName: '',
        storeName: '',
        price: '',
        quantity: '1',
        unit: 'pcs',
        date: new Date().toISOString().split('T')[0]
    });
  };

  const calculatedTotal = (parseFloat(formData.price || '0') * parseFloat(formData.quantity || '0')).toFixed(2);

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Tab Switcher */}
      <div className="px-4 pt-4 pb-2 bg-white border-b border-gray-100 z-10">
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
                onClick={() => setMode('manual')} 
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    mode === 'manual' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
             >
                <i className="fas fa-edit mr-2"></i>Manual
             </button>
             <button 
                onClick={() => setMode('chat')} 
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                    mode === 'chat' ? 'bg-white shadow-sm text-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
             >
                <i className="fas fa-magic mr-2"></i>AI Assistant
             </button>
          </div>
      </div>

      {mode === 'manual' ? (
        // --- Manual Form UI ---
        <div className="flex-1 overflow-y-auto p-5 pb-24">
            <h2 className="text-xl font-bold text-gray-800 mb-5">Add Purchase</h2>
            
            <form onSubmit={handleManualSubmit} className="space-y-5">
                {/* Date */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Date</label>
                    <input 
                        type="date" 
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                    />
                </div>

                {/* Item Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Item Name</label>
                    <input 
                        type="text" 
                        name="itemName"
                        value={formData.itemName}
                        onChange={handleInputChange}
                        placeholder="e.g. Milk, Eggs, Soap"
                        required
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                    />
                </div>

                {/* Store */}
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Store</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><i className="fas fa-store"></i></span>
                        <input 
                            type="text" 
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleInputChange}
                            placeholder="e.g. Walmart"
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                        />
                    </div>
                </div>

                {/* Price and Quantity Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Price</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
                            <input 
                                type="number" 
                                name="price"
                                value={formData.price}
                                onChange={handleInputChange}
                                placeholder="0.00"
                                step="0.01"
                                required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase">Quantity</label>
                        <div className="flex">
                            <input 
                                type="number" 
                                name="quantity"
                                value={formData.quantity}
                                onChange={handleInputChange}
                                placeholder="1"
                                step="0.1"
                                className="w-full bg-gray-50 border border-gray-200 rounded-l-xl px-4 py-3 text-gray-800 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder-gray-400"
                            />
                             <select 
                                name="unit" 
                                value={formData.unit}
                                onChange={handleInputChange}
                                className="bg-gray-100 border-y border-r border-gray-200 rounded-r-xl px-2 py-3 text-sm text-gray-600 focus:outline-none"
                            >
                                <option value="pcs">pcs</option>
                                <option value="kg">kg</option>
                                <option value="lb">lb</option>
                                <option value="oz">oz</option>
                                <option value="gal">gal</option>
                                <option value="pk">pack</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Total Preview */}
                <div className="flex justify-between items-center py-2 px-1 border-t border-dashed border-gray-200 mt-2">
                    <span className="text-gray-500 font-medium">Total Estimate</span>
                    <span className="text-2xl font-bold text-gray-800">${calculatedTotal}</span>
                </div>

                {/* Submit Button */}
                <button 
                    type="submit" 
                    className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <i className="fas fa-check"></i>
                    Save Transaction
                </button>
            </form>

            {/* Success Notification */}
            {showSuccess && (
                <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center animate-bounce z-50">
                    <i className="fas fa-check-circle text-emerald-400 mr-2"></i>
                    <span>Saved successfully!</span>
                </div>
            )}
        </div>
      ) : (
        // --- Chat UI ---
        <div className="flex flex-col h-full bg-white relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
                {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                        msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-none'
                        : 'bg-gray-100 text-gray-800 rounded-bl-none'
                    }`}
                    >
                    <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                    
                    {msg.pendingPurchase && (
                        <div className="mt-3 bg-white rounded-xl p-3 shadow-sm border border-gray-200">
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                                <span className="font-bold text-gray-800">{msg.pendingPurchase.itemName}</span>
                                <span className="text-emerald-600 font-bold">${(msg.pendingPurchase.total || 0).toFixed(2)}</span>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1 mb-3">
                                <p><i className="fas fa-store mr-1 text-gray-400"></i> {msg.pendingPurchase.storeName}</p>
                                <p><i className="fas fa-calendar mr-1 text-gray-400"></i> {msg.pendingPurchase.date}</p>
                                <p><i className="fas fa-tag mr-1 text-gray-400"></i> {msg.pendingPurchase.quantity} {msg.pendingPurchase.unit} @ ${msg.pendingPurchase.price}/ea</p>
                            </div>
                            <button 
                                onClick={() => handleConfirmPurchase(msg.id, msg.pendingPurchase!)}
                                className="w-full bg-emerald-100 text-emerald-700 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-200 transition-colors"
                            >
                                Confirm & Save
                            </button>
                        </div>
                    )}
                    </div>
                </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl rounded-bl-none px-4 py-3">
                            <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100">
                <div className="flex gap-2">
                    <button className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <i className="fas fa-camera"></i>
                    </button>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your purchase..."
                        className="flex-1 bg-gray-100 border-none rounded-full px-4 text-sm focus:ring-2 focus:ring-primary focus:bg-white transition-all outline-none"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!input.trim()}
                        className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default ChatInterface;
