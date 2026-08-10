import unittest

try:
    import chatbot_api
except ModuleNotFoundError as error:  # Optional service dependencies may be absent in the lightweight test runner.
    raise unittest.SkipTest(f"chatbot service dependencies unavailable: {error}")


class GuideRetrievalTests(unittest.TestCase):
    def setUp(self):
        self.original_pages = chatbot_api.PDF_PAGES
        chatbot_api.PDF_PAGES = [
            {"page": 2, "text": "Candidates can submit a portfolio and employers can review applications."},
            {"page": 5, "text": "Interview schedules are managed by the company dashboard."},
        ]

    def tearDown(self):
        chatbot_api.PDF_PAGES = self.original_pages

    def test_unrelated_query_has_no_grounding_fallback(self):
        ranked = chatbot_api.rank_guide_context("What is the weather today?")

        self.assertEqual(ranked, [])
        self.assertEqual(chatbot_api.build_retrieval_report("What is the weather today?", ranked)["status"], "no_match")

    def test_retrieval_and_citation_are_bound_to_available_pages(self):
        ranked = chatbot_api.rank_guide_context("How do employers review applications?")
        pages = [page for _, page in ranked]

        self.assertEqual([page["page"] for page in pages], [2])
        self.assertEqual(chatbot_api.audit_guide_citations("Use the guide [Guide p. 2].", pages)["status"], "pass")
        self.assertEqual(chatbot_api.audit_guide_citations("Use [Guide p. 5].", pages)["status"], "review")


if __name__ == "__main__":
    unittest.main()
