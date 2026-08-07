import React, { useState, useRef, useEffect } from "react";
import "./Chatbot.css";
import { HiOutlineLightningBolt, HiOutlineGlobeAlt } from "react-icons/hi";
import { apiUrl, PYTHON_API_URL } from '../api/config';

// 한글/영문 옵션 버튼
const initialOptions = {
  ko: [
    { label: "기업 고객 이신가요?" },
    { label: "구직자 유저 이신가요?" }
  ],
  en: [
    { label: "Are you a company client?" },
    { label: "Are you a job seeker?" }
  ]
};

// 한글/영문 웰컴 메시지
const welcomeMsgs = {
  ko: {
    type: "ai",
    content: (
      <div>
        <div>안녕하세요. <span role="img" aria-label="smile">😊</span></div>
        <div style={{ fontWeight: 700, margin: "0.32em 0", fontSize: "1.08em" }}>
          AI 채용 플랫폼 줍<span style={{ fontWeight: 400 }}>입니다.</span>
        </div>
        <div>줍에 궁금한 점이 있으시면 무엇이든 물어보세요.</div>
        <div>최대한 신속히 답변드리겠습니다.</div>
      </div>
    )
  },
  en: {
    type: "ai",
    content: (
      <div>
        <div>Hello! <span role="img" aria-label="smile">😊</span></div>
        <div style={{ fontWeight: 700, margin: "0.32em 0", fontSize: "1.08em" }}>
          This is <span style={{ fontWeight: 800 }}>ZOOP AI Recruiting Platform</span>
        </div>
        <div>If you have any questions, just ask!</div>
        <div>We’ll respond as quickly as possible.</div>
      </div>
    )
  }
};

