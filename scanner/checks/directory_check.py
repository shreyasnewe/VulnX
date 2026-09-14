"""
Directory Listing and Index Exposure Check Module
Safely probes common static paths to verify whether directory browsing is enabled.
"""
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)"})

    test_paths = ["/images/", "/static/", "/uploads/", "/assets/", "/backup/"]
    signatures = [
        "index of /",
        "<title>index of",
        "directory listing for",
        "parent directory</a>",
        "folder listing"
    ]

    for path in test_paths:
        test_url = urljoin(target_url, path)
        try:
            res = session.get(test_url, timeout=5, verify=False, allow_redirects=False)
            if res.status_code == 200:
                body_lower = res.text.lower()
                for sig in signatures:
                    if sig in body_lower:
                        findings.append({
                            "name": f"Directory Listing Enabled ({path})",
                            "category": "Information Disclosure",
                            "severity": "Medium",
                            "confidence": "High",
                            "description": f"The directory '{path}' allows open directory browsing, exposing the filesystem structure and sensitive uploaded or asset files.",
                            "evidence": f"Path '{test_url}' returned HTTP 200 with signature '{sig}' found in HTML.",
                            "recommendation": "Disable directory indexing in the web server configuration (e.g. 'Options -Indexes' in Apache, or ensure autoindex is disabled in Nginx).",
                            "urlTested": test_url,
                            "status": "Open"
                        })
                        # Only report once per path
                        break
        except Exception:
            continue

    return findings
