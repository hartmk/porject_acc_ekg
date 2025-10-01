const express = require("express");
const chokidar = require("chokidar");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");
const moment = require("moment");
const { uploadImage } = require("./image-uploader");
const { createUploadServer } = require("./http-upload-server");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;

// Environment variables
const PATH_IN = process.env.PATH_IN || "./input";

// แก้ไขตรงนี้ให้เป็นโฟลเดอร์ Output ข้างนอกโปรเจค
// ตัวอย่าง Windows
const PATH_OUT = process.env.PATH_OUT || "D:/EKG_OUTPUT";
// ถ้า Linux/Mac ให้ใช้ เช่น: /home/username/EKG_OUTPUT

const LINE_TOKEN = process.env.LINE_TOKEN;
const USER_ID = process.env.USER_ID;
const UPLOAD_PORT = process.env.UPLOAD_PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.static("public"));

// Ensure directories exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    //  console.log(`✅ Created directory: ${dirPath}`);
  } else {
    //  console.log(`📂 Using existing directory: ${dirPath}`);
  }
};

// Initialize directories
ensureDirectoryExists(PATH_IN);
ensureDirectoryExists(PATH_OUT);

// Function to generate new filename
const generateNewFilename = (originalFilename) => {
  const ext = path.extname(originalFilename);
  const baseName = path.basename(originalFilename, ext);
  const timestamp = moment().format("YYYYMMDDHHmmss");
  return `h${baseName}_${timestamp}_ekg${ext}`;
};

// Function to send image to LINE using cloud image hosting
async function uploadImageToImgbb(imagePath, apiKey) {
  const imageData = fs.readFileSync(imagePath, { encoding: "base64" });
  const response = await axios.post("https://swpallonline.com/api/imagelink/imagelink.php", null, {
    params: {
      base64 : imageData,
    },
  });
  return response.path;
}

const sendImageToLine = async (imagePath) => {
  try {
    if (!LINE_TOKEN || !USER_ID) {
      console.log("LINE_TOKEN or USER_ID not configured");
      return;
    }
    const fileName = path.basename(imagePath);
    const stats = fs.statSync(imagePath);
    const fileSizeInBytes = stats.size;
    const fileSizeInMB = fileSizeInBytes / (1024 * 1024);
    console.log(`Processing file: ${fileName} (${fileSizeInMB.toFixed(2)} MB)`);
    if (fileSizeInBytes === 0) {
      console.log("File is empty, skip upload to imgbb");
      const fallbackMessage = {
        to: USER_ID,
        messages: [
          {
            type: "text",
            text: `🏥 New EKG file processed!\n📁 File: ${fileName}\n📏 Size: 0 MB\n⏰ Time: ${moment().format(
              "YYYY-MM-DD HH:mm:ss"
            )}\n💾 File saved to output folder\n\n⚠️ Unable to upload image for preview (file is empty)`,
          },
        ],
      };
      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        fallbackMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );
      return;
    }
    const imgbbApiKey = "33ff798f15afda8db266382ac8c866bd"; // ใส่ API key ที่ได้จาก imgbb
    const imageUrl = await uploadImageToImgbb(imagePath, imgbbApiKey);
    console.log("imgbb imageUrl:", imageUrl);
    if (imageUrl) {
      const imageMessage = {
        to: USER_ID,
        messages: [
          {
            type: "text",
            text: `🏥 New EKG file processed!\n📁 File: ${fileName}\n📏 Size: ${fileSizeInMB.toFixed(
              2
            )} MB\n⏰ Time: ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
          },
          {
            type: "image",
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl,
          },
        ],
      };

      const response = await axios.post(
        "https://api.line.me/v2/bot/message/push",
        imageMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );

      console.log("🎉 Image sent to LINE successfully:", response.status);
    } else {
      console.log("Image upload failed, sending text notification only");
      const fallbackMessage = {
        to: USER_ID,
        messages: [
          {
            type: "text",
            text: `🏥 New EKG file processed!\n📁 File: ${fileName}\n📏 Size: ${fileSizeInMB.toFixed(
              2
            )} MB\n⏰ Time: ${moment().format(
              "YYYY-MM-DD HH:mm:ss"
            )}\n💾 File saved to output folder\n\n⚠️ Unable to upload image for preview`,
          },
        ],
      };

      const response = await axios.post(
        "https://api.line.me/v2/bot/message/push",
        fallbackMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );

      console.log("Fallback message sent successfully:", response.status);
    }
  } catch (error) {
    console.error(
      "Error in sendImageToLine:",
      error.response?.data || error.message
    );
    try {
      const simpleMessage = {
        to: USER_ID,
        messages: [
          {
            type: "text",
            text: `🏥 EKG file processed: ${path.basename(
              imagePath
            )}\n⏰ ${moment().format("YYYY-MM-DD HH:mm:ss")}`,
          },
        ],
      };

      await axios.post(
        "https://api.line.me/v2/bot/message/push",
        simpleMessage,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${LINE_TOKEN}`,
          },
        }
      );

      console.log("Simple notification sent");
    } catch (finalError) {
      console.error("All notification methods failed:", finalError.message);
    }
  }
};

