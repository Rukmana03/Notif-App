import axios from 'axios';

// 1. Tentukan URL backend Node.js Anda
const API_URL = 'http://localhost:3000';
const TOKEN_KEY = "access_token"; // Kunci untuk simpan token di localStorage

const apiClient = axios.create({
    baseURL: API_URL,
    // Kita tidak perlu withCredentials lagi, JWT bekerja dengan Header
});

// 2. Ini adalah "Interceptor" (Pencegat)
// Kode ini akan berjalan SEBELUM setiap request dikirim
apiClient.interceptors.request.use(
    (config) => {
        // Ambil token dari localStorage
        const token = localStorage.getItem(TOKEN_KEY);
        
        // Jika token ada, tambahkan ke header 'Authorization'
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default apiClient;