export default function Chatbot({ open, onClose, anchorRef, onIdealCandidateUpdate }) {
  const [visible, setVisible] = useState(open);
  const [animClass, setAnimClass] = useState(open ? "open" : "closed");
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("ko");
  const [openTime, setOpenTime] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([welcomeMsgs["ko"]]);
  const [optionButtons, setOptionButtons] = useState(initialOptions["ko"]);
  const [isComposing, setIsComposing] = useState(false);

  const fileInputRef = useRef(null);
  const inputRef = useRef(null);
  const modalRef = useRef(null);
  const scrollRef = useRef(null);
  const isSending = useRef(false);

  // 🟢 (추가) messages가 변경될 때마다 마지막 AI 답변을 onIdealCandidateUpdate로 전달
  useEffect(() => {
    if (typeof onIdealCandidateUpdate === "function") {
      const lastAIMsg = [...messages].reverse().find(m => m.type === "ai");
      if (lastAIMsg) {
        onIdealCandidateUpdate({
          messages,
          lastAI: typeof lastAIMsg.content === "string"
            ? lastAIMsg.content
            : renderToPlain(lastAIMsg.content)
        });
      }
    }
    // eslint-disable-next-line
  }, [messages]);

  // 언어 바뀔 때 옵션/웰컴 메시지 초기화
  useEffect(() => {
    setOptionButtons(initialOptions[lang]);
    setMessages([welcomeMsgs[lang]]);
  }, [lang]);

  useEffect(() => {
    if (open) {
      setVisible(true);
      setTimeout(() => setAnimClass("open"), 10);
    } else {
      setAnimClass("closed");
      setTimeout(() => setVisible(false), 330);
    }
  }, [open]);

  useEffect(() => {
    if (visible && open) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
      const formattedMinutes = minutes.toString().padStart(2, "0");
      setOpenTime(`${formattedHours}:${formattedMinutes} ${ampm}`);
    }
  }, [visible, open]);

  useEffect(() => {
    if (visible && anchorRef?.current && modalRef.current) {
      modalRef.current.style.right = "36px";
      modalRef.current.style.bottom = "120px";
      modalRef.current.style.left = "";
      modalRef.current.style.width = "380px";
      modalRef.current.style.height = "680px";
      if (window.innerWidth < 600) {
        modalRef.current.style.right = "2vw";
        modalRef.current.style.left = "2vw";
        modalRef.current.style.width = "96vw";
        modalRef.current.style.bottom = "72px";
        modalRef.current.style.height = "85vh";
      }
    }
  }, [visible, anchorRef]);

  useEffect(() => {
    if (!langOpen) return;
    const handleClick = (e) => {
      if (!modalRef.current) return;
      if (!modalRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading, optionButtons]);

  useEffect(() => {
    if (
      messages.length > 0 &&
      messages[messages.length - 1].type === "user" &&
      !loading &&
      !isSending.current
    ) {
      handleAIResponse(messages);
    }
    // eslint-disable-next-line
  }, [messages]);

  // ** AI 답변을 굵은 글씨/줄바꿈으로 렌더링하는 함수 **
  function renderAIContent(content) {
    if (typeof content !== "string") return content;
    // AI 응답을 HTML로 주입하지 않고, 제한적인 굵은 글씨만 React 노드로 렌더링한다.
    return content.split("\n").map((line, lineIndex) => (
      <React.Fragment key={`line-${lineIndex}`}>
        {line.split(/(\*\*[^*]+\*\*)/g).map((part, partIndex) => {
          const isBold = part.startsWith("**") && part.endsWith("**") && part.length > 4;
          return isBold
            ? <strong key={`part-${partIndex}`}>{part.slice(2, -2)}</strong>
            : <React.Fragment key={`part-${partIndex}`}>{part}</React.Fragment>;
        })}
        {lineIndex < content.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  }

  const sendMessage = (text) => {
    if (isSending.current || loading || !text) return;
    setOptionButtons([]);
    setAttachedFile(null);
    setEmojiOpen(false);
    setMessages((prevMsgs) => [
      ...prevMsgs,
      { type: "user", content: text }
    ]);
    setInputValue("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleOptionClick = (label) => {
    if (loading || isSending.current) return;
    setInputValue("");
    if (inputRef.current) inputRef.current.value = "";
    sendMessage(label);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === "Enter") {
      if (isComposing) return;
      e.preventDefault();
      const msg = inputValue.trim();
      if (msg !== "" && !loading && !isSending.current) {
        setInputValue("");
        if (inputRef.current) inputRef.current.value = "";
        sendMessage(msg);
      }
    }
  };

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = (e) => {
    setIsComposing(false);
    setInputValue(e.target.value);
  };

  // API 호출: lang 같이 전달
  const handleAIResponse = async (msgHistory) => {
    isSending.current = true;
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/chat', PYTHON_API_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          history: msgsToHistory(msgHistory),
          user_input: msgHistory[msgHistory.length - 1].content,
          lang
        }),
      });
      if (!res.ok) throw new Error(`chat request failed: ${res.status}`);
      const data = await res.json();
      let botContent = typeof data.answer === "string" ? data.answer : "AI가 응답하지 않았습니다.", exBtns = [];
        const m = botContent.match(/<EXAMPLES>([\s\S]*?)<END>/);
        if (m) {
        botContent = botContent.replace(m[0], "").trim();
        exBtns = m[1]
            .split("\n")
            .map((t) =>
            t
                .trim()
                .replace(/^(\d+[.)])\s*/, "") // ← 앞에 "1. " 또는 "2) " 등 숫자+점/괄호+공백 제거
                .replace(/^[-*•]\s*/, "")      // ← 혹시 불릿(-, *, •)도 제거
            )
            .filter(Boolean);
        }

      setMessages((msgs) => [
        ...msgs,
        { type: "ai", content: botContent, sources: Array.isArray(data.sources) ? data.sources : [] }
      ]);
      setOptionButtons(exBtns.map((label) => ({ label })));
    } catch (e) {
      setMessages((msgs) => [
        ...msgs,
        { type: "ai", content: lang === "ko"
            ? "죄송합니다. AI 서버와 연결이 원활하지 않습니다."
            : "Sorry, AI server connection failed."
          }
      ]);
      setOptionButtons([]);
    }
    setLoading(false);
    isSending.current = false;
  };

  const handleEmojiClick = (emoji) => {
    const el = inputRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = inputValue;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setInputValue(newValue);
    setTimeout(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + emoji.length;
    }, 1);
    setEmojiOpen(false);
  };

  function msgsToHistory(msgs) {
    return msgs
      .filter((m) => m.type === "user" || m.type === "ai")
      .map((m) => ({
        role: m.type === "user" ? "user" : "assistant",
        content: typeof m.content === "string" ? m.content : renderToPlain(m.content)
      }));
  }

  function renderToPlain(node) {
    if (typeof node === "string") return node;
    if (Array.isArray(node)) return node.map(renderToPlain).join("");
    if (!node) return "";
    if (node.props && node.props.children) return renderToPlain(node.props.children);
    return "";
  }

  const handleFileBtnClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setAttachedFile(file);
  };

  if (!visible) return null;

  return (
    <div className={`chatbot-kakao ${animClass}`} ref={modalRef}>
      <div className="chatbot-top-header">
        <img src="/zoopy.png" alt="profile" className="chatbot-profile-img" />
        <div className="chatbot-top-info">
          <div className="chatbot-top-title">ZOOP</div>
          <div className="chatbot-top-status">
            Will respond immediately
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <HiOutlineGlobeAlt
            className="chatbot-globe"
            role="button"
            aria-label={langOpen ? "언어 선택 닫기" : "언어 선택"}
            aria-expanded={langOpen}
            onClick={(e) => {
              e.stopPropagation();
              setLangOpen(prev => !prev);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLangOpen(prev => !prev);
              }
            }}
            tabIndex={0}
            style={{ marginLeft: 10 }}
          />
          {langOpen && (
            <div className="chatbot-lang-dropdown">
              <button onClick={() => { setLang("ko"); setLangOpen(false); }}>한국어</button>
              <button onClick={() => { setLang("en"); setLangOpen(false); }}>English</button>
            </div>
          )}
        </div>
      </div>
      <div className="chatbot-scroll-area" ref={scrollRef}>
        <div className="chatbot-banner-row">
          <span className="chatbot-banner-icon">📢</span>
          <span className="chatbot-banner-text">
            {lang === "ko"
              ? "채용, 이제 쉽고 간편하게"
              : "Hiring made easy and simple"}
          </span>
        </div>
        <div className="chatbot-appicon-block">
          <img src="/zoopy.png" alt="app-icon" className="chatbot-appicon-img" />
          <div className="chatbot-appicon-title">Contact ZOOP</div>
          <div className="chatbot-appicon-status">
            <HiOutlineLightningBolt style={{ color: "#68c5a9", fontSize: "1.14em", verticalAlign: "-0.1em" }} />
            <span style={{ marginLeft: "0.33em" }}>
              Available 24hrs
            </span>
          </div>
        </div>
        <div className="chatbot-time-row">{openTime}</div>

        {messages.map((msg, i) => (
          <div
            key={i}
            className={
              msg.type === "user"
                ? "chatbot-bubble-row chatbot-bubble-row-user"
                : "chatbot-bubble-row"
            }
          >
            {msg.type !== "user" && (
              <img src="/zoopy.png" alt="profile" className="chatbot-bubble-avatar" />
            )}
            <div
              className={
                msg.type === "user"
                  ? "chatbot-bubble-msg chatbot-bubble-user"
                  : "chatbot-bubble-msg chatbot-bubble-ai"
              }
            >
              {msg.type === "ai" ? (
                <>
                  {renderAIContent(msg.content)}
                  {Array.isArray(msg.sources) && msg.sources.length > 0 && (
                    <div className="chatbot-source-list" aria-label="답변 근거">
                      <span className="chatbot-source-label">답변 근거</span>
                      {msg.sources.slice(0, 3).map((source, sourceIndex) => (
                        <span className="chatbot-source-chip" key={`${source.page}-${sourceIndex}`}>
                          안내서 p.{source.page}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              ) : msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chatbot-bubble-row">
            <img src="/zoopy.png" alt="profile" className="chatbot-bubble-avatar" />
            <div className="chatbot-bubble-msg chatbot-bubble-ai chatbot-bubble-loading">
              <span className="chatbot-typing-dot"></span>
              <span className="chatbot-typing-dot"></span>
              <span className="chatbot-typing-dot"></span>
            </div>
          </div>
        )}
        {optionButtons.length > 0 && (
          <div className="chatbot-option-row-user">
            {optionButtons.map((opt, j) => (
              <button
                key={j}
                className="chatbot-flat-option-btn"
                onClick={() => handleOptionClick(opt.label)}
                disabled={loading || isSending.current}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="chatbot-flat-input-bar" style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          className="chatbot-flat-input"
          placeholder={lang === "ko" ? "메시지를 입력하세요" : "Type your message"}
          value={inputValue}
          maxLength={2000}
          onChange={e => {
            setInputValue(e.target.value);
            setEmojiOpen(false);
          }}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          onKeyDown={handleInputKeyDown}
        />
        <button
          className="chatbot-flat-icon-btn"
          tabIndex={0}
          aria-label="이모지"
          type="button"
          onClick={() => setEmojiOpen(v => !v)}
        >
          <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="11" stroke="#bababa" strokeWidth="2"/>
            <circle cx="9" cy="10" r="1.3" fill="#bababa"/>
            <circle cx="15" cy="10" r="1.3" fill="#bababa"/>
            <path d="M9 15c1.6 1.3 4.4 1.3 6 0" stroke="#bababa" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {emojiOpen && (
            <div className="emoji-picker-pop">
              {["😀", "😁", "😂", "🥲", "😍", "😎", "😭", "👍", "👏", "🙏"].map(emoji =>
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  tabIndex={0}
                >{emoji}</button>
              )}
            </div>
          )}
        </button>
        {inputValue.trim() === "" && !attachedFile ? (
          <>
            <button
              className="chatbot-flat-icon-btn"
              tabIndex={0}
              aria-label="첨부파일"
              type="button"
              onClick={handleFileBtnClick}
              style={{ marginRight: 0 }}
              disabled={loading || isSending.current}
            >
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                <path d="M7.5 12.5l5-5a3.5 3.5 0 015 5l-7 7a4.5 4.5 0 01-6.3-6.3l7.5-7.5"
                      stroke="#bababa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
          </>
        ) : (
          <button
            className="chatbot-flat-send-btn"
            tabIndex={0}
            aria-label="보내기"
            onClick={() => {
              const msg = inputValue.trim();
              if (msg !== "" && !loading && !isSending.current) {
                setInputValue("");
                if (inputRef.current) inputRef.current.value = "";
                sendMessage(msg);
              }
            }}
            type="button"
            style={{ marginLeft: "0.25em", marginRight: "0.1em" }}
            disabled={loading || isSending.current}
          >
            <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
              <rect x="2" y="2" width="34" height="34" rx="13" fill="#d2f6ea"/>
              <path d="M12.5 19L26.5 12.5L20.5 26L17 20L12.5 19Z" fill="#12d1a5"/>
            </svg>
          </button>
        )}
      </div>
      {attachedFile && (
        <div style={{
          margin: "0 1.1em 0.33em 1.1em",
          color: "#2dc4a1", fontSize: "0.97em", fontWeight: 500
        }}>
          첨부: {attachedFile.name}
          <button
            onClick={() => setAttachedFile(null)}
            style={{
              background: "none", border: "none", color: "#aaa", marginLeft: "0.65em",
              cursor: "pointer", fontSize: "1.1em"
            }}>×</button>
        </div>
      )}
    </div>
  );
}
