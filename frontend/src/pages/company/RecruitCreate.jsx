import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import { motion } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { ko } from "date-fns/locale";
import SEO from "../../components/SEO";
import { apiUrl } from "../../api/config";
import { useLanguage } from "../../context/LanguageContext";

const RECRUIT_COPY = {
  en: { title: "Set your hiring criteria", subtitle: "Use ZOOP's smart filters to find a better-fit candidate.", role: "Role", language: "Languages", region: "Location", nationwide: "Any location (nationwide)", salary: "Salary (KRW 10,000s)", headcount: "Open headcount", description: "Description", descriptionPlaceholder: "Add context about the role and team.", deadline: "Application deadline", deadlineLabel: "Deadline", apply: "Apply filters", selectLanguage: "Select at least one language.", selectRegion: "Select a location or choose nationwide.", selectDeadline: "Choose an application deadline.", userError: "Could not load your company profile.", createError: "Could not create the job posting.", createFailed: "Job posting creation failed: ", quickDays: "days", candidateSuffix: " candidates", salarySuffix: " ten-thousand KRW" },
  ko: { title: "채용 필터 기준 설정", subtitle: "ZOOP의 스마트 필터링으로 맞춤 인재를 추천받으세요.", role: "직무", language: "언어", region: "지역", nationwide: "지역 상관없음 (전국)", salary: "연봉 (만원)", headcount: "채용 인원", description: "상세 설명", descriptionPlaceholder: "공고에 대한 상세 설명을 입력하세요.", deadline: "공고 마감일", deadlineLabel: "마감일", apply: "필터링 적용", selectLanguage: "언어를 하나 이상 선택하세요.", selectRegion: "지역을 선택하거나 전국을 체크하세요.", selectDeadline: "마감일을 입력하세요.", userError: "사용자 정보를 가져올 수 없습니다.", createError: "공고 생성에 실패했습니다.", createFailed: "공고 생성 중 오류가 발생했습니다: ", quickDays: "일", candidateSuffix: "명", salarySuffix: "만원" },
  zh: { title: "设置招聘筛选条件", subtitle: "使用 ZOOP 的智能筛选，找到更匹配的人才。", role: "职位", language: "语言", region: "地区", nationwide: "不限地区（全国）", salary: "薪资（万韩元）", headcount: "招聘人数", description: "职位描述", descriptionPlaceholder: "请输入职位和团队的相关信息。", deadline: "申请截止日期", deadlineLabel: "截止日期", apply: "应用筛选", selectLanguage: "请至少选择一种语言。", selectRegion: "请选择地区或选择全国。", selectDeadline: "请选择截止日期。", userError: "无法读取公司信息。", createError: "无法创建职位。", createFailed: "创建职位时发生错误：", quickDays: "天", candidateSuffix: " 人", salarySuffix: " 万韩元" }
};

const ROLE_OPTIONS = [
  { value: "개발PM", label: "Engineering PM" },
  { value: "데이터엔지니어", label: "Data engineer" },
  { value: "백엔드/서버개발", label: "Backend / server" },
  { value: "앱개발", label: "Mobile engineer" },
  { value: "보안관제", label: "Security operations" },
  { value: "정보보안", label: "Information security" },
  { value: "프론트엔드", label: "Frontend engineer" },
  { value: "웹개발", label: "Web engineer" },
  { value: "시스템엔지니어", label: "Systems engineer" },
];

const REGION_OPTIONS = [
  { value: "서울", label: "Seoul" },
  { value: "인천", label: "Incheon" },
  { value: "경기", label: "Gyeonggi" },
  { value: "부산", label: "Busan" },
  { value: "대구", label: "Daegu" },
  { value: "광주", label: "Gwangju" },
  { value: "대전", label: "Daejeon" },
  { value: "세종", label: "Sejong" },
  { value: "울산", label: "Ulsan" },
  { value: "강원", label: "Gangwon" },
  { value: "충북", label: "North Chungcheong" },
  { value: "충남", label: "South Chungcheong" },
  { value: "전북", label: "North Jeolla" },
  { value: "전남", label: "South Jeolla" },
  { value: "경북", label: "North Gyeongsang" },
  { value: "경남", label: "South Gyeongsang" },
  { value: "제주", label: "Jeju" },
];

