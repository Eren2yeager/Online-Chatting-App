import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary with large file support
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  upload_timeout: 120000, // 2 minutes timeout for large files
});

/**
 * Generate signed upload parameters for secure client-side uploads
 * @param {string} folder - Cloudinary folder to upload to
 * @param {string} publicId - Public ID for the resource
 * @returns {Object} Signed upload parameters
 */
export function generateSignedUploadParams(
  folder = "chat-app",
  publicId = null
) {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder,
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "webp",
      "mp4",
      "mov",
      "avi",
      "pdf",
      "doc",
      "docx",
      "txt",
    ],
    max_bytes: 10 * 1024 * 1024, // 10MB max file size
    resource_type: "auto",
  };

  if (publicId) {
    params.public_id = publicId;
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET
  );

  return {
    timestamp,
    signature,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    ...params,
  };
}

/**
 * Delete a resource from Cloudinary
 * @param {string} publicId - Public ID of the resource to delete
 * @param {string} resourceType - Type of resource (image, video, raw)
 * @returns {Promise} Deletion result
 */
export async function deleteCloudinaryResource(
  publicId,
  resourceType = "auto"
) {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
    return result;
  } catch (error) {
    console.error("Error deleting Cloudinary resource:", error);
    throw error;
  }
}

/**
 * Get optimized URL for a Cloudinary resource
 * @param {string} publicId - Public ID of the resource
 * @param {Object} options - Transformation options
 * @returns {string} Optimized URL
 */
export function getOptimizedUrl(publicId, options = {}) {
  const defaultOptions = {
    quality: "auto",
    fetch_format: "auto",
    ...options,
  };

  return cloudinary.url(publicId, defaultOptions);
}

export default cloudinary;
