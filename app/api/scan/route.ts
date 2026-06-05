import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { extractReceiptData } from "@/lib/gemini";
import { ScanResponse } from "@/types";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 1. Verify Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await request.formData();
    const file = formData.get("receipt") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Invalid file type. Must be an image." }, { status: 400 });
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    // 3. Upload to Cloudinary
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create a unique folder for the user
    const folderPath = `finapp/receipts/${user.id}`;
    
    const uploadResult = await uploadToCloudinary(buffer, folderPath);

    // 4. Extract data using Gemini
    // We pass the secure URL from Cloudinary to Gemini
    const extractedData = await extractReceiptData(uploadResult.secure_url);

    // If Gemini failed to extract data, we still return the uploaded image URL
    // so the user can manually enter the data with the receipt attached.
    
    const responseData: ScanResponse = {
      receiptUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      extractedData,
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Scan API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process receipt" },
      { status: 500 }
    );
  }
}
