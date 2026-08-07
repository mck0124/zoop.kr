import React, { useState, useRef, useEffect } from "react";
import { HiOutlineLightningBolt } from "react-icons/hi";
import { apiUrl, CHATBOT_API_URL } from "../api/config";

// ✅ 기본 프리셋 예시 (아무 입력도 없을 때)
const defaultCandidatePhrases = [
  "예상 인재상 작성",
  "책임감 있는 인재를 원합니다",
  "팀워크를 중시합니다",
  "문제해결 능력이 뛰어난 분을 선호합니다",
  "실무 경험이 풍부한 분이면 좋겠습니다",
  "주도적으로 일하는 사람이 필요합니다",
  "창의적이고 유연한 사고를 가진 분",
  "빠른 학습 능력을 갖춘 인재",
  "커뮤니케이션이 원활한 분",
  "리더십 경험이 있는 분",
  "새로운 기술에 관심이 많은 분",
  "고객 중심의 사고를 가진 분",
  "데이터 기반 의사결정이 가능한 분",
  "자기주도적으로 성장하는 인재",
  "협업과 소통을 즐기는 분",
  "도전정신이 강한 분",
  "윤리의식이 투철한 분",
  "긍정적인 마인드를 가진 분"
];

// 최근에 보여준 버튼 phrase를 저장 (최대 10개)
let recentPhraseHistory = [];

function getDynamicCandidatePhrases(messages) {
  // 최근 입력/AI답변에 특정 키워드 있으면 다채롭게 제안 (간단 예시)
  const keywords = [
    { key: "책임", phrase: "주도적이고 책임감 있는 분을 원합니다" },
    { key: "경험", phrase: "실무 경험이 풍부한 인재가 이상적입니다" },
    { key: "팀워크", phrase: "팀과 협업을 잘하는 분이면 좋겠습니다" },
    { key: "소통", phrase: "원활한 소통 능력을 갖춘 인재를 선호합니다" },
    { key: "문제해결", phrase: "문제 해결 능력이 뛰어난 분을 선호합니다" },
    { key: "꼼꼼", phrase: "꼼꼼하고 디테일을 잘 챙기는 분을 찾고 있습니다" },
    { key: "창의", phrase: "창의적이고 유연한 사고를 가진 분을 선호합니다" },
    { key: "리더", phrase: "리더십 경험이 있는 분을 원합니다" },
    { key: "데이터", phrase: "데이터 기반 의사결정이 가능한 분을 선호합니다" },
    { key: "긍정", phrase: "긍정적인 마인드를 가진 인재를 찾고 있습니다" }
  ];
  let picks = [];
  let text = messages.map(m => (typeof m.content === "string" ? m.content : "")).join(" ");
  for (let { key, phrase } of keywords) {
    if (text.includes(key)) picks.push(phrase);
  }
  // 후보군: 키워드 기반 picks + 프리셋 섞기
  let pool = Array.from(new Set([...picks, ...defaultCandidatePhrases]));
  // 최근에 보여준 phrase는 제외
  pool = pool.filter(p => !recentPhraseHistory.includes(p));
  // 동일한 입력은 동일한 제안을 반환해 재현 가능한 UX를 유지합니다.
  const result = pool.slice(0, 6);
  // 최근 phrase 히스토리 갱신 (최대 10개)
  recentPhraseHistory = [...recentPhraseHistory, ...result].slice(-10);
  // 만약 후보가 부족하면 프리셋에서 추가
  if (result.length < 4) {
    const more = defaultCandidatePhrases.filter(p => !result.includes(p) && !recentPhraseHistory.includes(p));
    result.push(...more.slice(0, 4 - result.length));
    recentPhraseHistory = [...recentPhraseHistory, ...result].slice(-10);
  }
  return result;
}

