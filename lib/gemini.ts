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
  "total_amount": number,
  "currency": string (e.g. "IDR", "USD"),
  "items": [{ "name": string, "quantity": number, "price": number }],
  "category": string (must be one of: "Food & Beverage", "Transportation", "Shopping", "Entertainment", "Health", "Utilities", "Education", "Other"),
  "payment_method": string
}
Return only the JSON object. Use null for any field that cannot be determined.`;

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
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
            {
              type: "text",
              text: EXTRACTION_PROMPT,
            },
          ],
        },
      ],
      max_tokens: 1000,
    });

    const text = result.choices[0].message.content || "";

    // Parse JSON — strip markdown code blocks if present
    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7);
    else if (jsonString.startsWith("```")) jsonString = jsonString.slice(3);
    if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3);
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
    console.error("Sumopod extraction error:", error);
    return null;
  }
}