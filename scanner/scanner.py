#!/usr/bin/env python3
"""
VulnX - Core Web Application Vulnerability & Misconfiguration Scanner
B.Tech Full Stack Development Lab Project

Orchestrates 7 non-destructive security checks:
1. HTTPS & Transport Security
2. Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
3. Cookie Security (HttpOnly, Secure, SameSite)
4. CORS Misconfiguration
5. Information Disclosure (Server, X-Powered-By)
6. Directory Listing
7. Sensitive Files (/.env, /.git/HEAD, /robots.txt, /sitemap.xml)
"""

import sys
import os
import json
import argparse
import datetime
import urllib3
import requests

# Disable insecure HTTPS warnings for self-signed certificates during non-destructive testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Ensure the scanner folder is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from checks import (
    https_check,
    headers_check,
    cookie_check,
    cors_check,
    info_check,
    directory_check,
    sensitive_files_check
)

def normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url
    return url.rstrip("/")

def calculate_security_score(findings: list) -> int:
    score = 100
    weights = {
        "Critical": 20,
        "High": 15,
        "Medium": 8,
        "Low": 3,
        "Informational": 0
    }
    for f in findings:
        sev = f.get("severity", "Low")
        score -= weights.get(sev, 3)
    return max(0, min(100, score))

def scan_target(target_url: str) -> dict:
    normalized_url = normalize_url(target_url)
    start_time = datetime.datetime.utcnow().isoformat() + "Z"

    session = requests.Session()
    session.headers.update({
        "User-Agent": "VulnX-VAPT-Scanner/1.0 (Educational Assessment; B.Tech Lab)"
    })

    findings = []
    checks_executed = []

    check_registry = [
        ("HTTPS & Transport Security", https_check.run_check),
        ("Security Headers", headers_check.run_check),
        ("Cookie Security", cookie_check.run_check),
        ("CORS Misconfiguration", cors_check.run_check),
        ("Information Disclosure", info_check.run_check),
        ("Directory Listing Exposure", directory_check.run_check),
        ("Sensitive Files Exposure", sensitive_files_check.run_check),
    ]

    for name, check_func in check_registry:
        try:
            results = check_func(normalized_url, session=session)
            if results:
                findings.extend(results)
            checks_executed.append({"name": name, "status": "completed"})
        except Exception as e:
            checks_executed.append({"name": name, "status": "failed", "error": str(e)})

    # Deduplicate findings by name and urlTested
    unique_findings = []
    seen = set()
    for f in findings:
        key = (f.get("name"), f.get("urlTested"))
        if key not in seen:
            seen.add(key)
            unique_findings.append(f)

    # Compute distribution
    severity_counts = {
        "Critical": 0,
        "High": 0,
        "Medium": 0,
        "Low": 0,
        "Informational": 0
    }
    for f in unique_findings:
        sev = f.get("severity", "Low")
        if sev in severity_counts:
            severity_counts[sev] += 1
        else:
            severity_counts["Low"] += 1

    security_score = calculate_security_score(unique_findings)
    completed_time = datetime.datetime.utcnow().isoformat() + "Z"

    return {
        "success": True,
        "targetUrl": normalized_url,
        "startedAt": start_time,
        "completedAt": completed_time,
        "status": "Completed",
        "securityScore": security_score,
        "totalFindings": len(unique_findings),
        "severityDistribution": severity_counts,
        "checksExecuted": checks_executed,
        "findings": unique_findings
    }

def main():
    parser = argparse.ArgumentParser(description="VulnX VAPT Preliminary Security Scanner")
    parser.add_argument("url", nargs="?", help="Target URL to assess")
    parser.add_argument("--url", dest="flag_url", help="Target URL (alternative flag)")
    parser.add_argument("--pretty", action="store_true", help="Pretty print JSON")

    args = parser.parse_args()
    target = args.flag_url or args.url

    if not target:
        print(json.dumps({
            "success": False,
            "error": "Target URL is required. Usage: python3 scanner.py <URL> or --url <URL>"
        }))
        sys.exit(1)

    try:
        results = scan_target(target)
        if args.pretty:
            print(json.dumps(results, indent=2))
        else:
            print(json.dumps(results))
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Scanner fatal execution error: {str(e)}"
        }))
        sys.exit(1)

if __name__ == "__main__":
    main()
