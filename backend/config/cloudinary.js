// backend/config/cloudinary.js
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with your account details.
// These credentials should be set as environment variables,
// either in a .env file or directly in the Render dashboard.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;