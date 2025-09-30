# 🔧 FileZilla Connection Fix - Port 2121

## ⚡ การตั้งค่าใหม่ที่แก้ปัญหาแล้ว

**Server ตอนนี้ทำงานบน Port 2121 แทน 21 เพื่อแก้ปัญหาการเชื่อมต่อ**

### 📋 FileZilla Settings ใหม่:

#### Quick Connect:
```
Host: 127.0.0.1
Username: imac
Password: 123456
Port: 2121
```

#### Site Manager Settings:
```
Protocol: FTP - File Transfer Protocol
Host: 127.0.0.1
Port: 2121
Encryption: Use plain FTP (insecure)
Logon Type: Normal
User: imac
Password: 123456
```

### 🎯 Transfer Settings (สำคัญมาก!):
```
Transfer Settings Tab:
✅ Limit number of simultaneous connections
Maximum number of connections: 1

Advanced Tab:
Default remote directory: /
✅ Bypass proxy
```

### ⚙️ FileZilla Global Settings:

#### Connection > FTP:
```
✅ Passive (recommended)
✅ Allow fall back to other transfer mode on failure
Default FTP transfer mode: Binary
```

#### Connection Settings:
```
Timeout in seconds: 30
Number of retries: 3
Delay between retry attempts: 5
```

## 🧪 ทดสอบการเชื่อมต่อ

### วิธีที่ 1: FileZilla Quick Connect
1. เปิด FileZilla
2. ใส่ข้อมูล connection ใน Quick Connect bar:
   - Host: `127.0.0.1`
   - Username: `imac`
   - Password: `123456`
   - Port: `2121`
3. กด Enter

### วิธีที่ 2: Command Line Test
```bash
# ทดสอบด้วย telnet ก่อน
telnet 127.0.0.1 2121

# ควรจะเห็น welcome message:
# "Welcome to EKG File Monitor FTP Server"

# ออกจาก telnet: กด Ctrl+] แล้วพิมพ์ quit
```

### วิธีที่ 3: Built-in FTP Client
```bash
ftp 127.0.0.1 2121
# Username: imac
# Password: 123456
# binary
# put yourfile.jpg
# ls
# quit
```

## 🎉 สิ่งที่เปลี่ยนแปลง

### Port Change:
- **เดิม**: Port 21 (ต้องใช้ root privileges บน macOS)
- **ใหม่**: Port 2121 (ไม่ต้องใช้ root privileges)

### Passive Port Range:
- **เดิม**: 30000-30100 (อาจ conflict)
- **ใหม่**: 1024-1100 (ใช้ได้แน่นอน)

### Connection Timeout:
- **เดิม**: 30 วินาที
- **ใหม่**: 60 วินาที (มีเวลามากกว่าสำหรับ upload)

## 🚀 การทดสอบ Upload

หลังจากเชื่อมต่อสำเร็จแล้ว:

1. **ลาก Drop ไฟล์** จากฝั่งซ้าย (Local) ไปฝั่งขวา (Remote)
2. **ดู Server Logs** ควรเห็น:
   ```
   ✅ FTP Login successful for user: imac from 127.0.0.1
   📤 File uploaded via FTP: yourfile.jpg from 127.0.0.1
   New file detected: input/yourfile.jpg
   File moved and renamed: yourfile.jpg -> hyourfile_20250929123456_ekg.jpg
   🎉 Image sent to LINE successfully: 200
   ```

3. **ตรวจสอบผลลัพธ์**:
   - ไฟล์ถูก process และย้ายไป `output/` folder
   - ได้รับแจ้งเตือนใน LINE พร้อมรูปภาพ

## ⚠️ หากยังมีปัญหา

### ลองใช้ Active Mode แทน Passive:
```
FileZilla > Settings > Connection > FTP
เปลี่ยนเป็น: "Use active mode"
```

### เปลี่ยน Host:
```
แทนที่จะใช้ 127.0.0.1 ให้ลอง:
- localhost
- ::1 (IPv6 localhost)
```

### ตรวจสอบ Firewall:
```bash
# macOS - อนุญาต port 2121
sudo pfctl -f /etc/pf.conf
```

**ตอนนี้ควรจะ upload ไฟล์ได้แล้ว! 🎯**