import PDFDocument from 'pdfkit';
import { IScan } from '../models/Scan';
import { IFinding } from '../models/Finding';

export class PdfService {
  public static generateScanReport(scan: any, findings: any[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 40,
          size: 'A4',
          info: {
            Title: `VulnX Security Assessment - ${scan.targetName || scan.targetUrl}`,
            Author: 'VulnX VAPT Security Engine',
            Subject: 'Vulnerability Assessment & Penetration Testing Audit Report',
          }
        });

        const buffers: Buffer[] = [];
        doc.on('data', (chunk) => buffers.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(buffers)));
        doc.on('error', (err) => reject(err));

        // Primary Accent Colors
        const brandPrimary = '#06b6d4'; // Cyan 500
        const darkBg = '#0f172a';       // Slate 900
        const textDark = '#1e293b';     // Slate 800
        const textMuted = '#64748b';    // Slate 500

        // Header Banner
        doc.rect(40, 40, 515, 60).fill('#090d16');
        doc.fillColor('#ffffff').fontSize(20).font('Helvetica-Bold').text('VulnX Security Assessment Report', 55, 52);
        doc.fillColor(brandPrimary).fontSize(10).font('Helvetica').text('CONFIDENTIAL // AUTOMATED VAPT PRELIMINARY ASSESSMENT', 55, 78);

        doc.moveDown(3);

        // Meta Information Box
        const scanDate = new Date(scan.startedAt || scan.createdAt).toUTCString();
        doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text('ASSESSMENT TARGET SPECIFICATION');
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke();
        doc.moveDown(0.8);

        doc.font('Helvetica').fontSize(9).fillColor(textDark);
        doc.text(`Target Host / Name:  ${scan.targetName || 'Production Host'}`);
        doc.text(`Assessed Target URL:  ${scan.targetUrl}`);
        doc.text(`Assessment Scan ID:  ${scan._id || scan.id}`);
        doc.text(`Execution Date:      ${scanDate}`);
        doc.text(`Scan Status:         ${scan.status}`);

        doc.moveDown(1.5);

        // Executive Summary & Score Block
        doc.rect(40, doc.y, 515, 75).fill('#f1f5f9');
        const boxTop = doc.y;

        doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text('EXECUTIVE SECURITY SCORE', 55, boxTop + 12);
        
        const score = typeof scan.securityScore === 'number' ? scan.securityScore : 100;
        let scoreLabel = 'Low Risk / Strong Baseline';
        let scoreColor = '#10b981';
        if (score < 60) {
          scoreLabel = 'High Risk / Immediate Remediation Required';
          scoreColor = '#ef4444';
        } else if (score < 80) {
          scoreLabel = 'Moderate Risk / Security Misconfigurations Detected';
          scoreColor = '#f59e0b';
        }

        doc.fillColor(scoreColor).fontSize(22).font('Helvetica-Bold').text(`${score} / 100`, 55, boxTop + 30);
        doc.fillColor(textMuted).fontSize(9).font('Helvetica').text(`VulnX Security Score - Status: ${scoreLabel}`, 55, boxTop + 56);

        doc.y = boxTop + 85;
        doc.moveDown(1);

        // Severity Distribution
        const dist = scan.severityDistribution || { Critical: 0, High: 0, Medium: 0, Low: 0, Informational: 0 };
        doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text('VULNERABILITY SEVERITY BREAKDOWN');
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke();
        doc.moveDown(0.8);

        const sevY = doc.y;
        doc.fontSize(9).font('Helvetica-Bold');
        doc.fillColor('#dc2626').text(`Critical: ${dist.Critical || 0}`, 50, sevY);
        doc.fillColor('#ea580c').text(`High: ${dist.High || 0}`, 140, sevY);
        doc.fillColor('#d97706').text(`Medium: ${dist.Medium || 0}`, 220, sevY);
        doc.fillColor('#2563eb').text(`Low: ${dist.Low || 0}`, 310, sevY);
        doc.fillColor('#64748b').text(`Informational: ${dist.Informational || 0}`, 380, sevY);
        doc.fillColor(textDark).text(`Total Findings: ${findings.length}`, 480, sevY);

        doc.y = sevY + 25;
        doc.moveDown(1);

        // Findings Details
        doc.fillColor(textDark).fontSize(12).font('Helvetica-Bold').text('DETAILED AUDIT FINDINGS');
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke();
        doc.moveDown(1);

        if (findings.length === 0) {
          doc.fillColor(textMuted).fontSize(10).font('Helvetica-Oblique').text('No security misconfigurations or vulnerabilities were identified during this assessment.');
        } else {
          findings.forEach((finding, index) => {
            // Page break safeguard
            if (doc.y > 680) {
              doc.addPage();
            }

            const itemY = doc.y;
            // Draw card border
            doc.rect(40, itemY, 515, 130).strokeColor('#e2e8f0').lineWidth(1).stroke();

            // Severity Badge Color
            let badgeColor = '#64748b';
            if (finding.severity === 'Critical') badgeColor = '#dc2626';
            else if (finding.severity === 'High') badgeColor = '#ea580c';
            else if (finding.severity === 'Medium') badgeColor = '#d97706';
            else if (finding.severity === 'Low') badgeColor = '#2563eb';

            // Title line
            doc.fillColor(badgeColor).fontSize(9).font('Helvetica-Bold').text(`[${finding.severity.toUpperCase()}]`, 50, itemY + 10);
            doc.fillColor(textDark).fontSize(10).font('Helvetica-Bold').text(`${index + 1}. ${finding.name}`, 120, itemY + 10);

            doc.fillColor(textMuted).fontSize(8).font('Helvetica').text(`Category: ${finding.category}  |  Target: ${finding.urlTested || scan.targetUrl}  |  Status: ${finding.status || 'Open'}`, 50, itemY + 26);

            // Description
            doc.fillColor(textDark).fontSize(8.5).font('Helvetica').text(`Description: ${finding.description}`, 50, itemY + 40, { width: 495 });

            // Evidence
            if (finding.evidence) {
              doc.fillColor('#475569').fontSize(8).font('Helvetica-Oblique').text(`Evidence: ${finding.evidence.substring(0, 150)}`, 50, itemY + 75, { width: 495 });
            }

            // Recommendation
            if (finding.recommendation) {
              doc.fillColor('#059669').fontSize(8).font('Helvetica-Bold').text(`Remediation: ${finding.recommendation.substring(0, 160)}`, 50, itemY + 100, { width: 495 });
            }

            doc.y = itemY + 140;
          });
        }

        // Assessment Conclusion
        if (doc.y > 680) {
          doc.addPage();
        }
        doc.moveDown(1);
        doc.fillColor(textDark).fontSize(11).font('Helvetica-Bold').text('ASSESSMENT CONCLUSION');
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y + 4).lineTo(555, doc.y + 4).stroke();
        doc.moveDown(0.8);
        doc.fillColor(textMuted).fontSize(8.5).font('Helvetica').text(
          'This automated vulnerability assessment was performed by VulnX scanning engines evaluating HTTP transport security, response headers, cookie protections, CORS restrictions, sensitive file exposures, and directory listing vulnerabilities. Remediate High and Critical findings first by updating server configurations and applying defensive HTTP response headers.',
          40,
          doc.y,
          { width: 515, align: 'justify' }
        );

        // Finalize doc
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

export default PdfService;
