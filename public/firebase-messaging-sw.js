// public/firebase-messaging-sw.js

// Import skrip Firebase (gunakan versi compat untuk service worker)
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js");

// ----------------------------------------------------------------
// TODO: GANTI DENGAN KONFIGURASI FIREBASE ANDA (SAMA SEPERTI DI ATAS)
// ----------------------------------------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyB2LeELgZVBhdaxzLdl22joqGmXws0OaEQ",
  authDomain: "tes-notif-firebase.firebaseapp.com",
  projectId: "tes-notif-firebase",
  storageBucket: "tes-notif-firebase.firebasestorage.app",
  messagingSenderId: "1053878873649",
  appId: "1:1053878873649:web:15f26903f4a2604a2def10"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Mendapatkan instance messaging
const messaging = firebase.messaging();

// Menangani notifikasi saat aplikasi di background
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Menerima notifikasi background:", payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/react.svg", // Ambil ikon dari folder public
  };

  // Menampilkan notifikasi ke pengguna
  self.registration.showNotification(notificationTitle, notificationOptions);
});