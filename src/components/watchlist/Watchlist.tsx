import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth, db } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayRemove } from "firebase/firestore";
import { fetchMultipleStockQuotes, formatCurrency } from "@/services/marketService";
import { Trash2, TrendingUp, TrendingDown, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { handleFirestoreError, OperationType } from "@/lib/firestoreUtils";

export function Watchlist() {
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const watchlistRef = doc(db, "watchlists", auth.currentUser.uid);
    const unsubscribe = onSnapshot(watchlistRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSymbols(data.symbols || []);
      } else {
        setSymbols([]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "watchlists");
    });

    return () => unsubscribe();
  }, []);

  const refreshQuotes = async () => {
    if (symbols.length === 0) {
      setQuotes([]);
      return;
    }
    setRefreshing(true);
    try {
      const data = await fetchMultipleStockQuotes(symbols);
      setQuotes(data);
    } catch (error) {
      console.error("Scale Error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (symbols.length > 0) {
      refreshQuotes();
    } else {
      setQuotes([]);
    }
  }, [symbols]);

  const removeFromWatchlist = async (symbol: string) => {
    if (!auth.currentUser) return;
    const watchlistRef = doc(db, "watchlists", auth.currentUser.uid);
    try {
      await updateDoc(watchlistRef, {
        symbols: arrayRemove(symbol)
      });
      toast.success(`Đã xóa ${symbol} khỏi danh sách theo dõi`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "watchlists");
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <p className="text-slate-500 italic">Vui lòng đăng nhập để xem danh sách theo dõi của bạn</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-100 italic">Danh sách theo dõi</h2>
        <button 
          onClick={refreshQuotes}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600/10 text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3].map(i => (
            <Card key={i} className="bg-slate-900 border-slate-800 h-32 animate-pulse" />
          ))
        ) : symbols.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <p className="text-slate-500">Chưa có cổ phiếu nào trong danh sách theo dõi</p>
          </div>
        ) : (
          quotes.map((quote) => {
            const isUp = quote.change >= 0;
            return (
              <Card key={quote.symbol} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-slate-100">{quote.symbol}</h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest">Real-time Quote</p>
                    </div>
                    <div className="flex gap-2">
                       <div className={`p-1.5 rounded-lg ${isUp ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      </div>
                      <button 
                        onClick={() => removeFromWatchlist(quote.symbol)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold text-slate-100 tracking-tight">{formatCurrency(quote.price)}</span>
                    <span className={`text-sm font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                      {isUp ? '+' : ''}{quote.change} ({quote.changePercent})
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
