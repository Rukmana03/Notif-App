import React from 'react';
import { useAuth } from '../context/AuthContext'; // Impor hook useAuth

function Header() {
    // 1. Ambil user dan fungsi logout dari context
    const { user, logout } = useAuth();

    // Fungsi ini akan dipanggil saat tombol logout diklik
    const handleLogout = async () => {
        try {
            logout();
        } catch (error) {
            console.error('Gagal logout:', error);
        }
    };

    // Pengaman: Jika karena suatu alasan komponen ini render tanpa user, jangan tampilkan apa-apa
    if (!user) {
        return null;
    }

    return (
        <header className="bg-white shadow-md">
            <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                {/* Bagian Kiri: Judul Aplikasi */}
                <h1 className="text-xl font-bold text-slate-700">
                    Timeline Status
                </h1>

                {/* Bagian Kanan: Info User & Tombol Logout */}
                <div className="flex items-center">
                    <span className="text-slate-600 mr-4">
                        Selamat datang, <span className="font-semibold">{user.name}</span>
                    </span>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;