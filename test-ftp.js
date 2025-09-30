const FtpClient = require('ftp');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const testFtpUpload = () => {
  const client = new FtpClient();
  
  client.on('ready', function() {
    console.log('✅ Connected to FTP server successfully!');
    
    // Create a test file to upload
    const testContent = 'This is a test file from FTP client\n' + new Date().toString();
    const testFileName = `test_${Date.now()}.txt`;
    const testFilePath = `/tmp/${testFileName}`;
    
    // Write test file
    fs.writeFileSync(testFilePath, testContent);
    console.log(`📝 Created test file: ${testFilePath}`);
    
    // Upload the test file
    client.put(testFilePath, testFileName, function(err) {
      if (err) {
        console.error('❌ Upload failed:', err.message);
      } else {
        console.log(`🚀 File uploaded successfully: ${testFileName}`);
        console.log(`📂 File should now be in: ${process.env.PATH_IN || './input'}`);
      }
      
      // Clean up
      fs.unlinkSync(testFilePath);
      client.end();
    });
  });
  
  client.on('error', function(err) {
    console.error('❌ FTP Connection failed:', err.message);
  });
  
  // Connect to FTP server
  console.log('🔌 Connecting to FTP server...');
  client.connect({
    host: 'localhost',
    port: parseInt(process.env.FTP_PORT || '21'),
    user: process.env.FTP_USER || 'imac',
    password: process.env.FTP_PASS || '123456',
    connTimeout: 30000,
    pasvTimeout: 30000,
    keepalive: 30000
  });
};

console.log('🧪 Testing FTP Upload Functionality...\n');
testFtpUpload();