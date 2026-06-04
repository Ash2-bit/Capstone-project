# Panduan Deployment Sapulidiku JS ke VPS Ubuntu 24 (Database Siap Pakai)

Panduan ini berisi langkah-langkah *step-by-step* untuk mendeploy aplikasi backend Express.js dan frontend Next.js ke server VPS Ubuntu 24. 

> ⚠️ **PENTING**: Database MySQL Anda sudah terisi data dan siap pakai. **JANGAN** jalankan perintah `npx prisma db push` atau `npx prisma migrate reset` karena dapat menghapus atau menimpa data yang sudah ada di database Anda!

---

## 🛠️ Persiapan Awal di Server VPS

Asumsi: Anda sudah menginstal **Node.js**, **Nginx**, dan **MySQL**, serta service **FastAPI (Python ML)** sudah berjalan (misal pada `http://127.0.0.1:8000`). Database `sapulidiku` Anda di VPS sudah berisi data yang siap digunakan.

### 1. Instal PM2 (Process Manager) Global
PM2 diperlukan agar backend Express dan frontend Next.js tetap menyala di latar belakang server meskipun terminal ditutup:
```bash
sudo npm install -p pm2 -g
```

---

## 📦 Langkah 1: Deploy Backend (Express.js)

1. **Salin Folder `backend/`** ke VPS Anda (misal ke direktori `/var/www/sapulidiku_js/backend`).
2. **Masuk ke folder backend & instal dependensi**:
   ```bash
   cd /var/www/sapulidiku_js/backend
   npm install
   ```
3. **Konfigurasi file `.env`**:
   Buat file `.env` di dalam folder backend:
   ```bash
   nano .env
   ```
   Isi dengan konfigurasi koneksi database MySQL VPS Anda yang sudah ada datanya:
   ```env
   PORT=3333
   DATABASE_URL="mysql://username_mysql:password_mysql@127.0.0.1:3306/sapulidiku"
   FASTAPI_URL="http://127.0.0.1:8000"
   ```
4. **Generate Prisma Client**:
   Jalankan perintah ini hanya untuk membuat berkas client ORM agar Express.js dapat membaca database Anda yang sudah ada datanya.
   ```bash
   npx prisma generate
   ```
   *(Ingat: Jangan jalankan `npx prisma db push` agar data yang sudah ada di database tidak terhapus).*

5. **Jalankan Backend menggunakan PM2**:
   ```bash
   pm2 start src/app.js --name "sapulidiku-backend"
   ```

---

## 💻 Langkah 2: Deploy Frontend (Next.js)

1. **Salin Folder `frontend/`** ke VPS Anda (misal ke direktori `/var/www/sapulidiku_js/frontend`).
2. **Masuk ke folder frontend & instal dependensi**:
   ```bash
   cd /var/www/sapulidiku_js/frontend
   npm install
   ```
3. **Konfigurasi file `.env.local`**:
   Buat file `.env.local` di dalam folder frontend:
   ```bash
   nano .env.local
   ```
   Isi dengan **base URL domain Anda tanpa `/api`** di akhir:
   ```env
   NEXT_PUBLIC_API_URL="https://sapulidiku.space"
   ```
   > ⚠️ **PENTING**: Jangan tambahkan `/api` di akhir URL! Path `/api` sudah ditambahkan otomatis oleh kode.
   > ⚠️ **PENTING**: File `.env.local` **harus sudah ada dan terisi SEBELUM** menjalankan `npm run build`. Next.js meng-embed nilai variabel ini saat proses build, bukan saat runtime.

4. **Build Aplikasi Next.js untuk Produksi**:
   ```bash
   npm run build
   ```
5. **Jalankan Frontend menggunakan PM2**:
   ```bash
   pm2 start npm --name "sapulidiku-frontend" -- run start -- -p 5555
   ```

---

## ⚡ Langkah 3: Verifikasi Service di PM2
Pastikan kedua aplikasi berjalan normal dengan mengetikkan perintah berikut:
```bash
pm2 status
```
Anda akan melihat output daftar seperti ini:
```
┌────┬─────────────────────────┬─────────┬─────────┬────────┬────────┬──────┬───────────┬──────────┬──────────┐
│ id │ name                    │ mode    │ status  │ ↺      │ cpu    │ mem  │ user      │ watching │ [v]      │
├────┼─────────────────────────┼─────────┼─────────┼────────┼────────┼──────┼───────────┼──────────┼──────────┤
│ 0  │ sapulidiku-backend      │ fork    │ online  │ 0      │ 0%     │ 32MB │ ubuntu    │ disabled │ ...      │
│ 1  │ sapulidiku-frontend     │ fork    │ online  │ 0      │ 0%     │ 64MB │ ubuntu    │ disabled │ ...      │
└────┴─────────────────────────┴─────────┴─────────┴────────┼────────┼──────┼───────────┼──────────┼──────────┘
```

Agar PM2 otomatis berjalan saat VPS Anda restart, jalankan perintah ini:
```bash
pm2 startup
pm2 save
```
*(Salin dan jalankan perintah instruksi yang dikeluarkan oleh `pm2 startup` di terminal Anda).*

---

## 🛡️ Langkah 4: Konfigurasi Nginx Reverse Proxy

Nginx akan menerima traffic publik pada port `80` (HTTP) dan `443` (HTTPS) lalu mengarahkannya ke port internal Next.js (5555) dan Express (3333).

1. **Buat file konfigurasi Nginx baru**:
   ```bash
   sudo nano /etc/nginx/sites-available/sapulidiku
   ```
2. **Tempelkan konfigurasi berikut** (Ganti `sapulidiku.space` dengan domain Anda):
   ```nginx
   server {
       listen 80;
       server_name sapulidiku.space www.sapulidiku.space;

       # 1. Route Backend API Express (Port 3333)
       # Letakkan /api dan /storage SEBELUM / agar diprioritaskan
       location /api {
           proxy_pass http://127.0.0.1:3333;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # 2. Route Aset Media Storage (Foto Laporan)
       location /storage {
           proxy_pass http://127.0.0.1:3333/storage;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           client_max_body_size 10M;
       }

       # 3. Route Frontend Next.js (Port 5555)
       location / {
           proxy_pass http://127.0.0.1:5555;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
3. **Aktifkan konfigurasi Nginx**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sapulidiku /etc/nginx/sites-enabled/
   ```
4. **Uji konfigurasi dan restart Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

---

## 🔒 Langkah 5: Pasang SSL (HTTPS) Gratis dengan Certbot

Sangat penting menggunakan HTTPS agar fitur upload foto dan lokasi browser berjalan aman:

1. **Instal Certbot**:
   ```bash
   sudo apt update
   sudo apt install certbot python3-certbot-nginx -y
   ```
2. **Dapatkan sertifikat SSL**:
   ```bash
   sudo certbot --nginx -d domainanda.com -d www.domainanda.com
   ```
   *(Pilih opsi redirect otomatis seluruh traffic HTTP ke HTTPS).*

3. **Verifikasi perpanjangan otomatis sertifikat**:
   ```bash
   sudo certbot renew --dry-run
   ```

Aplikasi Sapulidiku JS Anda kini telah berhasil online sepenuhnya di VPS Ubuntu 24 Anda!
