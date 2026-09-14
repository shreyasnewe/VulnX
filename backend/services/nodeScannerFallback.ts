/**
 * Node.js Native Fallback Security Engine
 * VulnX - Web-Based Automated VAPT Platform
 *
 * Implements the same 7 non-destructive security checks in pure TypeScript/Node.js
 * when Python is not installed or configured on the host machine.
 */
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { ScannerOutput, ScanFindingResult } from './scannerService';

interface HttpResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: string;
}

const USER_AGENT = 'VulnX-Security-Scanner/1.0 (Safe Assessment; Node Engine)';

function makeRequest(
  targetUrl: string,
  options: {
    method?: string;
    timeout?: number;
    headers?: Record<string, string>;
  } = {}
): Promise<HttpResponse> {
  return new Promise((resolve, reject) => {
    try {
      const parsedUrl = new URL(targetUrl);
      const isHttps = parsedUrl.protocol === 'https:';
      const client = isHttps ? https : http;

      const reqOptions: http.RequestOptions = {
        protocol: parsedUrl.protocol,
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isHttps ? 443 : 80),
        path: parsedUrl.pathname + parsedUrl.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          ...(options.headers || {}),
        },
        timeout: options.timeout || 6000,
      };

      if (isHttps) {
        (reqOptions as https.RequestOptions).rejectUnauthorized = false; // Safe testing
      }

      const req = client.request(reqOptions, (res) => {
        let body = '';
        res.setEncoding('utf8');

        res.on('data', (chunk) => {
          body += chunk;
          // Cap body size to 256KB to keep memory safe
          if (body.length > 262144) {
            req.destroy();
          }
        });

        res.on('end', () => {
          const headers: Record<string, string | string[] | undefined> = {};
          for (const key of Object.keys(res.headers)) {
            headers[key.toLowerCase()] = res.headers[key];
          }
          resolve({
            statusCode: res.statusCode || 0,
            headers,
            body,
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timed out'));
      });

      req.on('error', (err) => {
        reject(err);
      });

      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

function calculateSecurityScore(findings: ScanFindingResult[]): number {
  let score = 100;
  const weights: Record<string, number> = {
    Critical: 20,
    High: 15,
    Medium: 8,
    Low: 3,
    Informational: 0,
  };
  for (const f of findings) {
    score -= weights[f.severity] ?? 3;
  }
  return Math.max(0, Math.min(100, score));
}

export async function executeNodeScan(targetUrl: string): Promise<ScannerOutput> {
  const startTime = new Date().toISOString();
  let normalizedUrl = targetUrl.trim();
  if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
    normalizedUrl = 'https://' + normalizedUrl;
  }
  normalizedUrl = normalizedUrl.replace(/\/+$/, '');

  const findings: ScanFindingResult[] = [];
  const checksExecuted: Array<{ name: string; status: string; error?: string }> = [];

  // Initial GET request to base target
  let baseResponse: HttpResponse | null = null;
  try {
    baseResponse = await makeRequest(normalizedUrl, { timeout: 8000 });
  } catch (err: any) {
    // If https fails, try http fallback
    if (normalizedUrl.startsWith('https://')) {
      try {
        const httpUrl = normalizedUrl.replace('https://', 'http://');
        baseResponse = await makeRequest(httpUrl, { timeout: 8000 });
        normalizedUrl = httpUrl;
      } catch {
        // keep baseResponse null
      }
    }
  }

  // 1. Check: HTTPS & Transport Security
  try {
    if (normalizedUrl.startsWith('http://')) {
      findings.push({
        name: 'Insecure Plaintext Transport (HTTP in use)',
        category: 'Transport Security',
        severity: 'High',
        confidence: 'High',
        description: 'The target application is accessible via unencrypted HTTP. Data transmitted over HTTP can be intercepted, read, or tampered with by adversaries in man-in-the-middle positions.',
        evidence: `Target URL protocol is unencrypted HTTP: ${normalizedUrl}`,
        recommendation: 'Enforce HTTPS via TLS 1.3/1.2 and configure automatic 301/308 redirects from HTTP to HTTPS.',
        urlTested: normalizedUrl,
        status: 'Open',
      });
    } else {
      // Test if HSTS exists on HTTPS
      const hsts = baseResponse?.headers['strict-transport-security'];
      if (!hsts) {
        findings.push({
          name: 'Missing HTTP Strict Transport Security (HSTS)',
          category: 'Transport Security',
          severity: 'Medium',
          confidence: 'High',
          description: 'HSTS tells browsers to only communicate over HTTPS, protecting users against SSL stripping and accidental insecure requests.',
          evidence: "Header 'Strict-Transport-Security' was not present in the HTTPS response.",
          recommendation: "Add header 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' in web server configuration.",
          urlTested: normalizedUrl,
          status: 'Open',
        });
      }
    }
    checksExecuted.push({ name: 'HTTPS & Transport Security', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'HTTPS & Transport Security', status: 'failed', error: err.message });
  }

  // 2. Check: Security Headers
  try {
    const headers = baseResponse?.headers || {};

    // CSP
    if (!headers['content-security-policy']) {
      findings.push({
        name: 'Missing Content-Security-Policy (CSP) Header',
        category: 'Security Headers',
        severity: 'Medium',
        confidence: 'High',
        description: 'Content-Security-Policy is an effective defense-in-depth header against Cross-Site Scripting (XSS), data injection, and unauthorized content embedding.',
        evidence: "Header 'Content-Security-Policy' was not found in the HTTP response headers.",
        recommendation: "Configure a restrictive Content-Security-Policy (e.g., default-src 'self'; script-src 'self'; object-src 'none').",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    // X-Frame-Options
    if (!headers['x-frame-options'] && !headers['content-security-policy']) {
      findings.push({
        name: 'Missing Anti-Clickjacking Header (X-Frame-Options)',
        category: 'Security Headers',
        severity: 'Medium',
        confidence: 'High',
        description: 'The page does not declare X-Frame-Options or frame-ancestors CSP directive, making it vulnerable to UI redress and Clickjacking attacks.',
        evidence: "Neither 'X-Frame-Options' header nor 'frame-ancestors' CSP directive was present in response headers.",
        recommendation: "Add header 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' to prevent framing in unauthorized domains.",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    // X-Content-Type-Options
    const nosniff = String(headers['x-content-type-options'] || '').toLowerCase();
    if (nosniff !== 'nosniff') {
      findings.push({
        name: 'Missing X-Content-Type-Options Header',
        category: 'Security Headers',
        severity: 'Low',
        confidence: 'High',
        description: 'Missing X-Content-Type-Options: nosniff allows browsers to perform MIME-sniffing, potentially executing malicious scripts masquerading as non-executable files.',
        evidence: `X-Content-Type-Options header value: '${headers['x-content-type-options'] || 'Not Set'}'`,
        recommendation: "Add header 'X-Content-Type-Options: nosniff' across all server responses.",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    // Referrer-Policy
    if (!headers['referrer-policy']) {
      findings.push({
        name: 'Missing Referrer-Policy Header',
        category: 'Security Headers',
        severity: 'Low',
        confidence: 'High',
        description: 'Without Referrer-Policy, user navigations may leak sensitive path or query parameters in the Referer header to external domains.',
        evidence: "Header 'Referrer-Policy' was not found in the response.",
        recommendation: "Implement header 'Referrer-Policy: strict-origin-when-cross-origin' or 'no-referrer'.",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    // Permissions-Policy
    if (!headers['permissions-policy'] && !headers['feature-policy']) {
      findings.push({
        name: 'Missing Permissions-Policy Header',
        category: 'Security Headers',
        severity: 'Low',
        confidence: 'Medium',
        description: 'Permissions-Policy allows developers to explicitly restrict browser features (camera, microphone, geolocation) that the application does not intend to use.',
        evidence: "Neither 'Permissions-Policy' nor 'Feature-Policy' headers were defined.",
        recommendation: "Add 'Permissions-Policy: camera=(), microphone=(), geolocation=()' to restrict high-privilege browser APIs.",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    checksExecuted.push({ name: 'Security Headers', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'Security Headers', status: 'failed', error: err.message });
  }

  // 3. Check: Cookie Security
  try {
    const rawCookies = baseResponse?.headers['set-cookie'];
    if (rawCookies) {
      const cookiesList = Array.isArray(rawCookies) ? rawCookies : [rawCookies];
      for (const cookieStr of cookiesList) {
        const parts = cookieStr.split(';').map((p) => p.trim());
        const cookieName = parts[0]?.split('=')[0] || 'UnknownCookie';
        const isHttpOnly = parts.some((p) => p.toLowerCase() === 'httponly');
        const isSecure = parts.some((p) => p.toLowerCase() === 'secure');
        const sameSitePart = parts.find((p) => p.toLowerCase().startsWith('samesite='));

        if (!isHttpOnly) {
          findings.push({
            name: `Cookie Missing HttpOnly Flag (${cookieName})`,
            category: 'Session Management',
            severity: 'Medium',
            confidence: 'High',
            description: `Cookie '${cookieName}' does not specify the HttpOnly directive, making it readable by client-side JavaScript and susceptible to theft via Cross-Site Scripting (XSS).`,
            evidence: `Set-Cookie: ${cookieStr}`,
            recommendation: `Add '; HttpOnly' to the Set-Cookie definition for '${cookieName}'.`,
            urlTested: normalizedUrl,
            status: 'Open',
          });
        }

        if (!isSecure && normalizedUrl.startsWith('https://')) {
          findings.push({
            name: `Cookie Missing Secure Flag (${cookieName})`,
            category: 'Session Management',
            severity: 'Medium',
            confidence: 'High',
            description: `Cookie '${cookieName}' transmitted over HTTPS lacks the Secure directive, allowing it to be sent over unencrypted connections if intercepted.`,
            evidence: `Set-Cookie: ${cookieStr}`,
            recommendation: `Add '; Secure' to the Set-Cookie directive.`,
            urlTested: normalizedUrl,
            status: 'Open',
          });
        }

        if (!sameSitePart) {
          findings.push({
            name: `Cookie Missing SameSite Attribute (${cookieName})`,
            category: 'Session Management',
            severity: 'Low',
            confidence: 'High',
            description: `Cookie '${cookieName}' does not declare a SameSite attribute, which protects against Cross-Site Request Forgery (CSRF).`,
            evidence: `Set-Cookie: ${cookieStr}`,
            recommendation: `Add '; SameSite=Lax' or '; SameSite=Strict' to the Set-Cookie directive.`,
            urlTested: normalizedUrl,
            status: 'Open',
          });
        }
      }
    }
    checksExecuted.push({ name: 'Cookie Security', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'Cookie Security', status: 'failed', error: err.message });
  }

  // 4. Check: CORS Misconfiguration
  try {
    const maliciousOrigin = 'https://attacker-vulnx-poc.com';
    const corsRes = await makeRequest(normalizedUrl, {
      timeout: 5000,
      headers: { Origin: maliciousOrigin },
    });
    const acao = String(corsRes.headers['access-control-allow-origin'] || '');
    const acac = String(corsRes.headers['access-control-allow-credentials'] || '').toLowerCase();

    if (acao === '*' && acac === 'true') {
      findings.push({
        name: 'Critical CORS Wildcard with Credentials Allowed',
        category: 'CORS Configuration',
        severity: 'Critical',
        confidence: 'High',
        description: 'Server returns Access-Control-Allow-Origin: * alongside Access-Control-Allow-Credentials: true. This allows any external site to make authenticated cross-origin requests and read private responses.',
        evidence: `Access-Control-Allow-Origin: * and Access-Control-Allow-Credentials: ${acac}`,
        recommendation: 'Never allow wildcard origin with credentials. Validate against an explicit whitelist of trusted origins.',
        urlTested: normalizedUrl,
        status: 'Open',
      });
    } else if (acao === maliciousOrigin) {
      findings.push({
        name: 'CORS Origin Reflection Detected',
        category: 'CORS Configuration',
        severity: 'Medium',
        confidence: 'High',
        description: 'Server blindly reflects arbitrary requested Origin headers in Access-Control-Allow-Origin, potentially exposing API responses across unauthorized domains.',
        evidence: `Requested Origin '${maliciousOrigin}' was echoed as Access-Control-Allow-Origin: '${acao}'`,
        recommendation: 'Implement strict origin whitelist validation rather than dynamically reflecting untrusted Origin headers.',
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }
    checksExecuted.push({ name: 'CORS Misconfiguration', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'CORS Misconfiguration', status: 'failed', error: err.message });
  }

  // 5. Check: Information Disclosure
  try {
    const serverHeader = String(baseResponse?.headers['server'] || '');
    const xPoweredBy = String(baseResponse?.headers['x-powered-by'] || '');

    if (serverHeader) {
      const hasVersion = /\d+\.\d+/.test(serverHeader);
      findings.push({
        name: hasVersion ? 'Detailed Web Server Version Disclosure' : 'Server Header Information Disclosure',
        category: 'Information Disclosure',
        severity: hasVersion ? 'Low' : 'Informational',
        confidence: 'High',
        description: hasVersion
          ? `The 'Server' header exposes detailed software and version information (${serverHeader}), aiding attackers in targeting known CVEs.`
          : `The 'Server' header advertises underlying server technology (${serverHeader}).`,
        evidence: `Server: ${serverHeader}`,
        recommendation: "Disable or obfuscate the Server header (e.g. 'ServerTokens Prod' in Apache or 'server_tokens off;' in Nginx).",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }

    if (xPoweredBy) {
      findings.push({
        name: 'Technology Disclosure via X-Powered-By Header',
        category: 'Information Disclosure',
        severity: 'Low',
        confidence: 'High',
        description: `The 'X-Powered-By' header advertises backend framework technology (${xPoweredBy}), making reconnaissance easier for attackers.`,
        evidence: `X-Powered-By: ${xPoweredBy}`,
        recommendation: "Remove the 'X-Powered-By' header in application configuration (e.g. app.disable('x-powered-by') in Express).",
        urlTested: normalizedUrl,
        status: 'Open',
      });
    }
    checksExecuted.push({ name: 'Information Disclosure', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'Information Disclosure', status: 'failed', error: err.message });
  }

  // 6. Check: Directory Listing
  try {
    const parsed = new URL(normalizedUrl);
    const testDirs = ['/images/', '/static/', '/uploads/', '/assets/'];
    for (const dir of testDirs) {
      try {
        const dirUrl = `${parsed.protocol}//${parsed.host}${dir}`;
        const dirRes = await makeRequest(dirUrl, { timeout: 4000 });
        const bodyLower = dirRes.body.toLowerCase();
        if (
          dirRes.statusCode === 200 &&
          (bodyLower.includes('index of /') ||
            bodyLower.includes('directory listing for') ||
            (bodyLower.includes('<title>index of') && bodyLower.includes('parent directory')))
        ) {
          findings.push({
            name: 'Directory Listing Enabled',
            category: 'Information Disclosure',
            severity: 'Medium',
            confidence: 'High',
            description: `Directory listing is enabled on path ${dir}, allowing unauthorized browsing of file structures and exposed asset directories.`,
            evidence: `GET ${dirUrl} returned HTTP 200 with directory listing patterns: '${dirRes.body.slice(0, 100)}'`,
            recommendation: "Disable directory indexing in your web server config (e.g. 'Options -Indexes' in Apache).",
            urlTested: dirUrl,
            status: 'Open',
          });
          break; // One hit is sufficient
        }
      } catch {
        // continue
      }
    }
    checksExecuted.push({ name: 'Directory Listing Exposure', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'Directory Listing Exposure', status: 'failed', error: err.message });
  }

  // 7. Check: Sensitive Files Exposure
  try {
    const parsed = new URL(normalizedUrl);
    const baseUrl = `${parsed.protocol}//${parsed.host}`;

    // 7a. Check /.env
    try {
      const envUrl = `${baseUrl}/.env`;
      const envRes = await makeRequest(envUrl, { timeout: 4000 });
      const ct = String(envRes.headers['content-type'] || '').toLowerCase();
      const isHtml = ct.includes('text/html') || envRes.body.slice(0, 100).toLowerCase().includes('<!doctype') || envRes.body.slice(0, 100).toLowerCase().includes('<html');

      if (envRes.statusCode === 200 && !isHtml && envRes.body.length > 5) {
        const lines = envRes.body.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
        const hasEnvPattern = lines.some((l) => l.includes('=') && !l.startsWith('<'));
        if (hasEnvPattern) {
          findings.push({
            name: 'Exposed Environment Configuration File (/.env)',
            category: 'Sensitive Data Exposure',
            severity: 'Critical',
            confidence: 'High',
            description: 'An environment configuration file (.env) was found publicly accessible. This file typically contains database credentials, secret API keys, and internal tokens.',
            evidence: `GET ${envUrl} returned HTTP 200. Preview: ${envRes.body.slice(0, 120).replace(/\n/g, ' | ')}...`,
            recommendation: 'Immediately restrict web access to dotfiles (.env) in server configurations and rotate any exposed credentials.',
            urlTested: envUrl,
            status: 'Open',
          });
        }
      }
    } catch {
      // ignore
    }

    // 7b. Check /.git/HEAD
    try {
      const gitUrl = `${baseUrl}/.git/HEAD`;
      const gitRes = await makeRequest(gitUrl, { timeout: 4000 });
      const ct = String(gitRes.headers['content-type'] || '').toLowerCase();
      const isHtml = ct.includes('text/html') || gitRes.body.slice(0, 100).toLowerCase().includes('<!doctype') || gitRes.body.slice(0, 100).toLowerCase().includes('<html');
      const content = gitRes.body.trim();
      const isGitHead = content.startsWith('ref: refs/') || (content.length === 40 && /^[0-9a-fA-F]{40}$/.test(content));

      if (gitRes.statusCode === 200 && !isHtml && isGitHead) {
        findings.push({
          name: 'Exposed Git Repository Metadata (/.git/HEAD)',
          category: 'Sensitive Data Exposure',
          severity: 'High',
          confidence: 'High',
          description: 'The Git version control directory (.git) is publicly accessible, allowing attackers to dump source code, commit history, and hardcoded secrets.',
          evidence: `GET ${gitUrl} returned HTTP 200 with content: '${content.slice(0, 100)}'`,
          recommendation: 'Block HTTP access to the .git directory in web server rules (e.g. deny all for /\\.git).',
          urlTested: gitUrl,
          status: 'Open',
        });
      }
    } catch {
      // ignore
    }

    // 7c. Check /robots.txt
    try {
      const robotsUrl = `${baseUrl}/robots.txt`;
      const robotsRes = await makeRequest(robotsUrl, { timeout: 4000 });
      const ct = String(robotsRes.headers['content-type'] || '').toLowerCase();
      const isHtml = ct.includes('text/html') || robotsRes.body.slice(0, 100).toLowerCase().includes('<html');

      if (robotsRes.statusCode === 200 && !isHtml && (robotsRes.body.toLowerCase().includes('user-agent:') || robotsRes.body.toLowerCase().includes('disallow:'))) {
        const sensitiveKeywords = ['admin', 'backup', 'secret', 'private', 'api', 'dashboard', 'staging'];
        const disallowLines = robotsRes.body.split('\n').filter((l) => l.trim().toLowerCase().startsWith('disallow:'));
        const matched = disallowLines.filter((l) => sensitiveKeywords.some((k) => l.toLowerCase().includes(k)));

        findings.push({
          name: matched.length > 0 ? 'Robots.txt Discloses Sensitive Internal Endpoints' : 'Public Robots.txt Available',
          category: 'Information Disclosure',
          severity: matched.length > 0 ? 'Low' : 'Informational',
          confidence: 'High',
          description: matched.length > 0
            ? 'The robots.txt file reveals potentially sensitive disallowed paths, aiding attackers in locating administrative and hidden interfaces.'
            : 'Robots.txt was located, outlining web crawler permissions and endpoint paths.',
          evidence: `Found ${disallowLines.length} Disallow rules. Sample: ${disallowLines.slice(0, 3).join(', ')}`,
          recommendation: 'Do not rely on robots.txt for security or hiding sensitive endpoints. Enforce proper access controls and authentication on all sensitive routes.',
          urlTested: robotsUrl,
          status: 'Open',
        });
      }
    } catch {
      // ignore
    }

    checksExecuted.push({ name: 'Sensitive Files Exposure', status: 'completed' });
  } catch (err: any) {
    checksExecuted.push({ name: 'Sensitive Files Exposure', status: 'failed', error: err.message });
  }

  // Deduplicate findings
  const uniqueFindings: ScanFindingResult[] = [];
  const seen = new Set<string>();
  for (const f of findings) {
    const key = `${f.name}:${f.urlTested}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueFindings.push(f);
    }
  }

  // Calculate severity distribution
  const severityDistribution = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
    Informational: 0,
  };
  for (const f of uniqueFindings) {
    if (f.severity in severityDistribution) {
      severityDistribution[f.severity as keyof typeof severityDistribution]++;
    }
  }

  const securityScore = calculateSecurityScore(uniqueFindings);
  const completedTime = new Date().toISOString();

  return {
    success: true,
    targetUrl: normalizedUrl,
    startedAt: startTime,
    completedAt: completedTime,
    status: 'Completed',
    securityScore,
    totalFindings: uniqueFindings.length,
    severityDistribution,
    checksExecuted,
    findings: uniqueFindings,
  };
}
