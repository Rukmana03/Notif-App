import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  // Validasi input dasar
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Semua field wajib diisi" });
  }

  try {
    // Cek apakah user sudah ada
    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10); // 10 adalah salt rounds

    // Buat user baru di database
    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    res.status(201).json({ message: "User berhasil dibuat", userId: user.id });
  } catch (error) {
    console.error("Error registrasi:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Cari user berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res.status(401).json({ message: "Email atau password salah" }); // 401 = Unauthorized
    }

    // 2. Bandingkan password yang dikirim dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Email atau password salah" });
    }

    // 3. GENERATE JWT (JSON WEB TOKEN)
    // Ini adalah "tiket" yang akan kita berikan ke frontend
    const token = jwt.sign(
      {
        userId: user.id, // Data yang ingin kita simpan di dalam token
        email: user.email,
      },
      process.env.JWT_SECRET, // Kunci rahasia dari file .env
      {
        expiresIn: process.env.JWT_EXPIRES_IN, // Durasi token dari file .env
      }
    );

    // 4. Kirim respon sukses ke frontend
    // Kita kirim token DAN data user (tanpa password)
    res.status(200).json({
      message: "Login berhasil",
      token: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
};

export const getMe = async (req, res) => {
  // req.user didapat dari authMiddleware
  const userId = req.user.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        // Hanya pilih data yang aman
        id: true,
        name: true,
        email: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    res.status(200).json({ user: user });
  } catch (error) {
    res.status(500).json({ message: "Terjadi kesalahan server" });
  }
};
