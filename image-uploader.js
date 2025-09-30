const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

// Function to upload image to imgbb (free image hosting)
const uploadToImgbb = async (imagePath) => {
  try {
    // You need to get API key from https://api.imgbb.com/
    const API_KEY = process.env.IMGBB_API_KEY || 'your_imgbb_api_key_here';
    
    if (!API_KEY || API_KEY === 'your_imgbb_api_key_here') {
      throw new Error('ImgBB API key not configured');
    }

    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');

    const form = new FormData();
    form.append('image', base64Image);
    form.append('key', API_KEY);

    const response = await axios.post('https://api.imgbb.com/1/upload', form, {
      headers: form.getHeaders(),
    });

    if (response.data.success) {
      return response.data.data.url;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('ImgBB upload failed:', error.message);
    return null;
  }
};

// Function to upload to temporary file service (0x0.st - free, no registration)
const uploadToTempService = async (imagePath) => {
  try {
    const form = new FormData();
    form.append('file', fs.createReadStream(imagePath));

    const response = await axios.post('https://0x0.st', form, {
      headers: form.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    // The response is just the URL as text
    return response.data.trim();
  } catch (error) {
    console.error('Temp service upload failed:', error.message);
    return null;
  }
};

// Function to try multiple upload services
const uploadImage = async (imagePath) => {
  console.log(`Attempting to upload: ${imagePath}`);

  // Try temporary service first (no API key needed)
  let imageUrl = await uploadToTempService(imagePath);
  if (imageUrl) {
    console.log(`✅ Uploaded to temp service: ${imageUrl}`);
    return imageUrl;
  }

  // Try ImgBB if API key is available
  imageUrl = await uploadToImgbb(imagePath);
  if (imageUrl) {
    console.log(`✅ Uploaded to ImgBB: ${imageUrl}`);
    return imageUrl;
  }

  console.log('❌ All upload services failed');
  return null;
};

module.exports = { uploadImage, uploadToImgbb, uploadToTempService };