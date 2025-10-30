import { db } from "../config/firebaseAdmin.js";
import { PrismaClient } from "@prisma/client";
import { sendPushNotification } from "../utils/sendNotification.js";

const prisma = new PrismaClient();

const getStatuses = async (req, res) => {
  const userId = req.user.userId;
  try {
    const myContacts = await prisma.contact.findMany({
      where: {
        userId: userId,
      },
      select: {
        contactUserId: true,
      },
    });

    const myContactIds = myContacts.map((contact) => contact.contactUserId);

    // === Langkah 2: Query utama dengan logika OR ===
    const statuses = await prisma.status.findMany({
      where: {
        // Tampilkan status jika SALAH SATU dari kondisi ini benar
        OR: [
          // 1. Status milik saya sendiri (semua visibility)
          {
            ownerId: userId,
          },

          // 2. Status 'public' (dari siapa saja)
          {
            visibility: "public",
          },

          // 3. Status 'contacts' DARI orang-orang di daftar kontak saya
          {
            visibility: "contacts",
            ownerId: {
              in: myContactIds, // 'ownerId' statusnya harus ada di array ID kontak saya
            },
          },

          // 4. Status 'specific_users' yang mencantumkan saya
          {
            visibility: "specific_users",
            specificViewers: {
              some: {
                id: userId, // Di mana 'saya' ada di relasi 'specificViewers'
              },
            },
          },
        ],
      },
      include: {
        owner: {
          // Sertakan info pemilik status
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            views: true,
            likes: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc", // Tampilkan yang terbaru di atas
      },
    });

    res.status(200).json(statuses);
  } catch (error) {
    console.error("Error fetching all statuses:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil feed status", error: error.message });
  }
};

const createStatus = async (req, res) => {
  const { content_url, visibility, user_ids } = req.body;
  const ownerId = req.user.userId;

  const io = req.io;

  if (!content_url || !visibility) {
    return res
      .status(400)
      .json({ message: "Konten dan visibilitas wajib diisi" });
  }
  const allowedVisibilities = ["public", "contacts", "specific_users"];
  if (!allowedVisibilities.includes(visibility)) {
    return res.status(400).json({ message: "Nilai visibility tidak valid" });
  }
  if (visibility === "specific_users" && (!user_ids || user_ids.length === 0)) {
    return res.status(400).json({
      message: "Pilih setidaknya satu user untuk visibility specific_users",
    });
  }

  try {
    // 1. Buat status dan hubungkan relasi specificViewers jika perlu
    const newStatus = await prisma.status.create({
      data: {
        content_url: content_url,
        visibility: visibility,
        ownerId: ownerId,
        specificViewers:
          visibility === "specific_users"
            ? {
                connect: user_ids.map((id) => ({ id: parseInt(id, 10) })),
              }
            : undefined,
      },
      include: {
        owner: { select: { name: true, id: true, email: true } },
      },
    });

    let recipientUserIds = [];
    const ownerName = newStatus.owner.name || newStatus.owner.email;

    if (visibility === "specific_users") {
      recipientUserIds = user_ids
        .map((id) => parseInt(id, 10))
        .filter((id) => id !== ownerId);
    } else if (visibility === "contacts") {
      const userContacts = await prisma.contact.findMany({
        where: { userId: ownerId }, // Ambil kontak milik 'ownerId'
        select: { contactUserId: true }, // Ambil ID teman-temannya
      });
      recipientUserIds = userContacts.map((c) => c.contactUserId);
    }

    // Jika ada penerima notifikasi
    if (recipientUserIds.length > 0) {
      try {
        // Ambil FCM token milik para penerima
        const tokensSnapshot = await prisma.fCMToken.findMany({
          where: {
            userId: { in: recipientUserIds }, // Cari token milik user ID dalam array
          },
          select: { token: true }, // Hanya butuh tokennya
        });
        const recipientTokens = tokensSnapshot.map((t) => t.token);

        if (recipientTokens.length > 0) {
          // Siapkan payload notifikasi
          const payload = {
            notification: {
              title: `Status baru dari ${ownerName}`,
              body:
                content_url.substring(0, 100) +
                (content_url.length > 100 ? "..." : ""), // Cuplikan konten
            },
            // Anda bisa menambahkan data custom di sini jika perlu
            // data: {
            //     statusId: newStatus.id.toString(), // Kirim ID status
            //     type: 'NEW_STATUS'
            // }
          };

          // Kirim notifikasi ke semua token penerima
          console.log(
            `Mengirim notifikasi status baru ke ${recipientTokens.length} device`
          );
          const response = await admin.messaging().sendMulticast({
            tokens: recipientTokens,
            notification: payload.notification,
            // data: payload.data
          });

          // (Opsional) Log hasil pengiriman
          if (response.failureCount > 0) {
            console.warn(
              `Gagal mengirim notifikasi ke ${response.failureCount} device.`
            );
            // Anda bisa menambahkan logging lebih detail di sini jika perlu
          }
        } else {
          console.log("Tidak ada FCM token ditemukan untuk penerima status.");
        }
      } catch (notifError) {
        console.error("Gagal mengirim notifikasi status baru:", notifError);
      }
    }

    const statusToEmit = {
      ...newStatus, // Ambil semua data dari status yang baru dibuat
      _count: { likes: 0, views: 0 }, // Status baru PASTI punya 0 like/view
    };

    if (visibility === "public") {
      // 3a. Jika publik, umumkan ke SEMUA user yang terhubung
      io.emit("new_status", statusToEmit);
      console.log("Socket.io: Mengumumkan status publik baru");
    } else if (recipientUserIds.length > 0) {
      // 3b. Jika 'contacts' atau 'specific_users', kirim HANYA ke room mereka
      recipientUserIds.forEach((id) => {
        io.to(id.toString()).emit("new_status", statusToEmit);
      });
      console.log(
        `Socket.io: Mengirim status baru ke ${recipientUserIds.length} user`
      );
    }

    res.status(201).json(statusToEmit);
  } catch (error) {
    // Tangani jika user ID di user_ids tidak valid/tidak ditemukan
    if (error.code === "P2025" || error.message.includes("related record(s)")) {
      return res
        .status(400)
        .json({ message: "Satu atau lebih user ID yang dipilih tidak valid." });
    }
    console.error("Error creating status:", error);
    res.status(500).json({
      message: "Gagal membuat status di server",
      error: error.message,
    });
  }
};

