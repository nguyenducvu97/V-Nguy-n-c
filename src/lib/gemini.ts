import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const STOCK_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    symbol: { type: Type.STRING },
    name: { type: Type.STRING },
    currentPrice: { type: Type.NUMBER },
    aiScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
    recommendation: { type: Type.STRING, enum: ["MUA", "GIỮ", "BÁN"] },
    targetPrice: { type: Type.NUMBER },
    stopLoss: { type: Type.NUMBER },
    winProbability: { type: Type.NUMBER, description: "0 to 1" },
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
};

export async function analyzeStock(symbol: string) {
  const model = "gemini-3.1-pro-preview";
  const prompt = `Hãy đóng vai một chuyên gia phân tích chứng khoán cấp cao. Phân tích mã cổ phiếu ${symbol} tại thị trường Việt Nam. 
  Cung cấp phân tích chi tiết bao gồm:
  1. Phân tích kỹ thuật (xu hướng, các chỉ báo quan trọng).
  2. Phân tích cơ bản (định giá, tăng trưởng).
  3. Phân tích dòng tiền (tổ chức, khối ngoại).
  4. Đưa ra điểm số AI (0-100) và khuyến nghị MUA/GIỮ/BÁN với mục tiêu và dừng lỗ.
  Dữ liệu cần mang tính giả định thực tế dựa trên bối cảnh thị trường hiện tại (May 2026).`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: STOCK_ANALYSIS_SCHEMA
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI Analysis Error:", error);
    throw error;
  }
}

export async function getMarketSentiment() {
  const model = "gemini-3-flash-preview";
  const prompt = `Phân tích tâm lý thị trường chứng khoán Việt Nam hiện tại (tháng 5/2026). 
  Đưa ra Fear & Greed Index (0-100) và tóm tắt ngắn gọn các tin tức quan trọng ảnh hưởng đến thị trường.
  Trả về định dạng JSON: { "index": number, "sentiment": string, "news": string[] }`;

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
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Market Sentiment Error:", error);
    return { index: 50, sentiment: "Neutral", news: ["Đang cập nhật..."] };
  }
}
