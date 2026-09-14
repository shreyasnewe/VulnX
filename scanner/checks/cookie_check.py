"""
Cookie Security Flags Assessment Check Module
Inspects Set-Cookie headers for Secure, HttpOnly, and SameSite attribute enforcement.
"""
import requests

def run_check(target_url: str, session: requests.Session = None) -> list:
    findings = []
    if session is None:
        session = requests.Session()
        session.headers.update({"User-Agent": "VulnX-Security-Scanner/1.0 (Safe Assessment)"})

    try:
        res = session.get(target_url, timeout=6, verify=False)
        # requests collects cookies in res.cookies or raw headers in res.raw or headers
        raw_set_cookie_headers = [v for k, v in res.headers.items() if k.lower() == "set-cookie"]

        # Also inspect cookies directly
        cookies = res.cookies

        if not cookies and not raw_set_cookie_headers:
            # No cookies issued by this endpoint
            return findings

        for cookie in cookies:
            cookie_name = cookie.name
            is_secure = cookie.secure
            # In requests.cookies, HttpOnly is in _rest['httponly'] or in raw string
            has_httponly = bool(cookie._rest.get('httponly') or cookie._rest.get('HttpOnly'))
            samesite = cookie._rest.get('samesite') or cookie._rest.get('SameSite')

            # 1. HttpOnly Flag
            if not has_httponly:
                findings.append({
                    "name": f"Cookie Without HttpOnly Flag ({cookie_name})",
                    "category": "Cookie Security",
                    "severity": "Medium",
                    "confidence": "High",
                    "description": f"The cookie '{cookie_name}' lacks the HttpOnly attribute. This makes it readable by client-side JavaScript, increasing exposure to Cross-Site Scripting (XSS) session theft.",
                    "evidence": f"Cookie '{cookie_name}' issued without HttpOnly flag.",
                    "recommendation": f"Add the 'HttpOnly' flag to the Set-Cookie header when issuing '{cookie_name}'.",
                    "urlTested": target_url,
                    "status": "Open"
                })

            # 2. Secure Flag
            if not is_secure and target_url.startswith("https://"):
                findings.append({
                    "name": f"Cookie Without Secure Flag ({cookie_name})",
                    "category": "Cookie Security",
                    "severity": "Medium",
                    "confidence": "High",
                    "description": f"The cookie '{cookie_name}' is transmitted over HTTPS but lacks the Secure attribute, meaning it could be transmitted in plaintext if a request falls back to HTTP.",
                    "evidence": f"Cookie '{cookie_name}' issued without Secure directive.",
                    "recommendation": f"Mark the '{cookie_name}' cookie with the 'Secure' attribute in the Set-Cookie header.",
                    "urlTested": target_url,
                    "status": "Open"
                })

            # 3. SameSite Flag
            if not samesite or str(samesite).lower() == "none":
                findings.append({
                    "name": f"Missing or Permissive SameSite Cookie Attribute ({cookie_name})",
                    "category": "Cookie Security",
                    "severity": "Low",
                    "confidence": "High",
                    "description": f"The cookie '{cookie_name}' does not specify SameSite=Lax or SameSite=Strict, leaving the application vulnerable to Cross-Site Request Forgery (CSRF).",
                    "evidence": f"SameSite attribute for '{cookie_name}': {samesite or 'Not set'}",
                    "recommendation": f"Set 'SameSite=Lax' or 'SameSite=Strict' for the '{cookie_name}' cookie.",
                    "urlTested": target_url,
                    "status": "Open"
                })

    except Exception as e:
        pass

    return findings
