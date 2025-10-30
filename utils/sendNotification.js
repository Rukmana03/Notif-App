import admin from "firebase-admin";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
    const userTokens = await prisma.fCMToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (userTokens.length === 0) {
      console.log(`Tidak ada FCM token ditemukan untuk user ${userId}`);
      return;
    }

    const tokens = userTokens.map((t) => t.token);

    const message = {
      notification: { title, body },
      data,
      tokens,
    };

    // ✅ Gunakan API klasik (ini pasti ada di semua versi modern)
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log("Notifikasi berhasil dikirim:", response.successCount);

    if (response.failureCount > 0) {
      const tokensToDelete = [];

      response.responses.forEach((result, index) => {
        if (!result.success) {
          const error = result.error.code;
          if (
            error === "messaging/registration-token-not-registered" ||
            error === "messaging/invalid-registration-token"
          ) {
            tokensToDelete.push(tokens[index]);
          } else {
            console.error(`Error saat mengirim ke token ${tokens[index]}:`, error);
          }
        }
      });

      if (tokensToDelete.length > 0) {
        await prisma.fCMToken.deleteMany({
          where: { token: { in: tokensToDelete } },
        });
        console.log("Token tidak valid berhasil dihapus.");
      }
    }
  } catch (error) {
    console.error("Error besar mengirim push notification:", error);
  }
};
