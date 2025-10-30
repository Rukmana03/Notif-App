import React, { useState, useEffect } from "react";
import apiClient from "../api/axiosConfig.js";
import { useToast } from "./ToastNotification.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import AddContactForm from "./AddContactForm.jsx";
import { useSocket } from "../context/SocketContext.jsx";
import { listenForForegroundMessages } from "../firebase.js";

const CreateStatusForm = ({ contacts, onStatusCreated }) => {
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- PERBAIKAN KECIL: Gunakan JSON jika tidak upload file ---
    // Jika Anda hanya mengirim teks, lebih mudah pakai JSON
    const payload = {
      content_url: content,
      visibility: visibility,
      user_ids: selectedUsers, // Kirim sebagai array biasa
    };

    try {
      // Gunakan apiClient yang sudah kita setup
      const response = await apiClient.post("/api/statuses", payload);
      console.log("Status berhasil dibuat:", response.data);
      onStatusCreated();
      setContent("");
      setVisibility("public");
      setSelectedUsers([]);
    } catch (error) {
      console.error("Error saat membuat status:", error);
      // TODO: Tampilkan pesan error ke user?
    }
  };

  return (
    <div className="bg-white text-black overflow-hidden shadow-sm sm:rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Buat Status Baru</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label htmlFor="content_url">Konten:</label>
        <textarea
          id="content_url"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="3"
          className="w-full border-gray-300 rounded-md shadow-sm bg-slate-100"
          required
        />
        <div>
          <label>Privasi:</label>
          <div className="space-y-2 mt-1">
            {["public", "contacts", "specific_users"].map((option) => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="visibility"
                  value={option}
                  checked={visibility === option}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="mr-2"
                />
                {option === "public"
                  ? "Publik"
                  : option === "contacts"
                  ? "Hanya Kontak"
                  : "Beberapa Kontak"}
              </label>
            ))}
          </div>
        </div>
        {visibility === "specific_users" && (
          <div>
            <label htmlFor="user_ids">Bagikan Hanya Dengan:</label>
            <select
              name="user_ids" // Tidak perlu [] di name
              id="user_ids"
              multiple
              value={selectedUsers}
              onChange={(e) =>
                setSelectedUsers(
                  Array.from(
                    e.target.selectedOptions,
                    (option) => option.value // Pastikan value adalah ID
                  )
                )
              }
              className="w-full border-gray-300 rounded-md shadow-sm h-32"
            >
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
            <small className="text-gray-500">
              Tahan Ctrl/Cmd untuk memilih.
            </small>
          </div>
        )}
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md"
        >
          Unggah Status
        </button>
      </form>
    </div>
  );
};