const likeStatus = async (req, res) => {
  const userId = req.user.userId;
  const statusId = parseInt(req.params.statusId, 10);

  const io = req.io;

  if (isNaN(statusId)) {
    return res.status(400).json({ message: "Status ID tidak valid" });
  }

  try {
    // 1. Cek statusnya ada
    const status = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      return res.status(404).json({ message: "Status tidak ditemukan" });
    }

    // 2. Cek apakah sudah di-like
    const existingLike = await prisma.statusLike.findFirst({
      where: {
        userId: userId,
        statusId: statusId,
      },
    });

    let newLikeCount = 0;

    if (existingLike) {
      // 3a. Jika sudah, UNLIKE (hapus like)
      await prisma.statusLike.delete({
        where: { id: existingLike.id },
      });
      newLikeCount = await prisma.statusLike.count({
        where: { statusId: statusId },
      });

      res.status(200).json({ message: "Status unliked" });
    } else {
      // 3b. Jika belum, LIKE (buat like)
      await prisma.statusLike.create({
        data: {
          userId: userId,
          statusId: statusId,
        },
      });

      newLikeCount = await prisma.statusLike.count({
        where: { statusId: statusId },
      });

      // 4. Buat notifikasi untuk pemilik status (JANGAN notif diri sendiri)
      if (status.ownerId !== userId) {
        const newNotification = await prisma.notification.create({
          data: {
            type: "LIKE",
            userId: status.ownerId, // Penerima notif = Pemilik Status
            actorId: userId, // Aktor = User yang me-like
            statusId: statusId,
          },
        });

        const actor = await prisma.user.findUnique({
          where: { id: userId },
          select: { name: true },
        });

        sendPushNotification(
          status.ownerId, // Kirim ke pemilik status
          "Status Anda Disukai", // Judul
          `${actor.name} menyukai status Anda.`, // Isi pesan
          { statusId: statusId.toString() } // Data (opsional)
        );

        const notificationWithDetails = await prisma.notification.findUnique({
          where: { id: newNotification.id },
          include: {
            actor: { select: { id: true, name: true } },
          },
        });

        // Format agar cocok dengan state 'notifications' di frontend
        const formattedNotif = {
          ...notificationWithDetails,
          data: {
            liker_name: notificationWithDetails.actor.name,
            message: `${notificationWithDetails.actor.name} menyukai status Anda.`,
          },
        };

        io.to(newNotification.userId.toString()).emit(
          "new_notification",
          formattedNotif
        );
        console.log(
          `Socket.io: Mengirim notifikasi LIKE ke room ${newNotification.userId}`
        );
      }

      res.status(201).json({ message: "Status liked" });
    }
    io.emit("status_like_updated", {
      statusId: statusId,
      newCount: newLikeCount,
    });
    console.log(
      `Socket.io: Mengumumkan like count baru untuk status ${statusId}: ${newLikeCount}`
    );
  } catch (error) {
    console.error("Error liking status:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses like", error: error.message });
  }
};

