"""
Sensitive Files and Metadata Exposure Check Module
Safely probes for exposed environment files (/.env), Git metadata (/.git/HEAD), robots.txt, and sitemap.xml.
"""
import requests
from urllib.parse import urljoin

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)"})

    # 1. Check /.env
    env_url = urljoin(target_url, "/.env")
    try:
        res = session.get(env_url, timeout=5, verify=False, allow_redirects=False)
        content_type = res.headers.get("content-type", "").lower()
        is_html = "text/html" in content_type or "<!doctype" in res.text[:100].lower() or "<html" in res.text[:100].lower()
        if res.status_code == 200 and not is_html:
            # Check if lines look like genuine KEY=VALUE or comments
            lines = [l.strip() for l in res.text.splitlines() if l.strip() and not l.strip().startswith("#")]
            has_env_pattern = any("=" in l and not l.startswith("<") for l in lines)
            if has_env_pattern:
                first_lines = res.text[:200].replace("\n", " | ")
                findings.append({
                    "name": "Exposed Environment Configuration File (/.env)",
                    "category": "Sensitive Data Exposure",
                    "severity": "Critical",
                    "confidence": "High",
                    "description": "An environment configuration file (.env) was found publicly accessible. This file typically contains database credentials, secret API keys, and internal tokens.",
                    "evidence": f"GET {env_url} returned HTTP 200. Preview: {first_lines[:120]}...",
                    "recommendation": "Immediately restrict web access to dotfiles (.env) in server configurations and rotate any exposed credentials.",
                    "urlTested": env_url,
                    "status": "Open"
                })
    except Exception:
        pass

    # 2. Check /.git/HEAD
    git_url = urljoin(target_url, "/.git/HEAD")
    try:
        res = session.get(git_url, timeout=5, verify=False, allow_redirects=False)
        content_type = res.headers.get("content-type", "").lower()
        is_html = "text/html" in content_type or "<!doctype" in res.text[:100].lower() or "<html" in res.text[:100].lower()
        content = res.text.strip()
        is_git_head = (content.startswith("ref: refs/") or (len(content) == 40 and all(c in "0123456789abcdefABCDEF" for c in content)))
        if res.status_code == 200 and not is_html and is_git_head:
            findings.append({
                "name": "Exposed Git Repository Metadata (/.git/HEAD)",
                "category": "Sensitive Data Exposure",
                "severity": "High",
                "confidence": "High",
                "description": "The Git version control directory (.git) is publicly accessible, allowing attackers to dump source code, commit history, and hardcoded secrets.",
                "evidence": f"GET {git_url} returned HTTP 200 with content: '{content[:100]}'",
                "recommendation": "Block HTTP access to the .git directory in web server rules (e.g. deny all for /\\.git).",
                "urlTested": git_url,
                "status": "Open"
            })
    except Exception:
        pass

    # 3. Check /robots.txt
    robots_url = urljoin(target_url, "/robots.txt")
    try:
        res = session.get(robots_url, timeout=5, verify=False, allow_redirects=True)
        if res.status_code == 200 and ("user-agent:" in res.text.lower() or "disallow:" in res.text.lower()):
            # Count disallow rules
            disallows = [line.strip() for line in res.text.splitlines() if line.lower().startswith("disallow:")]
            preview = ", ".join(disallows[:5]) if disallows else "No Disallow directives"
            findings.append({
                "name": "Public robots.txt File Discovered",
                "category": "Information Disclosure",
                "severity": "Low",
                "confidence": "High",
                "description": "A robots.txt file was found. While standard for web crawlers, Disallow directives frequently disclose internal paths, admin dashboards, or unlinked directories to adversaries.",
                "evidence": f"HTTP 200 at {robots_url}. Sample rules: {preview}",
                "recommendation": "Review robots.txt to ensure it does not reveal sensitive internal directory paths or administrative endpoints.",
                "urlTested": robots_url,
                "status": "Open"
            })
    except Exception:
        pass

    # 4. Check /sitemap.xml
    sitemap_url = urljoin(target_url, "/sitemap.xml")
    try:
        res = session.get(sitemap_url, timeout=5, verify=False, allow_redirects=True)
        if res.status_code == 200 and ("<urlset" in res.text or "<sitemapindex" in res.text or "xmlns=" in res.text):
            findings.append({
                "name": "Public XML Sitemap Discovered (/sitemap.xml)",
                "category": "Information Disclosure",
                "severity": "Low",
                "confidence": "High",
                "description": "An XML sitemap was discovered at /sitemap.xml, enumerating application URL endpoints and content structures.",
                "evidence": f"HTTP 200 at {sitemap_url}. Valid XML sitemap structure detected.",
                "recommendation": "Verify that all URLs indexed in sitemap.xml are intended for public indexing.",
                "urlTested": sitemap_url,
                "status": "Open"
            })
    except Exception:
        pass

    return findings
