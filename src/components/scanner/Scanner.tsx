import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, Search, ArrowUpRight, Zap, RefreshCw } from "lucide-react";
import { fetchMultipleStockQuotes, formatCurrency } from "@/services/marketService";
import { Skeleton } from "@/components/ui/skeleton";

export function Scanner() {
  const [loading, setLoading] = useState(true);
  const [stocks, setStocks] = useState<any[]>([]);

  const defaultStocks = [
    { symbol: "FPT", name: "FPT Corporation", category: "Công nghệ", Signal: "Breakout", score: 88, rsi: 65 },
    { symbol: "MWG", name: "Thế giới Di động", category: "Bán lẻ", Signal: "Dòng tiền vào", score: 82, rsi: 58 },
    { symbol: "TCB", name: "Techcombank", category: "Ngân hàng", Signal: "Tích lũy", score: 75, rsi: 55 },
    { symbol: "DGC", name: "Hóa chất Đức Giang", category: "Hóa chất", Signal: "Siêu cổ phiếu", score: 92, rsi: 72 },
    { symbol: "PVS", name: "Dịch vụ Dầu khí", category: "Dầu khí", Signal: "Hồi phục", score: 78, rsi: 60 },
    { symbol: "GMD", name: "Gemadept", category: "Cảng biển", Signal: "Vượt đỉnh", score: 85, rsi: 68 },
    { symbol: "VHC", name: "Vĩnh Hoàn", category: "Thủy sản", Signal: "Cạn cung", score: 70, rsi: 48 },
  ];

  const refreshScanner = async () => {
    setLoading(true);
    try {
      const symbols = defaultStocks.map(s => s.symbol);
      const quotes = await fetchMultipleStockQuotes(symbols);
      
      const liveData = defaultStocks.map(s => {
        const quote = quotes.find(q => q.symbol === s.symbol);
        return { ...s, ...quote };
      });
      setStocks(liveData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshScanner();
    const interval = setInterval(refreshScanner, 30000); // Polling 30s for scanner
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            AI Scanner (Real-time)
          </h2>
          <p className="text-slate-500 text-sm">Quét toàn bộ thị trường tìm cổ phiếu có tín hiệu kỹ thuật & dòng tiền mạnh nhất.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 rounded-xl" onClick={refreshScanner}>
             <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
             <Zap className="w-4 h-4 mr-2" /> Chạy quét AI
          </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <CardHeader className="border-b border-slate-800 bg-slate-900/50 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex gap-2 shrink-0">
               <Badge className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all border-none rounded-lg cursor-pointer">Tất cả</Badge>
               <Badge variant="outline" className="text-slate-500 border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">Công nghệ</Badge>
               <Badge variant="outline" className="text-slate-500 border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">Bất động sản</Badge>
               <Badge variant="outline" className="text-slate-500 border-slate-800 rounded-lg cursor-pointer hover:border-slate-700">Ngân hàng</Badge>
            </div>
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Tìm lọc kết quả..." 
                className="pl-10 h-10 rounded-xl bg-slate-800 border-slate-700 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
           <Table>
             <TableHeader className="bg-slate-800/30">
               <TableRow className="border-slate-800 hover:bg-transparent">
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-6">Mã CP</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Giá / Thay đổi</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nhóm ngành</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">RSI (14)</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Tín hiệu AI</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest text-center">AI Score</TableHead>
                 <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pr-6 text-right">Hành động</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {loading && stocks.length === 0 ? (
                 Array.from({ length: 7 }).map((_, i) => (
                   <TableRow key={i} className="border-slate-800">
                     <TableCell colSpan={7} className="p-4 pl-6">
                       <Skeleton className="h-10 w-full bg-slate-800" />
                     </TableCell>
                   </TableRow>
                 ))
               ) : (
                 stocks.map((stock) => (
                   <TableRow key={stock.symbol} className="border-slate-800 hover:bg-slate-800/30 transition-all group">
                     <TableCell className="py-4 pl-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              {stock.symbol[0]}
                           </div>
                           <div>
                              <p className="font-bold text-slate-200">{stock.symbol}</p>
                              <p className="text-[10px] text-slate-500">{stock.name}</p>
                           </div>
                        </div>
                     </TableCell>
                     <TableCell>
                        <p className="font-bold text-slate-200">{stock.price ? formatCurrency(stock.price) : "--"}</p>
                        <p className={`text-[10px] font-bold ${(stock.change || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {stock.changePercent || "0%"}
                        </p>
                     </TableCell>
                     <TableCell className="text-slate-400 text-sm font-medium">{stock.category}</TableCell>
                     <TableCell>
                        <div className="flex items-center gap-2">
                           <div className="flex-1 h-1.5 w-12 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500" style={{ width: `${stock.rsi}%` }} />
                           </div>
                           <span className="text-xs text-slate-400">{stock.rsi}</span>
                        </div>
                     </TableCell>
                     <TableCell>
                        <Badge className="bg-blue-500/10 text-blue-400 border-none rounded-lg text-[10px] px-2 py-0.5">
                          {stock.Signal}
                        </Badge>
                     </TableCell>
                     <TableCell className="text-center">
                        <span className={`text-sm font-bold ${stock.score > 85 ? 'text-green-500' : 'text-blue-400'}`}>{stock.score}</span>
                     </TableCell>
                     <TableCell className="pr-6 text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-blue-600/20 hover:text-blue-400 rounded-lg">
                          <ArrowUpRight className="w-4 h-4" />
                        </Button>
                     </TableCell>
                   </TableRow>
                 ))
               )}
             </TableBody>
           </Table>
        </CardContent>
      </Card>
    </div>
  );
}
