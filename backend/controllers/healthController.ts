import { Request, Response } from 'express';
import { dbStatus } from '../config/db';
import ScannerService from '../services/scannerService';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const getHealth = async (req: Request, res: Response) => {
  let pythonInfo = 'Unknown';
  let pythonReady = false;

  try {
    const { stdout } = await execPromise('python3 --version');
    pythonInfo = stdout.trim();
    pythonReady = true;
  } catch (err: any) {
    pythonInfo = `Error: ${err.message}`;
  }

  res.json({
    status: 'online',
    platform: 'VulnX Automated VAPT Platform',
    version: '1.0.0-Phase1',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    database: {
      status: dbStatus.connected ? 'connected' : 'disconnected',
      uri: dbStatus.uri,
      lastAttempt: dbStatus.lastAttempt,
      error: dbStatus.error || null,
      mode: dbStatus.connected ? 'live_mongodb' : 'fallback_in_memory'
    },
    scanner: {
      engine: 'Python 3.10+ Native Engine',
      pythonVersion: pythonInfo,
      ready: pythonReady,
      modulesCount: 7,
      registeredModules: [
        { id: 'https_check', name: 'HTTPS & SSL/TLS Verification', targetPort: 443 },
        { id: 'headers_check', name: 'Security Defense Headers (CSP, HSTS, X-Frame-Options, X-Content-Type)', targetPort: '80/443' },
        { id: 'cookie_check', name: 'Cookie Security Flags (Secure, HttpOnly, SameSite)', targetPort: '80/443' },
        { id: 'cors_check', name: 'CORS Misconfiguration & Origin Reflection', targetPort: '80/443' },
        { id: 'info_check', name: 'Information Disclosure & Banner Grabbing', targetPort: '80/443' },
        { id: 'directory_check', name: 'Directory Listing Exposure Prober', targetPort: '80/443' },
        { id: 'sensitive_files_check', name: 'Sensitive Files Scanner (/.env, /.git/HEAD, robots.txt, sitemap.xml)', targetPort: '80/443' }
      ]
    }
  });
};

export const runTestScan = async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Please provide a valid URL to test.' });
  }

  try {
    const result = await ScannerService.executeScan(url);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Scan execution failed'
    });
  }
};
