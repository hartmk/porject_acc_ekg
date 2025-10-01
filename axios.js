const axios = require('axios');
const fs = require('fs');

async function uploadImageToImgbb(imagePath, apiKey) {
  const imageData = fs.readFileSync(imagePath, { encoding: 'base64' });
  const response = await axios.post('https://swpallonline.com/api/imagelink/imagelink.php', null, {
    params: {
      base64: imagePath
    },
  });
  return response.data.data.url; // HTTPS URL
}