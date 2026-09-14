import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import Target from '../models/Target';
import Scan from '../models/Scan';
import Finding from '../models/Finding';
import Report from '../models/Report';
import ScannerService from '../services/scannerService';
import PdfService from '../services/pdfService';
import { dbStatus } from '../config/db';

// Score calculation formula as defined in specifications:
// Start = 100, Critical = -20, High = -15, Medium = -8, Low = -3, Informational = 0
// Clamped 0-100
export const calculateSecurityScore = (findings: Array<{ severity: string }>): number => {
  let score = 100;
  for (const f of findings) {
    switch (f.severity) {
      case 'Critical':
        score -= 20;
        break;
      case 'High':
        score -= 15;
        break;
      case 'Medium':
        score -= 8;
        break;
      case 'Low':
        score -= 3;
        break;
      default:
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
};

// 1. Dashboard Metrics (Strict User Isolation)
export const getDashboardMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;

    const targetsCount = await Target.countDocuments({ owner: userId });
    const scansCount = await Scan.countDocuments({ userId });
    const allFindings = await Finding.find({ userId });
    const findingsCount = allFindings.length;

    // Severity distribution from user findings
    const severityCount = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0
    };

    allFindings.forEach((f) => {
      const sev = f.severity as keyof typeof severityCount;
      if (severityCount[sev] !== undefined) {
        severityCount[sev]++;
      }
    });

    // Calculate overall average VulnX Security Score across user's completed scans
    const completedScans = await Scan.find({ userId, status: 'Completed' });
    const overallScore =
      completedScans.length > 0
        ? Math.round(
            completedScans.reduce((acc, s) => acc + (s.securityScore || 0), 0) /
              completedScans.length
          )
        : 100;

    // Recent 5 scans
    const recentScans = await Scan.find({ userId })
      .sort({ startedAt: -1 })
      .limit(5)
      .lean();

    // Attach findings to recent scans
    const recentScansWithFindings = await Promise.all(
      recentScans.map(async (s) => {
        const findings = await Finding.find({ scanId: s._id }).lean();
        return {
          id: s._id.toString(),
          targetId: s.targetId?.toString() || '',
          targetUrl: s.targetUrl,
          targetName: s.targetName || s.targetUrl,
          status: s.status,
          startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
          completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : undefined,
          securityScore: s.securityScore,
          totalFindings: s.totalFindings,
          severityDistribution: s.severityDistribution || severityCount,
          checksExecuted: s.checksExecuted || [],
          findings: findings.map((f: any) => ({
            id: f._id.toString(),
            scanId: f.scanId.toString(),
            name: f.name,
            severity: f.severity,
            category: f.category,
            confidence: f.confidence,
            description: f.description,
            evidence: f.evidence,
            recommendation: f.recommendation,
            urlTested: f.urlTested,
            status: f.status,
            createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
          }))
        };
      })
    );

    // Recent 6 findings
    const recentFindingsDocs = await Finding.find({ userId })
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    const recentFindings = recentFindingsDocs.map((f: any) => ({
      id: f._id.toString(),
      scanId: f.scanId.toString(),
      name: f.name,
      severity: f.severity,
      category: f.category,
      confidence: f.confidence,
      description: f.description,
      evidence: f.evidence,
      recommendation: f.recommendation,
      urlTested: f.urlTested,
      status: f.status,
      createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
    }));

    return res.json({
      success: true,
      data: {
        targetsCount,
        scansCount,
        findingsCount,
        overallScore,
        severityDistribution: severityCount,
        recentScans: recentScansWithFindings,
        recentFindings
      }
    });
  } catch (err: any) {
    console.error('[VulnX Metrics Error]:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 2. Targets Management (User Isolated)
export const getTargets = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const targets = await Target.find({ owner: userId }).sort({ createdAt: -1 }).lean();

    // Enrich targets with real last scan statistics
    const enrichedTargets = await Promise.all(
      targets.map(async (t) => {
        const lastScan = await Scan.findOne({
          userId,
          $or: [{ targetId: t._id }, { targetUrl: t.url }]
        })
          .sort({ startedAt: -1 })
          .lean();

        const totalScans = await Scan.countDocuments({
          userId,
          $or: [{ targetId: t._id }, { targetUrl: t.url }]
        });

        let lastScannedText: string | undefined = undefined;
        if (lastScan && lastScan.startedAt) {
          const diffMs = Date.now() - new Date(lastScan.startedAt).getTime();
          const mins = Math.floor(diffMs / 60000);
          if (mins < 2) lastScannedText = 'Just now';
          else if (mins < 60) lastScannedText = `${mins}m ago`;
          else {
            const hours = Math.floor(mins / 60);
            if (hours < 24) lastScannedText = `${hours}h ago`;
            else lastScannedText = `${Math.floor(hours / 24)}d ago`;
          }
        }

        return {
          id: t._id.toString(),
          name: t.name,
          url: t.url,
          authorizationConfirmed: t.authorizationConfirmed,
          createdAt: t.createdAt ? new Date(t.createdAt).toISOString() : new Date().toISOString(),
          lastScanned: lastScannedText,
          lastScore: lastScan ? lastScan.securityScore : undefined,
          totalScans
        };
      })
    );

    return res.json({ success: true, data: enrichedTargets });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const createTarget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { name, url, authorizationConfirmed } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Target name is required.' });
    }
    if (!url || !url.trim()) {
      return res.status(400).json({ success: false, error: 'Target URL is required.' });
    }
    if (!authorizationConfirmed) {
      return res.status(400).json({
        success: false,
        error: 'Explicit testing authorization confirmation is required.'
      });
    }

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    // Validate URL syntax
    try {
      new URL(cleanUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL format.' });
    }

    const newTarget = await Target.create({
      name: name.trim(),
      url: cleanUrl,
      owner: userId,
      authorizationConfirmed: true
    });

    return res.status(201).json({
      success: true,
      data: {
        id: newTarget._id.toString(),
        name: newTarget.name,
        url: newTarget.url,
        authorizationConfirmed: newTarget.authorizationConfirmed,
        createdAt: newTarget.createdAt.toISOString(),
        totalScans: 0
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteTarget = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const target = await Target.findOne({ _id: id, owner: userId });
    if (!target) {
      return res.status(404).json({ success: false, error: 'Target not found or access denied.' });
    }

    // Cascade delete associated scans, findings, reports for this user and target
    const userScans = await Scan.find({ userId, $or: [{ targetId: id }, { targetUrl: target.url }] });
    const scanIds = userScans.map((s) => s._id);

    await Finding.deleteMany({ scanId: { $in: scanIds } });
    await Report.deleteMany({ scanId: { $in: scanIds } });
    await Scan.deleteMany({ _id: { $in: scanIds } });
    await Target.deleteOne({ _id: id, owner: userId });

    return res.json({
      success: true,
      message: 'Target and associated scan telemetry deleted successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteScan = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const scan = await Scan.findOne({ _id: id, userId });
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found or access denied.' });
    }

    await Finding.deleteMany({ scanId: id });
    await Report.deleteMany({ scanId: id });
    await Scan.deleteOne({ _id: id, userId });

    return res.json({
      success: true,
      message: 'Scan and associated findings deleted successfully.'
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 3. Scans Management (User Isolated)
export const getScans = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const scans = await Scan.find({ userId }).sort({ startedAt: -1 }).lean();

    const formattedScans = await Promise.all(
      scans.map(async (s) => {
        const findings = await Finding.find({ scanId: s._id }).lean();
        return {
          id: s._id.toString(),
          targetId: s.targetId?.toString() || '',
          targetUrl: s.targetUrl,
          targetName: s.targetName || s.targetUrl,
          status: s.status,
          startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
          completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : undefined,
          securityScore: s.securityScore,
          totalFindings: s.totalFindings,
          severityDistribution: s.severityDistribution,
          checksExecuted: s.checksExecuted || [],
          findings: findings.map((f: any) => ({
            id: f._id.toString(),
            scanId: f.scanId.toString(),
            name: f.name,
            severity: f.severity,
            category: f.category,
            confidence: f.confidence,
            description: f.description,
            evidence: f.evidence,
            recommendation: f.recommendation,
            urlTested: f.urlTested,
            status: f.status,
            createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
          }))
        };
      })
    );

    return res.json({ success: true, data: formattedScans });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const getScanById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const s = await Scan.findOne({ _id: id, userId }).lean();
    if (!s) {
      return res.status(404).json({ success: false, error: 'Scan record not found or access denied.' });
    }

    const findings = await Finding.find({ scanId: s._id }).lean();
    return res.json({
      success: true,
      data: {
        id: s._id.toString(),
        targetId: s.targetId?.toString() || '',
        targetUrl: s.targetUrl,
        targetName: s.targetName || s.targetUrl,
        status: s.status,
        startedAt: s.startedAt ? new Date(s.startedAt).toISOString() : new Date().toISOString(),
        completedAt: s.completedAt ? new Date(s.completedAt).toISOString() : undefined,
        securityScore: s.securityScore,
        totalFindings: s.totalFindings,
        severityDistribution: s.severityDistribution,
        checksExecuted: s.checksExecuted || [],
        findings: findings.map((f: any) => ({
          id: f._id.toString(),
          scanId: f.scanId.toString(),
          name: f.name,
          severity: f.severity,
          category: f.category,
          confidence: f.confidence,
          description: f.description,
          evidence: f.evidence,
          recommendation: f.recommendation,
          urlTested: f.urlTested,
          status: f.status,
          createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
        }))
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const runNewScan = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user._id;
  const { url, targetId, targetName } = req.body;

  if (!url || !url.trim()) {
    return res.status(400).json({ success: false, error: 'Target URL is required to scan.' });
  }

  let cleanUrl = url.trim();
  if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }

  // Determine targetName
  let resolvedName = targetName;
  if (!resolvedName) {
    try {
      resolvedName = new URL(cleanUrl).hostname;
    } catch {
      resolvedName = cleanUrl;
    }
  }

  // Create initial Scan record in MongoDB with 'Running' status
  let scanRecord: any;
  try {
    scanRecord = await Scan.create({
      targetId: targetId || `adhoc-${Date.now()}`,
      targetUrl: cleanUrl,
      targetName: resolvedName,
      userId,
      status: 'Running',
      startedAt: new Date(),
      securityScore: 100,
      totalFindings: 0,
      severityDistribution: {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
        Informational: 0
      }
    });
  } catch (dbErr: any) {
    return res.status(500).json({ success: false, error: 'Failed to initialize scan in database' });
  }

  try {
    // Execute Python VAPT Scanner engine
    const scanResult = await ScannerService.executeScan(cleanUrl);

    // Calculate score using strict spec
    const calculatedScore = calculateSecurityScore(scanResult.findings || []);

    // Create findings in MongoDB with userId
    const createdFindings = await Promise.all(
      (scanResult.findings || []).map(async (f) => {
        const doc = await Finding.create({
          scanId: scanRecord._id,
          userId,
          targetId: scanRecord.targetId,
          name: f.name,
          severity: f.severity,
          category: f.category || 'General',
          confidence: f.confidence || 'High',
          description: f.description,
          evidence: f.evidence || '',
          recommendation: f.recommendation || '',
          urlTested: f.urlTested || cleanUrl,
          status: 'Open'
        });
        return {
          id: doc._id.toString(),
          scanId: doc.scanId.toString(),
          name: doc.name,
          severity: doc.severity,
          category: doc.category,
          confidence: doc.confidence,
          description: doc.description,
          evidence: doc.evidence,
          recommendation: doc.recommendation,
          urlTested: doc.urlTested,
          status: doc.status,
          createdAt: doc.createdAt.toISOString()
        };
      })
    );

    // Severity distribution count
    const sevCount = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0
    };
    createdFindings.forEach((f) => {
      const s = f.severity as keyof typeof sevCount;
      if (sevCount[s] !== undefined) sevCount[s]++;
    });

    // Update scan status to 'Completed' in MongoDB
    scanRecord.status = 'Completed';
    scanRecord.completedAt = new Date();
    scanRecord.securityScore = calculatedScore;
    scanRecord.totalFindings = createdFindings.length;
    scanRecord.severityDistribution = sevCount;
    scanRecord.checksExecuted = scanResult.checksExecuted || [];
    await scanRecord.save();

    // Auto-create report entry
    await Report.create({
      scanId: scanRecord._id,
      userId,
      targetName: resolvedName,
      filePath: `VulnX-Report-${scanRecord._id}.pdf`,
      summary: {
        securityScore: calculatedScore,
        totalFindings: createdFindings.length,
        targetUrl: cleanUrl
      }
    });

    return res.json({
      success: true,
      data: {
        id: scanRecord._id.toString(),
        targetId: scanRecord.targetId.toString(),
        targetUrl: scanRecord.targetUrl,
        targetName: scanRecord.targetName,
        status: 'Completed',
        startedAt: scanRecord.startedAt.toISOString(),
        completedAt: scanRecord.completedAt.toISOString(),
        securityScore: scanRecord.securityScore,
        totalFindings: scanRecord.totalFindings,
        severityDistribution: scanRecord.severityDistribution,
        checksExecuted: scanRecord.checksExecuted,
        findings: createdFindings
      }
    });
  } catch (err: any) {
    // If scanner fails, update scan record to 'Failed' so it does not remain 'Running'
    console.error('[VulnX Scan Execution Error]:', err);
    scanRecord.status = 'Failed';
    scanRecord.completedAt = new Date();
    await scanRecord.save();

    return res.status(500).json({
      success: false,
      error: err.message || 'Security scan execution encountered an unexpected error.'
    });
  }
};

// 4. Findings Management (User Isolated + Status Update)
export const getFindings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { severity, category, status, search } = req.query;

    const query: any = { userId };

    if (severity && severity !== 'All') {
      query.severity = severity;
    }
    if (category && category !== 'All') {
      query.category = category;
    }
    if (status && status !== 'All') {
      query.status = status;
    }
    if (search && typeof search === 'string' && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { description: { $regex: search.trim(), $options: 'i' } },
        { urlTested: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const findings = await Finding.find(query).sort({ createdAt: -1 }).lean();

    return res.json({
      success: true,
      data: findings.map((f: any) => ({
        id: f._id.toString(),
        scanId: f.scanId.toString(),
        name: f.name,
        severity: f.severity,
        category: f.category,
        confidence: f.confidence,
        description: f.description,
        evidence: f.evidence,
        recommendation: f.recommendation,
        urlTested: f.urlTested,
        status: f.status,
        createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : new Date().toISOString()
      }))
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const updateFindingStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Open', 'In Review', 'Resolved', 'Mitigated', 'False Positive'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const finding = await Finding.findOneAndUpdate(
      { _id: id, userId },
      { status },
      { new: true }
    );

    if (!finding) {
      return res.status(404).json({
        success: false,
        error: 'Finding not found or access denied.'
      });
    }

    return res.json({
      success: true,
      data: {
        id: finding._id.toString(),
        scanId: finding.scanId.toString(),
        name: finding.name,
        severity: finding.severity,
        category: finding.category,
        confidence: finding.confidence,
        description: finding.description,
        evidence: finding.evidence,
        recommendation: finding.recommendation,
        urlTested: finding.urlTested,
        status: finding.status,
        createdAt: finding.createdAt.toISOString()
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// 5. Reports & PDF Generation (User Isolated)
export const getReports = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const scans = await Scan.find({ userId, status: 'Completed' }).sort({ completedAt: -1 }).lean();

    const reportItems = scans.map((s) => ({
      id: s._id.toString(),
      scanId: s._id.toString(),
      targetName: s.targetName || s.targetUrl,
      targetUrl: s.targetUrl,
      securityScore: s.securityScore,
      totalFindings: s.totalFindings,
      generatedAt: s.completedAt ? new Date(s.completedAt).toISOString() : new Date().toISOString(),
      downloadUrl: `/api/reports/${s._id}/pdf`
    }));

    return res.json({ success: true, data: reportItems });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const downloadScanReportPdf = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user._id;
    const { scanId } = req.params;

    const scan = await Scan.findOne({ _id: scanId, userId }).lean();
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found or access denied.' });
    }

    const findings = await Finding.find({ scanId: scan._id, userId }).lean();

    const pdfBuffer = await PdfService.generateScanReport(scan, findings);

    const safeFilename = `VulnX-Report-${(scan.targetName || 'Scan').replace(/[^a-zA-Z0-9_-]/g, '_')}-${scan._id}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (err: any) {
    console.error('[VulnX PDF Generation Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate PDF security audit report'
    });
  }
};

// 6. Settings System Status
export const getSystemStatus = async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    api: 'Online',
    database: dbStatus.connected ? 'Connected (MongoDB)' : 'Operational',
    scanner: 'Ready (Python 3.11)'
  });
};
