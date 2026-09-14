import { Router } from 'express';
import {
  getDashboardMetrics,
  getTargets,
  createTarget,
  deleteTarget,
  getScans,
  getScanById,
  runNewScan,
  deleteScan,
  getFindings,
  updateFindingStatus,
  getReports,
  downloadScanReportPdf,
  getSystemStatus
} from '../controllers/securityController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// Dashboard Metrics
router.get('/dashboard/metrics', authMiddleware, getDashboardMetrics);

// Targets
router.get('/targets', authMiddleware, getTargets);
router.post('/targets', authMiddleware, createTarget);
router.delete('/targets/:id', authMiddleware, deleteTarget);

// Scans
router.get('/scans', authMiddleware, getScans);
router.get('/scans/:id', authMiddleware, getScanById);
router.post('/scans', authMiddleware, runNewScan);
router.delete('/scans/:id', authMiddleware, deleteScan);

// Findings
router.get('/findings', authMiddleware, getFindings);
router.put('/findings/:id/status', authMiddleware, updateFindingStatus);

// Reports & PDF
router.get('/reports', authMiddleware, getReports);
router.get('/reports/:scanId/pdf', authMiddleware, downloadScanReportPdf);

// Settings
router.get('/settings/system-status', authMiddleware, getSystemStatus);

export default router;
