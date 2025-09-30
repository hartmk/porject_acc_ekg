const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create HTTP upload server as FTP alternative
const createUploadServer = (PATH_IN, UPLOAD_PORT = 3002) => {
  const uploadApp = express();
  
  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // Ensure input directory exists
      if (!fs.existsSync(PATH_IN)) {
        fs.mkdirSync(PATH_IN, { recursive: true });
      }
      cb(null, PATH_IN);
    },
    filename: function (req, file, cb) {
      // Keep original filename
      cb(null, file.originalname);
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: {
      fileSize: 50 * 1024 * 1024 // 50MB limit
    }
  });

  // Enable CORS
  uploadApp.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  // Serve upload form
  uploadApp.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>EKG File Upload</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #333; text-align: center; }
          .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
          .upload-area:hover { border-color: #007bff; }
          input[type="file"] { margin: 20px 0; }
          button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
          button:hover { background: #0056b3; }
          .status { margin: 20px 0; padding: 10px; border-radius: 5px; }
          .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
          .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🏥 EKG File Upload System</h1>
          <p>Upload your EKG files here. They will be automatically processed and sent to LINE.</p>
          
          <div class="upload-area" onclick="document.getElementById('fileInput').click()">
            <p>📁 Click here or drag & drop files to upload</p>
            <p>Supported formats: JPG, PNG, GIF, PDF, etc.</p>
          </div>
          
          <form id="uploadForm" enctype="multipart/form-data">
            <input type="file" id="fileInput" name="files" multiple style="display: none;" onchange="uploadFiles()">
            <button type="button" onclick="document.getElementById('fileInput').click()">Choose Files</button>
          </form>
          
          <div id="status"></div>
        </div>

        <script>
          function uploadFiles() {
            const fileInput = document.getElementById('fileInput');
            const statusDiv = document.getElementById('status');
            const files = fileInput.files;
            
            if (files.length === 0) return;
            
            statusDiv.innerHTML = '<div class="status">📤 Uploading files...</div>';
            
            const formData = new FormData();
            for (let file of files) {
              formData.append('files', file);
            }
            
            fetch('/upload', {
              method: 'POST',
              body: formData
            })
            .then(response => response.json())
            .then(data => {
              if (data.success) {
                statusDiv.innerHTML = '<div class="status success">✅ Files uploaded successfully! Check your LINE for notifications.</div>';
                fileInput.value = '';
              } else {
                statusDiv.innerHTML = '<div class="status error">❌ Upload failed: ' + data.message + '</div>';
              }
            })
            .catch(error => {
              statusDiv.innerHTML = '<div class="status error">❌ Upload error: ' + error.message + '</div>';
            });
          }
        </script>
      </body>
      </html>
    `);
  });

  // Handle file uploads
  uploadApp.post('/upload', upload.array('files'), (req, res) => {
    try {
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ success: false, message: 'No files uploaded' });
      }

      console.log(`📤 ${files.length} file(s) uploaded via HTTP:`);
      files.forEach(file => {
        console.log(`   - ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`);
      });

      res.json({ 
        success: true, 
        message: `${files.length} file(s) uploaded successfully`,
        files: files.map(f => f.originalname)
      });
    } catch (error) {
      console.error('Upload error:', error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  // API endpoint for status
  uploadApp.get('/api/status', (req, res) => {
    res.json({
      service: 'EKG File Upload System',
      status: 'running',
      port: UPLOAD_PORT,
      uploadPath: PATH_IN
    });
  });

  // Start upload server
  const server = uploadApp.listen(UPLOAD_PORT, () => {
    console.log(`📡 HTTP Upload Server running on port ${UPLOAD_PORT}`);
    console.log(`🌐 Upload interface: http://localhost:${UPLOAD_PORT}`);
    console.log(`📁 Upload directory: ${path.resolve(PATH_IN)}`);
  });

  return server;
};

module.exports = { createUploadServer };