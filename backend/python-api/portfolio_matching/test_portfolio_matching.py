import json
import unittest

from portfolio_matching_api import _candidate_evidence_catalog, _normalize_portfolio_analysis


class PortfolioEvidenceTests(unittest.TestCase):
    def test_normalized_evidence_is_reproducible_and_source_bound(self):
        source = "I led the API migration and reduced latency by 30%."
        normalized = _normalize_portfolio_analysis({
            "summary": "API migration experience",
            "evidence": [
                {"topic": "project", "claim": "Led an API migration", "quote": "I led the API migration", "confidence": 0.9},
                {"topic": "project", "claim": "Invented a 99% uptime result", "quote": "99% uptime", "confidence": 0.9},
            ],
        }, source)

        self.assertEqual(normalized["version"], "portfolio-evidence-v1")
        self.assertEqual(normalized["evidence"][0]["verification_state"], "verified")
        self.assertEqual(normalized["evidence"][1]["verification_state"], "unverified")
        catalog = _candidate_evidence_catalog(json.dumps(normalized, ensure_ascii=False))
        self.assertEqual(len(catalog), 1)
        self.assertEqual(next(iter(catalog.values()))["quote"], "I led the API migration")


if __name__ == "__main__":
    unittest.main()
