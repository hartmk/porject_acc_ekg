#!/bin/bash

echo "🧪 Testing FTP Server Connection..."
echo "=================================="

# Test FTP connection using built-in FTP client
echo "📡 Connecting to FTP server..."
echo ""

# Create a test file first  
TEST_FILE="/tmp/ftp_test_$(date +%s).txt"
echo "Test file created at $(date)" > "$TEST_FILE"
echo "📝 Created test file: $TEST_FILE"

# Use expect to automate FTP session (if expect is available)
if command -v expect >/dev/null; then
    echo "🔄 Using expect for automated FTP test..."
    expect << EOF
spawn ftp localhost
expect "Name"
send "imac\r"
expect "Password:"
send "123456\r"
expect "ftp>"
send "binary\r"
expect "ftp>"  
send "put $TEST_FILE\r"
expect "ftp>"
send "ls\r"
expect "ftp>"
send "quit\r"
expect eof
EOF
else
    echo "⚠️  expect not available, showing manual commands:"
    echo ""
    echo "Run these commands manually:"
    echo "ftp localhost"
    echo "Username: imac"
    echo "Password: 123456" 
    echo "binary"
    echo "put $TEST_FILE"
    echo "ls"
    echo "quit"
    echo ""
    echo "Or use this one-liner:"
    echo 'echo -e "imac\n123456\nbinary\nput '$TEST_FILE'\nls\nquit" | ftp localhost'
fi

# Clean up
rm -f "$TEST_FILE"
echo ""
echo "✅ Test completed!"
echo "Check server logs for connection details"