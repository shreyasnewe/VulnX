"""
Cross-Origin Resource Sharing (CORS) Misconfiguration Check Module
Inspects Access-Control-Allow-Origin headers and tests for arbitrary origin reflection or wildcard exposures.
"""
import requests

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()

    test_origin = "https://evil-attacker.example.com"
    headers = {
        "User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)",
        "Origin": test_origin
    }

    try:
        res = session.get(target_url, headers=headers, timeout=6, verify=False)
        acao = res.headers.get("Access-Control-Allow-Origin", "")
        acac = res.headers.get("Access-Control-Allow-Credentials", "").lower()

        # 1. Arbitrary Origin Reflection with Credentials
        if acao == test_origin:
            if acac == "true":
                findings.append({
                    "name": "Critical CORS Misconfiguration: Arbitrary Origin Reflection with Credentials",
                    "category": "CORS Misconfiguration",
                    "severity": "High",
                    "confidence": "High",
                    "description": "The server dynamically reflects the untrusted request Origin header and permits credentials (cookies/tokens), allowing unauthorized cross-origin reading of sensitive data.",
                    "evidence": f"Request Origin '{test_origin}' reflected in Access-Control-Allow-Origin with Access-Control-Allow-Credentials: true",
                    "recommendation": "Implement an explicit whitelist of trusted domains and avoid blindly reflecting the Origin header.",
                    "urlTested": target_url,
                    "status": "Open"
                })
            else:
                findings.append({
                    "name": "Permissive CORS Origin Reflection",
                    "category": "CORS Misconfiguration",
                    "severity": "Medium",
                    "confidence": "Medium",
                    "description": "The server reflects arbitrary third-party origins in the Access-Control-Allow-Origin header.",
                    "evidence": f"Request Origin '{test_origin}' reflected in response header.",
                    "recommendation": "Restrict Access-Control-Allow-Origin to authorized corporate domains.",
                    "urlTested": target_url,
                    "status": "Open"
                })

        # 2. Wildcard Access-Control-Allow-Origin
        elif acao == "*":
            findings.append({
                "name": "Wildcard Access-Control-Allow-Origin (*)",
                "category": "CORS Misconfiguration",
                "severity": "Low",
                "confidence": "High",
                "description": "The resource permits all third-party domains to access its responses. If this endpoint serves sensitive data, it should be restricted.",
                "evidence": "Access-Control-Allow-Origin is set to '*'",
                "recommendation": "If the resource is meant to be private, remove the wildcard and restrict to authorized origins.",
                "urlTested": target_url,
                "status": "Open"
            })

    except Exception as e:
        pass

    return findings
