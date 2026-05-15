import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Users, DollarSign, BarChart3, Loader2, RefreshCw } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getMarketSentiment } from "@/lib/gemini";
import { fetchMarketIndexes, fetchTopStocks, MarketIndex, formatNumber, formatCurrency } from "@/services/marketService";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "@/lib/firestoreUtils";
import { Plus } from "lucide-react";

const chartData = [
  { time: "09:00", value: 1240 },
  { time: "10:00", value: 1255 },
  { time: "11:00", value: 1248 },
  { time: "13:00", value: 1262 },
  { time: "14:00", value: 1275 },
  { time: "14:45", value: 1280.5 }
];

export function Dashboard() {
  const [sentiment, setSentiment] = useState<{ index: number; sentiment: string; news: string[] } | null>(null);
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [topStocks, setTopStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [marketLoading, setMarketLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [history, setHistory] = useState(chartData);

  const refreshMarketData = async () => {
    setIsRefreshing(true);
    try {
      const [idxData, stockData] = await Promise.all([
        fetchMarketIndexes(),
        fetchTopStocks()
      ]);
      setIndexes(idxData);
      setTopStocks(stockData);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));

      // Update history chart for VNINDEX
      const vnIndex = idxData.find(idx => idx.symbol === "VNINDEX");
      if (vnIndex) {
        setHistory(prev => {
          const newPoint = { time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), value: vnIndex.value };
          // If the last point is the same time, replace it, otherwise add new
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.time === newPoint.time) {
            return [...prev.slice(0, -1), newPoint];
          }
          const nextHistory = [...prev, newPoint];
          return nextHistory.slice(-20); // Keep last 20 points
        });
      }
    } catch (err) {
      console.error("Refresh Market Data Error:", err);
    } finally {
      setMarketLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    async function fetchSentiment() {
      try {
        const res = await getMarketSentiment();
        setSentiment(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchSentiment();
    refreshMarketData();

    // Subscribe to symbols via WebSocket for real-time updates
    const symbolsToWatch = ["VNINDEX", "VN30", "HNX", "UPCOM", "HNX30", "VS100", "VSL-CAP", "VSM-CAP", "VSS-CAP", "VN30F1M", "FPT", "MWG", "TCB", "VCB", "DGC", "PVS", "GMD", "VNM"];
    import("@/services/marketService").then(({ marketStream }) => {
      marketStream.subscribe(symbolsToWatch, (quote) => {
        // Incrementally update state if we get a websocket push
        const indexSymbols = ["VNINDEX", "VN30", "HNX", "UPCOM", "HNX30", "VS100", "VSL-CAP", "VSM-CAP", "VSS-CAP", "VN30F1M"];
        if (indexSymbols.includes(quote.symbol)) {
          setIndexes(prev => prev.map(idx => idx.symbol === quote.symbol ? {
            ...idx,
            value: quote.price,
            change: quote.change,
            changePercent: quote.changePercent,
            updatedAt: quote.updatedAt
          } : idx));
        } else {
          setTopStocks(prev => prev.map(s => s.symbol === quote.symbol ? quote : s));
        }
      });
    });

    // Polling every 20 seconds for market data as a reliable fallback
    const interval = setInterval(refreshMarketData, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Dữ liệu trực tuyến - {lastUpdated || "Đang kết nối..."}
            {isRefreshing && <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />}
          </span>
        </div>
      </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {marketLoading && indexes.length === 0 ? [1,2,3,4,5,6,7,8].map(i => (
          <Card key={i} className="bg-slate-900 border-slate-800 h-32 animate-pulse" />
        )) : (
          (() => {
            const vnIndex = indexes.find(idx => idx.symbol === "VNINDEX");
            const liquidity = vnIndex?.totalValue ? { 
              symbol: "Thanh khoản", 
              value: vnIndex.totalValue > 1000000 ? vnIndex.totalValue / 1e9 : vnIndex.totalValue,
              change: 0, 
              changePercent: "Tỷ đồng" 
            } : null;

            const displayIndexes = liquidity ? [...indexes, liquidity as any] : indexes;

            return displayIndexes.map((item, i) => {
              const isUp = item.change >= 0;
              const isLiquidity = item.symbol === "Thanh khoản";
              
              // Map display names to match screenshot
              const displayInfo = {
                "VNINDEX": { name: "VN-Index" },
                "HNX": { name: "HNX-Index" },
                "UPCOM": { name: "UPCoM-Index" },
                "VN30": { name: "VN30" },
                "HNX30": { name: "HNX30" },
                "VS100": { name: "VS 100" },
                "VSL-CAP": { name: "VS-Large Cap" },
                "VSM-CAP": { name: "VS-Mid Cap" },
                "VSS-CAP": { name: "VS-Small Cap" },
                "VN30F1M": { name: "VN30F1M" }
              }[item.symbol] || { name: item.symbol };

              return (
                <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{displayInfo.name}</span>
                      <div className={`p-1.5 rounded-lg ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <h3 className="text-2xl font-bold tracking-tight text-slate-100">
                        {isLiquidity ? `${formatNumber(Math.round(item.value))}T` : formatNumber(item.value)}
                      </h3>
                      <span className={`text-[10px] font-bold ${isUp || isLiquidity ? 'text-green-500' : 'text-red-500'}`}>
                        {item.changePercent}
                      </span>
                    </div>
                    
                    {item.updatedAt && (
                      <div className="mt-1">
                        <span className="text-[8px] text-slate-600 font-medium">🕒 {item.updatedAt}</span>
                      </div>
                    )}

                    <div className="mt-3 h-[30px] w-full">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={history}>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke={isUp ? "#10b981" : "#ef4444"} 
                              fill={isUp ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"} 
                              strokeWidth={1.5}
                            />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              );
            });
          })()
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-100">Diễn biến thị trường</CardTitle>
              <CardDescription className="text-slate-500">VN-INDEX Realtime (Simulation)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">1D</Badge>
              <Badge variant="outline" className="text-slate-500 border-transparent hover:border-slate-800 cursor-pointer">1W</Badge>
              <Badge variant="outline" className="text-slate-500 border-transparent hover:border-slate-800 cursor-pointer">1M</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} domain={['dataMin - 10', 'dataMax + 10']} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f1f5f9' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-100">Tâm lý thị trường</CardTitle>
            <CardDescription className="text-slate-500">AI Sentiment Engine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex flex-col items-center justify-center p-4">
                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-8">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="text-xs text-slate-500 animate-pulse">AI đang phân tích tâm lý...</p>
                  </div>
                ) : (
                  <>
                    <div className="relative w-48 h-24 mb-4">
                       <div className="absolute inset-0 w-full h-full rounded-t-full border-[16px] border-slate-800" />
                       <div className="absolute inset-0 w-full h-full rounded-t-full border-[16px] border-transparent border-l-green-500 border-t-green-500 transition-all duration-1000" style={{ transform: `rotate(${(sentiment?.index || 50) * 1.8 - 90}deg)` }} />
                       <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex flex-col items-center">
                          <span className="text-3xl font-bold text-slate-100">{sentiment?.index || 0}</span>
                          <span className={`text-[10px] font-bold uppercase tracking-tighter ${sentiment && sentiment.index > 50 ? 'text-green-500' : 'text-red-500'}`}>
                            {sentiment?.sentiment || "Neutral"}
                          </span>
                       </div>
                    </div>
                    <p className="text-center text-sm text-slate-400">{sentiment?.sentiment === 'Greed' ? 'Thị trường đang trong giai đoạn Hưng phấn cao độ. Dòng tiền F0 gia nhập mạnh.' : 'Thị trường đang thận trọng. Dòng tiền luân chuyển giữa các nhóm ngành.'}</p>
                  </>
                )}
             </div>
             
             <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tin tức AI nổi bật</h4>
                {loading ? (
                  <div className="space-y-2">
                    <div className="h-12 w-full bg-slate-800 animate-pulse rounded-xl" />
                    <div className="h-12 w-full bg-slate-800 animate-pulse rounded-xl" />
                  </div>
                ) : (
                  sentiment?.news.map((news: string, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 leading-relaxed hover:bg-slate-800 transition-colors cursor-default">
                      {news}
                    </div>
                  ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900 border-slate-800">
           <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-100">Top cổ phiếu dẫn dắt</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="space-y-2">
                {marketLoading && topStocks.length === 0 ? [1,2,3,4].map(i => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-800" />
                )) : topStocks.map((stock, i) => {
                  const isUp = parseFloat(stock.changePercent) >= 0;
                  
                  const addToWatchlist = async (symbol: string) => {
                    if (!auth.currentUser) {
                      toast.error("Vui lòng đăng nhập để sử dụng tính năng này");
                      return;
                    }
                    
                    const watchlistRef = doc(db, "watchlists", auth.currentUser.uid);
                    try {
                      const docSnap = await getDoc(watchlistRef);
                      if (docSnap.exists()) {
                        await updateDoc(watchlistRef, {
                          symbols: arrayUnion(symbol)
                        });
                      } else {
                        await setDoc(watchlistRef, {
                          userId: auth.currentUser.uid,
                          symbols: [symbol]
                        });
                      }
                      toast.success(`Đã thêm ${symbol} vào danh sách theo dõi`);
                    } catch (error) {
                      handleFirestoreError(error, OperationType.WRITE, "watchlists");
                    }
                  };

                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-800 group">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all">
                            {stock.symbol[0]}
                         </div>
                         <div>
                            <p className="font-bold text-slate-200">{stock.symbol}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-tight">Real-time Quote</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                           <p className="font-bold text-slate-200">{formatCurrency(stock.price)}</p>
                           <p className={`text-xs font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>{stock.changePercent}</p>
                        </div>
                        <button 
                          onClick={() => addToWatchlist(stock.symbol)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all"
                          title="Thêm vào danh sách theo dõi"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
           </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
           <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-100">Tín hiệu Dòng tiền</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="space-y-4">
                 <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 text-blue-400 mb-2">
                       <DollarSign className="w-4 h-4" />
                       <span className="text-sm font-bold">Khối ngoại (Ước tính)</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-2xl font-bold text-slate-100">+452.5B</p>
                          <p className="text-xs text-slate-500">Mua ròng phiên hôm nay</p>
                       </div>
                       <Badge className="bg-green-500/20 text-green-400 border-transparent">Tích cực</Badge>
                    </div>
                 </div>
                 
                 <div className="p-4 rounded-2xl bg-purple-600/10 border border-purple-500/20">
                    <div className="flex items-center gap-2 text-purple-400 mb-2">
                       <Activity className="w-4 h-4" />
                       <span className="text-sm font-bold">Tự doanh (Ước tính)</span>
                    </div>
                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-2xl font-bold text-slate-100">-12.8B</p>
                          <p className="text-xs text-slate-500">Bán ròng phiên hôm nay</p>
                       </div>
                       <Badge className="bg-slate-500/20 text-slate-400 border-transparent">Trung lập</Badge>
                    </div>
                 </div>
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}

