# Sapulidiku ML Service

Layanan machine learning berbasis FastAPI untuk clustering laporan bencana.

## Persyaratan

- Python 3.11+
- Virtual environment sudah dibuat di `python_ml/venv`

## Menjalankan Service

### Cara 1: Gunakan skrip launcher (dari root project)
```bat
start-ml.bat
```

### Cara 2: Manual (dari root project)
```bat
python_ml\venv\Scripts\uvicorn python_ml.main:app --host 127.0.0.1 --port 8000 --reload
```

Service akan berjalan di: http://127.0.0.1:8000  
Dokumentasi API (Swagger): http://127.0.0.1:8000/docs

## Endpoint

### POST /cluster

Menerima data laporan dan basis SAR, menjalankan clustering, menghitung rekomendasi SAR terdekat.

**Request Body:**
```json
{
  "algorithm": "DBSCAN",
  "parameters": { "eps_km": 50.0, "min_samples": 3 },
  "reports": [
    { "id": 1, "latitude": -0.5, "longitude": 117.1, "overall_severity": "berat", "fatalities": 2, "injured": 5, "missing": 1, "evacuees": 10 }
  ],
  "sar_bases": [
    { "id": 1, "name": "Markas SAR Pekanbaru", "latitude": 0.507, "longitude": 101.448 }
  ]
}
```

**Response:** Clusters, SAR recommendations, dan metrik evaluasi.

## Parameter Algoritma

| Algoritma | Parameter | Keterangan |
|-----------|-----------|------------|
| DBSCAN | `eps_km` | Radius pencarian dalam km (default: 50) |
| DBSCAN | `min_samples` | Minimum titik per cluster (default: 3) |
| K-Means | `n_clusters` | Jumlah cluster (default: 3) |
| Agglomerative | `n_clusters` | Jumlah cluster (default: 3) |
