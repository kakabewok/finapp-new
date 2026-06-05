import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ScanResult } from "@/types";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const EXTRACTION_PROMPT = `Analyze this receipt or payment proof image and extract the data as a JSON object with exactly these fields:
{
  "merchant_name": string,
  "transaction_date": string (YYYY-MM-DD format),
  "total_amount": number,
  "currency": string (e.g. "IDR", "USD"),
  "items": [{ "name": string, "quantity": number, "price": number }],
  "category": string (must be one of: "Food & Beverage", "Transportation", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Other"),
  "payment_method": string
}
Return only the JSON object. Use null for any field that cannot be determined.`;

/**
 * Extract receipt data from an image URL using Gemini 2.5 Flash
 */
export async function extractReceiptData(imageUrl: string): Promise<ScanResult | null> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Fetch the image and convert to base64 for Gemini
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await model.generateContent([
      EXTRACTION_PROMPT,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = result.response;
    const text = response.text();

    // Parse the JSON response - handle markdown code blocks
    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.slice(7);
    } else if (jsonString.startsWith("```")) {
      jsonString = jsonString.slice(3);
    }
    if (jsonString.endsWith("```")) {
      jsonString = jsonString.slice(0, -3);
    }
    jsonString = jsonString.trim();

    const parsed = JSON.parse(jsonString);

    return {
      merchant_name: parsed.merchant_name || null,
      transaction_date: parsed.transaction_date || null,
      total_amount: parsed.total_amount ? Number(parsed.total_amount) : null,
      currency: parsed.currency || "IDR",
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: { name?: string; quantity?: number; price?: number }) => ({
            name: item.name || "Unknown item",
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
          }))
        : null,
      category: parsed.category || null,
      payment_method: parsed.payment_method || null,
    };
  } catch (error) {
    console.error("Gemini extraction error:", error);
    return null;
  }
}
