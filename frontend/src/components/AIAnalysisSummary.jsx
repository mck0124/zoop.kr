import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';

const ANALYSIS_COPY = {
  en: { title: 'AI analysis', empty: 'No additional information.', evidencePart: 'Evidence highlights', verified: 'Candidate source verified', context: 'Job context', needs: 'Needs verification', evidence: 'Evidence', score: 'Score', coverage: 'Evidence coverage', confidence: 'Confidence', strong: 'Well supported', insufficient: 'Insufficient evidence', review: 'Review recommended', structured: 'Structured analysis', ledger: 'This is a traceable verification record, not just a score.', input: 'Input type', source: 'source', evidenceCount: 'verified items', fingerprint: 'Source fingerprint', none: 'none', unreadable: 'No readable analysis is available yet.', calibration: 'Evidence-calibrated score', draft: 'AI draft', calibrated: 'verified', signals: 'Technical and competency signals', gaps: 'Evidence gaps', risks: 'Risk flags', next: 'Next verification steps', fairness: 'Fairness guard', fairnessDefault: 'Non-job-related signals are excluded.', trace: 'Decision trace', traceDefault: 'Collect evidence → summarize signals → identify verification needs', integrity: 'Source integrity', integrityPass: 'No instruction-like injection detected', integrityReview: 'Review source instructions', counterfactuals: 'What could change this decision?', counterfactualDefault: 'No counterfactual verification step was returned.', diversity: 'Evidence diversity', diversityDefault: 'Independent evidence types reduce overreliance on a single signal.', quality: 'Evidence quality gate', qualityAction: 'Recommended reviewer action', qualityGrounded: 'grounded', qualityNeeds: 'need verification', qualityUnsupported: 'unsupported claim rate', qualityLow: 'low review priority', qualityMedium: 'medium review priority', qualityHigh: 'high review priority', receipt: 'Download decision receipt', raw: 'View raw JSON', analysisTitle: 'AI analysis result' },
  ko: { title: 'AI 분석 결과', empty: '추가 정보가 없습니다.', evidencePart: '근거 일부', verified: '후보자 원문 확인', context: '공고 맥락', needs: '확인 필요', evidence: '검증 근거', score: '점수', coverage: '근거 커버리지', confidence: '신뢰도', strong: '근거 충분', insufficient: '근거 부족', review: '검토 권장', structured: '구조화된 분석', ledger: '이 판단은 ‘점수’가 아니라 추적 가능한 검증 기록입니다', input: '입력 계열', source: '원문', evidenceCount: '개', fingerprint: '원문 지문', none: '없음', unreadable: '아직 읽을 수 있는 분석 결과가 없습니다.', calibration: '근거 보정 점수', draft: 'AI 초안', calibrated: '검증 반영', signals: '기술·역량 신호', gaps: '확인할 빈틈', risks: '주의 신호', next: '다음 검증 제안', fairness: '공정성 가드', fairnessDefault: '비업무적 신호를 판단에서 제외하도록 처리됨', trace: '판단 단계', traceDefault: '근거 수집 → 신호 요약 → 검증 필요점 산출', integrity: '원문 무결성', integrityPass: '지시문형 주입 패턴 없음', integrityReview: '원문 지시문 검토 필요', counterfactuals: '판단을 바꿀 수 있는 확인 항목', counterfactualDefault: '반대 증거 확인 단계가 생성되지 않았습니다.', diversity: '근거 다양성', diversityDefault: '서로 다른 근거 유형을 사용해 하나의 신호에 과도하게 의존하지 않습니다.', quality: '근거 품질 게이트', qualityAction: '추천 검토 행동', qualityGrounded: '검증됨', qualityNeeds: '확인 필요', qualityUnsupported: '미검증 주장 비율', qualityLow: '낮은 검토 우선순위', qualityMedium: '중간 검토 우선순위', qualityHigh: '높은 검토 우선순위', receipt: '판단 영수증 다운로드', raw: '원문 JSON 보기', analysisTitle: 'AI 분석 결과' },
  zh: { title: 'AI 分析结果', empty: '没有更多信息。', evidencePart: '证据摘要', verified: '已验证候选人原文', context: '职位背景', needs: '需要验证', evidence: '验证证据', score: '分数', coverage: '证据覆盖率', confidence: '置信度', strong: '证据充分', insufficient: '证据不足', review: '建议复核', structured: '结构化分析', ledger: '这是一份可追溯的验证记录，而不仅是一个分数。', input: '输入类型', source: '原文', evidenceCount: '条已验证证据', fingerprint: '原文指纹', none: '无', unreadable: '暂时没有可读取的分析结果。', calibration: '证据校准分数', draft: 'AI 草案', calibrated: '验证后', signals: '技术与能力信号', gaps: '待确认信息', risks: '风险提示', next: '下一步验证建议', fairness: '公平性保护', fairnessDefault: '已排除与工作无关的信号。', trace: '判断过程', traceDefault: '收集证据 → 总结信号 → 识别验证需求', integrity: '来源完整性', integrityPass: '未检测到指令注入模式', integrityReview: '请复核来源中的指令文本', counterfactuals: '可能改变判断的证据', counterfactualDefault: '没有生成反向验证步骤。', diversity: '证据多样性', diversityDefault: '使用不同证据类型，降低对单一信号的过度依赖。', quality: '证据质量门', qualityAction: '建议的审核动作', qualityGrounded: '已验证', qualityNeeds: '需要验证', qualityUnsupported: '未验证声明比例', qualityLow: '低审核优先级', qualityMedium: '中审核优先级', qualityHigh: '高审核优先级', receipt: '下载判断凭证', raw: '查看原始 JSON', analysisTitle: 'AI 分析结果' }
};

