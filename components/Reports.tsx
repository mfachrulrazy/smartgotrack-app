import React, { useContext, useState, useMemo } from 'react';
import { AppContext } from '../App';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { generateSpendingInsights } from '../services/geminiService';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const Reports: React.FC = () => {
  const { state } = useContext(AppContext);
  const { purchases } = state;

  // --- Date Range State ---
  // Default to current month
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  const [startDate, setStartDate] = useState(startOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);

  // --- Insight State ---
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);

  // --- Trend Analysis Data (Current vs Last Year) ---
  const trendData = useMemo(() => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Create a loop pointer
    let currentPtr = new Date(start);

    while (currentPtr <= end) {
      const dateStr = currentPtr.toISOString().split('T')[0];
      const monthDay = dateStr.slice(5); // MM-DD
      
      // Calculate Previous Year Date
      const prevYearDate = new Date(currentPtr);
      prevYearDate.setFullYear(currentPtr.getFullYear() - 1);
      const prevYearDateStr = prevYearDate.toISOString().split('T')[0];

      // Sum Current Spending for this day
      const currentAmount = purchases
        .filter(p => p.date.startsWith(dateStr))
        .reduce((sum, p) => sum + p.total, 0);

      // Sum Previous Year Spending for this day
      const prevAmount = purchases
        .filter(p => p.date.startsWith(prevYearDateStr))
        .reduce((sum, p) => sum + p.total, 0);

      data.push({
        date: monthDay,
        fullDate: dateStr,
        current: currentAmount,
        previous: prevAmount
      });

      // Increment day
      currentPtr.setDate(currentPtr.getDate() + 1);
    }
    return data;
  }, [startDate, endDate, purchases]);

  const totalPeriodSpend = trendData.reduce((acc, curr) => acc + curr.current, 0);
  const totalPrevSpend = trendData.reduce((acc, curr) => acc + curr.previous, 0);
  const diffPercent = totalPrevSpend === 0 ? 100 : ((totalPeriodSpend - totalPrevSpend) / totalPrevSpend) * 100;

  // --- Category Data (Filtered by Range) ---
  const categoryData = useMemo(() => {
    const map = new Map<string, number>();
    
    purchases.forEach(p => {
      // Filter by selected range
      if (p.date >= startDate && p.date <= endDate) {
        const cat = p.itemName; 
        map.set(cat, (map.get(cat) || 0) + p.total);
      }
    });
    
    return Array.from(map.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
  }, [purchases, startDate, endDate]);

  const handleGenerateSuggestion = async () => {
    setLoadingSuggestion(true);
    // Filter purchases based on current view range to give relevant insights
    const filteredPurchases = purchases.filter(p => p.date >= startDate && p.date <= endDate);
    
    if (filteredPurchases.length === 0) {
        setAiSuggestion("Not enough transaction data in this period to generate insights. Try adding more purchases or changing the date range.");
        setLoadingSuggestion(false);
        return;
    }

    const suggestion = await generateSpendingInsights(filteredPurchases);
    setAiSuggestion(suggestion);
    setLoadingSuggestion(false);
  };


  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">From</label>
          <input 
            type="date" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">To</label>
          <input 
            type="date" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Trend Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-gray-700">Spending Trend</h3>
              <p className="text-xs text-gray-400">vs. Same period last year</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-gray-800">${totalPeriodSpend.toFixed(0)}</p>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${diffPercent > 0 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {diffPercent > 0 ? '+' : ''}{diffPercent.toFixed(1)}%
              </span>
            </div>
        </div>
        
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#9CA3AF'}} 
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 10, fill: '#9CA3AF'}} 
                    />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                      labelStyle={{ color: '#6B7280', fontSize: '12px', marginBottom: '4px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                    <Line 
                      name="This Year"
                      type="monotone" 
                      dataKey="current" 
                      stroke="#10B981" 
                      strokeWidth={3} 
                      dot={false} 
                      activeDot={{ r: 6 }} 
                    />
                    <Line 
                      name="Last Year"
                      type="monotone" 
                      dataKey="previous" 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      strokeDasharray="5 5" 
                      dot={false} 
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Top Expenses Pie Chart */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700">Top Items</h3>
        </div>
        
        <div className="h-64 w-full relative">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                      >
                          {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <i className="fas fa-chart-pie text-4xl mb-2 text-gray-200"></i>
                <p className="text-sm">No data in this range</p>
              </div>
            )}
        </div>
      </div>

      {/* AI Insights Section */}
      <div className="space-y-3">
          <div className="flex justify-between items-end">
            <h3 className="font-bold text-gray-800">AI Insights</h3>
             {!aiSuggestion && (
                 <button 
                    onClick={handleGenerateSuggestion}
                    disabled={loadingSuggestion}
                    className="text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-2"
                >
                    {loadingSuggestion ? (
                        <>
                            <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-sparkles"></i>
                            Get Smart Suggestions
                        </>
                    )}
                 </button>
             )}
          </div>
          
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl flex gap-3">
              <i className="fas fa-chart-line text-emerald-500 mt-1"></i>
              <div>
                  <h4 className="font-bold text-emerald-800 text-sm">Spending Trend</h4>
                  <p className="text-xs text-emerald-600 mt-1">
                      Based on the selected period ({startDate} to {endDate}), your spending is {diffPercent > 0 ? 'higher' : 'lower'} than last year. 
                      {categoryData.length > 0 && ` Your top expense was ${categoryData[0].name}.`}
                  </p>
              </div>
          </div>

          {aiSuggestion && (
            <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-100 p-4 rounded-xl flex gap-3 animate-[fadeIn_0.5s_ease-out]">
                <i className="fas fa-lightbulb text-violet-500 mt-1"></i>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                        <h4 className="font-bold text-violet-800 text-sm">Smart Suggestion</h4>
                        <button onClick={() => setAiSuggestion('')} className="text-violet-300 hover:text-violet-500"><i className="fas fa-times"></i></button>
                    </div>
                    <p className="text-xs text-violet-700 mt-1 leading-relaxed whitespace-pre-line">
                        {aiSuggestion}
                    </p>
                </div>
            </div>
          )}
      </div>
    </div>
  );
};

export default Reports;
