import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';
import { pythonMlService } from '../services/pythonMlService.js';
import { serialize } from '../utils/serializer.js';
import { verifyToken } from '../middlewares/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sapulidiku-super-secret-jwt-key-2026';

const router = express.Router();

// ==========================================
// 0. ADMIN LOGIN ENDPOINT (Public)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email dan password wajib diisi.' });
    }

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    // Verify Laravel Bcrypt hashed password
    const isPasswordValid = bcrypt.compareSync(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    // Generate token
    const token = jwt.sign(
      {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json(serialize({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      message: 'Login berhasil.',
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Protect all below CRUD routes
router.use(verifyToken);

// ==========================================
// 1. PROVINCES CRUD
// ==========================================

router.get('/provinces', async (req, res) => {
  try {
    const provinces = await prisma.provinces.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(serialize({ success: true, data: provinces }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/provinces', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama provinsi wajib diisi.' });

    const now = new Date();
    const newProvince = await prisma.provinces.create({
      data: { name, created_at: now, updated_at: now },
    });
    res.json(serialize({ success: true, data: newProvince }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/provinces/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Nama provinsi wajib diisi.' });

    const updated = await prisma.provinces.update({
      where: { id },
      data: { name, updated_at: new Date() },
    });
    res.json(serialize({ success: true, data: updated }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/provinces/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.provinces.delete({ where: { id } });
    res.json({ success: true, message: 'Provinsi berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. SAR BASES CRUD
// ==========================================

router.get('/sar-bases', async (req, res) => {
  try {
    const sarBases = await prisma.sar_bases.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(serialize({ success: true, data: sarBases }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/sar-bases', async (req, res) => {
  try {
    const { name, address, latitude, longitude, contact_number } = req.body;
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Nama, alamat, latitude, dan longitude wajib diisi.' });
    }

    const now = new Date();
    const newBase = await prisma.sar_bases.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contact_number: contact_number || null,
        created_at: now,
        updated_at: now,
      },
    });
    res.json(serialize({ success: true, data: newBase }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/sar-bases/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { name, address, latitude, longitude, contact_number } = req.body;
    if (!name || !address || !latitude || !longitude) {
      return res.status(400).json({ success: false, message: 'Nama, alamat, latitude, dan longitude wajib diisi.' });
    }

    const updated = await prisma.sar_bases.update({
      where: { id },
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        contact_number: contact_number || null,
        updated_at: new Date(),
      },
    });
    res.json(serialize({ success: true, data: updated }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/sar-bases/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.sar_bases.delete({ where: { id } });
    res.json({ success: true, message: 'Basis SAR berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. REPORTS CRUD
// ==========================================

router.get('/reports', async (req, res) => {
  try {
    const reports = await prisma.reports.findMany({
      include: {
        provinces: { select: { name: true } },
        report_photos: true,
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(serialize({ success: true, data: reports }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/reports/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const report = await prisma.reports.findUnique({
      where: { id },
      include: {
        provinces: true,
        report_photos: true,
        sar_recommendations: {
          include: {
            sar_bases: true,
          },
        },
      },
    });

    if (!report) return res.status(404).json({ success: false, message: 'Laporan tidak ditemukan.' });

    res.json(serialize({ success: true, data: report }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/reports/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { status, overall_severity, fatalities, injured, missing, evacuees } = req.body;

    const updated = await prisma.reports.update({
      where: { id },
      data: {
        status: status || undefined,
        overall_severity: overall_severity || undefined,
        fatalities: fatalities !== undefined ? parseInt(fatalities, 10) : undefined,
        injured: injured !== undefined ? parseInt(injured, 10) : undefined,
        missing: missing !== undefined ? parseInt(missing, 10) : undefined,
        evacuees: evacuees !== undefined ? parseInt(evacuees, 10) : undefined,
        updated_at: new Date(),
      },
    });

    res.json(serialize({ success: true, data: updated, message: 'Laporan berhasil diperbarui.' }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/reports/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.reports.delete({ where: { id } });
    res.json({ success: true, message: 'Laporan berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. CLUSTERING SESSIONS CRUD
// ==========================================

router.get('/sessions', async (req, res) => {
  try {
    const sessions = await prisma.clustering_sessions.findMany({
      include: {
        provinces: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });
    res.json(serialize({ success: true, data: sessions }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/sessions/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const session = await prisma.clustering_sessions.findUnique({
      where: { id },
      include: {
        provinces: true,
        spatial_clusters: {
          include: {
            report_cluster: {
              include: {
                reports: true,
              },
            },
          },
        },
      },
    });

    if (!session) return res.status(404).json({ success: false, message: 'Sesi clustering tidak ditemukan.' });

    res.json(serialize({ success: true, data: session }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * POST /api/admin/sessions
 * Creates a new clustering session and automatically triggers spatial clustering on FastAPI in background.
 * Replicates Filament ClusteringSession create action.
 */
router.post('/sessions', async (req, res) => {
  try {
    const { province_id, algorithm, parameters, start_date, end_date } = req.body;

    if (!province_id || !algorithm || !start_date || !end_date) {
      return res.status(400).json({
        success: false,
        message: 'Parameter utama (province_id, algorithm, start_date, end_date) wajib diisi.',
      });
    }

    const provinceId = BigInt(province_id);

    // Ensure province exists
    const provinceExists = await prisma.provinces.findUnique({ where: { id: provinceId } });
    if (!provinceExists) {
      return res.status(400).json({ success: false, message: 'Provinsi tidak ditemukan.' });
    }

    const now = new Date();
    const newSession = await prisma.clustering_sessions.create({
      data: {
        province_id: provinceId,
        algorithm,
        parameters: parameters ? JSON.stringify(parameters) : '{}',
        start_date: new Date(start_date),
        end_date: new Date(end_date),
        created_at: now,
        updated_at: now,
      },
    });

    // Trigger clustering asynchronously (Replicates Laravel queue Job dispatch)
    pythonMlService.processClustering(newSession.id).catch(err => {
      console.error(`Deferred clustering execution failed for session #${newSession.id}: ${err.message}`);
    });

    res.json(serialize({
      success: true,
      data: newSession,
      message: 'Sesi clustering berhasil dibuat dan proses pengelompokan sedang berjalan di latar belakang.',
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/sessions/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    await prisma.clustering_sessions.delete({ where: { id } });
    res.json({ success: true, message: 'Sesi clustering berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. USERS CRUD
// ==========================================

router.get('/users', async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(serialize({ success: true, data: users }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Nama, email, dan password wajib diisi.' });
    }

    const emailExists = await prisma.users.findUnique({ where: { email } });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email sudah terdaftar.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const now = new Date();
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
        created_at: now,
        updated_at: now,
      },
    });

    res.json(serialize({
      success: true,
      data: newUser,
      message: 'User berhasil ditambahkan.',
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);
    const { name, email, password } = req.body;

    if (!name || !email) {
      return res.status(400).json({ success: false, message: 'Nama dan email wajib diisi.' });
    }

    const emailExists = await prisma.users.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email sudah digunakan oleh user lain.' });
    }

    const updateData = {
      name,
      email,
      updated_at: new Date(),
    };

    if (password && password.trim() !== '') {
      updateData.password = bcrypt.hashSync(password, 10);
    }

    const updated = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    res.json(serialize({
      success: true,
      data: updated,
      message: 'User berhasil diperbarui.',
    }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    const id = BigInt(req.params.id);

    // Prevent self-deletion
    if (req.user && req.user.id === id.toString()) {
      return res.status(400).json({ success: false, message: 'Anda tidak dapat menghapus akun Anda sendiri.' });
    }

    await prisma.users.delete({ where: { id } });
    res.json({ success: true, message: 'User berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
