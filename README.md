# File Monitor LINE Notifier with FTP Server

โปรเจ็ค Node.js + Express ที่ทำหน้าที่ตรวจสอบไฟล์ที่เข้ามาในโฟลเดอร์ แล้วย้ายไฟล์และเปลี่ยนชื่อตามรูปแบบที่กำหนด และส่งภาพไปยัง LINE **โดยตรง** พร้อมด้วย **FTP Server** สำหรับรับไฟล์จากภายนอก

## 🆕 คุณสมบัติใหม่ - FTP Server

- ✅ **FTP Server แบบ Built-in** - รับไฟล์ผ่าน FTP protocol
- ✅ **รองรับ Authentication** - Username/Password protection
- ✅ **Auto Processing** - ไฟล์ที่ upload ผ่าน FTP จะถูก process อัตโนมัติ
- ✅ **Passive Mode Support** - รองรับ FTP passive mode

## คุณสมบัติทั้งหมด

- ✅ **ส่งภาพไปยัง LINE โดยตรง** - ใช้ cloud image hosting service
- ✅ **รองรับภาพทุกขนาด** - Upload ผ่าน temporary hosting service
- ✅ **ไม่ต้องตั้งค่า ngrok** - ใช้ external service hosting
- ✅ **Fallback system** - ส่งข้อความแจ้งเตือนแม้ upload ล้มเหลว

## คุณสมบัติ

- ตรวจสอบไฟล์ที่เข้ามาในโฟลเดอร์ `pathIN` แบบ real-time (File System + FTP)
- ย้ายไฟล์ไปยังโฟลเดอร์ `pathOUT` พร้อมเปลี่ยนชื่อเป็นรูปแบบ: `hxxx_yyyyMMddHHmmss_ekg.jpg`
- **ส่งภาพไปยัง LINE โดยตรง** โดย upload ไปยัง cloud service
- **FTP Server** สำหรับรับไฟล์จากระบบภายนอก
- REST API สำหรับตรวจสอบสถานะและไฟล์

## การติดตั้ง

1. ติดตั้ง dependencies:
```bash
npm install
```

2. กำหนดค่าในไฟล์ `.env`:
```env
PATH_IN=./input
PATH_OUT=./output
LINE_TOKEN=your_line_channel_access_token
USER_ID=your_line_user_id
PUBLIC_URL=http://localhost:3000

# FTP Server Configuration
FTP_PORT=21
FTP_USER=imac
FTP_PASS=123456
```

## การใช้งาน

### เริ่มต้นระบบ:
```bash
npm start
```

Server จะรันที่ port 3000 และเริ่มตรวจสอบไฟล์ใน input folder
FTP Server จะรันที่ port 21 (หรือตาม FTP_PORT ที่กำหนด)

### ทดสอบ FTP Server:
```bash
node test-ftp.js
```

## � การใช้งาน FTP Server

### การเชื่อมต่อ FTP:
```
Host: your_server_ip หรือ localhost
Port: 21 (หรือตาม FTP_PORT ที่กำหนด)
Username: imac
Password: 123456
Mode: Passive (PASV)
```

### การ upload ไฟล์ผ่าน FTP:
1. เชื่อมต่อ FTP client (FileZilla, WinSCP, หรือ command line)
2. Upload ไฟล์ไปยัง FTP root directory
3. ระบบจะ process ไฟล์อัตโนมัติ:
   - ย้ายไฟล์ไปยัง output folder
   - เปลี่ยนชื่อไฟล์ตามรูปแบบที่กำหนด
   - ส่งภาพไปยัง LINE

### FTP Command Line Example:
```bash
# Connect using command line FTP client
ftp localhost
# Username: imac
# Password: 123456
# Then use: put yourfile.jpg
```

## �🖼️ การส่งภาพไปยัง LINE

ระบบจะพยายามส่งภาพในลำดับต่อไปนี้:

1. **Upload ไปยัง 0x0.st** (temporary hosting service - ฟรี, ไม่ต้องลงทะเบียน)
2. **Upload ไปยัง ImgBB** (ถ้ามี API key ใน .env)
3. **Fallback** - ส่งข้อความแจ้งเตือนอย่างเดียว

### การตั้งค่า ImgBB (ไม่บังคับ):
1. สมัครสมาชิกที่ [ImgBB](https://imgbb.com/)
2. ขอ API key ฟรีที่ [API page](https://api.imgbb.com/)
3. เพิ่ม `IMGBB_API_KEY=your_api_key` ใน `.env`

## API Endpoints

- `GET /` - ข้อมูลสถานะของ service  
- `GET /api/files/input` - รายการไฟล์ในโฟลเดอร์ input
- `GET /api/files/output` - รายการไฟล์ในโฟลเดอร์ output
- `GET /images/:filename` - เข้าถึงไฟล์ภาพใน output folder

## การทดสอบ

### วิธีที่ 1: File System
1. เริ่มต้น server: `npm start`
2. วางไฟล์ภาพในโฟลเดอร์ `input`
3. ตรวจสอบการทำงาน

### วิธีที่ 2: FTP Upload
1. เริ่มต้น server: `npm start`
2. ทดสอบ FTP: `node test-ftp.js`
3. หรือใช้ FTP client เชื่อมต่อและ upload ไฟล์

### ผลลัพธ์ที่ควรได้รับ:
- ไฟล์ถูกย้ายและเปลี่ยนชื่อในโฟลเดอร์ `output` ✅
- ได้รับข้อความใน LINE พร้อมภาพ ✅

## 🔧 การแก้ไขปัญหา

### ไม่สามารถส่งภาพได้:
- ตรวจสอบการเชื่อมต่อ internet
- ตรวจสอบ logs ใน terminal

### LINE Token Error:
- ตรวจสอบ LINE_TOKEN และ USER_ID ใน .env
- ตรวจสอบว่า Channel เป็น Messaging API type

### FTP Connection Error:
- ตรวจสอบ FTP_PORT (default: 21)
- ตรวจสอบ firewall settings
- ลองใช้ Passive mode (PASV)

## 📋 โครงสร้างโปรเจ็ค

```
testmovefile/
├── input/              # โฟลเดอร์สำหรับไฟล์ที่เข้ามา (รองรับ File System + FTP)
├── output/             # โฟลเดอร์สำหรับไฟล์ที่ถูกย้าย
├── server.js           # ไฟล์หลักของ server (รวม FTP Server)
├── image-uploader.js   # ระบบ upload ภาพไป cloud
├── test-ftp.js         # ทดสอบ FTP server
├── package.json        # ข้อมูล dependencies  
├── README.md           # คู่มือนี้
└── .env               # ไฟล์กำหนดค่า environment
```