import fs from 'fs';
import path from 'path';
import axios from 'axios';
import prisma from '../config/db.js';

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

// Resolve storage path relative to backend root
const PUBLIC_STORAGE_PATH = path.resolve(process.cwd(), '../storage/app/public');

/**
 * Service to handle communication and processing with the FastAPI machine learning service using Axios.
 */
export const pythonMlService = {
  /**
   * Process photo damage prediction using FastAPI model-v1 via Axios.
   * Replicates ProcessReportPhotoInference.php
   * 
   * @param {number|bigint} photoId 
   */
  async predictDamage(photoId) {
    try {
      const reportPhoto = await prisma.report_photos.findUnique({
        where: { id: BigInt(photoId) },
        include: { reports: true }
      });

      if (!reportPhoto) {
        console.error(`Inference failed: photo with ID #${photoId} not found.`);
        return;
      }

      const fullPhotoPath = path.join(PUBLIC_STORAGE_PATH, reportPhoto.photo_path);

      if (!fs.existsSync(fullPhotoPath)) {
        console.error(`Inference failed: photo file ${fullPhotoPath} does not exist.`);
        return;
      }

      console.log(`Starting inference for photo #${photoId} (${reportPhoto.photo_path})...`);

      // Read file and prepare FormData
      const fileBuffer = fs.readFileSync(fullPhotoPath);
      const filename = path.basename(reportPhoto.photo_path);
      const blob = new Blob([fileBuffer]);

      const formData = new FormData();
      formData.append('file', blob, filename);

      const response = await axios.post(`${FASTAPI_URL}/predict-damage`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 seconds timeout matching Laravel Job
      });

      const result = response.data;

      if (result && result.status === 'success') {
        const severity = result.prediksi;
        const confidence = parseFloat(result.confidence_percentage);

        await prisma.report_photos.update({
          where: { id: BigInt(photoId) },
          data: {
            severity: severity,
            confidence_score: confidence,
            model_version: 'model-v1',
            updated_at: new Date(),
          },
        });

        console.log(`Inference success for photo #${photoId}: Class = ${severity}, Confidence = ${confidence}%`);

        // Update the parent report's overall severity
        await this.updateParentReportSeverity(reportPhoto.report_id);
      } else {
        console.error(`FastAPI returned unsuccessful inference payload: ${JSON.stringify(result)}`);
      }
    } catch (error) {
      console.error(`Connection to FastAPI prediction failed: ${error.message}`);
    }
  },

  /**
   * Update parent report's overall_severity based on the highest severity among all its photos.
   * Replicates updateParentReportSeverity() in ProcessReportPhotoInference.php
   * 
   * @param {number|bigint} reportId 
   */
  async updateParentReportSeverity(reportId) {
    try {
      const photos = await prisma.report_photos.findMany({
        where: { report_id: BigInt(reportId) },
        select: { severity: true },
      });

      const severityRank = {
        berat: 3,
        sedang: 2,
        ringan: 1,
        unknown: 0,
      };

      let highestSeverity = 'unknown';
      let highestRank = 0;

      for (const photo of photos) {
        const sev = photo.severity || 'unknown';
        const rank = severityRank[sev] ?? 0;
        if (rank > highestRank) {
          highestRank = rank;
          highestSeverity = sev;
        }
      }

      if (highestSeverity !== 'unknown') {
        await prisma.reports.update({
          where: { id: BigInt(reportId) },
          data: {
            overall_severity: highestSeverity,
            status: 'analyzed',
            updated_at: new Date(),
          },
        });
        console.log(`Parent Report #${reportId} overall_severity updated to ${highestSeverity} based on photo classifications.`);
      }
    } catch (error) {
      console.error(`Failed to update parent report severity for ID #${reportId}: ${error.message}`);
    }
  },

  /**
   * Run spatial clustering session by fetching reports, calling FastAPI via Axios, and persisting results.
   * Replicates ProcessClusteringSessionJob.php
   * 
   * @param {number|bigint} sessionId 
   */
  async processClustering(sessionId) {
    try {
      const session = await prisma.clustering_sessions.findUnique({
        where: { id: BigInt(sessionId) },
      });

      if (!session) {
        console.error(`Clustering session #${sessionId} not found.`);
        return;
      }

      console.log(`Starting clustering process for session #${sessionId}...`);

      const startDate = new Date(session.start_date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(session.end_date);
      endDate.setHours(23, 59, 59, 999);

      // Fetch reports within date range and province
      const reports = await prisma.reports.findMany({
        where: {
          province_id: session.province_id,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
          overall_severity: true,
          fatalities: true,
          injured: true,
          missing: true,
          evacuees: true,
          category: true,
          description: true,
        },
      });

      if (reports.length === 0) {
        console.log(`No reports found for clustering in session #${sessionId}.`);
        return;
      }

      // Fetch all SAR bases
      const sarBases = await prisma.sar_bases.findMany({
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
      });

      // Parse parameters (JSON string or object)
      let parsedParameters = {};
      try {
        parsedParameters = typeof session.parameters === 'string'
          ? JSON.parse(session.parameters)
          : session.parameters;
      } catch (e) {
        parsedParameters = session.parameters || {};
      }

      // Build payload for FastAPI
      const payload = {
        algorithm: session.algorithm,
        parameters: parsedParameters,
        reports: reports.map(r => ({
          id: Number(r.id),
          latitude: parseFloat(r.latitude.toString()),
          longitude: parseFloat(r.longitude.toString()),
          overall_severity: r.overall_severity || 'unknown',
          fatalities: Number(r.fatalities),
          injured: Number(r.injured),
          missing: Number(r.missing),
          evacuees: Number(r.evacuees),
          category: r.category,
          description: r.description || '',
        })),
        sar_bases: sarBases.map(b => ({
          id: Number(b.id),
          name: b.name,
          latitude: parseFloat(b.latitude.toString()),
          longitude: parseFloat(b.longitude.toString()),
        })),
      };

      console.log(`Sending payload to FastAPI clustering endpoint via Axios for session #${sessionId}...`);

      const response = await axios.post(`${FASTAPI_URL}/cluster`, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 540000, // 540 seconds timeout matching Laravel Job
      });

      const result = response.data;

      // Persist SpatialClusters and report associations
      for (const clusterData of result.clusters) {
        const now = new Date();
        const spatialCluster = await prisma.spatial_clusters.create({
          data: {
            clustering_session_id: BigInt(sessionId),
            name: clusterData.name,
            priority_level: clusterData.priority_level,
            centroid_lat: clusterData.centroid_lat,
            centroid_long: clusterData.centroid_long,
            radius_meter: parseFloat(clusterData.radius_meter),
            total_reports: Number(clusterData.total_reports),
            total_fatalities: Number(clusterData.total_fatalities),
            total_injured: Number(clusterData.total_injured),
            total_missing: Number(clusterData.total_missing),
            total_evacuees: Number(clusterData.total_evacuees),
            ai_prompt: clusterData.ai_prompt || null,
            ai_recommendation: clusterData.ai_recommendation || null,
            created_at: now,
            updated_at: now,
          },
        });

        // Insert report_cluster pivot links
        if (clusterData.report_ids && clusterData.report_ids.length > 0) {
          const reportClusterData = clusterData.report_ids.map(reportId => ({
            report_id: BigInt(reportId),
            spatial_cluster_id: spatialCluster.id,
            created_at: now,
            updated_at: now,
          }));

          await prisma.report_cluster.createMany({
            data: reportClusterData,
          });
        }
      }

      // Persist SAR Recommendations
      if (result.recommendations && result.recommendations.length > 0) {
        const recNow = new Date();
        const recommendationInserts = result.recommendations.map(rec => ({
          report_id: BigInt(rec.report_id),
          sar_base_id: BigInt(rec.sar_base_id),
          distance_km: parseFloat(rec.distance_km),
          rank: Number(rec.rank),
          created_at: recNow,
          updated_at: recNow,
        }));

        // Batch inserts for safety/performance
        const chunkSize = 200;
        for (let i = 0; i < recommendationInserts.length; i += chunkSize) {
          const chunk = recommendationInserts.slice(i, i + chunkSize);
          await prisma.sar_recommendations.createMany({
            data: chunk,
          });
        }
      }

      // Mark reports as 'clustered'
      const processedReportIds = [];
      result.clusters.forEach(c => {
        if (c.report_ids) {
          processedReportIds.push(...c.report_ids);
        }
      });
      const uniqueReportIds = [...new Set(processedReportIds)].map(id => BigInt(id));

      if (uniqueReportIds.length > 0) {
        await prisma.reports.updateMany({
          where: {
            id: { in: uniqueReportIds },
          },
          data: {
            status: 'clustered',
            updated_at: new Date(),
          },
        });
      }

      // Update session with metrics from FastAPI
      await prisma.clustering_sessions.update({
        where: { id: BigInt(sessionId) },
        data: {
          silhouette_score: result.silhouette_score ?? null,
          davies_bouldin_index: result.davies_bouldin_index ?? null,
          calinski_harabasz_index: result.calinski_harabasz_index ?? null,
          total_reports_processed: Number(result.total_reports_processed),
          processing_time_ms: Number(result.processing_time_ms),
          processed_at: new Date(),
          updated_at: new Date(),
        },
      });

      console.log(`Clustering session #${sessionId} fully completed and persisted successfully!`);
    } catch (error) {
      console.error(`Clustering process failed for session #${sessionId}: ${error.message}`);
    }
  },
};
