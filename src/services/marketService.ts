
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

// Map to store temporary real-time updates from WebSocket
const realtimeCache = new Map<string, StockPrice>();

/**
 * Robust WebSocket Manager for real-time market data
 */
class MarketDataStream {
  private socket: WebSocket | null = null;
  private symbols: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 5000;
  private onUpdateCallback: ((data: StockPrice) => void) | null = null;
  private isConnecting = false;

  constructor() {
    this.connect();
  }

  private connect() {
    if (this.socket || this.isConnecting) return;
    
    this.isConnecting = true;
    console.log("Connecting to Market Data WebSocket...");

    try {
      // Common WebSocket endpoints for VN market
      const endpoints = [
        "wss://price-strategy.vndirect.com.vn/ws",
        "wss://iboard-query.ssi.com.vn/socket.io/?EIO=3&transport=websocket"
      ];
      const endpoint = endpoints[this.reconnectAttempts % endpoints.length];
      
      console.log(`Connecting to WebSocket: ${endpoint}`);
      this.socket = new WebSocket(endpoint);

      this.socket.onopen = () => {
        console.log("Market Data WebSocket Connected");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.subscribePending();
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Handle VNDirect WS format (usually type: 'quote' or similar)
          if (data && data.type === 'quote' && data.data) {
            const quote = this.normalizeWsData(data.data);
            if (quote) {
              realtimeCache.set(quote.symbol, quote);
              if (this.onUpdateCallback) this.onUpdateCallback(quote);
            }
          }
        } catch (e) {
          // Non-JSON or malformed
        }
      };

      this.socket.onerror = (error) => {
        console.warn("WebSocket Error:", error);
        this.isConnecting = false;
      };

      this.socket.onclose = () => {
        console.warn("Market Data WebSocket Closed");
        this.socket = null;
        this.isConnecting = false;
        this.handleReconnect();
      };
    } catch (err) {
      console.error("Failed to initialize WebSocket:", err);
      this.isConnecting = false;
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting to WebSocket (Attempt ${this.reconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectInterval * this.reconnectAttempts);
    }
  }

  private normalizeWsData(data: any): StockPrice | null {
    if (!data.symbol) return null;
    
    const isIndex = ["VNINDEX", "HNX", "UPCOM", "VN30", "HNX30"].includes(data.symbol);
    const priceFactor = (!isIndex && data.lastPrice < 1000 && data.lastPrice !== 0) ? 1000 : 1;
    
    return {
      symbol: data.symbol,
      price: (data.lastPrice || 0) * priceFactor,
      change: (data.change || 0) * priceFactor,
      changePercent: `${data.pctChange > 0 ? "+" : ""}${data.pctChange || 0}%`,
      volume: data.nmVolume || 0,
      high: (data.high || 0) * priceFactor,
      low: (data.low || 0) * priceFactor,
      updatedAt: new Date().toLocaleTimeString('vi-VN')
    };
  }

  private subscribePending() {
    if (this.socket?.readyState === WebSocket.OPEN && this.symbols.size > 0) {
      const msg = JSON.stringify({
        type: "subscribe",
        symbols: Array.from(this.symbols)
      });
      this.socket.send(msg);
    }
  }

  public subscribe(symbols: string[], callback?: (data: StockPrice) => void) {
    symbols.forEach(s => this.symbols.add(s));
    if (callback) this.onUpdateCallback = callback;
    this.subscribePending();
  }
}

// Singleton instance
export const marketStream = new MarketDataStream();

