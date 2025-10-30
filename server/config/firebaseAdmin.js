// server/config/firebaseAdmin.js
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serviceAccountPath = path.join(__dirname, '../tes-notif-firebase-firebase-adminsdk-fbsvc-bf91d0bddd.json'); // <-- Pastikan nama file ini BENAR

let db; // Deklarasikan db di scope luar

if (admin.apps.length === 0) {
  try {
    const serviceAccountString = readFileSync(serviceAccountPath, 'utf8');
    const serviceAccount = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK berhasil diinisialisasi.");
    db = admin.firestore(); // Assign db setelah inisialisasi

  } catch (error) {
    console.error(`GAGAL inisialisasi Firebase Admin: Tidak bisa membaca/parse ${serviceAccountPath}`, error);
    process.exit(1);
  }
} else {
    console.log("Firebase Admin SDK sudah diinisialisasi sebelumnya. Menggunakan instance yang ada.");
    // Ambil instance app dan db yang sudah ada
    const existingApp = admin.app(); // Dapatkan app default yang sudah ada
    db = existingApp.firestore();  // Dapatkan firestore dari app yang sudah ada
}

// Ekspor instance Firestore dan admin (jika diperlukan)
// 'db' akan berisi instance firestore baik dari inisialisasi baru maupun yang sudah ada
export { db, admin }; // <-- Ekspor 'admin' juga jika perlu