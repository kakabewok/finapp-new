import OpenAI from "openai";
import type { ScanResult } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  baseURL: "https://ai.sumopod.com/v1",
});

const EXTRACTION_PROMPT = `Analyze this receipt or payment proof image and extract the data as a JSON object with exactly these fields:
{
  "merchant_name": string,
  "transaction_date": string (YYYY-MM-DD format),
  "total_amount": number (IMPORTANT: if the receipt is in Indonesian Rupiah and shows "65.000", this means 65000. Do NOT return 65),
  "currency": string (e.g. "IDR", "USD"),
  "items": [{ "name": string, "quantity": number, "price": number }],
  "category": string (must be one of: "Food & Beverage", "Transportation", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Other"),
  "payment_method": string
}
Return only the JSON object. Use null for any field that cannot be determined. Pay close attention to Indonesian number formats (dot as thousands separator) and translate any Indonesian categories into the required English category enums.`;

// Handle Indonesian number format: "65.000" → 65000
function parseIndonesianAmount(value: unknown): number | null {
  if (!value) return null;
  const str = String(value).replace(/\./g, "").replace(",", ".");
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

const CATEGORY_MAP: Record<string, string> = {
  "makanan": "Food & Beverage",
  "makanan & minuman": "Food & Beverage",
  "food": "Food & Beverage",
  "food & beverage": "Food & Beverage",
  "restaurant": "Food & Beverage",
  "restoran": "Food & Beverage",
  "transportasi": "Transportation",
  "transportation": "Transportation",
  "belanja": "Shopping",
  "shopping": "Shopping",
  "hiburan": "Entertainment",
  "entertainment": "Entertainment",
  "kesehatan": "Health",
  "health": "Health",
  "utilitas": "Utilities",
  "utilities": "Utilities",
  "pendidikan": "Education",
  "education": "Education",
};

function normalizeCategory(value: unknown): string | null {
  if (!value) return null;
  const lower = String(value).toLowerCase().trim();
  return CATEGORY_MAP[lower] || value as string;
}

export async function extractReceiptData(imageUrl: string): Promise<ScanResult | null> {
  try {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await openai.chat.completions.create({
      model: "gemini/gemini-2.5-flash-lite",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
    });

    const text = result.choices[0].message.content || "";
    console.log("RAW AI RESPONSE:", text);

    if (!text) {
      console.error("Model returned empty response — it may not support image input. Consider falling back to gemini/gemini-2.5-flash-lite.");
      return null;
    }

    // Try to extract JSON even if it's embedded in text
    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7);
    else if (jsonString.startsWith("```")) jsonString = jsonString.slice(3);
    if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3);
    jsonString = jsonString.trim();

    // If still not starting with {, try to find JSON object in the text
    if (!jsonString.startsWith("{")) {
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) {
        jsonString = match[0];
      }
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Failed to parse JSON. Raw string was:", jsonString);
      throw parseError;
    }

    return {
      merchant_name: parsed.merchant_name || null,
      transaction_date: parsed.transaction_date || null,
      total_amount: parseIndonesianAmount(parsed.total_amount),
      currency: parsed.currency || "IDR",
      items: Array.isArray(parsed.items)
        ? parsed.items.map((item: { name?: string; quantity?: number; price?: number }) => ({
          name: item.name || "Unknown item",
          quantity: Number(item.quantity) || 1,
          price: parseIndonesianAmount(item.price) || 0,
        }))
        : null,
      category: normalizeCategory(parsed.category),
      payment_method: parsed.payment_method || null,
    };
  } catch (error) {
    console.error("Sumopod extraction error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}