export type SeverityLevel = 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';

export interface Finding {
  id?: string;
  scanId?: string;
  name: string;
  category: string;
  severity: SeverityLevel;
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  recommendation: string;
  urlTested: string;
  status: string;
  createdAt?: string;
}

export interface SeverityDistribution {
  Critical: number;
  High: number;
  Medium: number;
  Low: number;
  Informational: number;
}

export interface Target {
  id: string;
  name: string;
  url: string;
  authorizationConfirmed: boolean;
  createdAt: string;
  lastScanned?: string;
  lastScore?: number;
  totalScans: number;
}

export interface Scan {
  id: string;
  targetId: string;
  targetUrl: string;
  targetName: string;
  status: 'Completed' | 'Running' | 'Failed' | 'Pending';
  startedAt: string;
  completedAt?: string;
  securityScore: number;
  totalFindings: number;
  severityDistribution: SeverityDistribution;
  checksExecuted: Array<{ name: string; status: string; error?: string }>;
  findings: Finding[];
}

export interface DashboardMetrics {
  targetsCount: number;
  scansCount: number;
  findingsCount: number;
  overallScore: number;
  severityDistribution: SeverityDistribution;
  recentScans: Scan[];
  recentFindings: Finding[];
}

export interface SystemSimpleStatus {
  api: string;
  database: string;
  scanner: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}

export interface ReportItem {
  id: string;
  scanId: string;
  targetName: string;
  targetUrl: string;
  securityScore: number;
  totalFindings: number;
  generatedAt: string;
  downloadUrl: string;
}
