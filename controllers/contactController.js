// server/controllers/contactController.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const getContacts = async (req, res) => {
  const userId = req.user.userId; // ID user yang login

  try {
    // Cari semua record Contact di mana user yg login adalah 'userId'
    const contacts = await prisma.contact.findMany({
      where: {
        userId: userId,
      },
      // Sertakan data user yang MENJADI kontak
      include: {
        contact: {
          // Nama relasi dari model Contact ke User (contactUserId)
          select: {
            id: true,
            name: true,
            email: true, // Sertakan field yang Anda butuhkan di frontend
          },
        },
      },
      orderBy: {
        contact: {
          name: "asc", // Field di dalam relasi
        },
      },
    });

    // Ubah format agar sesuai dengan ekspektasi frontend (jika perlu)
    // Frontend tampaknya mengharapkan array user, bukan array Contact
    const contactUsers = contacts.map((contact) => ({
      id: contact.contact.id, // ID user kontak
      name: contact.contact.name, // Nama user kontak
      email: contact.contact.email, // Email user kontak
      contactRecordId: contact.id, // ID record Contact (untuk delete)
    }));

    res.status(200).json(contactUsers);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data kontak", error: error.message });
  }
};

const deleteContact = async (req, res) => {
  const userId = req.user.userId; // ID user yang login
  // Ambil ID USER yang ingin dihapus dari kontak, dari parameter URL
  const contactUserIdToDelete = parseInt(req.params.contactId, 10);

  if (isNaN(contactUserIdToDelete)) {
    return res.status(400).json({ message: "Contact ID tidak valid" });
  }

  try {
    // Cari dan hapus record Contact yang cocok
    const deletedContact = await prisma.contact.deleteMany({
      where: {
        userId: userId, // Milik user yg login
        contactUserId: contactUserIdToDelete, // Dan menunjuk ke user yg ingin dihapus
      },
    });

    // deleteMany tidak error jika tidak ada yg dihapus, tapi mengembalikan count
    if (deletedContact.count === 0) {
      return res
        .status(404)
        .json({ message: "Hubungan kontak tidak ditemukan" });
    }

    res.status(200).json({ message: "Kontak berhasil dihapus" });
  } catch (error) {
    console.error("Error deleting contact:", error);
    res
      .status(500)
      .json({ message: "Gagal menghapus kontak", error: error.message });
  }
};

const createContact = async (req, res) => {
  // 1. Ambil 'contact_id' dari body (BUKAN 'email')
  const { contact_id } = req.body;
  const contactUserId = parseInt(contact_id, 10); // Ubah jadi integer
  const userId = req.user.userId; // ID user yang login

  // 2. Validasi input
  if (!contactUserId || isNaN(contactUserId)) {
    return res.status(400).json({ message: "Contact ID tidak valid" });
  }

  try {
    // 3. Cek jika user-nya ada
    const userToAdd = await prisma.user.findUnique({
      where: { id: contactUserId },
      select: { name: true }, // Ambil namanya untuk pesan sukses
    });

    if (!userToAdd) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // 4. Cek jika user mencoba menambahkan dirinya sendiri
    if (contactUserId === userId) {
      return res
        .status(400)
        .json({ message: "Anda tidak dapat menambahkan diri sendiri" });
    }

    // 5. Cek jika kontak ini sudah ada
    const existingContact = await prisma.contact.findFirst({
      where: {
        userId: userId,
        contactUserId: contactUserId,
      },
    });

    if (existingContact) {
      return res
        .status(409) // 409 Conflict
        .json({ message: "User ini sudah ada di daftar kontak Anda" });
    }

    // 6. Buat record Contact baru
    await prisma.contact.create({
      data: {
        userId: userId,
        contactUserId: contactUserId,
      },
    });

    // 7. Kirim respons sukses
    res
      .status(201)
      .json({ message: `Kontak ${userToAdd.name} berhasil ditambahkan` });
  } catch (error) {
    console.error("Error creating contact:", error);
    res
      .status(500)
      .json({ message: "Gagal menambahkan kontak", error: error.message });
  }
};

const getPotentialContacts = async (req, res) => {
  const userId = req.user.userId;

  try {
    const users = await prisma.user.findMany({
      where: {
        // 1. Kecualikan user yang sedang login
        id: {
          not: userId,
        },
        // 2. Kecualikan user yang SUDAH ADA di daftar kontak
        //    'contactOf' adalah relasi di model User
        //    yang merujuk ke 'Contact' di mana mereka adalah 'contactUserId'
        contactOf: {
          none: {
            userId: userId, // Filter 'Contact' di mana 'userId' adalah user yg login
          },
        },
      },
      // Pilih hanya data yang aman untuk dikirim
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc", // Urutkan berdasarkan nama agar rapi di dropdown
      },
    });

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching potential contacts:", error);
    res
      .status(500)
      .json({ message: "Gagal mengambil data user", error: error.message });
  }
};

export { createContact, getContacts, getPotentialContacts, deleteContact };
