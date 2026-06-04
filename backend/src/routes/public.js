import express from 'express';
import prisma from '../config/db.js';
import { upload } from '../config/multer.js';
import { pythonMlService } from '../services/pythonMlService.js';
import { serialize } from '../utils/serializer.js';

const router = express.Router();

/**
 * GET /api/public/home
 * Returns statistics, active provinces, and processed clustering sessions.
 * Replicates HomeController.php
 */
router.get('/home', async (req, res) => {
  try {
    const sessions = await prisma.clustering_sessions.findMany({
      where: {
        processed_at: { not: null },
      },
      include: {
        provinces: {
          select: { id: true, name: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    const provinces = await prisma.provinces.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    });

    const totalReports = await prisma.reports.count();
    const totalProvinces = await prisma.provinces.count();
    const totalSessions = await prisma.clustering_sessions.count({
      where: {
        processed_at: { not: null },
      },
    });

    // Structure matches laravel Home index variables
    res.json(serialize({
      success: true,
      data: {
        sessions,
        provinces,
        totalReports,
        totalProvinces,
        totalSessions,
      },
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/public/sessions/:id/map-data
 * Returns complete map data for a specific clustering session.
 * Replicates PublicMapController.php (getMapData)
 */
router.get('/sessions/:id/map-data', async (req, res) => {
  try {
    const sessionId = BigInt(req.params.id);

    const session = await prisma.clustering_sessions.findUnique({
      where: { id: sessionId },
      include: {
        provinces: true,
        spatial_clusters: {
          include: {
            report_cluster: {
              include: {
                reports: {
                  include: {
                    report_photos: true,
                    sar_recommendations: {
                      include: {
                        sar_bases: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Clustering session tidak ditemukan.' });
    }

    const sarBases = await prisma.sar_bases.findMany({
      select: { id: true, name: true, latitude: true, longitude: true },
    });

    // Format output exactly as getMapData in PublicMapController.php
    const formattedClusters = session.spatial_clusters.map(cluster => {
      const reports = cluster.report_cluster.map(rc => {
        const report = rc.reports;

        const recs = report.sar_recommendations
          .map(r => ({
            sar_base_name: r.sar_bases?.name || null,
            sar_base_latitude: r.sar_bases ? parseFloat(r.sar_bases.latitude.toString()) : null,
            sar_base_longitude: r.sar_bases ? parseFloat(r.sar_bases.longitude.toString()) : null,
            distance_km: parseFloat(r.distance_km.toString()),
            rank: r.rank,
          }))
          .sort((a, b) => a.rank - b.rank);

        const photos = report.report_photos.map(p => ({
          url: `/storage/${p.photo_path}`, // frontend will prepend api url if needed
          severity: p.severity,
          confidence_score: p.confidence_score,
        }));

        return {
          id: report.id,
          category: report.category,
          reporter_name: report.reporter_name,
          reporter_phone: report.reporter_phone,
          reporter_address: report.reporter_address,
          latitude: parseFloat(report.latitude.toString()),
          longitude: parseFloat(report.longitude.toString()),
          description: report.description,
          overall_severity: report.overall_severity,
          fatalities: report.fatalities,
          injured: report.injured,
          missing: report.missing,
          evacuees: report.evacuees,
          cluster_name: cluster.name,
          cluster_priority: cluster.priority_level,
          recommendations: recs,
          photos: photos,
        };
      });

      return {
        id: cluster.id,
        name: cluster.name,
        priority_level: cluster.priority_level,
        centroid_lat: parseFloat(cluster.centroid_lat.toString()),
        centroid_long: parseFloat(cluster.centroid_long.toString()),
        radius_meter: cluster.radius_meter ? parseFloat(cluster.radius_meter.toString()) : null,
        total_reports: cluster.total_reports,
        total_fatalities: cluster.total_fatalities,
        total_injured: cluster.total_injured,
        total_missing: cluster.total_missing,
        total_evacuees: cluster.total_evacuees,
        ai_prompt: cluster.ai_prompt,
        ai_recommendation: cluster.ai_recommendation,
        reports: reports,
      };
    });

    res.json(serialize({
      success: true,
      session: {
        id: session.id,
        province: session.provinces?.name || null,
        algorithm: session.algorithm,
        start_date: session.start_date.toISOString().split('T')[0],
        end_date: session.end_date.toISOString().split('T')[0],
        silhouette_score: session.silhouette_score,
        davies_bouldin_index: session.davies_bouldin_index,
        calinski_harabasz_index: session.calinski_harabasz_index,
        total_reports_processed: session.total_reports_processed,
      },
      clusters: formattedClusters,
      sar_bases: sarBases.map(b => ({
        id: b.id,
        name: b.name,
        latitude: parseFloat(b.latitude.toString()),
        longitude: parseFloat(b.longitude.toString()),
      })),
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * GET /api/public/sessions/:id/report
 * Returns full detailed printable report for a clustering session.
 * Replicates ClusterReportController.php (show)
 */
router.get('/sessions/:id/report', async (req, res) => {
  try {
    const sessionId = BigInt(req.params.id);

    const session = await prisma.clustering_sessions.findUnique({
      where: { id: sessionId },
      include: {
        provinces: true,
        spatial_clusters: {
          include: {
            report_cluster: {
              include: {
                reports: {
                  include: {
                    report_photos: true,
                    sar_recommendations: {
                      include: {
                        sar_bases: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!session) {
      return res.status(404).json({ success: false, message: 'Clustering session tidak ditemukan.' });
    }

    // Sort clusters by priority: red, yellow, green
    const priorityOrder = { red: 0, yellow: 1, green: 2 };
    const sortedClusters = [...session.spatial_clusters].sort((a, b) => {
      const rankA = priorityOrder[a.priority_level] ?? 99;
      const rankB = priorityOrder[b.priority_level] ?? 99;
      return rankA - rankB;
    });

    // Aggregate session-level totals
    let totalFatalities = 0;
    let totalInjured = 0;
    let totalMissing = 0;
    let totalEvacuees = 0;
    let totalReports = 0;

    const formattedClusters = sortedClusters.map(cluster => {
      totalFatalities += cluster.total_fatalities;
      totalInjured += cluster.total_injured;
      totalMissing += cluster.total_missing;
      totalEvacuees += cluster.total_evacuees;
      totalReports += cluster.total_reports;

      const reports = cluster.report_cluster.map(rc => {
        const report = rc.reports;
        return {
          id: report.id,
          category: report.category,
          reporter_name: report.reporter_name,
          reporter_address: report.reporter_address,
          latitude: parseFloat(report.latitude.toString()),
          longitude: parseFloat(report.longitude.toString()),
          description: report.description,
          overall_severity: report.overall_severity,
          fatalities: report.fatalities,
          injured: report.injured,
          missing: report.missing,
          evacuees: report.evacuees,
          created_at: report.created_at,
          photos: report.report_photos.map(p => ({
            url: `/storage/${p.photo_path}`,
            severity: p.severity,
            confidence_score: p.confidence_score,
          })),
          recommendations: report.sar_recommendations
            .map(r => ({
              sar_base_name: r.sar_bases?.name || null,
              distance_km: parseFloat(r.distance_km.toString()),
              rank: r.rank,
            }))
            .sort((a, b) => a.rank - b.rank),
        };
      });

      return {
        id: cluster.id,
        name: cluster.name,
        priority_level: cluster.priority_level,
        centroid_lat: parseFloat(cluster.centroid_lat.toString()),
        centroid_long: parseFloat(cluster.centroid_long.toString()),
        radius_meter: cluster.radius_meter ? parseFloat(cluster.radius_meter.toString()) : null,
        total_reports: cluster.total_reports,
        total_fatalities: cluster.total_fatalities,
        total_injured: cluster.total_injured,
        total_missing: cluster.total_missing,
        total_evacuees: cluster.total_evacuees,
        ai_recommendation: cluster.ai_recommendation,
        reports: reports,
      };
    });

    res.json(serialize({
      success: true,
      session: {
        id: session.id,
        province: session.provinces?.name || null,
        algorithm: session.algorithm,
        start_date: session.start_date.toISOString().split('T')[0],
        end_date: session.end_date.toISOString().split('T')[0],
        silhouette_score: session.silhouette_score,
        davies_bouldin_index: session.davies_bouldin_index,
        calinski_harabasz_index: session.calinski_harabasz_index,
        total_reports_processed: session.total_reports_processed,
      },
      clusters: formattedClusters,
      totals: {
        totalFatalities,
        totalInjured,
        totalMissing,
        totalEvacuees,
        totalReports,
      },
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/public/reports
 * Submits a new public report and uploads photos.
 * Replicates PublicReportController.php (store)
 */
router.post('/reports', upload.array('photos', 10), async (req, res) => {
  try {
    const {
      province_id,
      reporter_name,
      reporter_phone,
      reporter_address,
      category,
      latitude,
      longitude,
      description,
      fatalities,
      injured,
      missing,
      evacuees,
    } = req.body;

    // Basic Validation
    if (!province_id || !reporter_name || !category || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Parameter utama (province_id, reporter_name, category, latitude, longitude) wajib diisi.',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Minimal satu foto harus diunggah.',
      });
    }

    const provinceId = BigInt(province_id);

    // Validate if province exists
    const provinceExists = await prisma.provinces.findUnique({
      where: { id: provinceId },
    });
    if (!provinceExists) {
      return res.status(400).json({ success: false, message: 'Provinsi tidak valid.' });
    }

    // Create Report transactionally with Photos
    const newReport = await prisma.$transaction(async (tx) => {
      const now = new Date();

      const report = await tx.reports.create({
        data: {
          province_id: provinceId,
          reporter_name,
          reporter_phone: reporter_phone || null,
          reporter_address: reporter_address || null,
          category,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          description: description || null,
          overall_severity: 'unknown',
          status: 'pending',
          fatalities: parseInt(fatalities || '0', 10),
          injured: parseInt(injured || '0', 10),
          missing: parseInt(missing || '0', 10),
          evacuees: parseInt(evacuees || '0', 10),
          created_at: now,
          updated_at: now,
        },
      });

      // Insert photos records
      const photoRecords = req.files.map(file => {
        // Path should match Laravel: 'reports/photos/filename' relative to storage/app/public
        const relativePath = `reports/photos/${file.filename}`;
        return {
          report_id: report.id,
          photo_path: relativePath,
          severity: 'unknown',
          created_at: now,
          updated_at: now,
        };
      });

      await tx.report_photos.createMany({
        data: photoRecords,
      });

      return report;
    });

    // Fetch the created photo records to get their IDs
    const createdPhotos = await prisma.report_photos.findMany({
      where: { report_id: newReport.id },
    });

    // Dispatch asynchronous ML inference for each photo (Replicates Observer logic)
    createdPhotos.forEach(photo => {
      // Async trigger, does not block the response
      pythonMlService.predictDamage(photo.id).catch(err => {
        console.error(`Deferred inference triggering failed for photo #${photo.id}: ${err.message}`);
      });
    });

    res.json(serialize({
      success: true,
      message: `Laporan Anda berhasil dikirim! ID Laporan: #${newReport.id}. Tim kami akan segera menindaklanjuti.`,
      report_id: newReport.id,
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