export default function IdealCandidateChatbot({ recruitFilters, onIdealCandidateUpdate, style }) {
  function getFilterSummaryLines(filters) {
    if (!filters) return [];
    const f = filters.filters || filters;
    const lines = [];
    if (f.roles && f.roles.length) lines.push(`직무: ${f.roles.join(", ")}`);
    if (f.languages && f.languages.length) lines.push(`언어: ${f.languages.join(", ")}`);
    let regionStr = "";
    if (f.nationwide) regionStr = "전국";
    else if (f.regions && f.regions.length) regionStr = f.regions.join(", ");
    if (regionStr) lines.push(`지역: ${regionStr}`);
    if (f.salary) lines.push(`연봉: ${Number(f.salary).toLocaleString()}만원`);
    if (f.headcount) lines.push(`인원수: ${f.headcount}명`);
    if (filters.expiryDate) lines.push(`마감일: ${filters.expiryDate}`);
    if (filters.description) lines.push(`상세설명: ${filters.description}`);
    return lines;
  }
  const filterSummaryLines = getFilterSummaryLines(recruitFilters);

  // 기본 안내 메시지
  const initialAIMessage = {
    type: "ai",
    content: (
      <div style={{ color: "#222" }}>
        <div style={{ fontWeight: 700, marginBottom: "0.5rem", fontSize: "1.1rem" }}>
          안녕하세요! 👋
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <strong>회사 인재상 작성 AI 어시스턴트</strong>입니다.
        </div>
        {filterSummaryLines.length > 0 && (
          <div style={{ marginBottom: "0.5rem", fontWeight: 500 }}>
            {filterSummaryLines.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
            <div style={{ marginTop: "0.5rem" }}>
              추가로 필요한 <b>기술 스택, 경험, 가치관</b> 등을 자유롭게 말씀해 주세요.
            </div>
          </div>
        )}
        {filterSummaryLines.length === 0 && (
          <div>
            추가로 필요한 <b>기술 스택, 경험, 가치관</b> 등을 자유롭게 말씀해 주세요.
          </div>
        )}
      </div>
    )
  };

  const [messages, setMessages] = useState([initialAIMessage]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [examples, setExamples] = useState([]);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const isSending = useRef(false);

  // 예상 버튼들
  const candidatePhrases =
    examples && examples.length > 0
      ? examples
      : messages.length === 1 && messages[0] === initialAIMessage
        ? defaultCandidatePhrases
        : getDynamicCandidatePhrases(messages);

  // 예상 버튼들(중복 제거)
  const uniqueCandidatePhrases = Array.from(new Set(candidatePhrases));

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, showSuggestions]);

  // AI 답변 보내기
  const handleAIResponse = async () => {
    if (isSending.current) return;
    isSending.current = true;
    setLoading(true);
    try {
      let summary = "";
      let guide = "";
      const lastUserMsg = messages[messages.length - 1].content;
      const history = messages
        .filter(msg => msg.type === "user" || msg.type === "ai")
        .map(msg => ({
          role: msg.type === "user" ? "user" : "assistant",
          content: typeof msg.content === "string"
            ? msg.content
            : ""
        }));
      const response = await fetch(apiUrl('/ideal-candidate-chat', CHATBOT_API_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: history.slice(0, -1),
          user_input: lastUserMsg,
          recruit_filters: recruitFilters
        }),
      });
      if (!response.ok) throw new Error("API 호출 실패");
      const data = await response.json();
      let aiResponse = typeof data.answer === "string" ? data.answer : "요청을 처리할 수 있는 AI 응답이 없습니다.";
      // <SUMMARY> 파싱 및 제거 (닫는 태그가 없어도 <SUMMARY> 이후는 모두 제거)
      const summaryMatch = aiResponse.match(/<SUMMARY>([\s\S]*?)(<\/SUMMARY>|$)/);
      if (summaryMatch) {
        summary = summaryMatch[1].trim();
        // <SUMMARY>가 있으면 그 앞까지만 안내문구로 사용
        const summaryStart = aiResponse.indexOf('<SUMMARY>');
        if (summaryStart !== -1) {
          guide = aiResponse.slice(0, summaryStart);
        }
      } else {
        guide = aiResponse;
      }
      // <EXAMPLES> 태그 파싱 및 제거
      let parsedExamples = [];
      const examplesMatch = aiResponse.match(/<EXAMPLES>([\s\S]*?)<END>/);
      if (examplesMatch) {
        guide = guide.replace(examplesMatch[0], "");
        parsedExamples = examplesMatch[1]
          .split("||")
          .map(e => e.trim())
          .filter(Boolean);

          parsedExamples = Array.from(new Set(parsedExamples));

      }
      // 안내문구만 남기기 (앞뒤 공백/줄바꿈 정리)
      guide = guide.trim().replace(/^\n+|\n+$/g, "");
      setExamples(parsedExamples);
      // 안내문구만 챗봇에 표시
      setMessages((prevMsgs) => [
        ...prevMsgs,
        { type: "ai", content: guide }
      ]);
      // 인재상 요약만 업데이트
      if (typeof onIdealCandidateUpdate === "function") {
        onIdealCandidateUpdate({ summary, answer: guide });
      }
    } catch (error) {
      setMessages((prevMsgs) => [
        ...prevMsgs,
        { type: "ai", content: "죄송합니다. 일시적인 오류가 발생했습니다. 다시 시도해 주세요." }
      ]);
    } finally {
      setLoading(false);
      isSending.current = false;
    }
  };

  // 유저 입력 전송
  const sendMessage = (text) => {
    if (isSending.current || loading || !text.trim()) return;
    setMessages((prevMsgs) => [
      ...prevMsgs,
      { type: "user", content: text }
    ]);
    setInputValue("");
    setShowSuggestions(false); // 버튼 숨김 (예상 버튼 클릭/엔터 모두)
    if (inputRef.current) inputRef.current.value = "";
  };

  // Enter 입력 핸들러
  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isComposing) return;
      e.preventDefault();
      const msg = inputValue.trim();
      if (msg !== "" && !loading && !isSending.current) {
        sendMessage(msg);
      }
    }
  };

  // 예시 버튼 클릭 시 input에 입력 + 즉시 메시지 전송, 버튼 숨김
  const handlePhraseClick = (phrase) => {
    setInputValue("");
    setShowSuggestions(false); // 클릭 시 바로 숨김
    sendMessage(phrase);
  };

  // 메시지 바뀔 때 AI 호출
  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "user" &&
      !loading &&
      !isSending.current
    ) {
      handleAIResponse();
    }
    // eslint-disable-next-line
  }, [messages, loading]);

  // AI 답변이 오면 showSuggestions true (AI 답 오기 전엔 무조건 false)
  useEffect(() => {
    // messages 마지막이 'ai'일 때만 showSuggestions true로
    if (!loading && messages.length > 0 && messages[messages.length - 1].type === "ai") {
      setShowSuggestions(true);
    }
  }, [messages, loading]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
        background: "none",
        borderRadius: 24,
        ...style,
      }}
    >
      {/* 헤더 */}
      <div style={{
        padding: "1.2rem 2rem 1.2rem 2rem",
        background: "linear-gradient(115deg, #20e1a9 55%, #8ef5e2 100%)",
        color: "#000",
        display: "flex",
        alignItems: "center",
        gap: "0.85rem",
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        boxShadow: "0 2px 8px #a3f3e310",
        margin: 0,
      }}>
        <div style={{
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          <HiOutlineLightningBolt size={20} color="#18d1a0" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: "1.13rem", color: "#000" }}>AI 인재상 작성</div>
          <div style={{ fontSize: "0.89rem", color: "#000" }}>실시간 대화형 어시스턴트</div>
        </div>
      </div>
      {/* 메시지 영역 */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "1.25rem 1.7rem 0.7rem 1.7rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.2rem",
          background: "#fff",
          minHeight: 0,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.type === "user" ? "flex-end" : "flex-start"
            }}
          >
            <div
              style={{
                maxWidth: "76%",
                padding: "0.85rem 1.22rem",
                borderRadius: msg.type === "user" ? "18px 18px 6px 22px" : "18px 18px 22px 6px",
                background: msg.type === "user"
                  ? "linear-gradient(98deg,#18e4b6 60%,#5be6c2 100%)"
                  : "#f4f8f7",
                color: msg.type === "user" ? "#fff" : "#000",
                fontSize: "1.03rem",
                fontWeight: msg.type === "user" ? 700 : 500,
                boxShadow: msg.type === "user"
                  ? "0 1.5px 7px #a3e5d1"
                  : "0 2.5px 9px #caf6e525"
              }}
            >
              {typeof msg.content === "string" ? msg.content : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{
              padding: "0.85rem 1.22rem",
              borderRadius: "18px 18px 22px 6px",
              background: "#f4f8f7",
              color: "#000",
              fontSize: "1.03rem"
            }}>
              <div style={{ display: "flex", gap: "0.27rem" }}>
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#1ee1ae",
                  animation: "typing 1.4s infinite ease-in-out"
                }}></div>
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#1ee1ae",
                  animation: "typing 1.4s infinite ease-in-out 0.2s"
                }}></div>
                <div style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#1ee1ae",
                  animation: "typing 1.4s infinite ease-in-out 0.4s"
                }}></div>
              </div>
            </div>
          </div>
        )}
        {/* 예상 인재상 입력 버튼 (항상 오른쪽 정렬, 말풍선 스타일, 초록 네온 테두리, hover 효과, candidatePhrases만 사용) */}
        {showSuggestions && uniqueCandidatePhrases && uniqueCandidatePhrases.length > 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "0.5rem",
            marginTop: "0.7rem"
          }}>
            {uniqueCandidatePhrases.map((phrase, i) => (
              <button
                key={i}
                onClick={() => handlePhraseClick(phrase)}
                style={{
                  background: "#f4f8f7",
                  color: "#222",
                  border: "none",
                  borderRadius: "18px 18px 22px 6px",
                  fontSize: "1.03rem",
                  fontWeight: 500,
                  padding: "0.85rem 1.22rem",
                  marginBottom: 2,
                  cursor: "pointer",
                  boxShadow: "0 0 6px 1px #39e0ca33, 0 1.5px 7px #b3e5d110",
                  outline: "none",
                  textAlign: "left",
                  maxWidth: "76%",
                  alignSelf: "flex-end",
                  transition: "background 0.14s, color 0.14s, font-weight 0.13s, box-shadow 0.14s"
                }}
                onMouseOver={e => {
                  e.currentTarget.style.background = "#e3fbee";
                  e.currentTarget.style.color = "#12b48a";
                  e.currentTarget.style.fontWeight = 700;
                  e.currentTarget.style.boxShadow = "0 0 10px 2px #39e0ca55, 0 1.5px 7px #b3e5d110";
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = "#f4f8f7";
                  e.currentTarget.style.color = "#222";
                  e.currentTarget.style.fontWeight = 500;
                  e.currentTarget.style.boxShadow = "0 0 6px 1px #39e0ca33, 0 1.5px 7px #b3e5d110";
                }}
              >
                {phrase}
              </button>
            ))}
          </div>
        )}
      </div>
      {/* 입력 영역 */}
      <div style={{
        padding: "1rem 1.8rem",
        borderTop: "1px solid #e9f7f2",
        background: "#fff",
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        boxShadow: "none",
      }}>
        <div style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center"
        }}>
        <input
            ref={inputRef}
            type="text"
          value={inputValue}
          maxLength={2000}
            onChange={(e) => setInputValue(e.target.value)}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            onKeyDown={handleInputKeyDown}
            placeholder="인재상에 대해 자유롭게 말씀해 주세요..."
            style={{
              flex: 1,
              padding: "1rem 1.2rem",
              border: "1.6px solid #e0f4ea",
              borderRadius: "20px",
              fontSize: "1.02rem",
              outline: "none",
              background: "#f7fafc",
              fontWeight: 500,
              transition: "border-color 0.19s"
            }}
            onFocus={e => e.target.style.borderColor = "#14cda3"}
            onBlur={e => e.target.style.borderColor = "#e0f4ea"}
          />
          <button
            onClick={() => {
              const msg = inputValue.trim();
              if (msg !== "" && !loading && !isSending.current) {
                sendMessage(msg);
              }
            }}
            disabled={loading || isSending.current || !inputValue.trim()}
            style={{
              padding: "0.83rem",
              background: inputValue.trim()
                ? "linear-gradient(95deg,#17e1a5 60%,#57e0bf 100%)"
                : "#ddd",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: "45px",
              height: "45px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: "1.08rem",
              cursor: inputValue.trim() ? "pointer" : "not-allowed",
              boxShadow: inputValue.trim()
                ? "0 1.5px 8px #79e6ce45"
                : "none",
              transition: "all 0.18s"
            }}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-11px); }
        }
      `}</style>
    </div>
  );
}
