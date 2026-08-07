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
          <div key={`${index}-${item.evidence_id || item.source || item.claim}`} className="rounded-lg border border-emerald-100 bg-white/70 p-2 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.claim || item.source || '검증 근거'}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.verification_state === 'verified' || item.verification_state === 'grounded' ? 'bg-emerald-100 text-emerald-700' : item.verification_state === 'context_only' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {item.verification_state === 'verified' || item.verification_state === 'grounded' ? '후보자 원문 확인' : item.verification_state === 'context_only' ? '공고 맥락' : '확인 필요'}
              </span>
            </div>
            {item.quote && <div className="mt-1 text-gray-500">“{item.quote}”</div>}
            {item.evidence_id && <div className="mt-1 font-mono text-[10px] text-gray-400">근거 ID {item.evidence_id}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIAnalysisSummary({ analysis, score, title = 'AI 분석 결과' }) {
  const payload = parseAIAnalysisData(analysis?.analysisData ?? analysis);
  const legacyText = typeof analysis?.analysisData === 'string' && !payload ? analysis.analysisData : null;
  const analysisRoot = payload?.analysis && typeof payload.analysis === 'object' ? payload.analysis : payload;
  const categories = asArray(analysisRoot?.categories);
  const totalFeedback = analysisRoot?.total_feedback || analysisRoot?.totalFeedback;
  const summary = payload?.summary || payload?.overall_summary || payload?.overallSummary || payload?.conclusion || totalFeedback?.summary || payload?.overallEvaluation;
  const coverage = payload?.evidence_coverage ?? payload?.evidenceCoverage;
  const confidence = payload?.confidence;
  const stack = payload?.stack || payload?.technical_stack || payload?.technicalStack;
  const gaps = payload?.gaps || payload?.missing_evidence || payload?.missingEvidence;
  const risks = payload?.risk_flags || payload?.riskFlags;
  const verificationPlan = payload?.verification_plan || payload?.verificationPlan;
  const evidence = payload?.verified_evidence || payload?.evidence || payload?.claims || categories.flatMap(category => asArray(category.evidence).map(item => ({ ...item, claim: item.claim || category.name })));
  const fairness = payload?.fairness_guard || payload?.fairnessGuard;
  const trace = payload?.decision_trace || payload?.decisionTrace;
  const audit = payload?.audit || payload?.evidence_audit || null;
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
          {audit?.ledger_version && <span className="rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-white">Evidence Ledger</span>}
        </div>
      </div>

      {audit && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">이 판단은 ‘점수’가 아니라 추적 가능한 검증 기록입니다</span>
            <span className="font-mono text-[10px] text-slate-400">{audit.policy_version || 'grounded-hiring-v1'}</span>
          </div>
          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            <span>입력 계열: <b>{audit.source_type || '원문'}</b></span>
            <span>검증 근거: <b>{audit.evidence_count ?? 0}개</b></span>
            <span>원문 지문: <b className="font-mono">{audit.source_fingerprint ? `${audit.source_fingerprint.slice(0, 10)}…` : '없음'}</b></span>
          </div>
        </div>
      )}

      {summary ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{summary}</p> : null}
      {legacyText ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{legacyText}</p> : null}
      {!summary && !legacyText && <p className="mt-3 text-sm text-gray-400">아직 읽을 수 있는 분석 결과가 없습니다.</p>}

      {stack && <div className="mt-4"><div className="mb-1 text-xs font-semibold text-gray-500">기술·역량 신호</div><List items={Array.isArray(stack) ? stack : [stack]} /></div>}
      {categories.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {categories.slice(0, 6).map((category, index) => (
            <div key={`${category.name || category.category}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-700">
                <span>{category.name || category.category || '평가 항목'}</span>
                {category.score !== undefined && <span className="text-violet-700">{category.score}/{category.max_score || category.max || 25}</span>}
              </div>
              {(category.reason || category.improvement) && <p className="mt-1 text-xs leading-5 text-gray-600">{category.reason || category.improvement}</p>}
            </div>
          ))}
        </div>
      )}
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
