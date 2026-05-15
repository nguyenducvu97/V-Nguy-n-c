
import { toast } from "sonner";

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: string;
  volume: number;
  high: number;
  low: number;
  updatedAt: string;
}

export interface MarketIndex {
  symbol: string;
  value: number;
  change: number;
  changePercent: string;
  totalValue?: number;
  totalVolume?: number;
  updatedAt: string;
}

export async function fetchMarketIndexes(): Promise<MarketIndex[]> {
  try {
    const response = await fetch("/api/market/quotes?symbols=VNINDEX,HNX,UPCOM,VN30");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const now = new Date().toLocaleTimeString('vi-VN');
    
    if (json.data && json.data.length > 0) {
      return json.data.map((item: any) => ({
        symbol: item.symbol,
        value: item.lastPrice || 0,
        change: item.change || 0,
        changePercent: `${item.pctChange > 0 ? "+" : ""}${item.pctChange || 0}%`,
        totalValue: item.nmValue || 0,
        totalVolume: item.nmVolume || 0,
        updatedAt: now
      }));
    }
    
    throw new Error("No data received from API");
  } catch (error) {
    console.error("Market Index Fetch Error:", error);
    const now = new Date().toLocaleTimeString('vi-VN');
    return [
      { symbol: "VNINDEX", value: 1280.52, change: 12.45, changePercent: "+0.98%", updatedAt: now },
      { symbol: "HNX-INDEX", value: 242.15, change: -1.20, changePercent: "-0.49%", updatedAt: now },
      { symbol: "UPCOM", value: 92.30, change: 0.15, changePercent: "+0.16%", updatedAt: now },
    ];
  }
}

export async function fetchStockQuote(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(`/api/market/quotes?symbols=${symbol.toUpperCase()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const now = new Date().toLocaleTimeString('vi-VN');
    
    if (json.data && json.data.length > 0) {
      const item = json.data[0];
      const isIndex = ["VNINDEX", "HNX", "UPCOM", "VN30", "HNX30"].includes(item.symbol);
      
      // Smart price normalization: if price is small (< 1000) it's likely in 1/1000 units
      const priceFactor = (!isIndex && item.lastPrice < 1000 && item.lastPrice !== 0) ? 1000 : 1;

      return {
         symbol: item.symbol,
         price: (item.lastPrice || 0) * priceFactor,
         change: (item.change || 0) * priceFactor,
         changePercent: `${item.pctChange > 0 ? "+" : ""}${item.pctChange || 0}%`,
         volume: item.nmVolume || 0,
         high: (item.high || 0) * priceFactor,
         low: (item.low || 0) * priceFactor,
         updatedAt: now
      };
    }
    return null;
  } catch (error) {
    console.error(`Stock Quote Fetch Error (${symbol}):`, error);
    return null;
  }
}

export function formatCurrency(value: number): string {
  if (value === 0) return "0 ₫";
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export async function fetchMultipleStockQuotes(symbols: string[]): Promise<StockPrice[]> {
  try {
    const response = await fetch(`/api/market/quotes?symbols=${symbols.join(",")}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const json = await response.json();
    const now = new Date().toLocaleTimeString('vi-VN');
    
    if (json.data && json.data.length > 0) {
      return json.data.map((item: any) => {
        const isIndex = ["VNINDEX", "HNX", "UPCOM", "VN30", "HNX30"].includes(item.symbol);
        const priceFactor = (!isIndex && item.lastPrice < 1000 && item.lastPrice !== 0) ? 1000 : 1;
        
        return {
          symbol: item.symbol,
          price: (item.lastPrice || 0) * priceFactor,
          change: (item.change || 0) * priceFactor,
          changePercent: `${item.pctChange > 0 ? "+" : ""}${item.pctChange || 0}%`,
          volume: item.nmVolume || 0,
          high: (item.high || 0) * priceFactor,
          low: (item.low || 0) * priceFactor,
          updatedAt: now
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Multiple Stock Quotes Fetch Error:", error);
    return [];
  }
}

export async function fetchTopStocks(): Promise<StockPrice[]> {
  const leaders = ["FPT", "MWG", "TCB", "VCB", "DGC", "PVS", "GMD", "VNM"];
  return fetchMultipleStockQuotes(leaders);
}
