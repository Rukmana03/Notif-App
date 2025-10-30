import express from "express";
import cors from "cors";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp, getApps, cert } from "firebase-admin/app";

// =======================================================
// === 1. INISIALISASI FIREBASE HARUS DI PALING ATAS ===
// Pindahkan blok ini ke atas, SEBELUM import rute
// =======================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(
  __dirname,
  "tes-notif-firebase-firebase-adminsdk-fbsvc-bf91d0bddd.json"
);

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount),
  });
  console.log("Firebase Admin SDK berhasil diinisialisasi (Modular).");
} else {
  console.log("Firebase Admin SDK sudah diinisialisasi.");
}

import authRoutes from "./routes/authRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import statusRoutes from "./routes/statusRoutes.js";
import contactRoutes from "./routes/contactRoutes.js";

// --- Sisa kode Anda ---
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const server = http.createServer(app); // <-- Buat server dari 'app' Express

// GANTI 'http://localhost:5173' dengan URL frontend Anda
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // <-- URL React App Anda
    methods: ["GET", "POST"],
  },
});

// 3. BUAT 'io' AGAR BISA DIAKSES DARI CONTROLLER (BARU)
// Ini akan 'menyuntikkan' 'io' ke setiap request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. LOGIKA KONEKSI SOCKET.IO (BARU)
io.on("connection", (socket) => {
  console.log(`🔌 User terhubung: ${socket.id}`);

  // Bergabung ke 'room' pribadi berdasarkan userId
  socket.on("join_room", (userId) => {
    socket.join(userId.toString());
    console.log(`User ${socket.id} bergabung ke room ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 User terputus: ${socket.id}`);
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/statuses", statusRoutes);
app.use("/api/contacts", contactRoutes);

app.get("/", (req, res) => {
  res.send("Server Notifikasi berjalan!");
});

server.listen(port, () => {
  console.log(`🚀 Server Express berjalan di http://localhost:${port}`);
});
