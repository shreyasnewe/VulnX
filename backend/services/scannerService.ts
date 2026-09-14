/**
 * Scanner Service
 * Orchestrates execution of the Python security scanner script.
 */
import { spawn } from 'child_process';
import path from 'path';

export interface ScanFindingResult {
  name: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Informational';
  confidence: 'High' | 'Medium' | 'Low';
  description: string;
  evidence: string;
  recommendation: string;
  urlTested: string;
  status: string;
}

export interface ScannerOutput {
  success: boolean;
  targetUrl: string;
  startedAt: string;
  completedAt: string;
  status: string;
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
  findings: ScanFindingResult[];
  error?: string;
}

export class ScannerService {
  private static scannerScriptPath = path.resolve(process.cwd(), 'scanner', 'scanner.py');

  public static async executeScan(targetUrl: string, timeoutMs = 60000): Promise<ScannerOutput> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [this.scannerScriptPath, '--url', targetUrl], {
        timeout: timeoutMs,
      });

      let stdoutData = '';
      let stderrData = '';

      pythonProcess.stdout.on('data', (chunk) => {
        stdoutData += chunk.toString();
      });

      pythonProcess.stderr.on('data', (chunk) => {
        stderrData += chunk.toString();
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to invoke Python scanner: ${err.message}`));
      });

      pythonProcess.on('close', (code) => {
        if (!stdoutData.trim()) {
          return reject(new Error(`Scanner exited with code ${code} without output. Stderr: ${stderrData}`));
        }

        try {
          const parsed: ScannerOutput = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (jsonErr: any) {
          reject(new Error(`Failed to parse scanner output JSON: ${jsonErr.message}. Output was: ${stdoutData}`));
        }
      });
    });
  }
}

export default ScannerService;
