import cloudinary from "../config/cloudinary.js";

export async function uploadToCloudinary(fileData, folder = "delivery-tracker", resourceType = "image") {
  // Validate Cloudinary is configured
  const cfg = cloudinary.config();
  if (!cfg.cloud_name || !cfg.api_key || !cfg.api_secret) {
    throw new Error("Cloudinary is not configured — missing env vars");
  }

  // Base64 data URI
  if (typeof fileData === "string" && fileData.startsWith("data:")) {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: resourceType,
    });
    return result;
  }

  // Buffer — use upload_stream
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) {
          console.error("[Cloudinary] Stream upload error:", err.message, "http_code:", err.http_code);
          return reject(
            new Error(`Cloudinary upload failed: ${err.message} (HTTP ${err.http_code || "??"})`)
          );
        }
        if (!result?.secure_url) {
          return reject(new Error("Cloudinary returned no URL"));
        }
        resolve(result);
      }
    );
    uploadStream.end(fileData);
  });
}

export async function deleteFromCloudinary(publicId, resourceType = "image") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