// File watcher
const watcher = chokidar.watch(PATH_IN, {
  ignored: /^\./,
  persistent: true,
  ignoreInitial: true,
});

// Handle file addition
watcher.on("add", async (filePath) => {
  try {
    console.log(`New file detected: ${filePath}`);
    const originalFilename = path.basename(filePath);
    const newFilename = generateNewFilename(originalFilename);
    const newFilePath = path.join(PATH_OUT, newFilename);
    fs.renameSync(filePath, newFilePath);
    console.log(
      `File moved and renamed: ${originalFilename} -> ${newFilename}`
    );
    const ext = path.extname(newFilename).toLowerCase();
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
      await sendImageToLine(newFilePath);
    }
  } catch (error) {
    console.error("Error processing file:", error);
  }
});

const mysql = require("mysql2/promise");

// API Routes
app.get("/", (req, res) => {
  res.json({
    message: "File Monitor and LINE Notifier Service",
    status: "running",
    pathIn: PATH_IN,
    pathOut: PATH_OUT,
    configured: {
      lineToken: !!LINE_TOKEN,
      userId: !!USER_ID,
    },
  });
});

// Serve images
app.get("/images/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(PATH_OUT, filename);
    if (fs.existsSync(filePath)) {
      res.sendFile(path.resolve(filePath));
    } else {
      res.status(404).json({ error: "File not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get file lists
app.get("/api/files/input", (req, res) => {
  try {
    const files = fs.readdirSync(PATH_IN);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
app.get("/api/files/output", (req, res) => {
  try {
    const files = fs.readdirSync(PATH_OUT);
    res.json({ files });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- New Patient Data API ---
const pool = require("./db");

// GET /selectALL1000
app.get("/selectALL1000", async (req, res) => {
  try {
    const [rows] = await pool.query(`
SELECT 
    CONCAT(pname, fname, ' ', lname) AS Name,
    patient.birthday AS Birth,
    TIMESTAMPDIFF(YEAR, patient.birthday, CURDATE()) AS Age,
    CASE 
      WHEN sex = 1 THEN 'M'
      WHEN sex = 2 THEN 'F'
      ELSE ''
    END AS Gender,
    patient.hn AS PatientID,
    '-' AS Departments,
    '-' AS bedNum
FROM patient
LEFT JOIN ovst 
    ON patient.hn = ovst.hn
WHERE ovst.vstdate = CURDATE();
    `);

    res.status(200).json({
      rec: "200",
      worklist: rows,
    });
  } catch (error) {
    res.status(400).json({
      rec: 400,
      error: "For failure",
      message: error.message,
    });
  }
});

// GET /selectAll?pid=...
app.get("/selectAll", async (req, res) => {
  try {
    const { pid } = req.query;
    if (!pid) {
      return res.status(400).json({
        rec: 400,
        error: "For failure",
        message: "PatientID (pid) is required.",
      });
    }

    const [rows] = await pool.query(
      `
SELECT 
    CONCAT(pname, fname, ' ', lname) AS Name,
    patient.birthday AS Birth,
    TIMESTAMPDIFF(YEAR, patient.birthday, CURDATE()) AS Age,
    CASE 
      WHEN sex = 1 THEN 'M'
      WHEN sex = 2 THEN 'F'
      ELSE ''
    END AS Gender,
    patient.hn AS PatientID,
    '-' AS Departments,
    '-' AS bedNum
FROM patient
LEFT JOIN ovst 
    ON patient.hn = ovst.hn
WHERE ovst.vstdate = CURDATE()
  AND patient.hn = ?;
    `,
      [pid]
    );

    if (rows.length > 0) {
      res.status(200).json({ rec: "200", worklist: rows });
    } else {
      res.status(404).json({
        rec: 404,
        error: "For failure",
        message: `Patient with ID ${pid} not found.`,
      });
    }
  } catch (error) {
    res.status(400).json({
      rec: 400,
      error: "For failure",
      message: error.message,
    });
  }
});

// Start HTTP Upload Server
const uploadServer = createUploadServer(PATH_IN, 3003);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Monitoring directory: ${path.resolve(PATH_IN)}`);
  console.log(`Output directory: ${path.resolve(PATH_OUT)}`);
  console.log(`LINE Token configured: ${!!LINE_TOKEN}`);
  console.log(`User ID configured: ${!!USER_ID}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down services...");
  watcher.close();
  uploadServer.close(() => {
    console.log("Upload server closed");
    process.exit(0);
  });
});
