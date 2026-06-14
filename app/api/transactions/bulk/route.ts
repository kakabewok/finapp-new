import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { deleteCloudinaryImages } from "@/lib/cloudinary";

export async function DELETE(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No IDs provided for deletion" }, { status: 400 });
    }

    // Step 1: Fetch receipt_public_id for all selected transactions (only those
    // belonging to the authenticated user, for security).
    const { data: transactions, error: fetchError } = await supabase
      .from("transactions")
      .select("id, receipt_public_id")
      .in("id", ids)
      .eq("user_id", user.id);

    if (fetchError) {
      console.error("[BulkDelete] Error fetching transactions for Cloudinary cleanup:", fetchError);
      // Non-fatal: proceed to DB delete regardless
    }

    // Step 2: Collect public_ids that actually have images attached.
    const publicIds: string[] = (transactions ?? [])
      .filter((tx) => !!tx.receipt_public_id)
      .map((tx) => tx.receipt_public_id as string);

    // Step 3: Delete Cloudinary images in parallel (Promise.allSettled — failures
    // are logged but do NOT block the database deletion below).
    let cloudinaryFailedCount = 0;
    if (publicIds.length > 0) {
      const { succeeded, failed } = await deleteCloudinaryImages(publicIds);
      cloudinaryFailedCount = failed;
      console.log(
        `[BulkDelete] Cloudinary cleanup: ${succeeded} deleted, ${failed} failed out of ${publicIds.length} images.`
      );
    }

    // Step 4: Delete the transaction records from Supabase.
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids)
      .eq("user_id", user.id);

    if (error) {
      console.error("[BulkDelete] Error bulk deleting transactions:", error);
      return NextResponse.json({ error: "Failed to delete transactions" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      deletedCount: ids.length,
      ...(cloudinaryFailedCount > 0 && {
        warning: `${ids.length} transaction(s) deleted, but ${cloudinaryFailedCount} receipt image(s) could not be removed from storage.`,
      }),
    });
  } catch (error) {
    console.error("[BulkDelete] Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