const getStatusViewers = async (req, res) => {
  const userId = req.user.userId;
  const statusId = parseInt(req.params.statusId, 10);

  if (isNaN(statusId)) {
    return res.status(400).json({ message: "Status ID tidak valid" });
  }

  try {
    // 1. Cek status & kepemilikan
    const status = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      return res.status(404).json({ message: "Status tidak ditemukan" });
    }

    // (Opsional: Batasi agar hanya pemilik yg bisa lihat viewers)
    if (status.ownerId !== userId) {
      return res
        .status(403)
        .json({ message: "Anda tidak berhak melihat data ini" });
    }

    // 2. Ambil data viewers
    const views = await prisma.statusView.findMany({
      where: {
        statusId: statusId,
      },
      include: {
        user: {
          // Ambil data user yang melihat
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Format ulang agar hanya array user
    const viewers = views.map((view) => view.user);

    res.status(200).json(viewers);
  } catch (error) {
    console.error("Error fetching status viewers:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data viewers", error: error.message });
  }
};

const recordStatusView = async (req, res) => {
  const userId = req.user.userId;
  const statusId = parseInt(req.params.statusId, 10);

  const io = req.io;
  if (isNaN(statusId)) {
    return res.status(400).json({ message: "Status ID tidak valid" });
  }

  try {
    // 1. Cek statusnya dulu
    const status = await prisma.status.findUnique({
      where: { id: statusId },
      select: { ownerId: true }, // Kita hanya perlu ownerId
    });

    if (!status) {
      return res.status(404).json({ message: "Status tidak ditemukan" });
    }

    // 2. Jangan catat view jika itu pemilik status sendiri
    if (status.ownerId === userId) {
      return res
        .status(200)
        .json({ message: "Pemilik tidak dihitung sebagai viewer" });
    }

    // 3. Cek apakah user ini sudah pernah view (mencegah duplikat)
    const existingView = await prisma.statusView.findFirst({
      where: {
        statusId: statusId,
        userId: userId,
      },
    });

    // 4. Jika sudah pernah, tidak perlu lakukan apa-apa
    if (existingView) {
      return res.status(200).json({ message: "Sudah pernah dilihat" });
    }

    // === Jika semua lolos, ini adalah view baru ===

    // 5. Buat record StatusView
    await prisma.statusView.create({
      data: {
        statusId: statusId,
        userId: userId,
      },
    });

    // 6. Buat notifikasi "VIEW" untuk pemilik status
    const newNotification = await prisma.notification.create({
      data: {
        type: "VIEW",
        userId: status.ownerId, // Penerima = Pemilik Status
        actorId: userId, // Aktor = User yang melihat
        statusId: statusId,
      },
    });

    const actor = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    sendPushNotification(
      status.ownerId, // Kirim ke pemilik status
      "Status Anda Dilihat", // Judul
      `${actor.name} telah melihat status Anda.`, // Isi pesan
      { statusId: statusId.toString() } // Data (opsional)
    );

    const notificationWithDetails = await prisma.notification.findUnique({
      where: { id: newNotification.id },
      include: {
        actor: { select: { id: true, name: true } },
      },
    });

    // Format agar cocok dengan state 'notifications' di frontend
    const formattedNotif = {
      ...notificationWithDetails,
      data: {
        liker_name: notificationWithDetails.actor.name,
        message: `${notificationWithDetails.actor.name} telah melihat status Anda.`,
      },
    };

    // Kirim HANYA ke room pribadi pemilik status
    io.to(newNotification.userId.toString()).emit(
      "new_notification",
      formattedNotif
    );

    console.log(
      `Socket.io: Mengirim notifikasi VIEW ke room ${newNotification.userId}`
    );

    const countResult = await prisma.statusView.count({
      where: { statusId: statusId },
    });

    // 8. Umumkan ke SEMUA client yang terhubung
    io.emit("status_view_updated", {
      statusId: statusId,
      newCount: countResult,
    });

    console.log(
      `Socket.io: Mengumumkan view count baru untuk status ${statusId}: ${countResult}`
    );

    res.status(201).json({ message: "Status view dicatat" });
  } catch (error) {
    console.error("Error recording status view:", error);
    res
      .status(500)
      .json({ message: "Gagal mencatat view", error: error.message });
  }
};

const deleteStatus = async (req, res) => {
  const userId = req.user.userId;
  const statusId = parseInt(req.params.statusId, 10);

  const io = req.io;

  if (isNaN(statusId)) {
    return res.status(400).json({ message: "Status ID tidak valid" });
  }

  try {
    // 1. Verifikasi kepemilikan
    const status = await prisma.status.findUnique({
      where: { id: statusId },
    });

    if (!status) {
      return res.status(404).json({ message: "Status tidak ditemukan" });
    }

    // 2. Pastikan hanya pemilik yang bisa menghapus
    if (status.ownerId !== userId) {
      return res
        .status(403) // 403 Forbidden
        .json({ message: "Anda tidak punya izin untuk menghapus status ini" });
    }

    // 3. Hapus status
    await prisma.status.delete({
      where: { id: statusId },
    });

    io.emit("status_deleted", { id: statusId });
    console.log(`Socket.io: Mengumumkan status ${statusId} telah dihapus`);

    res.status(200).json({ message: "Status berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting status:", error);
    res
      .status(500)
      .json({ message: "Gagal menghapus status", error: error.message });
  }
};

export {
  getStatusViewers,
  likeStatus,
  getStatuses,
  createStatus,
  recordStatusView,
  deleteStatus,
};