const chipStyle = (selected) => ({
  border: selected ? "none" : "1.5px solid #e0e3e7",
  color: selected ? "#fff" : "#22694c",
  background: selected
    ? "linear-gradient(90deg,#35d7a1 10%,#35cfce 90%)"
    : "rgba(244,247,251,0.96)",
  boxShadow: selected
    ? "0 2px 12px 0 rgba(53,215,161,0.08)"
    : "0 1px 6px 0 rgba(0,0,0,0.02)",
  borderRadius: "24px",
  padding: "0.7rem 1.5rem",
  fontSize: "1.01rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
  outline: selected ? "2px solid #35cfce30" : "none",
  position: "relative",
  zIndex: 1,
  boxSizing: "border-box",
  letterSpacing: "-0.5px",
  userSelect: "none",
  appearance: "none",
  fontFamily: "inherit",
  textAlign: "center",
});

const sliderStyle = {
  width: "100%",
  appearance: "none",
  height: "8px",
  borderRadius: "6px",
  background: "linear-gradient(90deg, #35d7a1 20%, #35cfce 100%)",
  outline: "none",
  marginTop: "0.2rem",
  marginBottom: "0.7rem",
  boxShadow: "0 2px 8px rgba(53,215,161,0.05)",
};

const Section = ({ title, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 28 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.48, type: "spring", stiffness: 80 }}
    style={{
      marginBottom: "2.5rem",
      background: "#fff",
      borderRadius: "20px",
      boxShadow: "0 6px 32px rgba(53,215,161,0.07)",
      padding: "2.2rem 2rem 1.6rem 2rem",
      border: "1.2px solid #e1f7f1",
    }}
  >
    <h3
      style={{
        fontSize: "1.18rem",
        fontWeight: 700,
        color: "#185f44",
        marginBottom: "1.2rem",
        letterSpacing: "-0.5px",
      }}
    >
      {title}
    </h3>
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.9rem" }}>
      {children}
    </div>
  </motion.div>
);

// SVG 아이콘 컴포넌트 추가
const ClockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle'}}>
    <circle cx="11" cy="11" r="9" stroke="#35cfce" strokeWidth="2.2" fill="#eafff7"/>
    <path d="M11 6.5V11L14.2 13" stroke="#19b47a" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const CalendarIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{verticalAlign: 'middle'}}>
    <rect x="3" y="5" width="18" height="16" rx="4" fill="#eafff7" stroke="#35cfce" strokeWidth="2"/>
    <rect x="7" y="9" width="10" height="6" rx="2" fill="#35cfce" fillOpacity="0.18"/>
    <path d="M7 5V3.5M17 5V3.5" stroke="#19b47a" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

