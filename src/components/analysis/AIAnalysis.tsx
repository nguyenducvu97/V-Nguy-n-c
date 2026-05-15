import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, Search, Target, ShieldAlert, Zap, TrendingUp, BarChart3, Info, BookOpen, Users } from "lucide-react";
import { analyzeStock } from "@/lib/gemini";
import { fetchStockQuote } from "@/services/marketService";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import ReactMarkdown from "react-markdown";

export function AIAnalysis() {
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      // First, fetch the real-time quote for more accurate analysis
      const quote = await fetchStockQuote(symbol);
      
      const result = await analyzeStock(symbol.toUpperCase(), quote);
      setAnalysis(result);
      toast.success(`Đã phân tích xong cổ phiếu ${symbol.toUpperCase()}`);
    } catch (error) {
      toast.error("Không thể phân tích cổ phiếu này. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-blue-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Card className="bg-slate-900 border-slate-800 shadow-2xl">
        <CardContent className="p-8">
          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
               <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">AI Stock Analyst</h1>
              <p className="text-slate-400 mt-2">Nhập mã cổ phiếu để AI phân tích kỹ thuật, cơ bản và dòng tiền tức thì.</p>
            </div>
          </div>
          
          <div className="flex gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <Input 
                placeholder="Ví dụ: FPT, VNM, TCB..." 
                className="pl-12 py-7 rounded-2xl bg-slate-800 border-slate-700 focus:ring-blue-500 focus:border-blue-500 text-lg uppercase font-bold"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
            </div>
            <Button 
              size="lg" 
              className="px-8 py-7 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20"
              onClick={handleAnalyze}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Phân tích ngay"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-900 border-slate-800" />
          <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-900 border-slate-800" />
          <Skeleton className="h-[200px] w-full rounded-2xl bg-slate-900 border-slate-800" />
          <Skeleton className="h-[400px] md:col-span-3 w-full rounded-2xl bg-slate-900 border-slate-800" />
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
             <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Score</span>
                <span className={`text-5xl font-black ${getScoreColor(analysis.aiScore)}`}>{analysis.aiScore}</span>
                <span className="text-xs text-slate-500 mt-1">/ 100 điểm</span>
             </Card>
             
             <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Khuyến nghị</span>
                <Badge className={`text-lg px-4 py-1 rounded-xl font-bold ${
                  analysis.recommendation === 'MUA' ? 'bg-green-500 text-white' : 
                  analysis.recommendation === 'BÁN' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                  {analysis.recommendation}
                </Badge>
                <span className="text-xs text-slate-500 mt-2">Độ tin cậy: {(analysis.winProbability * 100).toFixed(0)}%</span>
             </Card>

             <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Mục tiêu 1</span>
                <span className="text-3xl font-extrabold text-blue-400">{analysis.targetPrice}</span>
                <span className="text-xs text-slate-500 mt-1">Lợi nhuận dự phóng</span>
             </Card>

             <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center text-center bg-red-950/20">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Dừng lỗ</span>
                <span className="text-3xl font-extrabold text-red-500">{analysis.stopLoss}</span>
                <span className="text-xs text-slate-500 mt-1">Rủi ro tối đa</span>
             </Card>
          </div>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-slate-900 border border-slate-800 p-1 h-auto rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Tổng quan AI</TabsTrigger>
              <TabsTrigger value="technical" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Kỹ thuật</TabsTrigger>
              <TabsTrigger value="fundamental" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Cơ bản</TabsTrigger>
              <TabsTrigger value="cashflow" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-blue-600 data-[state=active]:text-white">Dòng tiền</TabsTrigger>
            </TabsList>
            
            <Card className="bg-slate-900 border-slate-800 mt-4 overflow-hidden rounded-3xl">
              <CardContent className="p-8">
                <TabsContent value="overview" className="mt-0 space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="p-3 rounded-full bg-blue-500/10 text-blue-400">
                         <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="prose prose-invert max-w-none">
                         <h3 className="text-xl font-bold mb-4 text-slate-100 uppercase tracking-wide">Nhận định chuyên gia AI</h3>
                         <div className="text-slate-300 leading-relaxed text-lg">
                           {analysis.summary}
                         </div>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="technical" className="mt-0">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <div className="flex items-center gap-3">
                            <Activity className="w-5 h-5 text-blue-400" />
                            <h4 className="font-bold text-slate-100">Chỉ báo kỹ thuật</h4>
                         </div>
                         <p className="text-slate-400 leading-relaxed">{analysis.technicalAnalysis.indicators}</p>
                         <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <h4 className="font-bold text-slate-100">Xu hướng</h4>
                         </div>
                         <p className="text-slate-400 leading-relaxed">{analysis.technicalAnalysis.trend}</p>
                      </div>
                      <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700">
                         <h4 className="font-bold text-slate-200 mb-4 flex items-center gap-2">
                           <Zap className="w-4 h-4 text-yellow-500" />
                           Tín hiệu hành động
                         </h4>
                         <ul className="space-y-3">
                            {analysis.technicalAnalysis.signals.map((signal: string, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                 <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                 {signal}
                              </li>
                            ))}
                         </ul>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="fundamental" className="mt-0">
                   <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      <div className="p-6 rounded-3xl bg-slate-800/30 border border-slate-700">
                         <Target className="w-6 h-6 text-blue-400 mb-3" />
                         <h5 className="font-bold text-slate-100 mb-2">Định giá & Tài chính</h5>
                         <p className="text-sm text-slate-400 leading-relaxed">{analysis.fundamentalAnalysis.valuation}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-slate-800/30 border border-slate-700">
                         <TrendingUp className="w-6 h-6 text-green-500 mb-3" />
                         <h5 className="font-bold text-slate-100 mb-2">Tiềm năng tăng trưởng</h5>
                         <p className="text-sm text-slate-400 leading-relaxed">{analysis.fundamentalAnalysis.growth}</p>
                      </div>
                      <div className="p-6 rounded-3xl bg-slate-800/30 border border-slate-700 border-red-500/20">
                         <ShieldAlert className="w-6 h-6 text-red-500 mb-3" />
                         <h5 className="font-bold text-slate-100 mb-2">Rủi ro cần lưu ý</h5>
                         <p className="text-sm text-slate-400 leading-relaxed">{analysis.fundamentalAnalysis.risk}</p>
                      </div>
                   </div>
                </TabsContent>

                <TabsContent value="cashflow" className="mt-0 space-y-6">
                   <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700">
                      <h5 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Dòng tiền Tổ chức
                      </h5>
                      <p className="text-slate-400">{analysis.cashFlowAnalysis.institutional}</p>
                   </div>
                   <div className="p-6 rounded-3xl bg-slate-800/50 border border-slate-700">
                      <h5 className="font-bold text-slate-100 flex items-center gap-2 mb-3">
                        <Users className="w-5 h-5 text-purple-500" />
                        Dòng tiền Khối ngoại
                      </h5>
                      <p className="text-slate-400">{analysis.cashFlowAnalysis.foreign}</p>
                   </div>
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      )}
    </div>
  );
}
