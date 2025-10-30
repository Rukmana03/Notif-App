import React, { useState } from "react";
// HAPUS apiClient dari sini, kita pakai useAuth
import { useAuth } from "../context/AuthContext";

function LoginPage() {
    const { login } = useAuth(); // Ambil fungsi login dari Context
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");

        try {
            // Panggil fungsi login dari AuthContext
            await login(email, password);
            // AuthContext akan menangani sisanya (simpan token, user, panggil FCM)
            
        } catch (err) {
            console.error("Login gagal:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 400)) {
                setError("Email atau password yang Anda masukkan salah.");
            } else {
                setError("Tidak dapat terhubung ke server.");
            }
        }
    };

    return (
        <div className="flex items-center justify-center h-screen w-full">
            <div className="p-8 bg-slate-100 rounded-lg shadow-md w-full max-w-sm">
                <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-700">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                        />
                    </div>
                    {error && (
                        <p className="text-red-500 text-sm mb-4">{error}</p>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
}

export default LoginPage;