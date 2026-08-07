import React from 'react';

const asArray = (value) => (Array.isArray(value) ? value : []);

export function parseAIAnalysisData(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return null;

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function List({ items, empty = '추가 정보가 없습니다.' }) {
  const values = asArray(items).filter(Boolean);
  if (!values.length) return <span className="text-gray-400">{empty}</span>;
  return (
    <ul className="space-y-1 text-sm text-gray-700">
      {values.slice(0, 6).map((item, index) => (
        <li key={`${index}-${String(item)}`} className="flex gap-2">
          <span className="text-emerald-600" aria-hidden="true">•</span>
          <span>{typeof item === 'string' ? item : item.text || item.claim || JSON.stringify(item)}</span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceBlock({ evidence }) {
  const items = asArray(evidence).filter(item => item && (item.quote || item.claim || item.source));
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">근거 일부</div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item, index) => (
          <div key={`${index}-${item.source || item.claim}`} className="text-sm text-gray-700">
            <span className="font-medium">{item.claim || item.source || '검증 근거'}</span>
            {item.quote && <span className="ml-1 text-gray-500">— “{item.quote}”</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIAnalysisSummary({ analysis, score, title = 'AI 분석 결과' }) {
  const payload = parseAIAnalysisData(analysis?.analysisData ?? analysis);
  const legacyText = typeof analysis?.analysisData === 'string' && !payload ? analysis.analysisData : null;
  const summary = payload?.summary || payload?.overall_summary || payload?.overallSummary || payload?.conclusion;
  const coverage = payload?.evidence_coverage ?? payload?.evidenceCoverage;
  const confidence = payload?.confidence;
  const stack = payload?.stack || payload?.technical_stack || payload?.technicalStack;
  const gaps = payload?.gaps || payload?.missing_evidence || payload?.missingEvidence;
  const risks = payload?.risk_flags || payload?.riskFlags;
  const verificationPlan = payload?.verification_plan || payload?.verificationPlan;
  const evidence = payload?.verified_evidence || payload?.evidence || payload?.claims;
  const fairness = payload?.fairness_guard || payload?.fairnessGuard;
  const trace = payload?.decision_trace || payload?.decisionTrace;
  const hasStructuredData = Boolean(payload);

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="font-semibold text-gray-800">{title}</h5>
        <div className="flex flex-wrap gap-2 text-xs">
          {score !== undefined && score !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">점수 {score}/100</span>}
          {coverage !== undefined && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">근거 커버리지 {coverage}%</span>}
          {confidence !== undefined && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">신뢰도 {Math.round(Number(confidence) * (Number(confidence) <= 1 ? 100 : 1))}%</span>}
          {hasStructuredData && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">구조화된 분석</span>}
        </div>
      </div>

      {summary ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{summary}</p> : null}
      {legacyText ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{legacyText}</p> : null}
      {!summary && !legacyText && <p className="mt-3 text-sm text-gray-400">아직 읽을 수 있는 분석 결과가 없습니다.</p>}

      {stack && <div className="mt-4"><div className="mb-1 text-xs font-semibold text-gray-500">기술·역량 신호</div><List items={Array.isArray(stack) ? stack : [stack]} /></div>}
      {(gaps || risks) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {gaps && <div><div className="mb-1 text-xs font-semibold text-amber-700">확인할 빈틈</div><List items={gaps} /></div>}
          {risks && <div><div className="mb-1 text-xs font-semibold text-red-700">주의 신호</div><List items={risks} /></div>}
        </div>
      )}
      {verificationPlan && <div className="mt-4"><div className="mb-1 text-xs font-semibold text-gray-500">다음 검증 제안</div><List items={verificationPlan} /></div>}
      <EvidenceBlock evidence={evidence} />
      {fairness && <div className="mt-4 text-xs text-gray-500"><span className="font-semibold">공정성 가드:</span> {typeof fairness === 'string' ? fairness : fairness.summary || fairness.status || '비업무적 신호를 판단에서 제외하도록 처리됨'}</div>}
      {trace && <div className="mt-2 text-xs text-gray-500"><span className="font-semibold">판단 단계:</span> {Array.isArray(trace) ? trace.join(' → ') : typeof trace === 'string' ? trace : trace.summary || '근거 수집 → 신호 요약 → 검증 필요점 산출'}</div>}
      {typeof analysis?.analysisData === 'string' && (
        <details className="mt-4 border-t border-gray-100 pt-3">
          <summary className="cursor-pointer text-xs text-gray-500">원문 JSON 보기</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs text-gray-500">{analysis.analysisData}</pre>
        </details>
      )}
    </section>
  );
}
