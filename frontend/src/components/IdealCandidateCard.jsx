import React from "react";

export default function IdealCandidateCard({ summary, onEditSummary, isEditing, setIsEditing, forceCleanSummary }) {
  const [editValue, setEditValue] = React.useState(summary || "");

  // summary가 바뀌면 textarea 값도 반영
  React.useEffect(() => {
    setEditValue(summary || "");
  }, [summary]);

  // 수정모드 진입 시 example~end 자동 제거
  React.useEffect(() => {
    if (forceCleanSummary) {
      setEditValue(cleanSummary(summary || ""));
    }
  }, [forceCleanSummary, summary]);

  let sections = [];
  if (summary && typeof summary === "string") {
    sections = summary
      .split(/\n|<br\s*\/?>/)
      .map(line => line.trim())
      .filter(line => line && /:/.test(line))
      .map(line => {
        const [title, ...rest] = line.split(":");
        return { title: title.trim(), content: rest.join(":").trim() };
      });
  }

  // <EXAMPLES>~<END> 혹은 "examples:" 라인 자동 제거
  function cleanSummary(text) {
    if (!text) return "";
    // <EXAMPLES>~<END> 제거
    let cleaned = text.replace(/<EXAMPLES>[\s\S]*?<END>/gi, "");
    // "examples:" 포함된 라인 제거
    cleaned = cleaned.replace(/.*examples:.*(\r?\n)?/gi, "");
    // 앞뒤 공백 줄 정리
    cleaned = cleaned.trim();
    return cleaned;
  }

  // 저장 버튼 클릭 시
  const handleSave = () => {
    const cleaned = cleanSummary(editValue);
    if (typeof onEditSummary === "function") onEditSummary(cleaned);
    setIsEditing(false);
  };

  // 취소 버튼 클릭 시
  const handleCancel = () => {
    setEditValue(summary || "");
    setIsEditing(false);
  };

  return (
    <div style={{
      width: "100%",
      minHeight: "250px",
      background: "#fff",
      padding: "1.2rem",
      paddingTop: 80,
      fontFamily: "inherit",
      color: "#222",
      position: "relative",
      borderRadius: 24
    }}>
      {/* 수정모드: textarea + 저장/취소 */}
      {isEditing ? (
        <div style={{ marginTop: 10 }}>
          <textarea
            style={{
              width: "100%",
              minHeight: "calc(75vh - 120px)",
              maxHeight: "calc(78vh)",
              fontSize: "1.04rem",
              fontFamily: "inherit",
              padding: "1.1rem 1rem",
              border: "1.7px solid #bdeada",
              borderRadius: 16,
              resize: "vertical",
              background: "#f8fbfa",
              boxSizing: "border-box",
              lineHeight: 1.8
            }}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            placeholder="- 직무 및 역할: 개발PM으로서 프로젝트를 주도하고 팀을 이끌어 나가는 역할
- 필수 기술 스택: Python을 활용한 개발 및 프로젝트 관리 능력
- 경력 및 경험: 도전적인 프로젝트 경험, 문제 해결을 위한 다양한 접근 방식 경험
- 성격 및 소프트 스킬: 도전정신, 창의적 사고, 유연성, 팀원과의 소통 능력
- 업무 스타일: 적극적이고 주도적인 업무 수행, 새로운 기술 및 방법론에 대한 학습 의지
- 회사 문화 적합성: 혁신과 도전을 즐기는 문화에 적합"
          />
          <div style={{ marginTop: 15, display: "flex", gap: 14, justifyContent: "center" }}>
            <button
              onClick={handleSave}
              style={{
                background: "linear-gradient(90deg, #19e3a3 35%, #39e0ca 100%)",
                color: "#fff",
                border: "none",
                borderRadius: 22,
                padding: "1.08rem 3rem",
                fontWeight: 700,
                fontSize: "1.11rem",
                cursor: "pointer",
                boxShadow: "0 2px 12px #18d1a021",
                letterSpacing: "0.01em",
                transition: "all 0.16s",
                minWidth: 120
              }}
            >저장</button>
            <button
              onClick={handleCancel}
              style={{
                background: "#f6f6f7",
                color: "#555",
                border: "1.2px solid #e3e3e6",
                borderRadius: 22,
                padding: "1.08rem 3rem",
                fontWeight: 700,
                fontSize: "1.11rem",
                cursor: "pointer",
                minWidth: 120
              }}
            >취소</button>
          </div>
        </div>
      ) : (
        sections.length > 0 ? (
          <div>
            {sections.map((sec, idx) => (
              <div key={idx} style={{ marginBottom: idx === sections.length - 1 ? 0 : "2.2rem" }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: "1.08rem",
                  marginBottom: "0.5rem",
                  letterSpacing: "-0.01em"
                }}>{sec.title}</div>
                <div style={{
                  fontWeight: 400,
                  fontSize: "1.04rem",
                  lineHeight: 1.7,
                  whiteSpace: "pre-line"
                }}>{sec.content}</div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            color: "#888",
            fontSize: "1rem",
            textAlign: "center",
            marginTop: "4rem"
          }}>
            AI 어시스턴트와 대화해 인재상을 구체적으로 작성해보세요.<br />
            작성 내용이 여기에 실시간으로 나타납니다.
          </div>
        )
      )}
    </div>
  );
}
