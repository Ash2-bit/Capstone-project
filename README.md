# SAPULIDI: AI-Powered Damage Severity Clustering & Spatial Mapping for Disaster-Resilient Communities

**Tema Capstone:** *Inclusive & Resilient Communities*

**Tautan Aplikasi (Live Deployment):** [https://sapulidiku.space](https://sapulidiku.space)

---

## 📝 Deskripsi Singkat
**SAPULIDI** adalah sebuah platform mitigasi dan penanggulangan bencana kolaboratif terintegrasi. Sistem ini dirancang untuk mempercepat respon darurat kebencanaan dengan memanfaatkan kecerdasan buatan (AI) untuk mengotomatisasi penilaian tingkat keparahan dampak bencana dari laporan warga, melakukan klasterisasi wilayah bencana secara spasial untuk mengidentifikasi hotspot terdampak, serta menyusun rekomendasi alokasi tim penyelamat (Search and Rescue/SAR) terdekat secara dinamis.

Fitur utama meliputi pelaporan warga berbasis peta (Leaflet), klasifikasi kerusakan bangunan otomatis menggunakan model Deep Learning (TensorFlow/Keras), klasterisasi spasial multi-algoritma (DBSCAN, K-Means, Hierarchical), analisis dampak kumulatif, penentuan prioritas zona bahaya, serta rekomendasi strategis berbasis Google Gemini AI.

Tim kami memilih proyek ini karena tingginya urgensi peningkatan sistem respons bencana di Indonesia. Selama ini, informasi yang berharga dari masyarakat banyak namun sulit untuk dimanfaatkan karena tidak adanya platform terintegrasi. **SAPULIDI** yang melambangkan gotong royong masyarakat Indonesia hadir sebagai solusi end-to-end yang menggabungkan pelaporan masyarakat, klasifikasi kerusakan berbasis AI, pemetaan zona bencana, dan rekomendasi tim SAR terdekat.

Repositori ini memuat dua sub-proyek utama yang berkolaborasi:
1. **`sapulidiku_js`**: Aplikasi web berbasis JavaScript (Next.js untuk frontend dan Express.js untuk backend) yang menyajikan antarmuka visual peta interaktif bagi admin dan masyarakat umum.
2. **`python_ml`**: Layanan mikro AI & Machine Learning berbasis FastAPI yang memproses klasifikasi foto kerusakan bangunan (menggunakan TensorFlow/Keras) dan menghitung klasterisasi spasial kebencanaan serta rekomendasi operasional taktis berbasis Gemini AI.

---

## ✨ Fitur Utama

### 1. Sistem Pelaporan Masyarakat (Public Reporting & Geotagging)
* **Peta Interaktif Leaflet**: Mempermudah pelapor menandai titik koordinat lokasi bencana secara presisi langsung pada peta.
* **Upload Bukti Foto Bencana**: Pelapor dapat mengunggah foto lapangan sebagai bukti visual tingkat kerusakan.

### 2. Klasifikasi Keparahan Kerusakan Otomatis (AI Image Damage Classification)
* **Inference CNN Keras**: Mengklasifikasi tingkat keparahan foto bangunan yang diunggah secara otomatis menjadi 3 tingkat: **Ringan**, **Sedang**, atau **Berat**.
* **Prediksi Probabilitas**: Menyediakan nilai persentase tingkat kepercayaan (*confidence score*) dari model AI terhadap klasifikasi gambar.
* **Asynchronous Queueing**: Proses pengiriman foto diantrekan secara asinkron di latar belakang menggunakan antrean database untuk memastikan respons cepat bagi pengguna.

### 3. Klasterisasi Spasial Kebencanaan (Spatial Hotspot Clustering)
* **Multi-Algorithm Support**: Mendukung tiga algoritma pengelompokan spasial utama:
  * **DBSCAN** *(Density-Based Spatial Clustering of Applications with Noise)* berbasis metrik Haversine (menghitung radius pencarian berdasarkan kilometer riil).
  * **K-Means Clustering** berbasis koordinat lintang dan bujur.
  * **Agglomerative Hierarchical Clustering**.
* **Evaluasi Kualitas Klaster**: Menyediakan metrik evaluasi matematis secara real-time seperti *Silhouette Score*, *Davies-Bouldin Index*, dan *Calinski-Harabasz Index* untuk menganalisis kualitas pemisahan klaster.

### 4. Analisis Taktis & Panduan Operasional SAR Berbasis Gemini AI
* **Analisis Dampak Kumulatif**: Mengakumulasikan data korban jiwa (meninggal, luka-luka, hilang, mengungsi) dan tingkat keparahan laporan di setiap klaster.
* **Penentuan Prioritas Cerdas**: Melabeli prioritas klaster dengan indikator warna:
  * <span style="color:red">**Merah (Tinggi)**</span>: Jika terdapat korban jiwa, korban hilang, atau kerusakan kategori "Berat".
  * <span style="color:yellow">**Kuning (Sedang)**</span>: Jika terdapat luka-luka/pengungsi atau tingkat keparahan "Sedang".
  * <span style="color:green">**Hijau (Rendah)**</span>: Jika hanya berupa kerusakan minor tanpa adanya korban.
* **Generasi Panduan SAR Taktis**: Mengintegrasikan Google Gemini API untuk menghasilkan dokumen panduan taktis evakuasi dan logistik secara dinamis dalam Bahasa Indonesia untuk setiap klaster bencana.

### 5. Rekomendasi Pangkalan SAR Terdekat (SAR Proximity Mapping)
* **Kalkulasi Jarak Haversine**: Menghitung jarak terdekat secara geografis antara titik bencana dengan daftar markas/posko SAR terdaftar.
* **Top 3 Recommendations**: Merekomendasikan 3 pangkalan SAR terdekat berdasarkan peringkat jarak tempuh aktual (kilometer) demi mempercepat waktu respon tim evakuasi.

---

## 📂 Struktur Folder Proyek

Berikut adalah struktur folder utama yang relevan dengan pengembangan JavaScript dan Python Machine Learning:

```text
sapulidiku/
├── docs/                           # Dokumentasi teknis proyek
│   ├── api_specification_ml.md      # Spesifikasi API integrasi FastAPI ↔ Express
│   ├── deployment_guide.md         # Panduan deployment proyek secara menyeluruh
│   └── README.md                   # File ini (Dokumentasi Utama)
├── python_ml/                      # Sub-Proyek Machine Learning & AI (FastAPI)
│   ├── models/                     # Tempat menyimpan file model Deep Learning (.keras)
│   │   └── model-v1.keras          # Model klasifikasi kerusakan bangunan
│   ├── modeling/                   # Folder/Notebook pengembangan model AI
│   ├── inference.py                # Logika prapemrosesan gambar & inferensi TensorFlow/Keras
│   ├── main.py                     # Entry point server FastAPI (Endpoints: /predict-damage & /cluster)
│   └── requirements.txt            # Daftar dependensi modul Python
├── sapulidiku_js/                  # Sub-Proyek JavaScript (Express.js & Next.js)
│   ├── backend/                    # Layanan REST API Backend (Express.js)
│   │   ├── prisma/                 # Skema basis data & konfigurasi database ORM
│   │   └── src/                    # Kode sumber backend (app.js, controllers, routes, services)
│   ├── frontend/                   # Layanan UI/UX Frontend Web (Next.js & Leaflet)
│   │   ├── src/app/                # Struktur halaman (Admin Panel, Reporting Form, Dashboard Utama)
│   │   ├── src/components/         # Komponen React reusable (Interactive Maps, Form Elements, UI)
│   │   └── src/lib/                # Konfigurasi client API (Axios instance)
│   ├── DEPLOYS.md                  # Panduan deployment aplikasi JS ke server VPS
│   └── LOCAL_RUN.md                # Panduan praktis menjalankan aplikasi JS secara lokal
└── start-ml.bat                    # Script cepat untuk menjalankan service Python FastAPI
```

---

## 🛠️ Teknologi yang Digunakan

### 🖥️ Frontend (Next.js)
* **Next.js 16.2 (App Router)** - Framework React untuk performa tinggi & SEO-friendly.
* **React 19 & React DOM** - Core frontend library.
* **Tailwind CSS v4** - Styling visual utilitas modern.
* **Leaflet & React-Leaflet** - Engine visualisasi peta spasial interaktif.
* **Lucide React** - Set ikon SVG modern yang responsif.
* **Axios** - Client HTTP untuk integrasi data dengan API Backend.

### ⚙️ Backend (Express.js)
* **Express.js v4** - Framework routing dan penanganan request HTTP.
* **Prisma ORM & Client v5** - Object-Relational Mapper untuk berinteraksi dengan database secara type-safe.
* **MySQL** - Sistem manajemen database relasional.
* **JWT (JSON Web Tokens) & BcryptJS** - Sistem otentikasi admin aman & enkripsi kata sandi.
* **Multer** - Middleware penanganan unggahan file foto laporan.

### 🤖 Machine Learning & AI (Python/FastAPI)
* **Python 3.11+** - Bahasa pemrograman utama kecerdasan buatan.
* **FastAPI & Uvicorn** - Framework web performa tinggi untuk menyajikan REST API.
* **TensorFlow & Keras** - Engine untuk me-load model CNN dan melakukan inferensi klasifikasi foto bencana.
* **Scikit-Learn** - Modul untuk komputasi algoritma clustering spasial (DBSCAN, KMeans, Agglomerative) dan metrik evaluasi.
* **NumPy & Pillow (PIL)** - Manipulasi data array numerik koordinat dan prapemrosesan file gambar.
* **Google GenAI SDK** - SDK resmi Google untuk interaksi dengan LLM Gemini (menggunakan model `gemini-3.1-flash-lite` atau `gemini-1.5-flash`).

---

## 🚀 Cara Instalasi dan Menjalankan Proyek

Lakukan instalasi di komputer lokal Anda dengan mengikuti langkah-langkah di bawah ini. Pastikan Anda memiliki **Node.js (v20+)**, **Python (3.11+)**, dan **MySQL** yang berjalan aktif di latar belakang.

### Langkah 1: Setup Machine Learning Service (Python FastAPI)

1. Masuk ke direktori `python_ml`:
   ```bash
   cd python_ml
   ```
2. Buat Virtual Environment Python baru:
   ```bash
   python -m venv venv
   ```
3. Aktifkan virtual environment Anda:
   * **Windows (PowerShell):**
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **Linux/macOS:**
     ```bash
     source venv/bin/activate
     ```
4. Install semua dependensi library:
   ```bash
   pip install -r requirements.txt
   ```
5. Siapkan berkas `.env` di dalam folder `python_ml/` atau root proyek, lalu konfigurasikan kunci API Gemini:
   ```env
   GEMINI_API_KEY=KUNCI_API_GEMINI_ANDA_DISINI
   GEMINI_MODEL=gemini-3.1-flash-lite
   ```
6. Jalankan layanan FastAPI:
   * **Menggunakan Batch Launcher (dari root proyek):**
     ```powershell
     .\start-ml.bat
     ```
   * **Secara Manual:**
     ```bash
     uvicorn main:app --host 127.0.0.1 --port 8000 --reload
     ```
   *Layanan ML kini aktif di `http://127.0.0.1:8000` dan dokumentasi Swagger dapat diakses di `http://127.0.0.1:8000/docs`.*

---

### Langkah 2: Setup REST API Backend (Express.js)

1. Buka terminal baru dan masuk ke direktori backend:
   ```bash
   cd sapulidiku_js/backend
   ```
2. Pasang semua paket dependensi Node.js:
   ```bash
   npm install
   ```
3. Buat file `.env` di dalam folder `sapulidiku_js/backend` dan sesuaikan koneksi database Anda:
   ```env
   PORT=5000
   DATABASE_URL="mysql://username:password@127.0.0.1:3306/sapulidiku"
   FASTAPI_URL="http://127.0.0.1:8000"
   ```
4. Buat Prisma client untuk mengakses database:
   ```bash
   npx prisma generate
   ```
5. Jalankan server backend dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   *Backend Express kini mendengarkan request pada port `http://127.0.0.1:5000`.*

---

### Langkah 3: Setup Frontend UI (Next.js)

1. Buka terminal baru dan masuk ke direktori frontend:
   ```bash
   cd sapulidiku_js/frontend
   ```
2. Pasang paket dependensi Node.js:
   ```bash
   npm install
   ```
3. Buat file `.env` (atau `.env.local`) di dalam folder `sapulidiku_js/frontend` untuk mengarahkan ke Backend Express:
   ```env
   NEXT_PUBLIC_API_URL="http://127.0.0.1:5000"
   ```
4. Jalankan Next.js dalam mode pengembangan:
   ```bash
   npm run dev
   ```
   *Frontend Next.js kini aktif dan dapat diakses melalui browser Anda di **`http://localhost:3000`**.*

---

## 🗺️ Tampilan Penggunaan Aplikasi
Setelah ketiga terminal aktif, Anda dapat membuka browser untuk:
* **Halaman Beranda (`http://localhost:3000`)**: Melihat sebaran klaster laporan kebencanaan aktif yang dipetakan secara spasial.
* **Form Laporan (`http://localhost:3000/report`)**: Mengirim laporan baru, menandai koordinat langsung di peta, dan mengunggah foto kerusakan bangunan.
* **Dashboard Admin (`http://localhost:3000/admin`)**: Mengakses panel pengelolaan provinsi, pangkalan SAR, verifikasi foto bencana (hasil prediksi AI model-v1), dan menyimulasikan sesi klasterisasi baru (DBSCAN/K-Means/Agglomerative) dengan parameter kustom untuk memanggil Gemini AI.

---

## 👥 Tim Capstone (Capstone Team)

Berikut adalah anggota tim pengembangan proyek **SAPULIDI**:

| No | Nama | ID Peserta | Universitas / Institusi | Peran / Tanggung Jawab | Kontak / GitHub |
|:--:|---|:--:|---|---|:--:|
| 1 | **[Nama Anggota 1]** | [ID-12345] | [Nama Universitas 1] | *e.g., Machine Learning Engineer / Project Manager* | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/username1) |
| 2 | **[Nama Anggota 2]** | [ID-67890] | [Nama Universitas 2] | *e.g., Frontend Developer / UI Designer* | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/username2) |
| 3 | **[Nama Anggota 3]** | [ID-54321] | [Nama Universitas 3] | *e.g., Backend Developer / Cloud Engineer* | [![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/username3) |
