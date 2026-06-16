# 👕 ExternaWear Frontend

Frontend aplikasi e-commerce **ExternaWear**, platform pemesanan pakaian pria modern yang dibangun menggunakan **React**, **Vite**, dan **Tailwind CSS**. Aplikasi ini dirancang untuk memberikan pengalaman belanja yang cepat, responsif, dan aman bagi pelanggan.

---

## ✨ Fitur Utama

### 🔐 Autentikasi Pengguna

* Registrasi akun baru
* Login & Logout
* Autentikasi menggunakan **JWT Secure Cookie**
* Proteksi halaman untuk pengguna yang telah login

### 🛍️ Katalog Produk

* Menampilkan koleksi pakaian pria
* Informasi detail produk
* Status ketersediaan stok secara real-time
* Tampilan responsif untuk desktop maupun mobile

### 🛒 Keranjang Belanja

* Menambahkan produk ke keranjang
* Mengubah jumlah pesanan
* Menghapus produk dari keranjang
* Memilih item yang akan di-checkout

### 💳 Checkout & Pembayaran

* Integrasi dengan **Xendit Payment Gateway**
* Redirect otomatis ke halaman pembayaran
* Proses transaksi yang aman dan cepat

### 👤 Manajemen Profil

* Mengubah username
* Mengubah password
* Menghapus akun secara mandiri

---

## 🛠️ Tech Stack

| Teknologi        | Versi | Keterangan                                             |
| ---------------- | ----- | ------------------------------------------------------ |
| React            | 18.x  | Library utama untuk membangun UI                       |
| Vite             | 5.x   | Build tool modern dan cepat                            |
| React Router DOM | 6.x   | Routing Single Page Application (SPA)                  |
| Tailwind CSS     | 3.x   | Utility-first CSS Framework                            |
| Axios            | 1.x   | HTTP Client dengan konfigurasi `withCredentials: true` |
| pnpm             | 9.x   | Package Manager                                        |

---

## 📂 Struktur Proyek

```bash
externawear-frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── routes/
│   ├── services/
│   ├── hooks/
│   ├── context/
│   └── App.jsx
├── .env.example
├── package.json
└── vite.config.js
```

---

## 🚀 Instalasi dan Menjalankan Proyek

### 1️⃣ Clone Repository

```bash
git clone https://github.com/USERNAME_GITHUB/externawear-frontend.git
cd externawear-frontend
```

### 2️⃣ Install Dependencies

Menggunakan **pnpm**:

```bash
pnpm install
```

### 3️⃣ Konfigurasi Environment

Salin file `.env.example` menjadi `.env`

```bash
cp .env.example .env
```

Isi file `.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 4️⃣ Jalankan Development Server

```bash
pnpm run dev
```

Aplikasi akan berjalan pada:

```bash
http://localhost:5173
```

---

## 🔗 Integrasi Backend

Pastikan backend ExternaWear telah berjalan terlebih dahulu.

Contoh URL API:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📱 Tampilan Responsif

ExternaWear dirancang untuk berjalan optimal pada:

* 💻 Desktop
* 📱 Mobile
* 📟 Tablet

---

## 🔒 Keamanan

* JWT Authentication
* HTTP Only Secure Cookie
* CORS Protection
* Protected Routes
* Secure Checkout Process

---

## 🤝 Kontribusi

Kontribusi sangat terbuka.

1. Fork repository
2. Buat branch baru

```bash
git checkout -b feature/nama-fitur
```

3. Commit perubahan

```bash
git commit -m "Menambahkan fitur baru"
```

4. Push ke branch

```bash
git push origin feature/nama-fitur
```

5. Buat Pull Request

---

## 📄 License

Project ini dibuat untuk kebutuhan pembelajaran dan pengembangan aplikasi e-commerce modern.

---

<div align="center">

### 👨‍💻 Author

**Ahmad Zaki Hossam Mido**

© 2026 ExternaWear. All Rights Reserved.

</div>
