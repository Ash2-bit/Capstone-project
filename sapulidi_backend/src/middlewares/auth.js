import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sapulidiku-super-secret-jwt-key-2026';

/**
 * Authentication middleware to verify JWT token.
 * Secures all REST endpoints under /api/admin/*.
 */
export function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
    });
  }

  const token = authHeader.split(' ')[1]; // Extract token from "Bearer <TOKEN>"

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Format token tidak valid.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Attach user payload to request
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token kedaluwarsa atau tidak valid.',
    });
  }
}
