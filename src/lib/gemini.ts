import { toast } from "sonner";

export async function analyzeStock(symbol: string, realtimeData?: any) {
  try {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ symbol, realtimeData }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Backend AI analysis failed");
    }

    return await response.json();
  } catch (error) {
    console.error("AI Analysis Client Error:", error);
    toast.error("Không thể kết nối với dịch vụ phân tích AI. Vui lòng thử lại sau.");
    throw error;
  }
}

export async function getMarketSentiment() {
  try {
    const response = await fetch("/api/ai/sentiment");
    
    if (!response.ok) {
      return { index: 50, sentiment: "Neutral", news: ["Đang cập nhật..."] };
    }

    return await response.json();
  } catch (error) {
    console.error("Market Sentiment Client Error:", error);
    return { index: 50, sentiment: "Neutral", news: ["Đang cập nhật dữ liệu vĩ mô..."] };
  }
}