const ContactList = ({ contacts, setContacts }) => {
  const handleDeleteContact = async (contactId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kontak ini?"))
      return;
    try {
      await apiClient.delete(`/api/contacts/${contactId}`); // Endpoint perlu dibuat di server
      setContacts((prev) => prev.filter((c) => c.id !== contactId));
    } catch (error) {
      console.error("Gagal menghapus kontak:", error);
    }
  };

  return (
    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
      <h3 className="text-lg font-bold mb-4">Daftar Kontak</h3>
      <div className="space-y-3">
        {contacts.length > 0 ? (
          contacts.map((contact) => (
            <div key={contact.id} className="flex justify-between items-center">
              <span>{contact.name}</span>
              <button
                onClick={() => handleDeleteContact(contact.id)}
                className="text-red-500 hover:text-red-700 text-xs font-semibold"
              >
                Hapus
              </button>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">Anda belum memiliki kontak.</p>
        )}
      </div>
    </div>
  );
};

const TimelineFeed = ({ statuses, user, onStatusDeleted, showToast }) => {
  useEffect(() => {
    // Hanya jalankan jika user sudah ada
    if (!user) return;

    // Iterasi melalui status yang ditampilkan saat ini
    statuses.forEach((status) => {
      // Jangan catat view jika kita pemiliknya
      if (user.id === status.ownerId) {
        return; // Lanjut ke status berikutnya
      }

      // Panggil API untuk mencatat view (tanpa await)
      apiClient
        .post(`/api/statuses/${status.id}/view`)
        .then(() => {
          // console.log(`View dicatat untuk status ${status.id}`);
        })
        .catch((err) => {
          // Abaikan error jika view sudah dicatat (409 atau P2002)
          if (
            err.response?.status !== 409 &&
            err.response?.data?.code !== "P2002"
          ) {
            console.error(
              `Gagal mencatat view untuk status ${status.id}:`,
              err.response?.data?.message || err.message
            );
          }
        });
    });
  }, [statuses, user]);

  const handleDeleteStatus = async (statusId) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus status ini?")) {
      return;
    }
    try {
      await apiClient.delete(`/api/statuses/${statusId}`);
      // Panggil fungsi dari parent (TimelinePage) untuk update UI
      onStatusDeleted(statusId);
      showToast("Status berhasil dihapus", "success");
    } catch (error) {
      console.error("Gagal menghapus status:", error);
      showToast(
        error.response?.data?.message || "Gagal menghapus status",
        "error"
      );
    }
  };

  const handleLike = async (statusId) => {
    try {
      await apiClient.post(`/api/statuses/${statusId}/like`); // Endpoint perlu dibuat di server
      alert(`Anda menyukai status ${statusId}!`);
      // TODO: Update state 'statuses' agar like terlihat real-time?
    } catch (error) {
      console.error("Gagal menyukai status:", error);
    }
  };

  const handleShowViewers = async (statusId) => {
    try {
      const response = await apiClient.get(
        `/api/statuses/${statusId}/viewers` // Endpoint perlu dibuat di server
      );
      const viewers = response.data; // Server harus mengembalikan array user
      if (viewers.length === 0) {
        alert("Belum ada yang melihat status ini.");
        return;
      }
      const viewerNames = viewers.map((user) => user.name).join("\n");
      alert("Dilihat oleh:\n" + viewerNames);
    } catch (error) {
      console.error("Gagal mengambil data viewers:", error);
    }
  };

  return (
    <div className="md:col-span-2 space-y-4">
      {statuses.length > 0 ? (
        statuses.map((status) => {
          const isOwner = user && user.id === status.ownerId;
          return (
            <div
              key={status.id}
              className={`
              overflow-hidden shadow-sm sm:rounded-lg p-6
              transition-all duration-300
              ${
                isOwner
                  ? "bg-blue-50 border border-blue-200" // Latar biru untuk status Anda
                  : "bg-white" // Latar putih untuk status orang lain
              }
            `}
            >
              <div className="flex justify-between items-center">
                <p className="font-semibold text-lg text-black">
                  {status.owner?.name || "Unknown User"}

                  {/* --- TAMBAHAN BADGE "MILIK ANDA" --- */}
                  {isOwner && (
                    <span className="ml-2 text-xs font-medium text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                      Milik Anda
                    </span>
                  )}
                </p>
                <small className="text-gray-500">
                  {new Date(status.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  })}
                </small>
              </div>

              <p className="text-gray-700 mt-2">{status.content_url}</p>

              <div className="flex items-center justify-between space-x-4 mt-4 text-gray-500">
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleLike(status.id)}
                    className="hover:text-pink-500 flex items-center"
                  >
                    ❤️
                    <span className="ml-1">{status._count.likes}</span>
                    <span className="ml-1">Suka</span>
                  </button>
                  <button
                    onClick={() => handleShowViewers(status.id)}
                    className="hover:text-blue-500 flex items-center"
                  >
                    👁️
                    <span className="ml-1">{status._count.views}</span>
                    <span className="ml-1">Dilihat</span>
                  </button>
                </div>

                {/* --- TOMBOL HAPUS (HANYA MUNCUL JIKA ANDA PEMILIK) --- */}
                {isOwner && (
                  <button
                    onClick={() => handleDeleteStatus(status.id)}
                    className="text-red-500 hover:text-red-700 text-sm font-semibold"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          );
        }) // <-- GANTI DI SINI
      ) : (
        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
          <p className="text-black">Belum ada status untuk ditampilkan.</p>
        </div>
      )}
    </div>
  );
};

