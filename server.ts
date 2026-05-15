import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const cache = new Map<string, { data: any, timestamp: number }>();
  const CACHE_TTL = 10000; // 10 seconds

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Proxy endpoint for VNDirect API to bypass CORS
  app.get("/api/market/quotes", async (req, res) => {
    const symbols = req.query.symbols as string;
    if (!symbols) {
      return res.status(400).json({ error: "Missing symbols parameter" });
    }

    // Check cache
    const cached = cache.get(symbols);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      // Primary endpoint
      const primaryUrl = `https://finfo-api.vndirect.com.vn/v2/quotes?symbols=${symbols}`;
      // Secondary endpoint fallback
      const secondaryUrl = `https://price-strategy.vndirect.com.vn/api/quotes?symbols=${symbols}`;
      
      let response = await fetch(primaryUrl, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Referer": "https://www.vndirect.com.vn/",
          "Accept": "application/json, text/plain, */*"
        }
      });

      // Fallback if primary fails or blocked
      if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
        console.warn(`Primary API failed for symbols: ${symbols}, trying secondary...`);
        response = await fetch(secondaryUrl, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://www.vndirect.com.vn/",
            "Accept": "application/json"
          }
        });
      }

      clearTimeout(timeoutId);
      
      const contentType = response.headers.get("content-type");
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => "N/A");
        console.error(`VNDirect API Error: ${response.status} - ${errorText.substring(0, 100)}`);
        // If we have cached data, return it instead of error
        if (cached) return res.json(cached.data);
        return res.status(response.status).json({ error: "Upstream error", status: response.status });
      }

      if (!contentType || !contentType.includes("application/json")) {
        console.error(`VNDirect API returned non-JSON: ${contentType}`);
        if (cached) return res.json(cached.data);
        throw new Error("Invalid content type from upstream");
      }

      const data = await response.json();
      
      // Basic validation of response data
      if (!data || !data.data) {
        console.warn("VNDirect API returned empty or malformed data structure");
        if (cached) return res.json(cached.data);
      }
      
      // Update cache
      cache.set(symbols, { data, timestamp: Date.now() });
      
      res.json(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        res.status(504).json({ error: "VNDirect API request timed out" });
      } else {
        console.error("Proxy Fetch Error:", error);
        // Serve stale cache if available on error
        if (cached) {
          return res.json(cached.data);
        }
        res.status(500).json({ error: "Failed to fetch market data from VNDirect" });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
