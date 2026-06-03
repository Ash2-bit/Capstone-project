from fastapi import FastAPI, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
from inference import predict_building_damage, load_damage_model
from sklearn.cluster import DBSCAN, KMeans, AgglomerativeClustering
from sklearn.metrics import silhouette_score, davies_bouldin_score, calinski_harabasz_score
import math
import time
import os
from google import genai

def get_env_var(var_name: str) -> Optional[str]:
    # Check OS env first
    if var_name in os.environ:
        return os.environ[var_name]
    # Check .env file in parent/current dir
    for path in [".env", "../.env", "python_ml/.env"]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith(var_name + "="):
                            val = line.split("=", 1)[1].strip()
                            # Remove quotes if present
                            if val.startswith('"') and val.endswith('"'):
                                val = val[1:-1]
                            elif val.startswith("'") and val.endswith("'"):
                                val = val[1:-1]
                            return val
            except Exception:
                pass
    return None

def call_gemini(prompt: str) -> str:
    api_key = get_env_var("GEMINI_API_KEY")
    if not api_key:
        return "Error: GEMINI_API_KEY tidak ditemukan di environment atau file .env."

    model_name = get_env_var("GEMINI_MODEL") or "gemini-3.1-flash-lite"

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model_name,
            contents=prompt,
        )
        return response.text
    except Exception as e:
        return f"Error memanggil Gemini API: {str(e)}"

app = FastAPI(title="Sapulidiku ML Clustering Service")

# Geographic Haversine Distance Helper
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0088  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

# Input Pydantic Schemas
class ReportData(BaseModel):
    id: int
    latitude: float
    longitude: float
    overall_severity: str
    fatalities: int
    injured: int
    missing: int
    evacuees: int
    category: Optional[str] = None
    description: Optional[str] = None

