import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function analyzeStock(symbol: string, realtimeData?: any) {
  const model = "gemini-3.1-pro-preview";
  
  let context = "";
  if (realtimeData) {
    context = `\nTHÔNG TIN THỊ TRƯỜNG THỰC TẾ (HÃY SỬ DỤNG DỮ LIỆU NÀY LÀM ƯU TIÊN SỐ 1):
    - Giá hiện tại: ${realtimeData.price} VND
    - Thay đổi: ${realtimeData.changePercent}
    - Khối lượng: ${realtimeData.volume}
    - Cao nhất ngày: ${realtimeData.high}
    - Thấp nhất ngày: ${realtimeData.low}
    - Thời gian cập nhật: ${realtimeData.updatedAt}`;
  }

  const prompt = `Hãy đóng vai một chuyên gia phân tích chứng khoán cấp cao. Phân tích mã cổ phiếu ${symbol} tại thị trường Việt Nam. 
  ${context}
  Cung cấp phân tích chi tiết dựa trên bối cảnh thị trường chứng khoán Việt Nam tháng 5/2026. 
  Nếu có dữ liệu thực tế được cung cấp ở trên, hãy tích hợp nó vào phân tích kỹ thuật và điểm số AI.
  
  Cấu trúc trả về bao gồm:
  1. Phân tích kỹ thuật (xu hướng, các chỉ báo quan trọng).
  2. Phân tích cơ bản (định giá, tăng trưởng).
  3. Phân tích dòng tiền (tổ chức, khối ngoại).
  4. Đưa ra điểm số AI (0-100) và khuyến nghị MUA/GIỮ/BÁN với mục tiêu và dừng lỗ.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symbol: { type: Type.STRING },
            name: { type: Type.STRING },
            currentPrice: { type: Type.NUMBER },
            aiScore: { type: Type.NUMBER },
            recommendation: { type: Type.STRING, enum: ["MUA", "GIỮ", "BÁN"] },
            targetPrice: { type: Type.NUMBER },
            stopLoss: { type: Type.NUMBER },
            winProbability: { type: Type.NUMBER },
            technicalAnalysis: {
              type: Type.OBJECT,
              properties: {
                trend: { type: Type.STRING },
                indicators: { type: Type.STRING },
                signals: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            },
            fundamentalAnalysis: {
              type: Type.OBJECT,
              properties: {
                valuation: { type: Type.STRING },
                growth: { type: Type.STRING },
                risk: { type: Type.STRING }
              }
            },
            cashFlowAnalysis: {
              type: Type.OBJECT,
              properties: {
                institutional: { type: Type.STRING },
                foreign: { type: Type.STRING }
              }
            },
            summary: { type: Type.STRING }
          },
          required: ["symbol", "name", "aiScore", "recommendation"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("AI returned empty response");
    
    // Clean up potential markdown blocks if AI accidentally includes them
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function getMarketSentiment() {
  const model = "gemini-3-flash-preview";
  const prompt = `Phân tích tâm lý thị trường chứng khoán Việt Nam hiện tại (tháng 5/2026). 
  Đưa ra Fear & Greed Index (0-100) và tóm tắt ngắn gọn các tin tức quan trọng ảnh hưởng đến thị trường.
  Trả về JSON có cấu trúc: { "index": number, "sentiment": string, "news": string[] }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            index: { type: Type.NUMBER },
            sentiment: { type: Type.STRING },
            news: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["index", "sentiment", "news"]
        }
      }
    });

    const text = response.text;
    if (!text) return { index: 50, sentiment: "Neutral", news: ["Đang cập nhật..."] };
    
    const jsonStr = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Market Sentiment Error:", error);
    return { index: 50, sentiment: "Neutral", news: ["Đang cập nhật dữ liệu vĩ mô..."] };
  }
}
