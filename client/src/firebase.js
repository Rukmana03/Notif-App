import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { deleteToken } from "firebase/messaging";
import apiClient from "./api/axiosConfig";

const API_URL = "http://localhost:3000";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const getFCMToken = async () => {
    console.log("Meminta izin notifikasi...");
    try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            console.log("Izin notifikasi diberikan.");
            const vapidKey = "BGPnc0i-Yxm-Y6IHCYxwSUN15ZUf8hAh_3nCRbEkMaVQf0JMzzwzIs27CtB9uVCM-WkmJ-IpopppWnw40jMVEcM"; 
            const currentToken = await getToken(messaging, { vapidKey: vapidKey });
            
            if (currentToken) {
                console.log("✅ Token FCM (Device Token):", currentToken);
                
                // KIRIM TOKEN KE SERVER NODE.JS (ENDPOINT BARU)
                try {
                    // Panggil endpoint baru kita. 
                    // apiClient akan otomatis melampirkan JWT token di header
                    await apiClient.post(`/api/notifications/register-token`, {
                        token: currentToken,
                    });
                    console.log("Token FCM berhasil dikirim ke server Node.js");
                } catch (err) {
                    console.error("Gagal mengirim token FCM ke server", err);
                }
            } else {
                console.warn("Gagal mendapatkan token FCM.");
            }
        } else {
            console.warn("Izin notifikasi ditolak oleh pengguna.");
        }
    } catch (err) {
        console.error("❌ Error saat mengambil token FCM:", err);
    }
};

export const listenForForegroundMessages = (callback) => {
    return onMessage(messaging, (payload) => {
        console.log("Notifikasi diterima (foreground): ", payload);
        if (callback) {
            callback(payload);
        }
    });
};

export const deleteFCMToken = async () => {
  try {
    // Panggil fungsi deleteToken dari Firebase SDK
    await deleteToken(messaging); 
    console.log("Token FCM berhasil dihapus dari Firebase.");

  } catch (err) {
    console.error("Gagal menghapus token FCM:", err);
  }
};