class SarBaseData(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float

class ClusterRequest(BaseModel):
    algorithm: str
    parameters: Dict[str, Any]
    reports: List[ReportData]
    sar_bases: List[SarBaseData]

# Output Pydantic Schemas
class ClusterResult(BaseModel):
    name: str
    priority_level: str
    centroid_lat: float
    centroid_long: float
    radius_meter: float
    total_reports: int
    total_fatalities: int
    total_injured: int
    total_missing: int
    total_evacuees: int
    report_ids: List[int]
    ai_prompt: Optional[str] = None
    ai_recommendation: Optional[str] = None

class RecommendationResult(BaseModel):
    report_id: int
    sar_base_id: int
    distance_km: float
    rank: int

class ClusterResponse(BaseModel):
    silhouette_score: Optional[float] = None
    davies_bouldin_index: Optional[float] = None
    calinski_harabasz_index: Optional[float] = None
    total_reports_processed: int
    processing_time_ms: int
    clusters: List[ClusterResult]
    recommendations: List[RecommendationResult]

@app.post("/cluster", response_model=ClusterResponse)
def process_clustering(request: ClusterRequest):
    start_time = time.time()
    
    reports = request.reports
    sar_bases = request.sar_bases
    algorithm = request.algorithm
    params = request.parameters
    
    if not reports:
        return ClusterResponse(
            total_reports_processed=0,
            processing_time_ms=0,
            clusters=[],
            recommendations=[]
        )
        
    total_reports = len(reports)
    
    # 1. Run Spatial Clustering
    # Convert report coordinates to arrays
    # DBSCAN uses haversine metric which expects radians: [latitude, longitude]
    coords_rad = np.array([[math.radians(r.latitude), math.radians(r.longitude)] for r in reports])
    coords_deg = np.array([[r.latitude, r.longitude] for r in reports])
    
    labels = np.zeros(total_reports, dtype=int)
    
    try:
        if algorithm == "DBSCAN":
            eps_km = float(params.get("eps_km", params.get("eps", 50.0)))
            min_samples = int(params.get("min_samples", 3))
            
            # Convert kilometers to radians for DBSCAN's haversine metric
            eps_rad = eps_km / 6371.0088
            
            db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine')
            labels = db.fit_predict(coords_rad)
            
        elif algorithm == "K-Means":
            n_clusters = int(params.get("n_clusters", 3))
            n_clusters = max(1, min(n_clusters, total_reports))
            
            km = KMeans(n_clusters=n_clusters, random_state=42, n_init='auto')
            labels = km.fit_predict(coords_deg)
            
        elif algorithm == "Agglomerative":
            n_clusters = int(params.get("n_clusters", 3))
            n_clusters = max(1, min(n_clusters, total_reports))
            
            agg = AgglomerativeClustering(n_clusters=n_clusters)
            labels = agg.fit_predict(coords_deg)
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported algorithm: {algorithm}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Clustering algorithm error: {str(e)}")

    # 2. Calculate Evaluation Metrics
    silhouette = None
    davies_bouldin = None
    calinski_harabasz = None
    
    # We can only compute metrics if there are at least 2 distinct cluster labels and fewer than total reports
    unique_labels = set(labels)
    # Exclude noise label -1 from metrics calculation for DBSCAN
    valid_labels_mask = labels != -1
    valid_labels = labels[valid_labels_mask]
    valid_coords = coords_rad[valid_labels_mask] if algorithm == "DBSCAN" else coords_deg[valid_labels_mask]
    
    if len(set(valid_labels)) > 1 and len(valid_labels) < total_reports:
        try:
            if algorithm == "DBSCAN":
                silhouette = float(silhouette_score(valid_coords, valid_labels, metric='haversine'))
            else:
                silhouette = float(silhouette_score(valid_coords, valid_labels))
                
            davies_bouldin = float(davies_bouldin_score(valid_coords, valid_labels))
            calinski_harabasz = float(calinski_harabasz_score(valid_coords, valid_labels))
        except Exception:
            pass  # Ignore metric errors and leave them as None

    # 3. Build Spatial Clusters
    clusters = []
    unique_clusters = [l for l in unique_labels if l >= 0]
    
    for i, cluster_label in enumerate(unique_clusters):
        cluster_indices = [idx for idx, label in enumerate(labels) if label == cluster_label]
        cluster_reports = [reports[idx] for idx in cluster_indices]
        
        # Centroid coordinates (average)
        centroid_lat = float(np.mean([r.latitude for r in cluster_reports]))
        centroid_long = float(np.mean([r.longitude for r in cluster_reports]))
        
        # Max radius in meters
        max_dist_km = 0.0
        for r in cluster_reports:
            dist = haversine_distance(centroid_lat, centroid_long, r.latitude, r.longitude)
            if dist > max_dist_km:
                max_dist_km = dist
        
        radius_meter = float(max_dist_km * 1000.0)
        
        # Severity and Priority logic
        # Red: Any fatalities > 0 or 'berat' severity
        # Yellow: Any injured > 0 or 'sedang' severity
        # Green: Otherwise
        has_fatalities = any(r.fatalities > 0 or r.missing > 0 for r in cluster_reports)
        has_berat = any(r.overall_severity == "berat" for r in cluster_reports)
        has_injured = any(r.injured > 0 or r.evacuees > 0 for r in cluster_reports)
        has_sedang = any(r.overall_severity == "sedang" for r in cluster_reports)
        
        if has_fatalities or has_berat:
            priority = "red"
        elif has_injured or has_sedang:
            priority = "yellow"
        else:
            priority = "green"
            
        cluster_name = f"Cluster #{i + 1}"
        
        # Aggregate statistics
        total_reports_in_cluster = len(cluster_reports)
        total_fatalities = sum(r.fatalities for r in cluster_reports)
        total_injured = sum(r.injured for r in cluster_reports)
        total_missing = sum(r.missing for r in cluster_reports)
        total_evacuees = sum(r.evacuees for r in cluster_reports)
        
        # Generate AI analysis and recommendation
        reports_details_list = []
        for idx, r in enumerate(cluster_reports, 1):
            category_str = "Kerusakan Bangunan" if r.category == "building_damage" else "Kerusakan Infrastruktur" if r.category == "infrastructure_damage" else r.category or "Lainnya"
            desc_str = r.description or "Tidak ada deskripsi rinci"
            severity_str = r.overall_severity or "Tidak diketahui"
            reports_details_list.append(
                f"{idx}. Kategori: {category_str} | Severity: {severity_str}\n"
                f"   Korban: {r.fatalities} Meninggal, {r.injured} Luka, {r.missing} Hilang, {r.evacuees} Mengungsi\n"
                f"   Deskripsi: {desc_str}"
            )
        reports_details = "\n\n".join(reports_details_list)
        
        prompt = (
            f"Lakukan analisis kebencanaan secara taktis dan berikan rekomendasi operasional SAR "
            f"untuk klaster bencana berikut ini:\n\n"
            f"Informasi Klaster:\n"
            f"- Nama Klaster: {cluster_name}\n"
            f"- Tingkat Prioritas: {priority.upper()}\n"
            f"- Koordinat Centroid: Lat {centroid_lat:.6f}, Long {centroid_long:.6f}\n"
            f"- Estimasi Radius Klaster: {radius_meter:.1f} meter\n"
            f"- Total Titik Laporan: {total_reports_in_cluster}\n"
            f"- Akumulasi Korban:\n"
            f"  * Meninggal: {total_fatalities} orang\n"
            f"  * Cedera: {total_injured} orang\n"
            f"  * Hilang: {total_missing} orang\n"
            f"  * Mengungsi: {total_evacuees} orang\n\n"
            f"Daftar Detail Laporan di Klaster Ini:\n"
            f"{reports_details}\n\n"
            f"Instruksi Analisis & Rekomendasi:\n"
            f"1. Berikan ringkasan analisis situasi kebencanaan di klaster ini berdasarkan jenis laporan, tingkat keparahan (severity), dan dampak korban.\n"
            f"2. Berikan rekomendasi operasional taktis untuk tim SAR di lapangan (prioritas evakuasi, kebutuhan logistik mendesak, atau tindakan penyelamatan khusus).\n"
            f"3. Pastikan jawaban disajikan secara terstruktur, profesional, padat, dan menggunakan Bahasa Indonesia yang baik dan benar."
        )

        ai_recommendation = call_gemini(prompt)

        clusters.append(ClusterResult(
            name=cluster_name,
            priority_level=priority,
            centroid_lat=centroid_lat,
            centroid_long=centroid_long,
            radius_meter=radius_meter,
            total_reports=total_reports_in_cluster,
            total_fatalities=total_fatalities,
            total_injured=total_injured,
            total_missing=total_missing,
            total_evacuees=total_evacuees,
            report_ids=[r.id for r in cluster_reports],
            ai_prompt=prompt,
            ai_recommendation=ai_recommendation
        ))

    # 4. Calculate SAR Recommendations (top 3 for each report)
    recommendations = []
    if sar_bases:
        for r in reports:
            distances = []
            for base in sar_bases:
                dist = haversine_distance(r.latitude, r.longitude, base.latitude, base.longitude)
                distances.append((base.id, dist))
            
            # Sort by distance ascending
            distances.sort(key=lambda x: x[1])
            
            # Save top 3 recommendations
            for rank, (base_id, dist) in enumerate(distances[:3], 1):
                recommendations.append(RecommendationResult(
                    report_id=r.id,
                    sar_base_id=base_id,
                    distance_km=float(dist),
                    rank=rank
                ))

    processing_time_ms = int((time.time() - start_time) * 1000.0)

    return ClusterResponse(
        silhouette_score=silhouette,
        davies_bouldin_index=davies_bouldin,
        calinski_harabasz_index=calinski_harabasz,
        total_reports_processed=total_reports,
        processing_time_ms=processing_time_ms,
        clusters=clusters,
        recommendations=recommendations
    )


@app.on_event("startup")
def startup_event():
    # Pre-load the damage model into memory
    try:
        load_damage_model()
    except Exception as e:
        print(f"Error loading damage model at startup: {str(e)}")


@app.post("/predict-damage")
async def predict_damage(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        result = predict_building_damage(contents)
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
