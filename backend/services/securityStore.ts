import { IFinding } from '../models/Finding';
import { IScan } from '../models/Scan';
import { ITarget } from '../models/Target';

export interface ScanRecord {
  id: string;
  targetId: string;
  targetUrl: string;
  targetName: string;
  status: 'Completed' | 'Running' | 'Failed' | 'Pending';
  startedAt: string;
  completedAt?: string;
  securityScore: number;
  totalFindings: number;
  severityDistribution: {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
    Informational: number;
  };
  checksExecuted: Array<{ name: string; status: string; error?: string }>;
  findings: FindingRecord[];
}

export interface FindingRecord {
  id: string;
  scanId: string;
  name: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  category: string;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  recommendation: string;
  urlTested: string;
  status: 'Open' | 'Mitigated' | 'False Positive';
  createdAt: string;
}

export interface TargetRecord {
  id: string;
  name: string;
  url: string;
  authorizationConfirmed: boolean;
  createdAt: string;
  lastScanned?: string;
  lastScore?: number;
  totalScans: number;
}

// Initial default targets & scans so the dashboard displays realistic security data right away
const initialTargets: TargetRecord[] = [
  {
    id: 'target-1',
    name: 'Production Portal',
    url: 'https://example.com',
    authorizationConfirmed: true,
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    lastScanned: 'Today',
    lastScore: 82,
    totalScans: 3
  },
  {
    id: 'target-2',
    name: 'Staging Environment',
    url: 'https://testsite.local',
    authorizationConfirmed: true,
    createdAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    lastScanned: 'Yesterday',
    lastScore: 91,
    totalScans: 5
  },
  {
    id: 'target-3',
    name: 'Customer API Gateway',
    url: 'https://api.gateway.internal',
    authorizationConfirmed: true,
    createdAt: new Date(Date.now() - 21 * 86400000).toISOString(),
    lastScanned: '3 days ago',
    lastScore: 68,
    totalScans: 2
  }
];

