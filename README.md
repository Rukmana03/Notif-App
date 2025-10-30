# Aplikasi Status & Notifikasi Real-time

Ini adalah proyek aplikasi web *full-stack* yang meniru fungsionalitas status (seperti WhatsApp Status atau Instagram Stories) dengan notifikasi dan interaksi *real-time*.

Proyek ini dibangun menggunakan **React** untuk *frontend* dan **Node.js (Express)** dengan **Prisma** untuk *backend*. Fitur *real-time* didukung oleh **Socket.io** (untuk *update* UI) dan **Firebase Cloud Messaging (FCM)** (untuk *push notification*).

## ✨ Fitur Utama

Berikut adalah fungsionalitas yang sudah ada dan berfungsi:

  * \*\* autentikasi Pengguna:\*\* Pendaftaran dan Login aman menggunakan JWT.
  * \*\* Feed Status Real-time:\*\* Pengguna dapat mem-posting status baru yang akan langsung muncul di *feed* pengguna lain yang relevan (tanpa me-refresh).
  * **Visibilitas Status:**
      * **Publik:** Dapat dilihat oleh semua pengguna.
      * **Hanya Kontak:** Hanya dapat dilihat oleh pengguna yang ada di daftar kontak.
      * **Beberapa Kontak:** Hanya dapat dilihat oleh pengguna tertentu yang dipilih.
  * **Manajemen Kontak:** Menambah, menghapus, dan melihat daftar kontak.
  * **Interaksi Real-time:**
      * **Likes:** Jumlah "Suka" akan bertambah secara *real-time* di *feed* semua pengguna.
      * **Views:** Jumlah "Dilihat" akan bertambah secara *real-time* setelah dilihat oleh pengguna lain.
      * **Delete:** Status yang dihapus akan langsung hilang dari *feed* semua pengguna.
  * **Sistem Notifikasi Ganda:**
      * **Socket.io:** Memberikan *update* instan ke *state* UI (daftar notifikasi di *dropdown*).
      * **Firebase (FCM):** Mengirim *push notification* (toast/pop-up) ke *browser* pengguna saat mereka menerima *like* atau *view*.
  * **Keamanan:** Kunci API Frontend (Firebase) dan Kunci Service Account Backend (Firebase Admin) diamankan menggunakan *environment variables* (`.env`) dan tidak terekspos di repositori publik.

-----

## 🛠️ Tumpukan Teknologi (Tech Stack)

### Frontend (`/client`)

  * **Framework:** React (Vite)
  * **Styling:** Tailwind CSS
  * **Manajemen State:** React Context API
  * **Real-time:** Socket.io Client, Firebase Client SDK (Messaging)
  * **Networking:** Axios

### Backend (`/server`)

  * **Runtime:** Node.js
  * **Framework:** Express.js
  * **Database (ORM):** Prisma
  * **Database:** MySQL
  * **Real-time:** Socket.io
  * **Push Notification:** Firebase Admin SDK
  * **Autentikasi:** JWT (JSON Web Tokens)

-----

## ⚙️ Menjalankan Proyek Secara Lokal

Proyek ini adalah *monorepo* yang berisi folder `/server` (backend) dan `/client` (frontend).

### 1\. Persiapan Backend (`/server`)

1.  **Masuk ke folder server:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Setup Database:**
      * Buat database MySQL Anda.
      * Salin file `.env.example` (jika ada) menjadi `.env`.
      * Atur `DATABASE_URL` di dalam file `.env`:
        ```env
        # server/.env
        DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/NAMA_DATABASE"
        ```
4.  **Setup Firebase Admin (PENTING):**
      * Unduh file **Service Account Key** (`.json`) dari Firebase Console Anda.
      * Ubah namanya menjadi `serviceAccountKey.json`.
      * Tempatkan file ini di dalam folder `/server`. (File ini sudah ada di `.gitignore` jadi tidak akan ter-push).
5.  **Jalankan Migrasi Prisma:**
    Perintah ini akan membuat tabel-tabel di database Anda:
    ```bash
    npx prisma migrate dev
    ```
6.  **Jalankan Server Backend:**
    ```bash
    npm run server 
    ```
    Server Anda akan berjalan di `http://localhost:3000`.

### 2\. Persiapan Frontend (`/client`)

1.  **Buka terminal baru.**
2.  **Masuk ke folder client:**
    ```bash
    cd client
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Setup Kunci API Firebase:**
      * Buat file `.env.local` di dalam folder `/client`.
      * Buka Firebase Console ➜ Project Settings ➜ General.
      * Salin kredensial **Web App** Anda ke dalam file `.env.local` dengan awalan `VITE_`:
        ```env
        # client/.env.local
        VITE_FIREBASE_API_KEY="AIzaSy..."
        VITE_FIREBASE_AUTH_DOMAIN="proyek-anda.firebaseapp.com"
        VITE_FIREBASE_PROJECT_ID="proyek-anda"
        VITE_FIREBASE_STORAGE_BUCKET="proyek-anda.appspot.com"
        VITE_FIREBASE_MESSAGING_SENDER_ID="..."
        VITE_FIREBASE_APP_ID="..."
        ```
5.  **Jalankan Server Frontend:**
    ```bash
    npm run dev
    ```
    Aplikasi Anda akan berjalan di `http://localhost:5173`.

-----

## 📂 Struktur & Alur Kerja Git

Repositori ini adalah **monorepo**. Semua pekerjaan pengembangan dilakukan di *branch* `main`.

  * **`main`**: *Branch* utama. Berisi kedua folder (`/server` dan `/client`). **Semua *commit* dan *development* terjadi di sini.**
  * **`backend`**: *Branch* bersih yang **hanya** berisi kode dari `/server`. *Branch* ini di-update secara otomatis menggunakan `git subtree`.
  * **`frontend`**: *Branch* bersih yang **hanya** berisi kode dari `/client`. *Branch* ini juga di-update menggunakan `git subtree`.

### Alur Kerja (Workflow) untuk Update

**JANGAN** bekerja langsung di *branch* `backend` atau `frontend`.

1.  Selalu bekerja di *branch* `main`:

    ```bash
    git checkout main
    ```

2.  Lakukan perubahan pada kode (misal: di dalam `/server`).

3.  Commit perubahan Anda ke `main`:

    ```bash
    git add .
    git commit -m "feat(backend): Menambahkan fitur X"
    git push origin main
    ```

4.  Gunakan `git subtree push` untuk meng-update *branch* yang terpisah:

      * **Untuk meng-update `backend`:**
        ```bash
        git subtree push --prefix=server origin backend
        ```
      * **Untuk meng-update `frontend`:**
        ```bash
        git subtree push --prefix=client origin frontend
        ```

-----

## 🗺️ Roadmap (Fitur Selanjutnya)

Aplikasi ini masih dalam pengembangan. Berikut adalah beberapa fitur yang direncanakan:

  * **[ ] Upload Media:** Mengizinkan pengguna mengunggah **gambar** atau **video pendek** sebagai status, bukan hanya teks.
  * **[ ] Balasan Status (Replies):** Menambahkan fungsionalitas untuk membalas status tertentu.
  * **[ ] Tampilan "Seen":** Membuat ikon "Lihat Penonton" (👁️) hanya bisa diklik oleh pemilik status, dan menampilkan daftar siapa saja yang telah melihatnya.
  * **[ ] Umpan Balik UI:** Membuat ikon "Suka" (❤️) berubah warna secara instan saat diklik (optimistic UI update).
  * **[ ] Deployment:** Menyiapkan skrip dan panduan untuk *hosting* backend (mis. di Railway) dan frontend (mis. di Vercel).