const EN_CATEGORY_LABELS = {
  '전문성': 'Technical expertise',
  '의사소통': 'Communication',
  '의사소통 능력': 'Communication skills',
  '문제해결': 'Problem solving',
  '문제해결 능력': 'Problem-solving ability',
  '자신감': 'Confidence',
  '자신감과 태도': 'Confidence and attitude',
  '경험의 구체성': 'Specificity of experience',
  '팔로워 수': 'Followers',
  '공개 저장소 수': 'Public repositories',
  '언어 다양성': 'Language breadth',
  '최근 활동성': 'Recent activity',
  '프로젝트 품질': 'Project quality',
  '기술적 깊이': 'Technical depth',
};

const asArray = (value) => (Array.isArray(value) ? value : []);
const finiteNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};
const formatPercent = (value) => {
  const number = finiteNumber(value);
  if (number === null) return null;
  const percent = number <= 1 ? number * 100 : number;
  return Math.round(Math.max(0, Math.min(100, percent)));
};

const GROUNDED_ANALYSIS_VERSIONS = new Set(['github-evidence-v1', 'portfolio-evidence-v1', 'interview-evidence-v1']);

export function getEvidenceGroundedScore(analysis, requestedScore) {
  const payload = parseAIAnalysisData(analysis?.analysisData ?? analysis);
  const root = payload?.analysis && typeof payload.analysis === 'object' ? payload.analysis : payload;
  if (!root) return null;
  const categories = asArray(root.categories || root.dimensions);
  const evidence = [
    ...asArray(root.evidence),
    ...asArray(root.verified_evidence),
    ...categories.flatMap(category => asArray(category.evidence)),
  ];
  const groundedCount = evidence.filter(item => ['verified', 'grounded'].includes(item?.verification_state)).length;
  const hasGroundingRecord = groundedCount > 0 && (
    GROUNDED_ANALYSIS_VERSIONS.has(root.version) ||
    Boolean(root.audit?.ledger_version || root.evidence_quality?.grounded_evidence || root.score_calibration || evidence.length)
  );
  const score = finiteNumber(root.score_calibration?.calibrated_score ?? root.score ?? payload?.score ?? requestedScore);
  return hasGroundingRecord && score !== null ? Math.round(Math.max(0, Math.min(100, score))) : null;
}

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