const initialScans: ScanRecord[] = [
  {
    id: 'scan-101',
    targetId: 'target-1',
    targetUrl: 'https://example.com',
    targetName: 'Production Portal',
    status: 'Completed',
    startedAt: new Date(Date.now() - 3600000).toISOString(),
    completedAt: new Date(Date.now() - 3550000).toISOString(),
    securityScore: 82,
    totalFindings: 4,
    severityDistribution: {
      Critical: 0,
      High: 1,
      Medium: 2,
      Low: 1,
      Informational: 0
    },
    checksExecuted: [
      { name: 'HTTPS & Transport Security', status: 'completed' },
      { name: 'Security Headers', status: 'completed' },
      { name: 'Cookie Security', status: 'completed' },
      { name: 'CORS Misconfiguration', status: 'completed' },
      { name: 'Information Disclosure', status: 'completed' },
      { name: 'Directory Listing Exposure', status: 'completed' },
      { name: 'Sensitive Files Exposure', status: 'completed' }
    ],
    findings: [
      {
        id: 'f-1',
        scanId: 'scan-101',
        name: 'Missing Content-Security-Policy (CSP) Header',
        severity: 'Medium',
        category: 'Security Headers',
        confidence: 'High',
        description: 'The Content-Security-Policy (CSP) HTTP response header was not provided. This header helps mitigate Cross-Site Scripting (XSS) and data injection attacks.',
        evidence: "HTTP response headers missing 'Content-Security-Policy'.",
        recommendation: "Implement a Content-Security-Policy header specifying trusted script, style, and object sources (e.g. default-src 'self').",
        urlTested: 'https://example.com',
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'f-2',
        scanId: 'scan-101',
        name: 'Missing Anti-Clickjacking Header (X-Frame-Options)',
        severity: 'Medium',
        category: 'Security Headers',
        confidence: 'High',
        description: 'The response lacks the X-Frame-Options header and frame-ancestors directive, allowing unauthorized websites to frame this page in an iframe.',
        evidence: "Missing 'X-Frame-Options' header in server response.",
        recommendation: "Add 'X-Frame-Options: DENY' or 'SAMEORIGIN' to protect users against UI redress and clickjacking.",
        urlTested: 'https://example.com',
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'f-3',
        scanId: 'scan-101',
        name: 'Missing Cookie HttpOnly Flag',
        severity: 'High',
        category: 'Cookie Security',
        confidence: 'High',
        description: 'One or more session cookies were set without the HttpOnly attribute, allowing client-side scripts to access sensitive session identifiers.',
        evidence: "Set-Cookie: session_id=abc8491...; Path=/; Secure (Missing 'HttpOnly')",
        recommendation: 'Configure session cookies with the HttpOnly attribute to prevent script access in the event of an XSS vulnerability.',
        urlTested: 'https://example.com',
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 'f-4',
        scanId: 'scan-101',
        name: 'Server Version Disclosure',
        severity: 'Low',
        category: 'Information Disclosure',
        confidence: 'High',
        description: 'The web server discloses its software name and version in HTTP headers, providing potential attackers with reconnaissance details.',
        evidence: "Server: cloudflare / nginx/1.22.1",
        recommendation: 'Configure web server to suppress or genericize the Server response header.',
        urlTested: 'https://example.com',
        status: 'Open',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]
  },
  {
    id: 'scan-102',
    targetId: 'target-2',
    targetUrl: 'https://testsite.local',
    targetName: 'Staging Environment',
    status: 'Completed',
    startedAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86350000).toISOString(),
    securityScore: 91,
    totalFindings: 2,
    severityDistribution: {
      Critical: 0,
      High: 0,
      Medium: 1,
      Low: 1,
      Informational: 0
    },
    checksExecuted: [
      { name: 'HTTPS & Transport Security', status: 'completed' },
      { name: 'Security Headers', status: 'completed' },
      { name: 'Cookie Security', status: 'completed' },
      { name: 'CORS Misconfiguration', status: 'completed' },
      { name: 'Information Disclosure', status: 'completed' },
      { name: 'Directory Listing Exposure', status: 'completed' },
      { name: 'Sensitive Files Exposure', status: 'completed' }
    ],
    findings: [
      {
        id: 'f-5',
        scanId: 'scan-102',
        name: 'Missing X-Content-Type-Options Header',
        severity: 'Low',
        category: 'Security Headers',
        confidence: 'High',
        description: "Without 'X-Content-Type-Options: nosniff', older browsers may attempt to MIME-sniff response content.",
        evidence: "Header 'X-Content-Type-Options' is not set.",
        recommendation: "Add 'X-Content-Type-Options: nosniff' header to all HTTP responses.",
        urlTested: 'https://testsite.local',
        status: 'Open',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 'f-6',
        scanId: 'scan-102',
        name: 'Permissive CORS Wildcard Configured',
        severity: 'Medium',
        category: 'CORS Misconfiguration',
        confidence: 'High',
        description: 'The server returns Access-Control-Allow-Origin: * for authenticated or data-bearing endpoints.',
        evidence: 'Access-Control-Allow-Origin: * returned with credentials requested.',
        recommendation: 'Restrict CORS origins to authorized partner domains rather than wildcard origins.',
        urlTested: 'https://testsite.local',
        status: 'Open',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  }
];

class SecurityStore {
  private targets: TargetRecord[] = [...initialTargets];
  private scans: ScanRecord[] = [...initialScans];

  // Target Methods
  public getTargets(): TargetRecord[] {
    return this.targets;
  }

  public getTargetById(id: string): TargetRecord | undefined {
    return this.targets.find(t => t.id === id);
  }

  public addTarget(name: string, url: string, authorizationConfirmed: boolean): TargetRecord {
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const newTarget: TargetRecord = {
      id: `target-${Date.now()}`,
      name: name.trim(),
      url: cleanUrl,
      authorizationConfirmed,
      createdAt: new Date().toISOString(),
      totalScans: 0
    };
    this.targets.unshift(newTarget);
    return newTarget;
  }

  public deleteTarget(id: string): boolean {
    const initialLen = this.targets.length;
    this.targets = this.targets.filter(t => t.id !== id);
    return this.targets.length < initialLen;
  }

  // Scan Methods
  public getScans(): ScanRecord[] {
    return this.scans;
  }

  public getScanById(id: string): ScanRecord | undefined {
    return this.scans.find(s => s.id === id);
  }

  public addScan(scanData: Omit<ScanRecord, 'id'>): ScanRecord {
    const newScan: ScanRecord = {
      ...scanData,
      id: `scan-${Date.now()}`
    };
    // Attach scan ID to all findings
    newScan.findings = newScan.findings.map((f, i) => ({
      ...f,
      id: f.id || `f-${Date.now()}-${i}`,
      scanId: newScan.id,
      createdAt: f.createdAt || new Date().toISOString()
    }));

    this.scans.unshift(newScan);

    // Update target last scan info if matching target found
    const target = this.targets.find(t => t.id === newScan.targetId || t.url === newScan.targetUrl);
    if (target) {
      target.lastScanned = 'Just now';
      target.lastScore = newScan.securityScore;
      target.totalScans += 1;
    }

    return newScan;
  }

  // Findings Methods
  public getAllFindings(): FindingRecord[] {
    const all: FindingRecord[] = [];
    for (const scan of this.scans) {
      all.push(...scan.findings);
    }
    return all;
  }

  // Dashboard Metrics
  public getMetrics() {
    const targetsCount = this.targets.length;
    const scansCount = this.scans.length;
    const allFindings = this.getAllFindings();
    const findingsCount = allFindings.length;

    // Calculate overall average score
    const avgScore = this.scans.length > 0
      ? Math.round(this.scans.reduce((acc, s) => acc + s.securityScore, 0) / this.scans.length)
      : 100;

    // Severity counts
    const severityCount = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
      Informational: 0
    };

    allFindings.forEach(f => {
      if (severityCount[f.severity] !== undefined) {
        severityCount[f.severity]++;
      }
    });

    return {
      targetsCount,
      scansCount,
      findingsCount,
      overallScore: avgScore,
      severityDistribution: severityCount,
      recentScans: this.scans.slice(0, 5),
      recentFindings: allFindings.slice(0, 6)
    };
  }
}

export const securityStore = new SecurityStore();
export default securityStore;
