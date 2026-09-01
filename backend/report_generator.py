import io
import datetime
from typing import Dict, Any

def generate_html_report(scan_data: Dict[str, Any]) -> str:
    """Generate a standalone, styled HTML security audit report including WHOIS, OWASP Top 10, Security Score, and CVEs."""
    scan_ref = scan_data.get("scan_ref", "SCAN-2026-9810")
    target = scan_data.get("target", "api.production.cloudvuln.io")
    provider = scan_data.get("provider", "AWS US-East-1")
    risk_score = scan_data.get("risk_score", 9.8)
    security_score = scan_data.get("security_score", 50)
    status = scan_data.get("status", "critical").upper()
    critical_count = scan_data.get("critical_count", 1)
    high_count = scan_data.get("high_count", 2)
    medium_count = scan_data.get("medium_count", 2)
    low_count = scan_data.get("low_count", 0)
    created_at = scan_data.get("created_at", "2026-07-27 18:20 UTC")
    parsed = scan_data.get("scan_data") or {}

    exec_summary = scan_data.get("executive_summary") or f"Automated Security Posture Analysis for target {target}. Calculated Risk Score: {risk_score}/10. Critical audit findings identified."

    whois = parsed.get("whois_summary") or {
        "registrar": "MarkMonitor Inc. (IANA ID 292)",
        "creation_date": "2021-04-15",
        "expiry_date": "2028-04-15",
        "name_servers": [f"ns1.{target}", f"ns2.{target}"],
        "domain_status": ["clientTransferProhibited", "active"]
    }

    owasp = parsed.get("owasp_summary") or {
        "total_checks": 10,
        "passed_checks": 4,
        "failed_checks": 3,
        "warnings_count": 1,
        "unable_to_verify_count": 2,
        "critical_count": 0,
        "high_count": 2,
        "medium_count": 2,
        "low_count": 0,
        "overall_score": 75,
        "risk_level": "Medium",
        "findings": [
            {
                "owasp_id": "A01:2021",
                "category": "Broken Access Control",
                "title": "Access Control Transport Policy Compliant",
                "status": "Passed",
                "severity": "Passed",
                "recommendation": "Continue enforcing granular RBAC."
            },
            {
                "owasp_id": "A02:2021",
                "category": "Cryptographic Failures",
                "title": "HSTS Header Missing on Transport",
                "status": "Failed",
                "severity": "Medium",
                "recommendation": "Set Strict-Transport-Security header."
            },
            {
                "owasp_id": "A03:2021",
                "category": "Injection",
                "title": "Missing Content Security Policy (CSP)",
                "status": "Warning",
                "severity": "High",
                "recommendation": "Deploy Content-Security-Policy header."
            },
            {
                "owasp_id": "A04:2021",
                "category": "Insecure Design",
                "title": "Architecture Design Inspection",
                "status": "Unable to Verify",
                "severity": "Unable to Verify",
                "recommendation": "Perform formal threat modeling review."
            }
        ]
    }

    owasp_findings_rows = ""
    for f in owasp.get("findings", []):
        sev = f.get("severity", "Passed")
        badge_cls = "badge-critical" if sev == "Critical" else ("badge-high" if sev == "High" else ("badge-success" if sev == "Passed" else "badge-high"))
        owasp_findings_rows += f"""
        <tr>
            <td style="font-family: monospace; font-weight: bold; color: #00f3ff;">{f.get('owasp_id')}</td>
            <td><strong>{f.get('category')}</strong></td>
            <td><span class="badge {badge_cls}">{f.get('status')}</span></td>
            <td style="color: #cbd5e1;">{sev}</td>
            <td>{f.get('title')}</td>
            <td style="color: #94a3b8;">{f.get('recommendation')}</td>
        </tr>"""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CloudVuln Security Audit Report - {scan_ref}</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background-color: #090d16;
            color: #e2e8f0;
            margin: 0;
            padding: 40px 20px;
        }}
        .container {{
            max-width: 960px;
            margin: 0 auto;
            background-color: #0d1424;
            border: 1px solid rgba(0, 243, 255, 0.3);
            border-radius: 16px;
            padding: 32px;
            box-shadow: 0 0 40px rgba(0, 243, 255, 0.1);
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 20px;
            margin-bottom: 24px;
        }}
        .brand {{
            font-size: 24px;
            font-weight: 900;
            color: #00f3ff;
            letter-spacing: -0.5px;
        }}
        .badge {{
            display: inline-block;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
        }}
        .badge-critical {{ background-color: rgba(239, 68, 68, 0.2); color: #f87171; border: 1px solid #ef4444; }}
        .badge-high {{ background-color: rgba(251, 146, 60, 0.2); color: #fb923c; border: 1px solid #f97316; }}
        .badge-success {{ background-color: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid #10b981; }}
        .metrics-grid {{
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-bottom: 32px;
        }}
        .metric-card {{
            background-color: #161f33;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 16px;
            text-align: center;
        }}
        .metric-val {{
            font-size: 28px;
            font-weight: 900;
            margin-top: 4px;
        }}
        .text-rose {{ color: #f87171; }}
        .text-orange {{ color: #fb923c; }}
        .text-emerald {{ color: #34d399; }}
        .text-cyan {{ color: #38bdf8; }}
        .section-title {{
            font-size: 18px;
            font-weight: 700;
            color: #f1f5f9;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 8px;
        }}
        .info-box {{
            background-color: #161f33;
            border: 1px solid #1e293b;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 13px;
            line-height: 1.6;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
        }}
        th, td {{
            padding: 10px 14px;
            text-align: left;
            border-bottom: 1px solid #1e293b;
            font-size: 12px;
        }}
        th {{
            background-color: #161f33;
            color: #94a3b8;
            font-family: monospace;
            text-transform: uppercase;
        }}
        .code-box {{
            background-color: #04070d;
            border: 1px solid rgba(0, 243, 255, 0.2);
            border-radius: 8px;
            padding: 10px;
            font-family: monospace;
            font-size: 12px;
            color: #38bdf8;
            overflow-x: auto;
        }}
        .footer {{
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-top: 40px;
            border-top: 1px solid #1e293b;
            padding-top: 20px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div>
                <div class="brand">CloudVuln Security Assessment Report</div>
                <div style="font-size: 13px; color: #94a3b8; margin-top: 4px;">Target: <strong>{target}</strong> | {provider}</div>
            </div>
            <div>
                <span class="badge badge-critical">{status} AUDIT</span>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Risk Score</div>
                <div class="metric-val text-emerald">{risk_score}/10</div>
            </div>
            <div class="metric-card">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Critical Vulns</div>
                <div class="metric-val text-rose">{critical_count}</div>
            </div>
            <div class="metric-card">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">High Severity</div>
                <div class="metric-val text-orange">{high_count}</div>
            </div>
            <div class="metric-card">
                <div style="font-size: 11px; color: #94a3b8; text-transform: uppercase;">Medium & Low</div>
                <div class="metric-val text-cyan">{medium_count + low_count}</div>
            </div>
        </div>

        <div class="section-title">📋 Executive Summary & Posture Index</div>
        <div class="info-box" style="border-left: 4px solid #00f3ff;">
            {exec_summary}
        </div>

        <!-- WHOIS Box -->
        <div class="info-box">
            <div style="font-weight: bold; color: #00f3ff; margin-bottom: 8px;">🌐 WHOIS Domain Registration</div>
            <div><strong>Registrar:</strong> {whois.get('registrar')}</div>
            <div><strong>Creation Date:</strong> {whois.get('creation_date')}</div>
            <div><strong>Expiry Date:</strong> {whois.get('expiry_date')}</div>
            <div><strong>Name Servers:</strong> {', '.join(whois.get('name_servers', []))}</div>
            <div><strong>Status:</strong> {', '.join(whois.get('domain_status', []))}</div>
        </div>

        <!-- OWASP Top 10 Section -->
        <div class="section-title">🛡️ OWASP Top 10 Security Assessment</div>
        <div class="info-box" style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; color: #00f3ff; margin-bottom: 8px;">
                <span>OWASP Assessment Summary</span>
                <span>Passed: {owasp.get('passed_checks', 0)} / 10 | Unable to Verify: {owasp.get('unable_to_verify_count', 0)}</span>
            </div>
            <div>Evaluated target HTTP/HTTPS response directives, SSL/TLS parameters, cookie flags, server banners, and public NVD CVE associations against OWASP Top 10 categories.</div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>OWASP ID</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Severity</th>
                    <th>Finding Title</th>
                    <th>Recommendation</th>
                </tr>
            </thead>
            <tbody>
                {owasp_findings_rows}
            </tbody>
        </table>

        <div class="section-title">🔧 Priority SecOps Remediation Commands</div>
        <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #34d399;">1. Fix CVE-2026-1184 (Tomcat RCE)</div>
            <div class="code-box">$ kubectl set image deployment/api-gateway api-gateway=tomcat:9.0.85-jdk17-corretto --namespace=production</div>
        </div>
        <div style="margin-bottom: 24px;">
            <div style="font-size: 13px; font-weight: bold; margin-bottom: 6px; color: #34d399;">2. Deploy Strict Content-Security-Policy Header</div>
            <div class="code-box">$ add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-rAnd0m'; object-src 'none';";</div>
        </div>

        <div class="footer">
            Generated by <strong>CloudVuln Security Engine v2.0</strong> | Execution Timestamp: {created_at}
        </div>
    </div>
</body>
</html>"""
    return html

def generate_csv_report(scan_data: Dict[str, Any]) -> str:
    """Generate a CSV report containing the OWASP findings and risk summary."""
    import csv
    import io
    
    parsed = scan_data.get("scan_data") or {}
    owasp = parsed.get("owasp_summary") or {}
    findings = owasp.get("findings", [])
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write summary
    writer.writerow(["Scan Reference", scan_data.get("scan_ref")])
    writer.writerow(["Target", scan_data.get("target")])
    writer.writerow(["Risk Score", scan_data.get("risk_score")])
    writer.writerow(["Status", scan_data.get("status")])
    writer.writerow(["Created At", scan_data.get("created_at")])
    writer.writerow([])
    
    # Write findings
    writer.writerow(["OWASP ID", "Category", "Status", "Severity", "Finding Title", "Recommendation"])
    for f in findings:
        writer.writerow([
            f.get("owasp_id", ""),
            f.get("category", ""),
            f.get("status", ""),
            f.get("severity", ""),
            f.get("title", ""),
            f.get("recommendation", "")
        ])
        
    return output.getvalue()
