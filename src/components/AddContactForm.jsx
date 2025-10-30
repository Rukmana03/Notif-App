import React, { useState } from 'react';
import apiClient from '../api/axiosConfig';

const AddContactForm = ({ potentialContacts, onContactAdded, showToast }) => {
    const [selectedContact, setSelectedContact] = useState(potentialContacts[0]?.id || '');
    const [message, setMessage] = useState({ text: '', type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedContact) {
            showToast('Pilih pengguna untuk ditambahkan.', 'error');
            return;
        }

        try {
            const response = await apiClient.post('/api/contacts', { contact_id: selectedContact });
            setMessage({ text: response.data.message, type: 'success' });
            showToast(response.data.message, 'success');
            onContactAdded(); // Panggil fungsi refresh dari parent
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Gagal menambahkan kontak.';
            setMessage({ text: errorMessage, type: 'error' });
            showToast(errorMessage, 'error');
        }
    };

    return (
        <div className="bg-white text-black overflow-hidden shadow-sm sm:rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Tambah Kontak Baru</h3>
            <form onSubmit={handleSubmit}>
                <div className='flex flex-col gap-2'>
                    <label htmlFor="contact_id">Pilih Pengguna:</label>
                    <select
                        name="contact_id"
                        id="contact_id"
                        value={selectedContact}
                        onChange={(e) => setSelectedContact(e.target.value)}
                        className="w-full mt-1 border-gray-300 rounded-md shadow-sm bg-slate-100"
                    >
                        {potentialContacts.length > 0 ? (
                            potentialContacts.map(contact => (
                                <option key={contact.id} value={contact.id}>{contact.name}</option>
                            ))
                        ) : (
                            <option disabled>Tidak ada pengguna lain.</option>
                        )}
                    </select>
                </div>
                <button type="submit" className="mt-4 bg-green-500 text-white px-4 py-2 rounded-md">
                    Tambah Kontak
                </button>
            </form>
            {message.text && (
                 <div className={`mt-4 text-sm ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    {message.text}
                </div>
            )}
        </div>
    );
};

export default AddContactForm;