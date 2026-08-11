# ZOOP presentation runbook

Use this order for a short product video. The public flow is intentionally first so the recording still works if a local AI service needs a restart.

## Recommended 2–3 minute flow

1. Open `/` and keep the language on **EN**.
2. Show the headline and explain: “ZOOP makes hiring evidence-verifiable instead of hiding everything behind an AI score.”
3. Scroll to **Try a real evidence check**.
   - Keep the prefilled source excerpt.
   - Enter a phrase that appears exactly in the source.
   - Click **Audit this claim** and show `Verified · exact source match`.
   - Replace the claim with a phrase that is not in the source and show `Needs verification`.
4. Scroll to **Try the ledger**.
   - Click **Verified evidence** to show the source quote and evidence ID.
   - Click **Open question** to show the missing verification step.
   - Click **Decision experiment**, then **Simulate new evidence** to show that a decision can change when evidence changes.
5. If a demo company account is available, continue with:
   - Company dashboard → open a role → Candidates
   - Open one candidate → show the evidence ledger, source integrity, fairness guard, and decision receipt
   - Avoid presenting a number when the UI says `Evidence review needed`; that is an intentional safety feature.

## Backup explanation if authenticated services are unavailable

Say: “The public Evidence Ledger demo is live locally and proves the core AI policy without uploading text. Authenticated candidate analysis is service-backed, so this recording focuses on the deterministic evidence gate rather than inventing a result.”

## Recording checklist

- Use a clean browser window at 1280×720 or a mobile-width shot for the responsive menu.
- Confirm the browser console has no errors before recording.
- Keep the browser language on EN for the main take; use the language switch only as a short closing proof.
- Do not show real candidate personal information or API keys.
- If an AI request stays loading, refresh once and use the public Evidence Ledger flow as the fallback scene.
