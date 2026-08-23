/**
 * Test Cloudinary buffer upload directly
 */
import dotenv from "dotenv";
dotenv.config();
import { uploadToCloudinary } from "../src/utils/cloudinaryUpload.js";
import https from "https";

// Download a real small image buffer
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on("data", (d) => chunks.push(d));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

console.log("Downloading test image...");
const buf = await downloadImage("https://picsum.photos/200/200.jpg");
console.log("Downloaded:", buf.length, "bytes");

console.log("Uploading to Cloudinary...");
try {
  const result = await uploadToCloudinary(buf, "delivery-tracker/test", "image");
  console.log("✅ Cloudinary upload SUCCESS:", result.secure_url);
} catch(e) {
  console.log("❌ Cloudinary upload FAILED:", e.message);
}
