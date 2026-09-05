require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'vh13i1cn',
  api_key: process.env.CLOUDINARY_API_KEY || '345412634868692',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'rcLExAmJr2jSdVzuryWj1lQNbTE',
  secure: true,
});

/**
 * Upload a file (Buffer, base64 data URI, or remote URL) to Cloudinary
 * @param {Buffer|string} fileSource 
 * @param {string} folder - 'submitted' | 'approved' | 'condition_reports'
 * @returns {Promise<{ url: string, publicId: string }>}
 */
async function uploadToCloudinary(fileSource, folder = 'submitted') {
  return new Promise((resolve, reject) => {
    // If it's a buffer from multer
    if (Buffer.isBuffer(fileSource)) {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
      uploadStream.end(fileSource);
    } else {
      // If it's a URL or base64 string
      cloudinary.uploader.upload(
        fileSource,
        {
          folder,
          resource_type: 'image',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );
    }
  });
}

/**
 * Moves an image from 'submitted' to 'approved' folder in Cloudinary
 * @param {string} publicIdOrUrl 
 * @returns {Promise<string>} New approved Cloudinary URL
 */
async function moveToApproved(publicIdOrUrl) {
  if (!publicIdOrUrl) return publicIdOrUrl;

  try {
    let publicId = publicIdOrUrl;

    // If a full Cloudinary URL is passed, extract the public_id
    if (publicIdOrUrl.includes('res.cloudinary.com')) {
      const urlParts = publicIdOrUrl.split('/upload/');
      if (urlParts.length > 1) {
        // e.g. v1234567890/submitted/sample.jpg -> remove version prefix and file extension
        let pathAfterUpload = urlParts[1];
        // Strip version if present (v\d+/)
        pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, '');
        // Strip extension (.jpg, .png, etc.)
        publicId = pathAfterUpload.replace(/\.[^/.]+$/, '');
      }
    }

    // Only move if it is currently in 'submitted' folder
    if (publicId.startsWith('submitted/') || publicId.includes('submitted')) {
      const newPublicId = publicId.replace('submitted', 'approved');
      const result = await cloudinary.uploader.rename(publicId, newPublicId, {
        overwrite: true,
        invalidate: true,
      });
      return result.secure_url;
    }

    return publicIdOrUrl;
  } catch (err) {
    console.warn(`Could not move Cloudinary image ${publicIdOrUrl} to approved folder:`, err.message);
    return publicIdOrUrl; // Fallback to existing URL
  }
}

module.exports = {
  cloudinary,
  uploadToCloudinary,
  moveToApproved,
};
