import unittest
import database
import models
import scan_comparator
import report_generator

class TestScanComparisonIntegration(unittest.TestCase):
    def setUp(self):
        self.db = database.SessionLocal()
        self.scans = self.db.query(models.Scan).order_by(models.Scan.created_at.desc()).all()

    def tearDown(self):
        self.db.close()

    def test_database_scans_available(self):
        self.assertGreaterEqual(len(self.scans), 2, "Database must have at least 2 real scans")

    def test_comparison_calculation(self):
        prev = self.scans[1]
        latest = self.scans[0]
        result = scan_comparator.compare_scans_data(prev, latest)

        # 1. Summary validation
        summary = result["summary"]
        self.assertIn("security_status", summary)
        self.assertIn("status_category", summary)
        self.assertIn(summary["status_category"], ["improved", "degraded", "neutral"])
        self.assertEqual(summary["score_difference"], summary["latest_security_score"] - summary["previous_security_score"])

        # 2. Severity validation
        sev = result["severity_comparison"]
        for k in ["critical", "high", "medium", "low", "total"]:
            self.assertIn(k, sev)
            self.assertEqual(sev[k]["change"], sev[k]["latest"] - sev[k]["previous"])

        # 3. Lifecycle validation
        vulns = result["vulnerability_changes"]
        self.assertIn("fixed", vulns)
        self.assertIn("new", vulns)
        self.assertIn("persistent", vulns)

        # 4. OWASP validation
        owasp = result["owasp_comparison"]
        self.assertEqual(len(owasp), 10)

        # 5. Headers & SSL
        self.assertIn("header_comparison", result)
        self.assertIn("ssl_comparison", result)

    def test_trend_calculation(self):
        trend = scan_comparator.get_real_scan_trend(self.db)
        self.assertTrue(trend["has_sufficient_data"])
        self.assertGreaterEqual(len(trend["security_trend"]), 2)
        self.assertGreaterEqual(len(trend["severity_trend"]), 2)

    def test_reports_generation(self):
        prev = self.scans[1]
        latest = self.scans[0]
        result = scan_comparator.compare_scans_data(prev, latest)
        
        html_report = report_generator.generate_comparison_html_report(result)
        self.assertIn("<!DOCTYPE html>", html_report)
        self.assertIn("CloudVuln Security Comparison Report", html_report)

        csv_report = report_generator.generate_comparison_csv_report(result)
        self.assertIn("CloudVuln Scan Comparison & Security Trend Report", csv_report)
        self.assertIn("Previous Security Score", csv_report)

if __name__ == "__main__":
    unittest.main()
