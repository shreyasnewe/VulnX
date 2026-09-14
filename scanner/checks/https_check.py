"""
HTTPS and SSL/TLS Enforcement Check Module
Validates whether HTTPS is supported and whether plain HTTP correctly redirects to HTTPS.
"""
import requests
from urllib.parse import urlparse

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)"})

    parsed = urlparse(target_url)
    domain = parsed.netloc or parsed.path
    # Strip any port if standard
    host = domain.split(':')[0]

    http_url = f"http://{host}"
    https_url = f"https://{host}"

    https_supported = False
    https_response = None

    # 1. Test HTTPS connection
    try:
        https_response = session.get(https_url, timeout=6, verify=True)
        https_supported = True
    except requests.exceptions.SSLError as ssl_err:
        findings.append({
            "name": "Invalid or Untrusted SSL/TLS Certificate",
            "category": "Transport Security",
            "severity": "High",
            "confidence": "High",
            "description": "The target domain presented an invalid, expired, or self-signed SSL/TLS certificate.",
            "evidence": f"SSL Error encountered: {str(ssl_err)[:200]}",
            "recommendation": "Install a valid, trusted SSL/TLS certificate issued by a recognized Certificate Authority (e.g., Let's Encrypt).",
            "urlTested": https_url,
            "status": "Open"
        })
    except Exception as e:
        findings.append({
            "name": "HTTPS Not Supported",
            "category": "Transport Security",
            "severity": "High",
            "confidence": "High",
            "description": "The server failed to establish an encrypted HTTPS connection on port 443.",
            "evidence": f"Connection attempt failed: {str(e)[:200]}",
            "recommendation": "Enable TLS/HTTPS on port 443 with modern cipher suites to protect traffic from eavesdropping and tampering.",
            "urlTested": https_url,
            "status": "Open"
        })

    # 2. Test HTTP to HTTPS redirection
    try:
        http_response = session.get(http_url, timeout=6, allow_redirects=False)
        is_redirect = http_response.status_code in (301, 302, 307, 308)
        redirect_to = http_response.headers.get("Location", "")

        if not is_redirect or not redirect_to.startswith("https://"):
            findings.append({
                "name": "Missing HTTP to HTTPS Redirection",
                "category": "Transport Security",
                "severity": "Medium",
                "confidence": "High",
                "description": "Plain HTTP requests are not automatically redirected to secure HTTPS, exposing users to Man-in-the-Middle (MitM) attacks.",
                "evidence": f"HTTP response status: {http_response.status_code}, Location header: '{redirect_to}'",
                "recommendation": "Configure a permanent 301 redirect from HTTP to HTTPS across all hostnames and paths.",
                "urlTested": http_url,
                "status": "Open"
            })
    except Exception as e:
        # If plain HTTP connection fails, note as low or skip if HTTPS works
        pass

    return findings
