import React, { useState, useEffect } from 'react';

// Hook kustom untuk mengelola notifikasi
export const useToast = () => {
    const [toasts, setToasts] = useState([]);
    let toastId = 0;

    const showToast = (message, type = 'success') => {
        const id = toastId++;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 5000); // Hilang setelah 5 detik
    };

    return { toasts, showToast };
};


// Komponen untuk menampilkan container toast
export const ToastContainer = ({ toasts }) => {
    const getBgColor = (type) => {
        switch (type) {
            case 'error': return 'bg-red-500';
            case 'success': return 'bg-green-500';
            default: return 'bg-gray-800';
        }
    };

    return (
        <div id="notification-container" className="fixed bottom-5 right-5 z-50 space-y-2 ">
            {toasts.map(toast => (
                <div
                    key={toast.id}
                    className={`toast-animation text-white p-4 rounded-lg shadow-lg ${getBgColor(toast.type)}`}
                >
                    {toast.message}
                </div>
            ))}
        </div>
    );
};