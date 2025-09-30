const net = require('net');
const fs = require('fs');
const path = require('path');

// Simple FTP client test
const testFtpUpload = () => {
  const client = net.createConnection({ port: 2121, host: '127.0.0.1' }, () => {
    console.log('✅ Connected to FTP server!');
  });

  let step = 0;
  const testFile = 'test.txt';
  const testContent = 'This is a test file from Node.js FTP client';

  client.on('data', (data) => {
    const response = data.toString().trim();
    console.log(`📥 Server: ${response}`);

    switch(step) {
      case 0: // Initial connection
        if (response.startsWith('220')) {
          console.log('📤 Sending USER command...');
          client.write('USER imac\r\n');
          step = 1;
        }
        break;

      case 1: // USER response
        if (response.startsWith('331')) {
          console.log('📤 Sending PASS command...');
          client.write('PASS 123456\r\n');
          step = 2;
        }
        break;

      case 2: // PASS response
        if (response.startsWith('230')) {
          console.log('✅ Login successful!');
          console.log('📤 Sending TYPE command...');
          client.write('TYPE I\r\n'); // Binary mode
          step = 3;
        }
        break;

      case 3: // TYPE response
        if (response.startsWith('200')) {
          console.log('📤 Sending PASV command...');
          client.write('PASV\r\n');
          step = 4;
        }
        break;

      case 4: // PASV response
        if (response.startsWith('227')) {
          console.log('✅ Passive mode enabled');
          // Parse PASV response to get data port
          const pasvMatch = response.match(/\((\d+,\d+,\d+,\d+,\d+,\d+)\)/);
          if (pasvMatch) {
            const nums = pasvMatch[1].split(',').map(n => parseInt(n));
            const dataPort = (nums[4] << 8) + nums[5];
            console.log(`📡 Data port: ${dataPort}`);

            // Create test file
            fs.writeFileSync(testFile, testContent);
            console.log(`📝 Created test file: ${testFile}`);

            // Send STOR command
            console.log('📤 Sending STOR command...');
            client.write(`STOR ${testFile}\r\n`);
            step = 5;

            // Connect to data port and send file
            setTimeout(() => {
              const dataClient = net.createConnection({ port: dataPort, host: '127.0.0.1' }, () => {
                console.log('📡 Connected to data port');
                dataClient.write(testContent);
                dataClient.end();
              });

              dataClient.on('error', (err) => {
                console.error('❌ Data connection error:', err.message);
              });
            }, 100);
          }
        }
        break;

      case 5: // STOR response
        if (response.startsWith('150')) {
          console.log('📤 Transfer started...');
        } else if (response.startsWith('226')) {
          console.log('✅ File uploaded successfully!');
          console.log('📤 Sending QUIT command...');
          client.write('QUIT\r\n');
          step = 6;
        }
        break;

      case 6: // QUIT response
        if (response.startsWith('221')) {
          console.log('👋 Disconnected successfully');
          client.end();
          // Clean up
          fs.unlinkSync(testFile);
        }
        break;
    }
  });

  client.on('error', (err) => {
    console.error('❌ Connection error:', err.message);
  });

  client.on('end', () => {
    console.log('🔚 Connection ended');
  });
};

console.log('🧪 Testing FTP Upload with custom client...\n');
testFtpUpload();