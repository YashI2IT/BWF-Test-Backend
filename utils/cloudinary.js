const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'co2gsulq',
  api_key: process.env.CLOUDINARY_API_KEY || '758988719589415',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'cLWxeum_4_DovYKz5A2mp8HmEQ0',
  timeout: 60000 // 60 second timeout to prevent hanging uploads
});

const uploadToCloudinary = (fileBuffer, fileType) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder: 'community_posts' },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result.secure_url, type: result.resource_type });
      }
    );
    uploadStream.end(fileBuffer);
  });
};

module.exports = { cloudinary, uploadToCloudinary };