export function createDecisionReceipt(payload, { title, score, language = 'en' } = {}) {
  return {
    schema_version: 'zoop-decision-receipt-v1',
    title: title || 'ZOOP AI decision',
    language,
    score: finiteNumber(score),
    decision: payload?.decision || null,
    decision_gate: payload?.decision_gate || payload?.decisionGate || null,
    evidence_coverage: payload?.evidence_coverage ?? payload?.evidenceCoverage ?? null,
    confidence: payload?.confidence ?? null,
    score_calibration: payload?.score_calibration || payload?.scoreCalibration || null,
    evidence_diversity: payload?.evidence_diversity || payload?.evidenceDiversity || null,
    evidence_quality: payload?.evidence_quality || payload?.evidenceQuality || null,
    evidence: asArray(payload?.verified_evidence || payload?.evidence || payload?.claims),
    counterfactuals: asArray(payload?.counterfactuals),
    gaps: asArray(payload?.gaps || payload?.missing_evidence || payload?.missingEvidence),
    risks: asArray(payload?.risk_flags || payload?.riskFlags),
    verification_plan: asArray(payload?.verification_plan || payload?.verificationPlan),
    fairness_guard: payload?.fairness_guard || payload?.fairnessGuard || null,
    decision_trace: payload?.decision_trace || payload?.decisionTrace || [],
    audit: payload?.audit || payload?.evidence_audit || null,
    source_integrity: payload?.source_integrity || payload?.audit?.source_integrity || null,
    generated_at: new Date().toISOString(),
  };
}

