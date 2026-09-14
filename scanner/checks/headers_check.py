"""
Security Headers Assessment Check Module
Inspects critical HTTP defense headers to mitigate XSS, Clickjacking, MIME sniffing, and downgrade attacks.
"""
import requests

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)"})

    try:
        res = session.get(target_url, timeout=6, verify=False)
        headers = {k.lower(): v for k, v in res.headers.items()}

        # 1. Content-Security-Policy
        if "content-security-policy" not in headers:
            findings.append({
                "name": "Missing Content-Security-Policy (CSP) Header",
                "category": "Security Headers",
                "severity": "Medium",
                "confidence": "High",
                "description": "Content-Security-Policy is an effective defense-in-depth header against Cross-Site Scripting (XSS), data injection, and unauthorized content embedding.",
                "evidence": "Header 'Content-Security-Policy' was not found in the HTTP response headers.",
                "recommendation": "Configure a restrictive Content-Security-Policy (e.g., default-src 'self'; script-src 'self'; object-src 'none').",
                "urlTested": target_url,
                "status": "Open"
            })
        elif "unsafe-inline" in headers["content-security-policy"] or "*" in headers["content-security-policy"]:
            findings.append({
                "name": "Permissive Content-Security-Policy Detected",
                "category": "Security Headers",
                "severity": "Low",
                "confidence": "Medium",
                "description": "The Content-Security-Policy header contains permissive directives such as 'unsafe-inline' or wildcard sources, weakening protection against XSS.",
                "evidence": f"CSP Directive: {headers['content-security-policy'][:180]}...",
                "recommendation": "Refactor inline scripts to external scripts with cryptographic nonces or hashes.",
                "urlTested": target_url,
                "status": "Open"
            })

        # 2. X-Frame-Options
        if "x-frame-options" not in headers and "content-security-policy" not in headers:
            findings.append({
                "name": "Missing Anti-Clickjacking Header (X-Frame-Options)",
                "category": "Security Headers",
                "severity": "Medium",
                "confidence": "High",
                "description": "The page does not declare X-Frame-Options or frame-ancestors CSP directive, making it vulnerable to UI redress and Clickjacking attacks.",
                "evidence": "Neither 'X-Frame-Options' header nor 'frame-ancestors' CSP directive was present in response headers.",
                "recommendation": "Add header 'X-Frame-Options: DENY' or 'X-Frame-Options: SAMEORIGIN' to prevent framing in unauthorized domains.",
                "urlTested": target_url,
                "status": "Open"
            })

        # 3. X-Content-Type-Options
        if headers.get("x-content-type-options", "").lower() != "nosniff":
            findings.append({
                "name": "Missing X-Content-Type-Options Header",
                "category": "Security Headers",
                "severity": "Low",
                "confidence": "High",
                "description": "Without 'X-Content-Type-Options: nosniff', browsers may attempt to MIME-sniff the response payload, potentially treating non-executable MIME types as executable code.",
                "evidence": f"X-Content-Type-Options header value: '{headers.get('x-content-type-options', 'None')}'",
                "recommendation": "Set the HTTP response header 'X-Content-Type-Options: nosniff'.",
                "urlTested": target_url,
                "status": "Open"
            })

        # 4. Strict-Transport-Security (HSTS)
        if target_url.startswith("https://") and "strict-transport-security" not in headers:
            findings.append({
                "name": "Missing HTTP Strict-Transport-Security (HSTS)",
                "category": "Security Headers",
                "severity": "Medium",
                "confidence": "High",
                "description": "HTTP Strict-Transport-Security (HSTS) enforces encrypted connections at the browser layer, protecting against SSL stripping attacks.",
                "evidence": "The Strict-Transport-Security header is absent in HTTPS response.",
                "recommendation": "Set 'Strict-Transport-Security: max-age=31536000; includeSubDomains; preload' on all HTTPS endpoints.",
                "urlTested": target_url,
                "status": "Open"
            })

    except Exception as e:
        # Ignore network errors handled by scanner.py
        pass

    return findings
