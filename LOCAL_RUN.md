# Panduan Menjalankan Sapulidiku JS di Komputer Lokal (Localhost)

Panduan praktis ini ditujukan untuk membantu Anda menjalankan dan menguji aplikasi backend Express.js dan frontend Next.js di komputer lokal (*localhost*) Anda sebelum melakukan deployment ke VPS.

---

## 📋 Persyaratan Awal (Prerequisites)
1. **MySQL Database**: Harus dalam kondisi aktif (menggunakan database `sapulidiku` yang sama dengan Laravel sebelumnya).
2. **Node.js**: Pastikan Node.js terpasang pada komputer Anda (disarankan versi v20 ke atas).

---

## ⚡ Langkah-Langkah Menjalankan Aplikasi

Buka 3 terminal terpisah (PowerShell, Command Prompt, atau Terminal di VS Code) dan ikuti langkah di bawah ini:

### 1. Terminal 1: Jalankan Service ML Python (FastAPI)
Arahkan terminal ke root direktori project, lalu jalankan perintah berikut untuk mengaktifkan kecerdasan buatan:
```powershell
.\start-ml.bat
```
*Service ini akan berjalan di latar belakang pada alamat `http://127.0.0.1:8000`.*

---

### 2. Terminal 2: Jalankan Backend REST API (Express.js)
1. Pindah ke direktori backend:
   ```powershell
   cd sapulidiku_js/backend
   ```
2. Jalankan server backend dalam mode pengembangan (*development mode*):
   ```powershell
   npm run dev
   ```
   *Terminal akan menampilkan pesan:*  
   `Sapulidiku Express server is listening on http://127.0.0.1:5000`

---

### 3. Terminal 3: Jalankan Frontend UI (Next.js)
1. Pindah ke direktori frontend:
   ```powershell
   cd sapulidiku_js/frontend
   ```
2. Jalankan server frontend:
   ```powershell
   npm run dev
   ```
   *Terminal akan menampilkan pesan:*  
   `Local: http://localhost:3000`

---

## 🌐 4. Mengakses Aplikasi di Browser
Buka browser Anda (Google Chrome, Edge, dll.) dan akses alamat berikut:
👉 **`http://localhost:3000`**

Di sini Anda bisa mencoba seluruh fitur aplikasi secara langsung:
- **Halaman Beranda**: Melihat peta spasial sebaran laporan bencana berdasarkan sesi clustering.
- **Form Pelaporan**: Mengirim laporan baru, memilih koordinat langsung dengan mengklik peta, dan mengunggah foto kerusakan.
- **Dashboard Admin**: Mengakses panel admin di `http://localhost:3000/admin` untuk CRUD Provinsi, CRUD Posko SAR, manajemen laporan (melihat hasil deteksi AI), serta simulasi sesi clustering ML baru.

---

## 🛑 Cara Menghentikan Server
Jika Anda sudah selesai melakukan pengujian dan ingin mematikan jalannya aplikasi di terminal, cukup klik terminal yang bersangkutan dan tekan tombol kombinasi keyboard berikut:
```
Ctrl + C
```
Ketik `Y` lalu tekan `Enter` jika terminal menanyakan konfirmasi penghentian proses.