// 날짜를 YYYY-MM-DD로 로컬 타임존 기준 포맷하는 함수
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RecruitCreate() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const copy = RECRUIT_COPY[language] || RECRUIT_COPY.en;

  const [description, setDescription] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [filters, setFilters] = useState({
    roles: [],
    languages: [],
    regions: [],
    nationwide: false,
    salary: 5000,
    headcount: 5,
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formFeedback, setFormFeedback] = useState({ type: '', message: '' });

  const toggleSelection = (field, value) => {
    setFilters((prev) => {
      const set = new Set(prev[field]);
      set.has(value) ? set.delete(value) : set.add(value);
      return { ...prev, [field]: Array.from(set) };
    });
  };

  const handleSliderChange = (field) => (e) => {
    setFilters((prev) => ({ ...prev, [field]: parseInt(e.target.value, 10) }));
  };

  const handleNationwideToggle = () => {
    setFilters((prev) => ({ ...prev, nationwide: !prev.nationwide }));
  };

  const handleSubmit = async () => {
    if (submitLoading) return;
    if (filters.languages.length === 0) {
      setFormFeedback({ type: 'error', message: copy.selectLanguage });
      return;
    }
    if (!filters.nationwide && filters.regions.length === 0) {
      setFormFeedback({ type: 'error', message: copy.selectRegion });
      return;
    }
    if (!expiryDate) {
      setFormFeedback({ type: 'error', message: copy.selectDeadline });
      return;
    }

    setFormFeedback({ type: '', message: '' });
    setSubmitLoading(true);
    try {
      // 사용자 정보 가져오기
      const userId = localStorage.getItem('userId');
      const userInfoResponse = await fetch(apiUrl(`/api/companyadmins/info/${userId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
        },
      });
      
      if (!userInfoResponse.ok) {
        throw new Error(copy.userError);
      }
      
      const userInfo = await userInfoResponse.json();
      const selectedRegionLabels = REGION_OPTIONS
        .filter(region => filters.regions.includes(region.value))
        .map(region => region.label);

      const postData = {
        companyId: userInfo.companyId,
        companyAdminId: userInfo.companyAdminId,
        postTitle: `${filters.languages.join(", ")} developer role`,
        postDescription: description,
        postProgrammingLanguage: filters.languages.join(","),
        postLocation: filters.nationwide ? "Nationwide" : selectedRegionLabels.join(", "),
        postHeadcount: filters.headcount,
        postSalaryStart: `${filters.salary}만원`,
        postSalaryEnd: `${filters.salary + 1000}만원`,
        postPostedDate: new Date().toISOString().split("T")[0],
        postExpiryDate: expiryDate,
        postStatus: "ACTIVE",
      };

      const response = await fetch(apiUrl('/api/postings'), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) throw new Error(copy.createError);

      const result = await response.json();
      const postId = result.postId;

      const stateData = { filters, description, expiryDate, postId, language };
      navigate(`/company/ideal-candidate/${postId}`, { state: stateData });
    } catch (error) {
      setFormFeedback({ type: 'error', message: copy.createFailed + error.message });
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "SUIT, Pretendard, Montserrat, sans-serif",
        background: "linear-gradient(120deg, #ffffff 0%, #eafff7 50%, #eaf6ff 100%)",
        minHeight: "100vh",
        minWidth: "100vw",
      }}
    >
      <SEO
        title="Create a job posting - ZOOP"
        description="Create a role and receive evidence-backed candidate recommendations with ZOOP."
        keywords="hiring, job posting, candidate matching, AI recruiting, ZOOP"
      />
      <Navbar />
      {/* --- 달력/전체 스타일 글로벌 적용 --- */}
      <style>
        {`
        .react-datepicker {
          display: flex;
          flex-direction: row;
          border: none;
          box-shadow: none;
          background: #fff;
          border-radius: 24px;
          min-width: 720px;
          padding: 30px 40px 28px 40px;
          justify-content: center;
          gap: 36px;
        }
        @media (max-width: 760px) {
          .react-datepicker {
            min-width: 0;
            width: 100%;
            padding: 18px 8px;
            gap: 8px;
          }
          .react-datepicker__month-container {
            width: 100%;
            margin: 0;
          }
          .react-datepicker__day-name,
          .react-datepicker__day {
            width: 2rem;
            height: 2rem;
            font-size: 0.9rem;
          }
        }
        .react-datepicker__month-container {
          border: none;
          background: none;
          box-shadow: none;
          margin: 0 10px;
          width: 320px;
        }
        .react-datepicker__header {
          background: none;
          border: none;
          padding: 16px 0 10px 0;
        }
        .react-datepicker__current-month,
        .react-datepicker__current-month--hasYearDropdown {
          font-weight: 800;
          color: #19b47a;
          font-size: 1.9rem;
          margin-bottom: 0.1em;
          margin-top: 2px;
          letter-spacing: -1.5px;
        }
        .react-datepicker__day-names,
        .react-datepicker__week {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        .react-datepicker__day-name,
        .react-datepicker__day {
          font-family: 'SUIT', 'Pretendard', 'Montserrat', sans-serif;
          color: #148f62;
          font-size: 1.07rem;
          font-weight: 500;
          width: 2.6rem;
          height: 2.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          border-radius: 50%;
          transition: background 0.13s, color 0.12s;
        }
        .react-datepicker__day--outside-month {
          color: #b2cec3 !important;
          opacity: 0.45;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background: linear-gradient(90deg, #3ee1a8 25%, #35cfce 90%) !important;
          color: #fff !important;
          font-weight: 800;
          box-shadow: 0 2px 10px #35cfce25;
        }
        .react-datepicker__day--today:not(.react-datepicker__day--selected) {
          border: 2px solid #19b47a !important;
          background: none !important;
          color: #19b47a !important;
        }
        .react-datepicker__navigation {
          top: 46px;
        }
        .react-datepicker__navigation--previous,
        .react-datepicker__navigation--next {
          background: none;
          border: none;
          width: 38px;
          height: 38px;
          outline: none;
          box-shadow: none;
          color: #9bddbc;
          font-size: 2.2rem;
          transition: color 0.14s;
        }
        .react-datepicker__navigation--previous:hover,
        .react-datepicker__navigation--next:hover {
          color: #19b47a;
          background: none;
        }
        .react-datepicker__navigation-icon::before {
          border-color: #b7e1d2;
          border-width: 0 3px 3px 0;
          width: 9px;
          height: 9px;
        }
        .react-datepicker__day-name:nth-child(1),
        .react-datepicker__day--weekend {
          color: #1adfa0 !important;
        }
        .react-datepicker__day:hover {
          border-radius: 50% !important;
          background: linear-gradient(90deg, #35cfce 30%, #3ee1a8 100%) !important;
          color: #fff !important;
          font-weight: 700;
          box-shadow: 0 2px 10px #35cfce25;
        }
        .react-datepicker__day--selected.react-datepicker__day--weekend,
        .react-datepicker__day--keyboard-selected.react-datepicker__day--weekend {
          color: #fff !important;
        }
        `}
      </style>
      {/* --- 달력/전체 스타일 글로벌 적용 끝 --- */}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.68, type: "spring", stiffness: 70 }}
        style={{
          padding: "7.5rem 2vw 5.5rem",
          maxWidth: 900,
          margin: "0 auto",
          width: "99vw",
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            marginBottom: "2.5rem",
            textAlign: "left",
          }}
        >
          <h2
            style={{
              fontSize: "2.25rem",
              fontWeight: 800,
              color: "#18684e",
              letterSpacing: "-1px",
              marginBottom: "0.28rem",
              lineHeight: 1.16,
            }}
          >
            {copy.title}
          </h2>
          <div
            style={{
              fontSize: "1.1rem",
              color: "#1a936f",
              fontWeight: 500,
              letterSpacing: "-0.5px",
              marginTop: "0.1rem",
            }}
          >
            {copy.subtitle}
          </div>
          {formFeedback.message && (
            <div
              role="alert"
              aria-live="polite"
              style={{ marginTop: '1.2rem', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid #fecaca', background: '#fef2f2', color: '#b91c1c', fontWeight: 600 }}
            >
              {formFeedback.message}
            </div>
          )}
        </motion.div>

        <Section title={copy.role}>
          {ROLE_OPTIONS.map((role) => (
            <motion.button
              type="button"
              key={role.value}
              aria-pressed={filters.roles.includes(role.value)}
              whileHover={{
                scale: 1.07,
                boxShadow: "0 2px 14px #2ed99224",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSelection("roles", role.value)}
              style={chipStyle(filters.roles.includes(role.value))}
            >
              {role.label}
            </motion.button>
          ))}
        </Section>

        <Section title={copy.language}>
          {[
            "Python",
            "JavaScript",
            "Java",
            "C++",
            "Go",
            "Ruby",
            "Kotlin",
            "TypeScript",
            "React",
          ].map((lang) => {
            const langToFile = {
              Python: "python.svg",
              JavaScript: "javascript.svg",
              Java: "java.svg",
              "C++": "cpp.svg",
              Go: "go.svg",
              Ruby: "ruby.svg",
              Kotlin: "kotlin.svg",
              TypeScript: "typescript.svg",
              React: "react.svg",
            };
            const iconSrc = `/languages/${langToFile[lang]}`;
            return (
              <motion.button
                type="button"
                key={lang}
                aria-pressed={filters.languages.includes(lang)}
                whileHover={{
                  scale: 1.07,
                  boxShadow: "0 2px 14px #3ee1a820",
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toggleSelection("languages", lang)}
                style={chipStyle(filters.languages.includes(lang))}
              >
                <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src={iconSrc} alt={lang} style={{ width: 24, height: 24, marginRight: 6, verticalAlign: "middle" }} />
                  {lang}
                </span>
              </motion.button>
            );
          })}
        </Section>

        <Section title={copy.region}>
          {REGION_OPTIONS.map((region) => (
            <motion.button
              type="button"
              key={region.value}
              aria-pressed={filters.regions.includes(region.value)}
              whileHover={{
                scale: 1.08,
                boxShadow: "0 2px 14px #3ee1a815",
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => toggleSelection("regions", region.value)}
              style={chipStyle(filters.regions.includes(region.value))}
            >
              {region.label}
            </motion.button>
          ))}
          <motion.button
            type="button"
            aria-pressed={filters.nationwide}
            whileHover={{
              scale: 1.06,
              boxShadow: "0 2px 10px #3ee1a815",
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleNationwideToggle}
            style={chipStyle(filters.nationwide)}
          >
            {copy.nationwide}
          </motion.button>
        </Section>

        <Section title={copy.salary}>
          <div
            style={{
              marginBottom: "0.7rem",
              fontSize: "1.01rem",
              color: "#209166",
              fontWeight: 500,
              letterSpacing: "-0.3px",
            }}
          >
            {filters.salary.toLocaleString()}{copy.salarySuffix}
          </div>
          <input
            type="range"
            min="2000"
            max="10000"
            step="100"
            value={filters.salary}
            onChange={handleSliderChange("salary")}
            style={sliderStyle}
          />
        </Section>

        <Section title={copy.headcount}>
          <div
            style={{
              marginBottom: "0.7rem",
              fontSize: "1.01rem",
              color: "#209166",
              fontWeight: 500,
            }}
          >
            {filters.headcount}{copy.candidateSuffix}
          </div>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={filters.headcount}
            onChange={handleSliderChange("headcount")}
            style={sliderStyle}
          />
        </Section>

        <Section title={copy.description}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={copy.descriptionPlaceholder}
            rows="6"
            style={{
              padding: "1.2rem",
              borderRadius: "14px",
              border: "1.5px solid #c3ede0",
              width: "100%",
              fontSize: "1.06rem",
              resize: "vertical",
              fontWeight: 500,
              color: "#22694c",
              background: "#f6fffa",
              boxShadow: "0 1.5px 7px rgba(53,215,161,0.03)",
              outline: "none",
              transition: "border 0.2s",
            }}
            onFocus={(e) => (e.target.style.border = "1.5px solid #35cfce")}
            onBlur={(e) => (e.target.style.border = "1.5px solid #c3ede0")}
          />
        </Section>

        {/* 가로로 넓은 2달짜리 달력 + 버튼 */}
        <Section title={copy.deadline}>
          <div
            style={{
              display: "flex",
              flexDirection: typeof window !== 'undefined' && window.innerWidth < 760 ? "column" : "row",
              gap: "2.8rem",
              alignItems: "flex-start",
              justifyContent: "center",
              minHeight: 320,
              margin: "0 auto",
            }}
          >
            {/* 달력 */}
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              style={{
                minWidth: 0,
                width: '100%',
                maxWidth: 900,
                borderRadius: 24,
                margin: "0 auto",
                background: "#fff",
                border: "none",
              }}
            >
              <DatePicker
                selected={expiryDate ? new Date(expiryDate) : null}
                onChange={date => setExpiryDate(date ? formatDate(date) : "")}
                minDate={new Date()}
                locale={language === 'ko' ? ko : undefined}
                inline
                dateFormat="yyyy-MM-dd"
                calendarStartDay={0}
                monthsShown={typeof window !== 'undefined' && window.innerWidth < 760 ? 1 : 2}
                showPopperArrow={false}
              />
            </motion.div>
            {/* 빠른 선택 버튼 */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                marginTop: 22,
                minWidth: 0,
                width: typeof window !== 'undefined' && window.innerWidth < 760 ? '100%' : 150,
              }}
            >
              {[7, 14, 30, 60].map((days) => (
                <motion.button
                  key={days}
                  type="button"
                  whileHover={{
                    scale: 1.07,
                    background: "#f8fffd",
                    color: "#19b47a",
                    borderColor: "#35cfce",
                    textShadow: "0 0 8px #35cfce55, 0 1px 2px #fff8"
                  }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    const d = new Date();
                    d.setDate(d.getDate() + days);
                    setExpiryDate(formatDate(d));
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.95rem 1.5rem",
                    background: "#fff",
                    border: "2px solid #b8ffe3",
                    borderRadius: "32px",
                    fontSize: "1.13rem",
                    fontWeight: 800,
                    color: "#19b47a",
                    cursor: "pointer",
                    transition: "all 0.18s cubic-bezier(0.4,0,0.2,1)",
                    boxShadow: "none",
                    minWidth: 130,
                    justifyContent: "center",
                    letterSpacing: "-0.2px",
                    textShadow: "0 0 8px #35cfce33, 0 1px 2px #fff8",
                  }}
                >
                  <ClockIcon />
                  {`+${days} ${copy.quickDays}`}
                </motion.button>
              ))}
            </div>
          </div>
          {/* 마감일 안내 */}
          {expiryDate && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 32,
                padding: "1.18rem 2.5rem",
                background: "linear-gradient(90deg, #eafff7 25%, #35cfce 80%)",
                borderRadius: "17px",
                color: "#18684e",
                fontSize: "1.17rem",
                fontWeight: 800,
                textAlign: "center",
                boxShadow: "0 4px 18px rgba(53,215,161,0.10)",
                letterSpacing: "-0.2px",
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                border: "1.5px solid #b8ffe3",
              }}
            >
              <CalendarIcon />
              <span style={{marginLeft: 10}}>
                {copy.deadlineLabel}: {new Date(expiryDate).toLocaleDateString(language === 'zh' ? 'zh-CN' : language === 'ko' ? 'ko-KR' : 'en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  weekday: 'long',
                })}
              </span>
            </motion.div>
          )}
        </Section>

        <motion.button
          onClick={handleSubmit}
          disabled={submitLoading}
          whileHover={{ scale: 1.035, background: "linear-gradient(90deg,#35cfce 15%,#35d7a1 85%)" }}
          whileTap={{ scale: 0.98 }}
          style={{
            marginTop: "2.8rem",
            padding: "1.08rem 2.7rem",
            fontSize: "1.08rem",
            background: "linear-gradient(90deg,#3ee1a8 10%,#35cfce 90%)",
            color: "#fff",
            border: "none",
            borderRadius: "32px",
            fontWeight: 800,
            letterSpacing: "0.5px",
            boxShadow: "0 8px 32px rgba(53,215,161,0.14)",
            cursor: submitLoading ? "wait" : "pointer",
            opacity: submitLoading ? 0.7 : 1,
            transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
            outline: "none",
          }}
        >
          {submitLoading ? 'Creating…' : copy.apply}
        </motion.button>
      </motion.div>
    </div>
  );
}
