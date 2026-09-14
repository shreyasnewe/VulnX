/**
 * Scanner Service
 * Orchestrates execution of the Python security scanner script.
 */
import { spawn } from 'child_process';
import path from 'path';
import { executeNodeScan } from './nodeScannerFallback.js';

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

  /**
   * Attempts to execute the Python scanner with candidate binary names ('py', 'python', 'python3', or PYTHON_PATH env).
   */
  private static trySpawnPython(
    pythonBin: string,
    targetUrl: string,
    timeoutMs: number
  ): Promise<ScannerOutput> {
    return new Promise((resolve, reject) => {
      let isDone = false;
      const pythonProcess = spawn(pythonBin, [this.scannerScriptPath, '--url', targetUrl], {
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
        if (!isDone) {
          isDone = true;
          reject(new Error(`Failed to invoke Python executable '${pythonBin}': ${err.message}`));
        }
      });

      pythonProcess.on('close', (code) => {
        if (isDone) return;
        isDone = true;

        // Windows error code 9009 means command/executable not found
        if (code === 9009 || (stderrData.includes('Python was not found') && !stdoutData.trim())) {
          return reject(
            new Error(
              `Python executable '${pythonBin}' not found on system path (code ${code}). Stderr: ${stderrData.trim()}`
            )
          );
        }

        if (!stdoutData.trim()) {
          return reject(
            new Error(`Scanner exited with code ${code} without output. Stderr: ${stderrData}`)
          );
        }

        try {
          const parsed: ScannerOutput = JSON.parse(stdoutData.trim());
          resolve(parsed);
        } catch (jsonErr: any) {
          reject(
            new Error(`Failed to parse scanner output JSON: ${jsonErr.message}. Output was: ${stdoutData}`)
          );
        }
      });
    });
  }

  public static async executeScan(targetUrl: string, timeoutMs = 60000): Promise<ScannerOutput> {
    // List of candidate python commands to try on Windows / Linux / macOS
    const customBin = process.env.PYTHON_PATH;
    const candidates = customBin
      ? [customBin, 'py', 'python', 'python3']
      : process.platform === 'win32'
      ? ['py', 'python', 'python3']
      : ['python3', 'python'];

    let lastError: any = null;

    for (const bin of candidates) {
      try {
        const result = await this.trySpawnPython(bin, targetUrl, timeoutMs);
        console.log(`[VulnX Scanner] Successfully completed scan using Python binary: '${bin}'`);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || '';
        // If Python was not found, try next candidate
        if (
          msg.includes('not found') ||
          msg.includes('ENOENT') ||
          msg.includes('code 9009') ||
          msg.includes('App execution aliases')
        ) {
          continue;
        } else {
          // If Python ran but threw a different error (e.g. invalid arguments), fail early
          break;
        }
      }
    }

    console.warn(
      `[VulnX Scanner] Python runtime unavailable (${lastError?.message || 'not found'}). Activating built-in Node.js VAPT Engine.`
    );

    // Automatic fallback: Run identical 7 non-destructive security checks in pure Node.js
    return await executeNodeScan(targetUrl);
  }
}

export default ScannerService;
