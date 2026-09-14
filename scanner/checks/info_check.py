"""
Information Disclosure and Technology Fingerprinting Check Module
Checks for sensitive server technology and version disclosures in headers (Server, X-Powered-By).
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

        # 1. Server Header Disclosure
        server_val = headers.get("server")
        if server_val:
            # Check if version numbers or detailed technology are leaked
            has_version = any(char.isdigit() for char in server_val)
            severity = "Low" if has_version else "Low"
            findings.append({
                "name": "Server Software Fingerprint Disclosed",
                "category": "Information Disclosure",
                "severity": severity,
                "confidence": "High",
                "description": "The HTTP response leaks the underlying web server software and potentially its version, aiding attackers in vulnerability targeting.",
                "evidence": f"Server header leaked: '{server_val}'",
                "recommendation": "Disable or sanitize the Server token in web server configuration (e.g., ServerTokens Prod in Apache, server_tokens off in Nginx).",
                "urlTested": target_url,
                "status": "Open"
            })

        # 2. X-Powered-By Disclosure
        powered_by = headers.get("x-powered-by")
        if powered_by:
            findings.append({
                "name": "Technology Framework Disclosed (X-Powered-By)",
                "category": "Information Disclosure",
                "severity": "Low",
                "confidence": "High",
                "description": "The 'X-Powered-By' header exposes backend runtime/framework details (e.g. Express, PHP, ASP.NET).",
                "evidence": f"X-Powered-By header: '{powered_by}'",
                "recommendation": "Remove the X-Powered-By header (e.g., app.disable('x-powered-by') in Express or expose_php = Off in php.ini).",
                "urlTested": target_url,
                "status": "Open"
            })

        # 3. ASP.NET specific headers
        if "x-aspnet-version" in headers or "x-aspnetmvc-version" in headers:
            findings.append({
                "name": "ASP.NET Version Disclosed in Header",
                "category": "Information Disclosure",
                "severity": "Low",
                "confidence": "High",
                "description": "The application leaks Microsoft ASP.NET framework version information.",
                "evidence": f"Headers: {headers.get('x-aspnet-version') or headers.get('x-aspnetmvc-version')}",
                "recommendation": "Disable version disclosure in web.config with <httpRuntime enableVersionHeader=\"false\" />.",
                "urlTested": target_url,
                "status": "Open"
            })

    except Exception as e:
        pass

    return findings
