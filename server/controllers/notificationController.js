import { PrismaClient } from "@prisma/client";
import admin from "firebase-admin"; // admin di-init di index.js

const prisma = new PrismaClient();

const registerToken = async (req, res) => {
  // req.user didapat dari authMiddleware
  const { userId } = req.user;
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "FCM Token wajib diisi" });
  }

  try {
    // Simpan token ke database, tautkan ke userId
    // 'upsert' akan membuat baru JIKA token belum ada,
    // atau update userId JIKA token sudah ada tapi di-assign ke user lain
    const fcmToken = await prisma.fCMToken.upsert({
      where: { token: token },
      update: { userId: userId },
      create: {
        token: token,
        userId: userId, // Tautkan ke user yang sedang login
      },
    });

    console.log(`Token ${token} didaftarkan untuk user ${userId}`);
    res.status(200).json({ message: "Token berhasil didaftar", fcmToken });
  } catch (error) {
    console.error("Error mendaftarkan token:", error);
    res.status(500).json({ message: "Gagal mendaftarkan token" });
  }
};

const sendTestNotification = async (req, res) => {
  const { title, body } = req.body;

  try {
    // 1. Ambil SEMUA token dari database Prisma
    const allTokens = await prisma.fCMToken.findMany({
      select: { token: true }, // Hanya ambil kolom token
    });

    if (allTokens.length === 0) {
      return res
        .status(400)
        .json({ message: "Tidak ada token yang terdaftar di database" });
    }

    // 2. Ubah array of objects [ {token: '...'} ] menjadi array of strings [ '...' ]
    const tokenStrings = allTokens.map((t) => t.token);

    // 3. Siapkan payload
    const payload = {
      notification: {
        title: title || "Tes Notifikasi Server",
        body: body || "Ini adalah notifikasi dari server Node.js!",
      },
    };

    // 4. Buat message untuk sendMulticast (ini perbaikan dari sendToDevice)
    const message = {
      ...payload,
      tokens: tokenStrings,
    };

    console.log("Mengirim notifikasi ke:", tokenStrings);

    // 5. Kirim notifikasi
    const response = await admin.messaging().sendMulticast(message);

    res.status(200).json({
      message: "Notifikasi tes berhasil dikirim",
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    console.error("Error mengirim notifikasi tes:", error);
    res
      .status(500)
      .json({ message: "Gagal mengirim notifikasi", error: error.message });
  }
};

const getNotifications = async (req, res) => {
  const userId = req.user.userId;

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
      },
      include: {
        actor: {
          select: { id: true, name: true },
        },
        status: {
          select: { id: true, content_url: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    });

    // 1. Format SEMUA notifikasi terlebih dahulu
    // (Buat 'data' object agar strukturnya konsisten)
    const formattedNotifications = notifications.map((notif) => {
      let message = "Melakukan aksi pada status Anda.";
      if (notif.type === "LIKE") {
        message = "menyukai status Anda.";
      } else if (notif.type === "VIEW") {
        message = "melihat status Anda.";
      }

      return {
        ...notif,
        data: {
          liker_name: notif.actor.name, // Kita tetap gunakan nama 'liker_name' agar FE konsisten
          message: `${notif.actor.name} ${message}`,
        },
      };
    });

    // 2. SEKARANG baru pisahkan ke 'read' dan 'unread'
    const classifiedNotifications = formattedNotifications.reduce(
      (acc, notif) => {
        if (notif.isRead) {
          acc.read.push(notif); // 'notif' sekarang sudah punya .data
        } else {
          acc.unread.push(notif); // 'notif' ini juga punya .data
        }
        return acc;
      },
      { unread: [], read: [] } // Objek yang diharapkan frontend
    );

    res.status(200).json(classifiedNotifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil notifikasi", error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  const userId = req.user.userId;

  try {
    // Update semua notifikasi milik user yg login
    // yang statusnya 'isRead: false' menjadi 'isRead: true'
    const updated = await prisma.notification.updateMany({
      where: {
        userId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    res.status(200).json({
      message: "Semua notifikasi ditandai telah dibaca",
      count: updated.count, // Jumlah notif yg di-update
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res
      .status(500)
      .json({ message: "Gagal memproses permintaan", error: error.message });
  }
};

export { registerToken, sendTestNotification, getNotifications, markAllAsRead };
