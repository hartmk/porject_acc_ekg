# FTP Server Configuration Guide

## 🚀 FTP Server Overview

ระบบ FTP Server ที่ built-in ในโปรเจ็คนี้ช่วยให้สามารถรับไฟล์จากระบบภายนอกได้โดยตรง ไฟล์ที่ upload ผ่าน FTP จะถูก process อัตโนมัติเหมือนกับไฟล์ที่วางในโฟลเดอร์ input

## 🔧 การตั้งค่า

### Environment Variables ใน .env:
```env
FTP_PORT=21          # Port ของ FTP server (default: 21)
FTP_USER=imac        # Username สำหรับ login
FTP_PASS=123456      # Password สำหรับ login
```

### การเปิดใช้งาน:
FTP Server จะเริ่มทำงานอัตโนมัติเมื่อรัน `npm start`

## 📡 การเชื่อมต่อ FTP

### ข้อมูลการเชื่อมต่อ:
- **Host**: localhost (หรือ IP address ของ server)
- **Port**: 21 (หรือตาม FTP_PORT ที่กำหนด)
- **Username**: imac
- **Password**: 123456
- **Mode**: Passive (PASV) - แนะนำ
- **Root Directory**: input folder ของโปรเจ็ค

### FTP Clients ที่แนะนำ:

#### 1. FileZilla (GUI - ฟรี)
```
Site Manager > New Site
Host: localhost
Port: 21
Protocol: FTP
Logon Type: Normal
User: imac
Password: 123456
Transfer Settings: Passive
```

#### 2. Command Line (macOS/Linux)
```bash
ftp localhost
# Username: imac
# Password: 123456
# Commands:
# put filename.jpg    (upload file)
# ls                  (list files)
# quit                (exit)
```

#### 3. WinSCP (Windows)
```
File Protocol: FTP
Host name: localhost
Port number: 21
User name: imac
Password: 123456
```

## 🔄 การทำงานของระบบ

1. **Upload ไฟล์ผ่าน FTP** → ไฟล์ถูกบันทึกใน `input/` folder
2. **File Watcher ตรวจพบไฟล์ใหม่** → เริ่ม process
3. **ย้ายและเปลี่ยนชื่อไฟล์** → `hxxx_yyyyMMddHHmmss_ekg.jpg`
4. **บันทึกใน output folder** → ไฟล์พร้อมใช้งาน
5. **ส่งแจ้งเตือนไปยัง LINE** → พร้อมรูปภาพ (ถ้าเป็นไฟล์รูป)

## 🛠️ การทดสอบ

### ทดสอบด้วย Script:
```bash
node test-ftp.js
```

### ทดสอบด้วย Command Line:
```bash
# เชื่อมต่อ
ftp localhost

# Login
Name: imac
Password: 123456

# Upload ไฟล์
put /path/to/your/file.jpg

# ตรวจสอบผล
ls

# ออกจากระบบ
quit
```

## 🔒 Security Considerations

### การตั้งค่าความปลอดภัย:
1. **เปลี่ยน Username/Password**: แก้ไขใน .env file
2. **จำกัด IP Access**: ใช้ firewall rules
3. **ใช้ FTPS**: สำหรับ production environment
4. **จำกัด File Types**: เพิ่ม validation ในโค้ด

### Firewall Configuration (ถ้าจำเป็น):
```bash
# เปิด FTP port
sudo ufw allow 21/tcp

# เปิด passive mode ports (ถ้าใช้)
sudo ufw allow 30000:30100/tcp
```

## 🚨 การแก้ไขปัญหา

### FTP Connection Refused:
- ตรวจสอบ port 21 ว่าว่างหรือไม่: `lsof -i :21`
- ตรวจสอบ firewall settings
- ลอง restart server

### Authentication Failed:
- ตรวจสอบ FTP_USER และ FTP_PASS ใน .env
- ตรวจสอบ case-sensitive ของ username/password

### Passive Mode Issues:
- ตรวจสอบ NAT/Router configuration
- ลองเปลี่ยนเป็น Active mode
- ตรวจสอบ passive port range (30000-30100)

### File Upload แล้วไม่ process:
- ตรวจสอบ logs ใน terminal
- ตรวจสอบสิทธิ์เขียนไฟล์ในโฟลเดอร์ input
- ตรวจสอบ file watcher ทำงานหรือไม่

## 📊 Monitoring

### ดู FTP Logs:
Server จะแสดง logs เมื่อมีการเชื่อมต่อและ upload:
```
FTP Login successful for user: imac
New file detected: input/yourfile.jpg
File moved and renamed: yourfile.jpg -> hyourfile_20250929123456_ekg.jpg
```

### การตรวจสอบสถานะ:
- FTP Server status: ดู console output เมื่อ start server
- Active connections: ดู logs real-time
- Files in queue: เช็คโฟลเดอร์ input และ output