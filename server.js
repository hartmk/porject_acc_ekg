const express = require('express');
const chokidar = require('chokidar');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const moment = require('moment');
const { uploadImage } = require('./image-uploader');
const { createUploadServer } = require('./http-upload-server');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Environment variables
const PATH_IN = process.env.PATH_IN || './input';
const PATH_OUT = process.env.PATH_OUT || './output';
const LINE_TOKEN = process.env.LINE_TOKEN;
const USER_ID = process.env.USER_ID;
const UPLOAD_PORT = process.env.UPLOAD_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

// Initialize directories
ensureDirectoryExists(PATH_IN);
ensureDirectoryExists(PATH_OUT);

// Function to generate new filename
const generateNewFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const timestamp = moment().format('YYYYMMDDHHmmss');
  return `h${baseName}_${timestamp}_ekg${ext}`;
};

// Function to send image to LINE using cloud image hosting
const sendImageToLine = async (imagePath) => {
  try {
    if (!LINE_TOKEN || !USER_ID) {
      console.log('LINE_TOKEN or USER_ID not configured');
      return;
    }

    const fileName = path.basename(imagePath);
    const stats = fs.statSync(imagePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    
    console.log(`Processing file: ${fileName} (${fileSizeInMB.toFixed(2)} MB)`);

    // Try to upload image to cloud service
    ///const imageUrl = await uploadImage(imagePath);
    const imageUrl = 'https://www.autoshippers.co.uk/blog/wp-content/uploads/bugatti-centodieci.jpg';
    
    
    if (imageUrl) {
      // Send image message with the uploaded URL
      const imageMessage = {
        to: USER_ID,
        messages: [
          {
            type: 'text',
            text: `🏥 New EKG file processed!\n📁 File: ${fileName}\n📏 Size: ${fileSizeInMB.toFixed(2)} MB\n⏰ Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}`
          },
          {
            type: 'image',
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl
          }
        ]
      };

      const response = await axios.post('https://api.line.me/v2/bot/message/push', imageMessage, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_TOKEN}`,
        },
      });

      console.log('🎉 Image sent to LINE successfully:', response.status);
      
    } else {
      // Fallback: Send text message only if upload failed
      console.log('Image upload failed, sending text notification only');
      
      const fallbackMessage = {
        to: USER_ID,
        messages: [
          {
            type: 'text',
            text: `🏥 New EKG file processed!\n📁 File: ${fileName}\n📏 Size: ${fileSizeInMB.toFixed(2)} MB\n⏰ Time: ${moment().format('YYYY-MM-DD HH:mm:ss')}\n💾 File saved to output folder\n\n⚠️ Unable to upload image for preview`
          }
        ]
      };

      const response = await axios.post('https://api.line.me/v2/bot/message/push', fallbackMessage, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_TOKEN}`,
        },
      });

      console.log('Fallback message sent successfully:', response.status);
    }
    
  } catch (error) {
    console.error('Error in sendImageToLine:', error.response?.data || error.message);
    
    // Final fallback: Send simple text message
    try {
      const simpleMessage = {
        to: USER_ID,
        messages: [
          {
            type: 'text',
            text: `🏥 EKG file processed: ${path.basename(imagePath)}\n⏰ ${moment().format('YYYY-MM-DD HH:mm:ss')}`
          }
        ]
      };

      await axios.post('https://api.line.me/v2/bot/message/push', simpleMessage, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${LINE_TOKEN}`,
        },
      });

      console.log('Simple notification sent');
    } catch (finalError) {
      console.error('All notification methods failed:', finalError.message);
    }
  }
};

// File watcher
const watcher = chokidar.watch(PATH_IN, {
  ignored: /^\./, // ignore dotfiles
  persistent: true,
  ignoreInitial: true
});

// Handle file addition
watcher.on('add', async (filePath) => {
  try {
    console.log(`New file detected: ${filePath}`);
    
    // Generate new filename
    const originalFilename = path.basename(filePath);
    const newFilename = generateNewFilename(originalFilename);
    const newFilePath = path.join(PATH_OUT, newFilename);
    
    // Move and rename file
    fs.renameSync(filePath, newFilePath);
    console.log(`File moved and renamed: ${originalFilename} -> ${newFilename}`);
    
    // Send to LINE if it's an image
    const ext = path.extname(newFilename).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
      await sendImageToLine(newFilePath);
    }
    
  } catch (error) {
    console.error('Error processing file:', error);
  }
});

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'File Monitor and LINE Notifier Service',
    status: 'running',
    pathIn: PATH_IN,
    pathOut: PATH_OUT,
    configured: {
      lineToken: !!LINE_TOKEN,
      userId: !!USER_ID
    }
  });
});

// Serve images for LINE
app.get('/images/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(PATH_OUT, filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file list
app.get('/api/files/input', (req, res) => {
  try {
    const files = fs.readdirSync(PATH_IN);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/files/output', (req, res) => {
  try {
    const files = fs.readdirSync(PATH_OUT);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Start HTTP Upload Server (replaces FTP Server)
const uploadServer = createUploadServer(PATH_IN);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Monitoring directory: ${path.resolve(PATH_IN)}`);
  console.log(`Output directory: ${path.resolve(PATH_OUT)}`);
  console.log(`LINE Token configured: ${!!LINE_TOKEN}`);
  console.log(`User ID configured: ${!!USER_ID}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down services...');
  console.log('Closing file watcher...');
  watcher.close();
  
  console.log('Closing upload server...');
  uploadServer.close(() => {
    console.log('Upload server closed');
    process.exit(0);
  });
});