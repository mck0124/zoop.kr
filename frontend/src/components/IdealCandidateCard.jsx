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
            placeholder="- Role mission: Own delivery of a developer platform and align the team around outcomes
- Must-have capabilities: Practical Python experience and strong project execution
- Experience: Challenging projects with multiple approaches to problem solving
- Collaboration: Clear communication and constructive teamwork
- Growth: Proactive learning of new tools and methods"
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
            >Save</button>
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
            >Cancel</button>
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
            Describe the ideal candidate with the AI assistant.<br />
            Your brief will appear here in real time.
          </div>
        )
      )}
    </div>
  );
}
