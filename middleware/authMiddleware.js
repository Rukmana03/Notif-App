import jwt from "jsonwebtoken";

/**
 * Middleware untuk memverifikasi JWT
 * Ini akan mengambil token dari header 'Authorization'
 */
const authMiddleware = (req, res, next) => {
  // Ambil token dari header 'Authorization: Bearer <token>'
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Akses ditolak. Tidak ada token." });
  }

  try {
    // Ambil token-nya saja
    const token = authHeader.split(" ")[1];

    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Tambahkan data user (dari token) ke object request
    // agar bisa dipakai oleh controller selanjutnya
    req.user = decoded; // Ini akan berisi { userId: ..., email: ... }

    next(); // Lanjutkan ke controller
  } catch (error) {
    res.status(400).json({ message: "Token tidak valid" });
  }
};

export default authMiddleware;
