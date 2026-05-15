import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Wallet, TrendingUp, ArrowUpRight, Plus, History } from "lucide-react";
import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts";

export function Portfolio() {
  const holdings = [
    { symbol: "FPT", quantity: 500, avgPrice: 112.5, currentPrice: 135.2, profit: "+20.1%", value: 67600, color: "#3b82f6" },
    { symbol: "TCB", quantity: 2000, avgPrice: 42.1, currentPrice: 48.9, profit: "+16.1%", value: 97800, color: "#ef4444" },
    { symbol: "MWG", quantity: 300, avgPrice: 58.2, currentPrice: 64.5, profit: "+10.8%", value: 19350, color: "#eab308" },
    { symbol: "DGC", quantity: 200, avgPrice: 115.0, currentPrice: 125.4, profit: "+9.0%", value: 25080, color: "#10b981" },
  ];

  const pieData = holdings.map(h => ({ name: h.symbol, value: h.value, color: h.color }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              <Wallet className="w-6 h-6 text-blue-500" />
              Sổ tay Đầu tư
            </h2>
            <p className="text-slate-500 text-sm">Quản trị danh mục và theo dõi hiệu suất đầu tư bằng AI.</p>
         </div>
         <div className="flex gap-2">
            <Button variant="outline" className="bg-slate-900 border-slate-700 text-slate-300 rounded-xl">
               <History className="w-4 h-4 mr-2" /> Lịch sử
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
                       <h3 className="text-4xl font-black text-slate-100">209.83M</h3>
                       <span className="text-xs text-slate-500">VND</span>
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-3xl bg-green-500/10 border border-green-500/20">
                       <p className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-1">Lãi/Lỗ tạm tính</p>
                       <p className="text-xl font-bold text-slate-100">+31.25M</p>
                       <p className="text-xs text-green-500 font-medium">+17.5%</p>
                    </div>
                    <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                       <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Tiền mặt</p>
                       <p className="text-xl font-bold text-slate-100">45.0M</p>
                       <p className="text-xs text-slate-500">21.4% Tỷ trọng</p>
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
               {holdings.map((h) => (
                  <TableRow key={h.symbol} className="border-slate-800 hover:bg-slate-800/30 transition-all">
                     <TableCell className="py-5 pl-8 font-bold text-slate-100">{h.symbol}</TableCell>
                     <TableCell className="text-slate-300">{h.quantity.toLocaleString()}</TableCell>
                     <TableCell>
                        <span className="text-slate-500 text-xs">{h.avgPrice}</span>
                        <span className="text-slate-400 mx-2">→</span>
                        <span className="text-slate-100 font-bold">{h.currentPrice}</span>
                     </TableCell>
                     <TableCell className="text-slate-200 font-medium">{h.value.toLocaleString()}</TableCell>
                     <TableCell className="pr-8 text-right">
                        <Badge className="bg-green-500/20 text-green-400 border-none rounded-lg">{h.profit}</Badge>
                     </TableCell>
                  </TableRow>
               ))}
            </TableBody>
         </Table>
      </Card>
    </div>
  );
}
