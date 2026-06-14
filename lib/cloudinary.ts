import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
}

/**
 * Upload a file buffer to Cloudinary
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = "siboros/receipts"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: "image",
          transformation: [
            { quality: "auto", fetch_format: "auto" },
            { width: 1200, crop: "limit" },
          ],
        },
        (error, result) => {
          if (error || !result) {
            reject(error || new Error("Upload failed"));
            return;
          }
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
          });
        }
      )
      .end(fileBuffer);
  });
}

/**
 * Delete a single image from Cloudinary.
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}

/**
 * Delete multiple images from Cloudinary in parallel.
 *
 * Uses Promise.allSettled so a single failure never blocks the rest.
 * Failed deletions are logged with their public_id.
 *
 * @returns { succeeded: number; failed: number }
 */
export async function deleteCloudinaryImages(
  publicIds: string[]
): Promise<{ succeeded: number; failed: number }> {
  if (publicIds.length === 0) return { succeeded: 0, failed: 0 };

  const results = await Promise.allSettled(
    publicIds.map((pid) => cloudinary.uploader.destroy(pid))
  );

  let succeeded = 0;
  let failed = 0;

  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      succeeded++;
    } else {
      failed++;
      console.error(
        `[Cloudinary] Failed to delete image public_id="${publicIds[index]}":`,
        result.reason
      );
    }
  });

  return { succeeded, failed };
}

export default cloudinary;
