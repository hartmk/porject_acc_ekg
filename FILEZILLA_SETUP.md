# FileZilla Configuration Guide

## 🚀 การตั้งค่า FileZilla สำหรับเชื่อมต่อ FTP Server

### ⚙️ ขั้นตอนการตั้งค่า FileZilla:

#### 1. เปิด Site Manager
- เมนู `File` > `Site Manager` หรือ กด `Ctrl+S`
- กดปุ่ม `New site`

#### 2. การตั้งค่าทั่วไป (General Tab):
```
Site Name: EKG Monitor (ตั้งชื่อเอง)
Protocol: FTP - File Transfer Protocol
Host: 127.0.0.1 (หรือ localhost)
Port: 21
Encryption: Use plain FTP (insecure)
Logon Type: Normal
User: imac  
Password: 123456
```

#### 3. การตั้งค่า Transfer (Transfer Settings Tab):
```
Transfer mode: Default
Limit number of simultaneous connections: ✅ เช็ค
Maximum number of connections: 1
```

#### 4. การตั้งค่า Advanced (Advanced Tab):
```
Default local directory: (ว่างไว้หรือเลือกโฟลเดอร์ที่ต้องการ)
Default remote directory: /
Bypass proxy: ✅ เช็ค
```

#### 5. การตั้งค่าที่สำคัญมาก - Passive Mode:
- ไปที่ `Settings` (Preferences) > `Connection` > `FTP`
- เลือก `Passive (recommended)`
- หรือถ้าไม่ได้ให้ลองเลือก `Active`

## 🔧 การแก้ไขปัญหาการเชื่อมต่อ

### ปัญหา: Connection timed out / หลุดบ่อยๆ

#### วิธีแก้ที่ 1: เปลี่ยน Transfer Mode
```
Settings > Transfers > File Types
เลือก: Binary
```

#### วิธีแก้ที่ 2: ปรับ Passive Mode Settings
```
Settings > Connection > FTP > Passive mode
ลองเปลี่ยนเป็น:
- "Use passive mode (recommended)" 
- หรือ "Fall back to active mode"
```

#### วิธีแก้ที่ 3: เปลี่ยน Connection Settings
```
Settings > Connection
- Timeout in seconds: 60
- Number of retries: 3
- Delay between retry attempts: 5 seconds
```

#### วิธีแก้ที่ 4: Disable IPv6 (ถ้าจำเป็น)
```
Settings > Connection > Generic
เอา IPv6 ออก และใช้แค่ IPv4
```

## 🧪 การทดสอบการเชื่อมต่อ

### ขั้นตอนการทดสอบ:
1. **เริ่ม Server**: `npm start`
2. **เปิด FileZilla** และตั้งค่าตามด้านบน
3. **กด Connect**
4. **ดูผลใน FileZilla Status**:
   ```
   Status: Resolving address of 127.0.0.1
   Status: Connected to 127.0.0.1:21
   Status: Logged in
   ```

### การทดสอบ Upload:
1. **Drag & Drop** ไฟล์จาก Local (ซ้าย) ไป Remote (ขวา)
2. **ดู Server Log**:
   ```
   ✅ FTP Login successful for user: imac from 127.0.0.1
   📤 File uploaded via FTP: yourfile.jpg
   New file detected: input/yourfile.jpg
   ```

## 🚨 Troubleshooting เพิ่มเติม

### Error: "Connection refused"
```bash
# ตรวจสอบว่า server ทำงานหรือไม่
lsof -i :21

# ถ้าไม่มีผลลัพธ์ แสดงว่า server ไม่ทำงาน
# ให้รัน: npm start
```

### Error: "Login failed"  
- ตรวจสอบ username: `imac`
- ตรวจสอบ password: `123456`
- ตรวจสอบการพิมพ์ให้ถูกต้อง (case-sensitive)

### Error: "Data connection failed"
- เปลี่ยนจาก Passive เป็น Active mode
- หรือลองใช้ IP `localhost` แทน `127.0.0.1`

### การดู Logs เพิ่มเติมใน FileZilla:
```
View > Message log (เพื่อดู detailed connection logs)
```

## 📋 Quick Settings Summary

**สำหรับการเชื่อมต่อที่เสถียร:**
```
Host: 127.0.0.1
Port: 21  
User: imac
Pass: 123456
Encryption: Plain FTP
Transfer Mode: Passive
Max Connections: 1
```

**หากยังไม่ได้ ลองใช้:**
```
Host: localhost
Transfer Mode: Active  
Port: 2121 (ถ้า 21 ถูกใช้งาน)
```