export async function fetchMarketIndexes(): Promise<MarketIndex[]> {
  try {
    const symbols = "VNINDEX,HNX,UPCOM,VN30,HNX30,VS100,VSL-CAP,VSM-CAP,VSS-CAP,VN30F1M";
    const response = await fetch(`/api/market/quotes?symbols=${symbols}`);
    const now = new Date().toLocaleTimeString('vi-VN');
    
    // Robust response handling
    if (!response.ok) {
        console.warn(`Market Index API returned status ${response.status}`);
        return getFallbackIndexes();
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.warn("Market Index API returned non-JSON content");
        return getFallbackIndexes();
    }

    const json = await response.json();
    
    if (json.data && json.data.length > 0) {
      return json.data.map((item: any) => {
        // Prefer real-time cache for fresh values if available
        const cached = realtimeCache.get(item.symbol);
        if (cached && cached.updatedAt > now) {
            return {
                symbol: cached.symbol,
                value: cached.price,
                change: cached.change,
                changePercent: cached.changePercent,
                totalValue: item.nmValue || 0,
                totalVolume: item.nmVolume || 0,
                updatedAt: cached.updatedAt
            };
        }

        return {
          symbol: item.symbol,
          value: item.lastPrice || 0,
          change: item.change || 0,
          changePercent: `${item.pctChange > 0 ? "+" : ""}${item.pctChange || 0}%`,
          totalValue: item.nmValue || 0,
          totalVolume: item.nmVolume || 0,
          updatedAt: now
        };
      });
    }
    
    return getFallbackIndexes();
  } catch (error) {
    console.error("Market Index Fetch Error:", error);
    return getFallbackIndexes();
  }
}

function getFallbackIndexes(): MarketIndex[] {
    const now = new Date().toLocaleTimeString('vi-VN');
    return [
      { symbol: "VNINDEX", value: 1921.60, change: -3.86, changePercent: "-0.2%", updatedAt: now, totalValue: 24500e9 },
      { symbol: "HNX", value: 257.42, change: 2.35, changePercent: "+0.92%", updatedAt: now, totalValue: 2800e9 },
      { symbol: "UPCOM", value: 126.40, change: 0.05, changePercent: "+0.04%", updatedAt: now, totalValue: 1650e9 },
      { symbol: "VN30", value: 2050.58, change: -18.04, changePercent: "-0.87%", updatedAt: now, totalValue: 12500e9 },
      { symbol: "HNX30", value: 531.60, change: 1.22, changePercent: "+0.23%", updatedAt: now, totalValue: 1200e9 },
      { symbol: "VS100", value: 477.40, change: -1.16, changePercent: "-0.24%", updatedAt: now, totalValue: 0 },
      { symbol: "VSL-CAP", value: 685.34, change: -1.67, changePercent: "-0.24%", updatedAt: now, totalValue: 0 },
      { symbol: "VSM-CAP", value: 1296.21, change: 1.66, changePercent: "+0.13%", updatedAt: now, totalValue: 0 },
      { symbol: "VSS-CAP", value: 1896.52, change: 1.03, changePercent: "+0.05%", updatedAt: now, totalValue: 0 },
      { symbol: "VN30F1M", value: 2053.90, change: -11.20, changePercent: "-0.54%", updatedAt: now, totalValue: 0 }
    ];
}

export async function fetchStockQuote(symbol: string): Promise<StockPrice | null> {
  try {
    const response = await fetch(`/api/market/quotes?symbols=${symbol.toUpperCase()}`);
    const now = new Date().toLocaleTimeString('vi-VN');
    
    if (!response.ok) {
        console.warn(`Stock Quote API returned status ${response.status}`);
        return null;
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.warn("Stock Quote API returned non-JSON content");
        return null;
    }

    const json = await response.json();
    
    if (json.data && json.data.length > 0) {
      const item = json.data[0];
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
    const now = new Date().toLocaleTimeString('vi-VN');
    
    if (!response.ok) {
       console.warn(`Multiple Stocks API returned status ${response.status}`);
       return [];
    }
    
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        console.warn("Multiple Stocks API returned non-JSON content");
        return [];
    }

    const json = await response.json();
    
    if (json.data && json.data.length > 0) {
      return json.data.map((item: any) => {
        // Check real-time cache first
        const cached = realtimeCache.get(item.symbol);
        if (cached && cached.updatedAt > now) {
            return cached;
        }

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
