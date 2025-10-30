import React, { createContext, useState, useContext, useEffect } from "react";
// Impor apiClient baru kita, BUKAN axios lama
import apiClient from "../api/axiosConfig.js";
// Impor fungsi firebase kita
import { getFCMToken, deleteFCMToken } from "../firebase.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "access_token"; // Pastikan kuncinya sama

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (token) {
      apiClient
        .get("/api/auth/me")
        .then((response) => {
          setUser(response.data.user);
          getFCMToken();
        })
        .catch((err) => {
          // Token tidak valid atau kadaluarsa
          console.error("AuthContext Effect: /me GAGAL", err.response || err); // <-- LOG 5
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
        })
        .finally(() => {
          setIsLoading(false); // Pastikan ini selalu dijalankan
        });
    } else {
      setIsLoading(false); // Tidak ada token, tidak perlu loading
    }
  }, []);

  const login = async (email, password) => {
    // 1. Panggil endpoint login Node.js Anda
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });

    // 2. Ambil data dari respon
    const { token, user } = response.data;

    // 3. Simpan token & user
    localStorage.setItem(TOKEN_KEY, token);
    setUser(user);

    // 4. Daftarkan FCM Token ke server (sekarang dengan login yang valid)
    getFCMToken();
  };

  const logout = () => {
    // Hapus FCM token dari database (opsional tapi bagus)
    // deleteFCMToken(); // Kita bisa implementasi ini nanti

    // Hapus dari frontend
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
  };

  const value = { user, login, logout, isLoading };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
