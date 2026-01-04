
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function extractTransactionsFromImage(base64Image: string): Promise<Partial<Transaction>[]> {
  const model = 'gemini-3-flash-preview';
  
  const prompt = `Extract all individual transactions or retail receipt details from this image. 
  The image could be a bank statement, a mobile banking app screenshot, or a physical paper receipt from a store.
  
  For each transaction/receipt:
  1. Date: Find the date of purchase.
  2. Description: Extract the Merchant name or Vendor.
  3. Amount: Find the TOTAL amount paid (including tax/tip). Return as a positive number.
  4. Category: Assign a logical category from: Groceries, Dining, Utilities, Rent, Entertainment, Transport, Shopping, Health, Other.
  
  If it's a paper receipt, look for the 'Total' line. If it's a bank statement, list each row as a separate transaction.`;

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType: 'image/png' } },
        { text: prompt }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            description: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["description", "amount"]
        }
      }
    }
  });

  try {
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}