function TimelinePage() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const socket = useSocket();

  // States Anda (sudah benar)
  const [statuses, setStatuses] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [potentialContacts, setPotentialContacts] = useState([]);
  const [notifications, setNotifications] = useState({
    unread: [],
    read: [],
  });
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fungsi fetchData (sudah benar, tapi endpoint perlu dibuat di server)
  const fetchData = async () => {
    if (!user) {
      setIsLoading(false);
      setError("Silakan login untuk melihat timeline.");
      return;
    }
    setIsLoading(true);
    setError(null);

    // Reset state sebelum fetch
    setStatuses([]);
    setContacts([]);
    setPotentialContacts([]);
    setNotifications({ unread: [], read: [] });

    let fetchError = null;

    try {
      // 1. Ambil Statuses
      try {
        const statusesRes = await apiClient.get("/api/statuses");
        setStatuses(statusesRes.data);
      } catch (err) {
        console.error(
          "Gagal mengambil status:",
          err.response?.status,
          err.message
        );
        if (err.response?.status !== 404) fetchError = err; // Catat error selain 404
      }

      // 2. Ambil Contacts (jika endpoint ada)
      try {
        const contactsRes = await apiClient.get("/api/contacts");
        setContacts(contactsRes.data);
      } catch (err) {
        console.error(
          "Gagal mengambil kontak:",
          err.response?.status,
          err.message
        );
        if (err.response?.status !== 404) fetchError = err;
      }

      // 3. Ambil Potential Contacts (jika endpoint ada)
      try {
        const potentialContactsRes = await apiClient.get(
          "/api/contacts/potential"
        );
        setPotentialContacts(potentialContactsRes.data);
      } catch (err) {
        console.error(
          "Gagal mengambil potential contacts:",
          err.response?.status,
          err.message
        );
        if (err.response?.status !== 404) fetchError = err;
      }

      // 4. Ambil Notifications (jika endpoint ada)
      try {
        const notifsRes = await apiClient.get("/api/notifications");
        // Pastikan server mengembalikan {unread: [], read: []}
        setNotifications(notifsRes.data || { unread: [], read: [] });
      } catch (err) {
        console.error(
          "Gagal mengambil notifikasi:",
          err.response?.status,
          err.message
        );
        if (err.response?.status !== 404) fetchError = err;
      }

      // Jika ada error BUKAN 404 selama proses, tampilkan pesan error umum
      if (fetchError) {
        setError("Terjadi kesalahan saat memuat sebagian data. Coba refresh.");
      }
    } catch (generalError) {
      // Tangani error tak terduga lainnya
      console.error("Error umum saat fetchData:", generalError);
      setError("Gagal memuat data. Coba refresh halaman.");
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect untuk fetchData (sudah benar)
  useEffect(() => {
    fetchData();
  }, [user]); // Akan fetch ulang jika user berubah (login/logout)

  const handleStatusDeleted = (deletedStatusId) => {
    // Update state 'statuses' dengan menghapus status yang dihapus
    setStatuses((prevStatuses) =>
      prevStatuses.filter((status) => status.id !== deletedStatusId)
    );
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = listenForForegroundMessages((payload) => {
      // HANYA TAMPILKAN TOAST (Socket.io yang akan update state)
      showToast(payload.notification.body || payload.notification.title);
    });
    return () => unsubscribe();
  }, [user, showToast]);

  useEffect(() => {
    // Hanya jalankan jika socket & user sudah siap
    if (socket && user) {
      // 1. Bergabung ke room pribadi (hanya perlu sekali)
      console.log(`Socket: Bergabung ke room ${user.id}`);
      socket.emit("join_room", user.id);

      // 2. Listener untuk status baru
      const handleNewStatus = (newStatus) => {
        console.log("Socket: Menerima status baru", newStatus);
        setStatuses((prev) => [newStatus, ...prev]);
      };
      socket.on("new_status", handleNewStatus);

      // 3. Listener untuk notifikasi baru (like/view)
      const handleNewNotification = (newNotification) => {
        console.log("Socket: Menerima notifikasi baru", newNotification);
        setNotifications((prev) => ({
          ...prev,
          unread: [newNotification, ...prev.unread],
        }));
        // Tampilkan toast hanya jika notifikasi bukan dari diri sendiri
        if (newNotification.actorId !== user.id) {
          showToast(newNotification.data.message, "success");
        }
      };
      socket.on("new_notification", handleNewNotification);

      // 4. Listener untuk status dihapus
      const handleStatusDeleted = (data) => {
        console.log("Socket: Menerima status_deleted", data);
        setStatuses((prevStatuses) =>
          prevStatuses.filter((status) => status.id !== data.id)
        );
      };
      socket.on("status_deleted", handleStatusDeleted);

      // 5. Listener untuk update jumlah view
      const handleStatusViewUpdated = (data) => {
        console.log("Socket: Menerima status_view_updated", data);
        setStatuses((prevStatuses) =>
          prevStatuses.map((status) => {
            if (status.id === data.statusId) {
              return {
                ...status,
                _count: {
                  ...status._count,
                  views: data.newCount,
                },
              };
            }
            return status;
          })
        );
      };
      socket.on("status_view_updated", handleStatusViewUpdated);

      const handleStatusLikeUpdated = (data) => {
        console.log("Socket: Menerima status_like_updated", data);
        setStatuses((prevStatuses) =>
          prevStatuses.map((status) => {
            if (status.id === data.statusId) {
              return {
                ...status,
                _count: {
                  ...status._count,
                  likes: data.newCount, // Perbarui 'likes'
                },
              };
            }
            return status;
          })
        );
      };
      socket.on("status_like_updated", handleStatusLikeUpdated);

      // 6. Cleanup SEMUA listener saat komponen unmount
      return () => {
        console.log(
          `Socket: Keluar dari room ${user.id} & membersihkan listener`
        );
        // Optional: Beri tahu server kita keluar room (jika perlu)
        // socket.emit('leave_room', user.id);
        socket.off("new_status", handleNewStatus);
        socket.off("new_notification", handleNewNotification);
        socket.off("status_deleted", handleStatusDeleted);
        socket.off("status_view_updated", handleStatusViewUpdated);
        socket.off("status_like_updated", handleStatusLikeUpdated);
      };
    }
  }, [socket, user, showToast]);

  const handleMarkNotifsAsRead = async () => {
    if (notifications.unread.length === 0) return;
    try {
      await apiClient.post("/api/notifications/read"); // Endpoint perlu dibuat
      setNotifications((prev) => ({
        read: [...prev.unread, ...prev.read], // Pindahkan unread ke read
        unread: [],
      }));
    } catch (error) {
      console.error("Gagal menandai notifikasi sebagai terbaca", error);
    }
  };

  return (
    <>
      <main>
        <div className="py-12">
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Kolom Kiri */}
            <div className="md:col-span-1 space-y-6">
              <CreateStatusForm
                contacts={contacts} // Pastikan server kirim kontak yang benar
                onStatusCreated={fetchData} // Refresh timeline setelah create
              />
              <AddContactForm
                potentialContacts={potentialContacts} // Pastikan server kirim user yg benar
                onContactAdded={fetchData} // Refresh kontak setelah add
                showToast={showToast}
              />
              <ContactList contacts={contacts} setContacts={setContacts} />
            </div>

            {/* Kolom Tengah */}
            {isLoading ? (
              <div className="md:col-span-2 text-center">
                Loading timeline...
              </div>
            ) : error ? (
              <div className="md:col-span-2 text-center text-red-500">
                {error}
              </div>
            ) : (
              <TimelineFeed
                statuses={statuses}
                user={user} // 1. Kirim data user yang login
                onStatusDeleted={handleStatusDeleted} // 2. Kirim fungsi delete handler
                showToast={showToast} // 3. Kirim showToast untuk notifikasi
              />
            )}

            {/* Kolom Kanan */}
            <div className="md:col-span-1">
              <div className="bg-white shadow-sm sm:rounded-lg p-6">
                <h3 className="text-lg font-bold mb-4">Notifikasi</h3>
                <div className="relative">
                  <button
                    id="notification-button"
                    onClick={() => {
                      setShowNotifDropdown(!showNotifDropdown);
                      if (
                        !showNotifDropdown &&
                        notifications.unread.length > 0
                      ) {
                        handleMarkNotifsAsRead();
                      }
                    }}
                    className="relative p-2 w-full flex justify-center rounded-full items-center text-gray-400 hover:text-gray-500 focus:outline-none bg-slate-100"
                  >
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    {notifications.unread.length > 0 && (
                      <span className="absolute top-2 right-2 block h-6 w-6 transform -translate-y-1/2 translate-x-1/2 rounded-full text-white bg-red-500 text-xs text-center">
                        {notifications.unread.length}
                      </span>
                    )}
                  </button>
                  {showNotifDropdown && (
                    <div className="origin-top-right absolute right-0 mt-2 w-full rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                        {notifications.unread.length === 0 &&
                        notifications.read.length === 0 ? (
                          <p className="text-sm text-gray-500 p-4 text-center">
                            Tidak ada notifikasi.
                          </p>
                        ) : (
                          <>
                            {notifications.unread.map((notif) => (
                              <a
                                key={notif.id}
                                href="#"
                                className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 font-bold"
                              >
                                <strong>{notif.data.liker_name}</strong>{" "}
                                {notif.data.message}
                              </a>
                            ))}
                            {notifications.read.map((notif) => (
                              <a
                                key={notif.id}
                                href="#"
                                className="block px-4 py-3 text-sm text-gray-500 hover:bg-gray-100" // Warna lebih pudar untuk yg sudah dibaca
                              >
                                <strong>{notif.data.liker_name}</strong>{" "}
                                {notif.data.message}
                              </a>
                            ))}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default TimelinePage;
