import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Users, DollarSign, BarChart3, Loader2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { getMarketSentiment } from "@/lib/gemini";

const data = [
  { time: "09:00", value: 1240 },
  { time: "10:00", value: 1255 },
  { time: "11:00", value: 1248 },
  { time: "13:00", value: 1262 },
  { time: "14:00", value: 1275 },
  { time: "14:45", value: 1280.5 }
];

export function Dashboard() {
  const [sentiment, setSentiment] = useState<{ index: number; sentiment: string; news: string[] } | null>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "VN-INDEX", value: "1,280.52", change: "+12.45", pc: "+0.98%", up: true },
          { label: "HNX-INDEX", value: "242.15", change: "-1.20", pc: "-0.49%", up: false },
          { label: "UPCOM", value: "92.30", change: "+0.15", pc: "+0.16%", up: true },
          { label: "Dòng tiền", value: "22.5T", change: "+4.2T", pc: "Tỷ đồng", up: true },
        ].map((item, i) => (
          <Card key={i} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all group">
            <CardContent className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">{item.label}</span>
                <div className={`p-1.5 rounded-lg ${item.up ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.up ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight text-slate-100">{item.value}</h3>
                <span className={`text-xs font-medium ${item.up ? 'text-green-500' : 'text-red-500'}`}>
                  {item.pc}
                </span>
              </div>
              <div className="mt-4 h-[40px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={item.up ? "#10b981" : "#ef4444"} 
                        fill={item.up ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)"} 
                        strokeWidth={2}
                      />
                    </AreaChart>
                 </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
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
                <AreaChart data={data}>
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
                  sentiment?.news.map((news, i) => (
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
              <div className="space-y-4">
                {[
                  { symbol: "FPT", name: "FPT Corporation", price: "135.2", change: "+3.2%", status: "Leader" },
                  { symbol: "MWG", name: "Thế giới Di động", price: "64.5", change: "+2.8%", status: "Accumulating" },
                  { symbol: "TCB", name: "Techcombank", price: "48.9", change: "+1.9%", status: "High Liquidity" },
                  { symbol: "VCB", name: "Vietcombank", price: "92.4", change: "+0.5%", status: "Bluechip" },
                ].map((stock, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/50 transition-all border border-transparent hover:border-slate-800 group">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-slate-300 group-hover:bg-blue-600/20 group-hover:text-blue-400 transition-all">
                          {stock.symbol[0]}
                       </div>
                       <div>
                          <p className="font-bold text-slate-200">{stock.symbol}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-tight">{stock.name}</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="font-bold text-slate-200">{stock.price}</p>
                       <p className="text-xs text-green-500 font-medium">{stock.change}</p>
                    </div>
                  </div>
                ))}
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
                       <span className="text-sm font-bold">Khối ngoại</span>
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
                       <span className="text-sm font-bold">Tự doanh</span>
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
