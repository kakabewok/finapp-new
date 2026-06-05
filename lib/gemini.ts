import { aiClient, AI_MODEL } from "@/lib/ai/client";
import type { ScanResult } from "@/types";

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

IMPORTANT RULES:
- Return total_amount as a plain integer or decimal number with NO dots or commas as thousand separators. Example: return 65000 not "65.000" or "65,000".
- Return item prices as plain numbers too. Example: 25000 not "25.000".
- Determine total_amount from "Grand Total", "Total", or the final amount on the receipt.
- Return category in English, exactly matching one of the allowed values above.
- Return only the raw JSON object, no markdown, no explanation.`;

// Handle Indonesian number format: "65.000" → 65000
function parseIndonesianAmount(value: unknown): number | null {
  if (value === null || value === undefined) return null;
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
  "other": "Other",
  "lainnya": "Other",
};

const VALID_CATEGORIES = [
  "Food & Beverage", "Transportation", "Shopping",
  "Entertainment", "Health", "Utilities", "Education", "Other"
];

function normalizeCategory(value: unknown): string | null {
  if (!value) return null;
  const lower = String(value).toLowerCase().trim();
  return CATEGORY_MAP[lower] ?? (VALID_CATEGORIES.includes(String(value)) ? String(value) : "Other");
}

export async function extractReceiptData(imageUrl: string): Promise<ScanResult | null> {
  try {
    // Fetch image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await aiClient.chat.completions.create({
      model: AI_MODEL,
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
      console.error("Model returned empty response — it may not support image input.");
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
    console.error("AI extraction error:", error instanceof Error ? error.message : String(error));
    return null;
  }
}

export async function generateFinancialInsights(data: {
  income: string;
  expense: string;
  balance: string;
  savingsRate: number;
  budgetSummary: string;
  topCategories: string;
  incomeChange: number;
  expenseChange: number;
}) {
  const prompt = `You are a personal finance advisor. Analyze this user's financial data for the month and provide actionable insights in English.
Data:
Total Income: ${data.income}
Total Expense: ${data.expense}
Net Balance: ${data.balance}
Savings Rate: ${data.savingsRate}%
Budget performance: ${data.budgetSummary}
Top spending categories: ${data.topCategories}
vs last month: income ${data.incomeChange}%, expense ${data.expenseChange}%

Provide exactly 4 insight points in this JSON format:
{
  "insights": [
    {
      "type": "positive" | "warning" | "negative" | "info",
      "title": "short title max 8 words",
      "description": "1-2 sentence insight max 30 words"
    }
  ],
  "overall_score": number (1-100, financial health score),
  "summary": "Overall 1 paragraph summary max 50 words"
}

Return ONLY the JSON string. No markdown formatting.`;

  try {
    const result = await aiClient.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    const text = result.choices[0].message.content || "";
    let jsonString = text.trim();
    if (jsonString.startsWith("```json")) jsonString = jsonString.slice(7);
    else if (jsonString.startsWith("```")) jsonString = jsonString.slice(3);
    if (jsonString.endsWith("```")) jsonString = jsonString.slice(0, -3);
    jsonString = jsonString.trim();
    
    if (!jsonString.startsWith("{")) {
      const match = jsonString.match(/\{[\s\S]*\}/);
      if (match) jsonString = match[0];
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error("AI Insight error:", error);
    return null;
  }
}