export function downloadDecisionReceipt(receipt) {
  if (typeof document === 'undefined' || !receipt) return false;
  const blob = new Blob([JSON.stringify(receipt, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `zoop-decision-receipt-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  return true;
}

function List({ items, empty }) {
  const values = asArray(items).filter(Boolean);
  if (!values.length) return <span className="text-gray-400">{empty}</span>;
  return (
    <ul className="space-y-1 text-sm text-gray-700">
      {values.slice(0, 6).map((item, index) => (
        <li key={`${index}-${String(item)}`} className="flex gap-2">
          <span className="text-emerald-600" aria-hidden="true">•</span>
          <span>
            {typeof item === 'string' ? item : (
              <>
                <span className="font-medium">{item.text || item.claim || item.signal || item.missing_signal || 'Review item'}</span>
                {(item.action || item.validation_action) && <span className="text-gray-600"> — {item.action || item.validation_action}</span>}
                {item.priority && <span className="ml-1 text-[11px] font-semibold uppercase text-amber-700">({item.priority})</span>}
              </>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function EvidenceBlock({ evidence, copy }) {
  const items = asArray(evidence).filter(item => item && (item.quote || item.claim || item.source));
  if (!items.length) return null;
  return (
    <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">{copy.evidencePart}</div>
      <div className="space-y-2">
        {items.slice(0, 4).map((item, index) => (
          <div key={`${index}-${item.evidence_id || item.source || item.claim}`} className="rounded-lg border border-emerald-100 bg-white/70 p-2 text-sm text-gray-700">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{item.claim || item.source || copy.evidence}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${item.verification_state === 'verified' || item.verification_state === 'grounded' ? 'bg-emerald-100 text-emerald-700' : item.verification_state === 'context_only' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                {item.verification_state === 'verified' || item.verification_state === 'grounded' ? copy.verified : item.verification_state === 'context_only' ? copy.context : copy.needs}
              </span>
            </div>
            {item.quote && <div className="mt-1 text-gray-500">“{item.quote}”</div>}
            {item.observed_value !== undefined && item.observed_value !== null && (
              <div className="mt-1 rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] text-slate-500">
                {typeof item.observed_value === 'string' ? item.observed_value : JSON.stringify(item.observed_value)}
              </div>
            )}
            {item.evidence_id && <div className="mt-1 font-mono text-[10px] text-gray-400">Evidence ID {item.evidence_id}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIAnalysisSummary({ analysis, score, title }) {
  const { language } = useLanguage();
  const copy = useMemo(() => ANALYSIS_COPY[language] || ANALYSIS_COPY.en, [language]);
  const displayCategoryName = (name) => language === 'en' ? (EN_CATEGORY_LABELS[name] || name) : name;
  const resolvedTitle = title || copy.analysisTitle;
  const payload = parseAIAnalysisData(analysis?.analysisData ?? analysis);
  const legacyText = typeof analysis?.analysisData === 'string' && !payload ? analysis.analysisData : null;
  const analysisRoot = payload?.analysis && typeof payload.analysis === 'object' ? payload.analysis : payload;
  // Interview analysis is stored as { analysis: {...}, score, transcripts } while
  // portfolio/GitHub analysis is stored directly. Keep one evidence UI for both.
  const data = analysisRoot || payload;
  const categories = asArray(analysisRoot?.categories || analysisRoot?.dimensions);
  const totalFeedback = analysisRoot?.total_feedback || analysisRoot?.totalFeedback;
  const summary = data?.summary || data?.overall_summary || data?.overallSummary || data?.conclusion || totalFeedback?.summary || data?.overallEvaluation;
  const coverage = data?.evidence_coverage ?? data?.evidenceCoverage;
  const confidence = data?.confidence;
  const decision = data?.decision;
  const stack = data?.stack || data?.technical_stack || data?.technicalStack;
  const gaps = data?.gaps || data?.missing_evidence || data?.missingEvidence;
  const risks = data?.risk_flags || data?.riskFlags;
  const verificationPlan = data?.verification_plan || data?.verificationPlan;
  const counterfactuals = data?.counterfactuals;
  const evidence = data?.verified_evidence || data?.evidence || (categories.length
    ? categories.flatMap(category => asArray(category.evidence).map(item => ({ ...item, claim: item.claim || category.name })))
    : data?.claims);
  const fairness = data?.fairness_guard || data?.fairnessGuard;
  const trace = data?.decision_trace || data?.decisionTrace;
  const audit = data?.audit || data?.evidence_audit || null;
  const sourceIntegrity = audit?.source_integrity || data?.source_integrity || null;
  const calibration = data?.score_calibration || data?.scoreCalibration || null;
  const evidenceDiversity = data?.evidence_diversity || data?.evidenceDiversity || null;
  const evidenceQuality = data?.evidence_quality || data?.evidenceQuality || null;
  const decisionGate = data?.decision_gate || data?.decisionGate || null;
  const hasStructuredData = Boolean(payload);
  const safeScore = getEvidenceGroundedScore(analysis, score);
  const coveragePercent = formatPercent(coverage);
  const confidencePercent = formatPercent(confidence);
  const handleDownloadReceipt = () => downloadDecisionReceipt(createDecisionReceipt(data, { title: resolvedTitle, score: safeScore, language }));

  return (
    <section className="rounded-xl border border-blue-100 bg-white p-4" aria-label={resolvedTitle}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h5 className="font-semibold text-gray-800">{resolvedTitle}</h5>
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs">
          {hasStructuredData && <button type="button" onClick={handleDownloadReceipt} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50" aria-label={copy.receipt}>{copy.receipt}</button>}
          {safeScore !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{copy.score} {Math.round(Math.max(0, Math.min(100, safeScore)))}/100</span>}
          {coveragePercent !== null && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">{copy.coverage} {coveragePercent}%</span>}
          {confidencePercent !== null && <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">{copy.confidence} {confidencePercent}%</span>}
          {decision && <span className={`rounded-full px-2.5 py-1 font-semibold ${decision === 'strong_match' ? 'bg-emerald-100 text-emerald-700' : decision === 'not_enough_evidence' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
            {decision === 'strong_match' ? copy.strong : decision === 'not_enough_evidence' ? copy.insufficient : copy.review}
          </span>}
          {hasStructuredData && <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-600">{copy.structured}</span>}
          {audit?.ledger_version && <span className="rounded-full bg-slate-900 px-2.5 py-1 font-semibold text-white">Evidence Ledger</span>}
        </div>
      </div>

      {audit && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-slate-800">{copy.ledger}</span>
            <span className="font-mono text-[10px] text-slate-400">{audit.policy_version || 'grounded-hiring-v1'}</span>
          </div>
          <div className="mt-2 grid gap-1 sm:grid-cols-3">
            <span>{copy.input}: <b>{audit.source_type || copy.source}</b></span>
            <span>{copy.evidence}: <b>{audit.evidence_count ?? 0}{copy.evidenceCount}</b></span>
            <span>{copy.fingerprint}: <b className="font-mono">{audit.source_fingerprint ? `${audit.source_fingerprint.slice(0, 10)}…` : copy.none}</b></span>
          </div>
        </div>
      )}

      {sourceIntegrity && (
        <div className={`mt-3 rounded-xl border p-3 text-xs ${sourceIntegrity.status === 'review' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{copy.integrity}</span>
            <span className="rounded-full bg-white/70 px-2 py-1 font-semibold">
              {sourceIntegrity.status === 'review' ? copy.integrityReview : copy.integrityPass}
            </span>
          </div>
          <p className="mt-1">{sourceIntegrity.note}</p>
          {sourceIntegrity.instruction_signal_count > 0 && <p className="mt-1 font-medium">Signals found: {sourceIntegrity.instruction_signal_count}</p>}
        </div>
      )}

      {fairness && (
        <div className={`mt-3 rounded-xl border p-3 text-xs ${fairness.status === 'review' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Fairness guard</span>
            <span className="rounded-full bg-white/70 px-2 py-1 font-semibold">{fairness.status || 'pass'}</span>
          </div>
          {fairness.audit?.note && <p className="mt-1">{fairness.audit.note}</p>}
          {fairness.audit?.violations?.length > 0 && <p className="mt-1 font-medium">Review flags: {fairness.audit.violations.join(', ')}</p>}
        </div>
      )}

      {summary ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{summary}</p> : null}
      {legacyText ? <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{legacyText}</p> : null}
      {!summary && !legacyText && <p className="mt-3 text-sm text-gray-400">{copy.unreadable}</p>}

      {calibration && (
        <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-3 text-xs text-teal-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{copy.calibration}</span>
            <span>{copy.draft} {Math.round(Number(calibration.model_score || 0))} → {copy.calibrated} {Math.round(Number(calibration.calibrated_score || safeScore || 0))}</span>
          </div>
          <p className="mt-1">{calibration.description || 'Only claims grounded in the candidate source are fully reflected in the decision.'}</p>
        </div>
      )}

      {decisionGate && (
        <div className={`mt-4 rounded-xl border p-3 text-xs ${decisionGate.status === 'downgraded' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">Deterministic decision gate</span>
            <span className="rounded-full bg-white/70 px-2 py-1 font-semibold">{decisionGate.status || 'pass'}</span>
          </div>
          <p className="mt-1">{decisionGate.note || 'The final decision is bounded by evidence and safety checks.'}</p>
          {decisionGate.reasons?.length > 0 && <p className="mt-1 font-medium">Review reasons: {decisionGate.reasons.join(' · ')}</p>}
        </div>
      )}

      {evidenceDiversity && (
        <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{copy.diversity}</span>
            <span className="rounded-full bg-white/70 px-2 py-1 font-semibold">{evidenceDiversity.source_count ?? 0} source type(s)</span>
          </div>
          <p className="mt-1">{evidenceDiversity.description || copy.diversityDefault}</p>
          {Array.isArray(evidenceDiversity.distinct_sources) && evidenceDiversity.distinct_sources.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{evidenceDiversity.distinct_sources.map(source => <span key={source} className="rounded-full bg-white px-2 py-1 font-mono text-[10px] text-indigo-700">{source}</span>)}</div>}
        </div>
      )}

      {evidenceQuality && (
        <div className={`mt-4 rounded-xl border p-3 text-xs ${evidenceQuality.review_priority === 'high' ? 'border-rose-200 bg-rose-50 text-rose-900' : evidenceQuality.review_priority === 'medium' ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold">{copy.quality}</span>
            <span className="rounded-full bg-white/80 px-2 py-1 font-semibold">{evidenceQuality.review_priority === 'high' ? copy.qualityHigh : evidenceQuality.review_priority === 'medium' ? copy.qualityMedium : copy.qualityLow}</span>
          </div>
          <div className="mt-2 grid gap-1 sm:grid-cols-4">
            <span>{copy.qualityGrounded}: <b>{evidenceQuality.grounded_evidence ?? 0}</b></span>
            <span>{copy.qualityNeeds}: <b>{evidenceQuality.needs_verification ?? 0}</b></span>
            <span>{copy.coverage}: <b>{evidenceQuality.coverage_percent ?? 0}%</b></span>
            <span>{copy.qualityUnsupported}: <b>{evidenceQuality.unsupported_claim_rate ?? 0}%</b></span>
          </div>
          <div className="mt-2"><b>{copy.qualityAction}:</b> {evidenceQuality.recommended_action}</div>
          {Array.isArray(evidenceQuality.review_reasons) && <ul className="mt-1 list-disc pl-4">{evidenceQuality.review_reasons.slice(0, 3).map(reason => <li key={reason}>{reason}</li>)}</ul>}
        </div>
      )}

      {stack && <div className="mt-4"><div className="mb-1 text-xs font-semibold text-gray-500">{copy.signals}</div><List items={Array.isArray(stack) ? stack : [stack]} empty={copy.empty} /></div>}
      {categories.length > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {categories.slice(0, 6).map((category, index) => (
            <div key={`${category.name || category.category}-${index}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex items-center justify-between gap-2 text-sm font-semibold text-gray-700">
                <span>{displayCategoryName(category.name || category.category || 'Evaluation item')}</span>
                {category.score !== undefined && <span className="text-violet-700">{category.score}/{category.max_score || category.max || 25}</span>}
              </div>
              {(category.reason || category.improvement) && <p className="mt-1 text-xs leading-5 text-gray-600">{category.reason || category.improvement}</p>}
            </div>
          ))}
        </div>
      )}
      {(gaps || risks) && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {gaps && <div><div className="mb-1 text-xs font-semibold text-amber-700">{copy.gaps}</div><List items={gaps} empty={copy.empty} /></div>}
          {risks && <div><div className="mb-1 text-xs font-semibold text-red-700">{copy.risks}</div><List items={risks} empty={copy.empty} /></div>}
        </div>
      )}
      {verificationPlan && <div className="mt-4"><div className="mb-1 text-xs font-semibold text-gray-500">{copy.next}</div><List items={verificationPlan} empty={copy.empty} /></div>}
      {counterfactuals && <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50/60 p-3"><div className="mb-1 text-xs font-semibold text-violet-700">{copy.counterfactuals}</div>{asArray(counterfactuals).length ? <div className="space-y-2">{asArray(counterfactuals).slice(0, 4).map((item, index) => <div key={`${index}-${item.missing_signal || item.validation_action}`} className="rounded-lg border border-violet-100 bg-white/70 p-2 text-sm text-gray-700"><div className="font-medium">{item.missing_signal || item.signal || copy.needs}</div>{item.validation_action && <div className="mt-1 text-gray-600">Next check: {item.validation_action}</div>}{item.expected_score_delta !== undefined && <div className="mt-1 text-xs font-semibold text-violet-700">Potential score change: {Number(item.expected_score_delta) > 0 ? '+' : ''}{item.expected_score_delta}</div>}</div>)}</div> : <span className="text-sm text-gray-500">{copy.counterfactualDefault}</span>}</div>}
      <EvidenceBlock evidence={evidence} copy={copy} />
      {trace && <div className="mt-2 text-xs text-gray-500"><span className="font-semibold">{copy.trace}:</span> {Array.isArray(trace) ? trace.join(' → ') : typeof trace === 'string' ? trace : trace.summary || copy.traceDefault}</div>}
      {typeof analysis?.analysisData === 'string' && (
        <details className="mt-4 border-t border-gray-100 pt-3">
          <summary className="cursor-pointer text-xs text-gray-500">{copy.raw}</summary>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-gray-50 p-3 text-xs text-gray-500">{analysis.analysisData}</pre>
        </details>
      )}
    </section>
  );
}
