import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Wallet, TrendingUp, ArrowUpRight, Plus, History, RefreshCw } from "lucide-react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";
import { fetchMultipleStockQuotes, formatCurrency } from "@/services/marketService";
import { Skeleton } from "@/components/ui/skeleton";

export function Portfolio() {
  const [loading, setLoading] = useState(true);
  const [holdings, setHoldings] = useState<any[]>([]);

  const baseHoldings = [
    { symbol: "FPT", quantity: 500, avgPrice: 112.5, color: "#3b82f6" },
    { symbol: "TCB", quantity: 2000, avgPrice: 42.1, color: "#ef4444" },
    { symbol: "MWG", quantity: 300, avgPrice: 58.2, color: "#eab308" },
    { symbol: "DGC", quantity: 200, avgPrice: 115.0, color: "#10b981" },
  ];

  const refreshPortfolio = async () => {
    setLoading(true);
    try {
      const symbols = baseHoldings.map(h => h.symbol);
      const quotes = await fetchMultipleStockQuotes(symbols);
      
      const liveData = baseHoldings.map(h => {
        const quote = quotes.find(q => q.symbol === h.symbol);
        const currentPrice = quote?.price || h.avgPrice;
        const value = h.quantity * currentPrice;
        const profit = ((currentPrice - h.avgPrice) / h.avgPrice) * 100;
        return {
          ...h,
          currentPrice,
          value,
          profit: `${profit > 0 ? "+" : ""}${profit.toFixed(1)}%`
        };
      });
      setHoldings(liveData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  const totalCost = baseHoldings.reduce((sum, h) => sum + (h.quantity * h.avgPrice), 0);
  const totalProfit = totalValue - totalCost;
  const totalProfitPercent = (totalProfit / totalCost) * 100;

  const pieData = holdings.map(h => ({ name: h.symbol, value: h.value, color: h.color }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-500" />
              Sổ tay Đầu tư (Live)
            </h2>
            <p className="text-slate-500 text-sm">Quản trị danh mục và theo dõi hiệu suất đầu tư bằng AI.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 rounded-xl" onClick={refreshPortfolio}>
               <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl">
               <Plus className="w-4 h-4 mr-2" /> Thêm giao dịch
            </Button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 bg-slate-900 border-slate-800 p-8 rounded-3xl">
           <div className="flex flex-col md:flex-row justify-between gap-8">
              <div className="space-y-8 flex-1">
                 <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Tổng giá trị tài sản</span>
                    <div className="flex items-baseline gap-3 mt-1">
                       <h3 className="text-4xl font-black text-slate-100">{(totalValue / 1000).toFixed(2)}M</h3>
                       <span className="text-xs text-slate-500">VND</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-green-500/10 border border-green-500/20">
                       <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Lãi/Lỗ tạm tính</p>
                       <p className="text-xl font-bold text-slate-100">{(totalProfit / 1000).toFixed(2)}M</p>
                       <p className="text-xs font-medium text-green-500">{totalProfitPercent > 0 ? "+" : ""}{totalProfitPercent.toFixed(1)}%</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                       <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Tiền mặt</p>
                       <p className="text-xl font-bold text-slate-100">45.0M</p>
                       <p className="text-xs text-slate-500">{(45000 / (totalValue + 45000) * 100).toFixed(1)}% Tỷ trọng</p>
                    </div>
                 </div>
              </div>

              <div className="w-full h-[220px] md:w-[220px] shrink-0">
                 <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                       <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                       >
                        {pieData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                       </Pie>
                       <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff' }}
                       />
                    </RechartsPieChart>
                 </ResponsiveContainer>
              </div>
           </div>
        </Card>

        <Card className="bg-slate-900 border-slate-800 rounded-3xl p-6">
           <CardHeader className="p-0 mb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-500">AI Portfolio Advisor</CardTitle>
           </CardHeader>
           <CardContent className="p-0 space-y-4">
              <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-500/20 text-xs text-slate-300 leading-relaxed">
                "Danh mục của bạn đang tập trung mạnh vào nhóm Công nghệ (FPT). Nên cân nhắc đa dạng hóa sang nhóm Tiêu dùng hoặc Ngân hàng để giảm thiểu rủi ro."
              </div>
              <div className="space-y-3">
                 <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Đề xuất giao dịch</h5>
                 {[
                   { action: "Cân nhắc Mua", symbol: "VNM", reason: "Tích lũy nền giá đẹp" },
                   { action: "Chốt lời 50%", symbol: "FPT", reason: "Chạm vùng kháng cự mạnh" },
                 ].map((rec, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700">
                       <div>
                          <p className="text-xs font-bold text-slate-200">{rec.action} {rec.symbol}</p>
                          <p className="text-[10px] text-slate-500">{rec.reason}</p>
                       </div>
                       <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-blue-600/20">
                          <ArrowUpRight className="w-3 h-3 text-blue-400" />
                       </Button>
                    </div>
                 ))}
              </div>
           </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800 rounded-3xl overflow-hidden">
         <Table>
            <TableHeader className="bg-slate-800/30">
               <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pl-8">Mã CP</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Khối lượng</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Giá vốn / Giá hiện tại</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Giá trị (k VNĐ)</TableHead>
                  <TableHead className="text-slate-400 font-bold uppercase text-[10px] tracking-widest pr-8 text-right">Lợi nhuận</TableHead>
               </TableRow>
            </TableHeader>
            <TableBody>
               {loading && holdings.length === 0 ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-800">
                      <TableCell colSpan={5} className="p-4 pl-8">
                        <Skeleton className="h-10 w-full bg-slate-800" />
                      </TableCell>
                    </TableRow>
                  ))
               ) : (
                 holdings.map((h) => (
                    <TableRow key={h.symbol} className="border-slate-800 hover:bg-slate-800/30 transition-all">
                       <TableCell className="py-5 pl-8 font-bold text-slate-100">{h.symbol}</TableCell>
                       <TableCell className="text-slate-300">{h.quantity.toLocaleString()}</TableCell>
                       <TableCell>
                          <span className="text-slate-500 text-xs">{formatCurrency(h.avgPrice)}</span>
                          <span className="text-slate-400 mx-2">→</span>
                          <span className="text-slate-100 font-bold">{formatCurrency(h.currentPrice)}</span>
                       </TableCell>
                       <TableCell className="text-slate-200 font-medium">{formatCurrency(h.value)}</TableCell>
                       <TableCell className="pr-8 text-right">
                          <Badge className={`${parseFloat(h.profit) >= 0 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"} border-none rounded-lg`}>{h.profit}</Badge>
                       </TableCell>
                    </TableRow>
                 ))
               )}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}
