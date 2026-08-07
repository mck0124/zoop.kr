import requests, re, os, base64, json
from bs4 import BeautifulSoup
from dotenv import load_dotenv
import difflib
from bs4.element import Tag
import openai
import mimetypes
from PyPDF2 import PdfReader

load_dotenv()
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

def get_headers():
    return {
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

EMAIL_PATTERN = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}"

def is_valid_email(email):
    return email and not any([
        email.endswith("@users.noreply.github.com"),
        email == "git@github.com",
        email.startswith("noreply")
    ])

def extract_email_from_profile_html(username):
    url = f"https://github.com/{username}"
    try:
        res = requests.get(url, headers={"User-Agent": "Mozilla/5.0"})
        print(f"🌐 Fetching profile page: {url}")
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, "html.parser")
            email_li = soup.find("li", {"itemprop": "email"})
            if email_li and isinstance(email_li, Tag):
                email_a = email_li.find("a", href=True) if hasattr(email_li, 'find') else None
                if email_a and isinstance(email_a, Tag):
                    href = email_a.get("href")
                    if href and isinstance(href, str) and href.startswith("mailto:"):
                        email = href.replace("mailto:", "").strip()
                        if is_valid_email(email):
                            print(f"📧 Found email in profile: {email}")
                            return email

            emails = re.findall(EMAIL_PATTERN, res.text)
            for email in emails:
                if is_valid_email(email):
                    print(f"📬 Backup email from HTML: {email}")
                    return email
    except Exception as e:
        print(f"❌ Error fetching profile for {username}: {e}")
    return None

def extract_email_from_readme(username):
    try:
        repo_url = f"https://api.github.com/users/{username}/repos?sort=stars&per_page=1"
        repo_res = requests.get(repo_url, headers=get_headers())
        if repo_res.status_code != 200:
            return None

        repos = repo_res.json()
        if not repos:
            return None

        repo_name = repos[0]["name"]
        readme_url = f"https://api.github.com/repos/{username}/{repo_name}/readme"
        readme_res = requests.get(readme_url, headers=get_headers())
        if readme_res.status_code != 200:
            return None

        content = readme_res.json().get("content", "")
        decoded_readme = base64.b64decode(content).decode("utf-8", errors="ignore")
        emails = re.findall(EMAIL_PATTERN, decoded_readme)
        for email in emails:
            if is_valid_email(email):
                print(f"📘 Found email in README: {email}")
                return email
    except Exception as e:
        print(f"❌ Error reading README for {username}: {e}")
    return None

def extract_user_email(username):
    email = extract_email_from_profile_html(username)
    if email:
        return email
    return extract_email_from_readme(username)

REGION_KEYWORDS = {
    "서울": ["서울", "seoul"],
    "부산": ["부산", "busan"],
    "대구": ["대구", "daegu"],
    "경기": ["경기", "gyeonggi"],
    "인천": ["인천", "incheon"],
    "광주": ["광주", "gwangju"],
    "대전": ["대전", "daejeon"],
    "세종": ["세종", "sejong"],
    "울산": ["울산", "ulsan"],
    "강원": ["강원", "gangwon"],
    "충북": ["충북", "chungbuk"],
    "충남": ["충남", "chungnam"],
    "전북": ["전북", "jeonbuk"],
    "전남": ["전남", "jeonnam"],
    "경북": ["경북", "gyeongbuk"],
    "경남": ["경남", "gyeongnam"],
    "제주": ["제주", "jeju"]
}

NATIONWIDE_KEYWORDS = ["대한민국", "한국", "korea", "south korea"]

def expand_locations(filters):
    if filters.nationwide:
        return NATIONWIDE_KEYWORDS
    expanded = []
    for region in filters.regions:
        expanded.extend(REGION_KEYWORDS.get(region, [region]))
    return expanded



def get_user_bio(username):
    try:
        user_url = f"https://api.github.com/users/{username}"
        user_res = requests.get(user_url, headers=get_headers())
        if user_res.status_code != 200:
            return ""
        user_info = user_res.json()
        return user_info.get("bio", "") or ""
    except Exception as e:
        print(f"❌ Failed to get bio for {username}: {e}")
        return ""

def get_user_readme(username):
    try:
        repo_url = f"https://api.github.com/users/{username}/repos?sort=stars&per_page=1"
        repo_res = requests.get(repo_url, headers=get_headers())
        if repo_res.status_code != 200:
            return ""
        repos = repo_res.json()
        if not repos:
            return ""
        repo_name = repos[0]["name"]
        readme_url = f"https://api.github.com/repos/{username}/{repo_name}/readme"
        readme_res = requests.get(readme_url, headers=get_headers())
        if readme_res.status_code != 200:
            return ""
        content = readme_res.json().get("content", "")
        decoded_readme = base64.b64decode(content).decode("utf-8", errors="ignore")
        return decoded_readme
    except Exception as e:
        print(f"❌ Error reading README for {username}: {e}")
        return ""

def calc_similarity(ideal, text):
    if not ideal or not text:
        return 0.0
    # 간단한 유사도: 단어 집합의 겹치는 비율 + fuzzy ratio
    ideal_words = set(ideal.lower().split())
    text_words = set(text.lower().split())
    overlap = len(ideal_words & text_words) / (len(ideal_words) + 1e-6)
    fuzzy = difflib.SequenceMatcher(None, ideal, text).ratio()
    return 0.5 * overlap + 0.5 * fuzzy

def enhanced_search_github_candidates(filters, post_id=None):
    locations = expand_locations(filters)
    email_results = []
    headcount = getattr(filters, 'headcount', 5)
    ideal = getattr(filters, 'idealCandidate', None)
    for location in locations:
        for language in filters.languages:
            page = 1
            while len(email_results) < headcount and page <= 10:  # 최대 10페이지(500명)까지 반복
                query = f"language:{language} location:{location}"
                url = f"https://api.github.com/search/users?q={query}&per_page=50&page={page}"
                resp = requests.get(url, headers=get_headers())
                users = resp.json().get("items", [])
                if not users:
                    break

                for user in users:
                    login = user.get("login")
                    profile_url = f"https://github.com/{login}"
                    email = extract_user_email(login)
                    followers = None
                    public_repos = None
                    # Get followers and public_repos for prompt
                    try:
                        user_url = f"https://api.github.com/users/{login}"
                        user_res = requests.get(user_url, headers=get_headers())
                        if user_res.status_code == 200:
                            user_info = user_res.json()
                            followers = user_info.get("followers", "불명")
                            public_repos = user_info.get("public_repos", "불명")
                    except Exception:
                        pass
                    if email:
                        # 상세 정보 수집
                        details = get_github_candidate_details(login)
                        # 분석 및 점수/근거/요약 생성
                        candidate_obj = {
                            "login": login,
                            "profile_url": profile_url,
                            "email": email,
                            "followers": followers,
                            "public_repos": public_repos
                        }
                        print(f"[DEBUG] OpenAI 분석 시작: {candidate_obj['login']}")
                        try:
                            analysis = analyze_candidate_with_prompt(candidate_obj, details)
                        except Exception as e:
                            print(f"[WARN] 후보자 분석 실패로 결과에서 제외: {login} - {e}")
                            continue
                        print(f"[DEBUG] OpenAI 분석 결과: {analysis}")
                        # LLM 점수 파싱 (예: (점수: 92점))
                        llm_score = 0
                        analysis_str = str(analysis) if analysis is not None else ""

                        # 구조화된 GitHub 증거 원장에서는 모델이 계산한 총점을 우선 사용한다.
                        try:
                            structured_analysis = json.loads(analysis_str)
                            if structured_analysis.get("version") == "github-evidence-v1":
                                llm_score = float(structured_analysis.get("score", 0) or 0)
                        except (TypeError, ValueError, json.JSONDecodeError):
                            structured_analysis = None
                        
                        # 먼저 총점 패턴으로 시도
                        total_score_patterns = [
                            r"\(점수: (\d+)점\)",  # (점수: 85점)
                            r"점수: (\d+)점",      # 점수: 85점
                            r"총점: (\d+)점",      # 총점: 85점
                            r"종합 점수: (\d+)점", # 종합 점수: 85점
                            r"총 점수: (\d+)점",   # 총 점수: 85점
                        ]
                        
                        # 총점 패턴으로 먼저 시도
                        for pattern in total_score_patterns:
                            m = re.search(pattern, analysis_str)
                            if m:
                                try:
                                    llm_score = int(m.group(1))
                                    print(f"[DEBUG] 총점 추출 성공: {llm_score} (패턴: {pattern})")
                                    break
                                except ValueError:
                                    continue
                        
                        # 총점을 찾지 못했다면 각 항목별 점수를 더해서 계산
                        if llm_score == 0:
                            print(f"[DEBUG] 총점 패턴 실패, 항목별 점수 계산 시작")
                            # 각 항목별 점수 추출
                            item_scores = {
                                '팔로워': 0,
                                '공개 저장소': 0,
                                '언어 다양성': 0,
                                '최근 활동성': 0,
                                '프로젝트 품질': 0,
                                '기술적 깊이': 0
                            }
                            
                            # 각 항목별 점수 패턴
                            item_patterns = [
                                (r'팔로워.*?(\d+)점', '팔로워'),
                                (r'공개 저장소.*?(\d+)점', '공개 저장소'),
                                (r'언어 다양성.*?(\d+)점', '언어 다양성'),
                                (r'최근 활동성.*?(\d+)점', '최근 활동성'),
                                (r'프로젝트 품질.*?(\d+)점', '프로젝트 품질'),
                                (r'기술적 깊이.*?(\d+)점', '기술적 깊이')
                            ]
                            
                            for pattern, item_name in item_patterns:
                                matches = re.findall(pattern, analysis_str)
                                if matches:
                                    try:
                                        score = int(matches[0])
                                        item_scores[item_name] = score
                                        print(f"[DEBUG] {item_name} 점수: {score}")
                                    except ValueError:
                                        continue
                            
                            # 총점 계산
                            llm_score = sum(item_scores.values())
                            print(f"[DEBUG] 항목별 점수 합계: {item_scores} = 총점 {llm_score}")
                        
                        if llm_score == 0:
                            print(f"[WARNING] 점수 추출 실패. 분석 텍스트: {analysis_str[:200]}...")
                        
                        candidate_result = {
                            **candidate_obj,
                            "details": details,
                            "analysis": analysis,
                            "llm_score": llm_score,
                            "score": llm_score  # 기존 호환성을 위해 score도 추가
                        }
                        
                        analysis_preview = str(analysis)[:100] if analysis else "분석 없음"
                        print(f"[DEBUG] 최종 결과: {login} - 점수: {llm_score}, 분석: {analysis_preview}...")
                        
                        # Spring Boot에서 자동으로 DB에 저장됨 (post_id는 Spring Boot에서 처리)
                        
                        email_results.append(candidate_result)
                        if len(email_results) >= headcount:
                            break
                page += 1
            if len(email_results) >= headcount:
                break
        if len(email_results) >= headcount:
            break
    # LLM 점수순 정렬
    email_results = sorted(email_results, key=lambda x: x["llm_score"], reverse=True)[:headcount]
    return email_results

openai_client = None

def get_openai_client():
    global openai_client
    if openai_client is None:
        if not OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not configured")
        openai_client = openai.OpenAI(api_key=OPENAI_API_KEY)
    return openai_client

def call_openai_chat(messages, max_tokens=800, temperature=0.3):
    try:
        response = get_openai_client().chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return (
            response.choices[0].message.content
            if response.choices and hasattr(response.choices[0], "message")
            else "AI가 응답하지 않았습니다."
        )
    except Exception as e:
        print(f"[OpenAI API Error] {e}")
        raise RuntimeError("AI 서버 연결에 문제가 발생했습니다.") from e

def get_github_candidate_details(username):
    """
    Fetches detailed info for a GitHub user: top language, language list, recent events, repo descriptions, and readme.
    """
    details = {
        'top_language': None,
        'languages': [],
        'recent_events': [],
        'repo_descriptions': [],
        'repo_readmes': [],
        'top_repos': [],
        'commit_activity': [],
        'contribution_stats': {},
        'profile_info': {},
        'skills_analysis': {}
    }
    repos = []
    try:
        # Get repos
        repo_url = f"https://api.github.com/users/{username}/repos?per_page=100"
        repo_res = requests.get(repo_url, headers=get_headers())
        if repo_res.status_code == 200:
            repos = repo_res.json()
            language_count = {}
            for repo in repos:
                lang = repo.get('language')
                if lang:
                    language_count[lang] = language_count.get(lang, 0) + 1
                desc = repo.get('description')
                if desc:
                    details['repo_descriptions'].append(desc)
                # Get README for top 2 starred repos
            sorted_repos = sorted(repos, key=lambda r: r.get('stargazers_count', 0), reverse=True)[:2]
            for repo in sorted_repos:
                repo_name = repo['name']
                readme_url = f"https://api.github.com/repos/{username}/{repo_name}/readme"
                readme_res = requests.get(readme_url, headers=get_headers())
                if readme_res.status_code == 200:
                    content = readme_res.json().get("content", "")
                    decoded_readme = base64.b64decode(content).decode("utf-8", errors="ignore")
                    details['repo_readmes'].append(decoded_readme[:500])  # Only first 500 chars
            # Top language
            if language_count:
                details['top_language'] = max(language_count, key=lambda k: language_count[k])
                details['languages'] = list(language_count.keys())
        # Get recent events
        events_url = f"https://api.github.com/users/{username}/events/public"
        events_res = requests.get(events_url, headers=get_headers())
        if events_res.status_code == 200:
            events = events_res.json()
            for event in events[:10]:  # 최근 10개 이벤트
                event_type = event.get('type', '')
                if event_type in ['PushEvent', 'CreateEvent', 'PullRequestEvent', 'IssuesEvent']:
                    details['recent_events'].append(f"{event_type}: {event.get('repo', {}).get('name', '')}")
        
        # Get top repositories with more details
        sorted_repos = sorted(repos, key=lambda r: r.get('stargazers_count', 0), reverse=True)[:5]
        for repo in sorted_repos:
            repo_info = {
                'name': repo['name'],
                'description': repo.get('description', ''),
                'language': repo.get('language', ''),
                'stars': repo.get('stargazers_count', 0),
                'forks': repo.get('forks_count', 0),
                'size': repo.get('size', 0),
                'created_at': repo.get('created_at', ''),
                'updated_at': repo.get('updated_at', ''),
                'topics': repo.get('topics', [])
            }
            details['top_repos'].append(repo_info)
        
        # Get user profile info
        user_url = f"https://api.github.com/users/{username}"
        user_res = requests.get(user_url, headers=get_headers())
        if user_res.status_code == 200:
            user_data = user_res.json()
            details['profile_info'] = {
                'name': user_data.get('name', ''),
                'bio': user_data.get('bio', ''),
                'company': user_data.get('company', ''),
                'location': user_data.get('location', ''),
                'blog': user_data.get('blog', ''),
                'twitter_username': user_data.get('twitter_username', ''),
                'created_at': user_data.get('created_at', ''),
                'updated_at': user_data.get('updated_at', '')
            }
        
        # GitHub's unauthenticated API does not provide reliable contribution
        # totals. Keep unavailable values explicit instead of manufacturing
        # activity from repository count.
        details['contribution_stats'] = {
            'total_commits': None,
            'recent_commits': None,
            'pull_requests': None,
            'issues_created': None,
            'repositories_contributed': None,
            'public_repositories': len(repos),
            'data_quality': 'partial'
        }
        
        # Analyze skills based on repositories
        skills = {}
        for repo in repos:
            lang = repo.get('language')
            if lang:
                if lang not in skills:
                    skills[lang] = {'count': 0, 'stars': 0, 'size': 0}
                skills[lang]['count'] += 1
                skills[lang]['stars'] += repo.get('stargazers_count', 0)
                skills[lang]['size'] += repo.get('size', 0)
        
        details['skills_analysis'] = skills
        
    except Exception as e:
        print(f"[Error fetching details for {username}] {e}")
    return details

def analyze_candidate_with_prompt(candidate, details):
    """GitHub 공개 신호를 설명 가능한 구조화 평가로 변환한다."""
    safe_details = {
        "followers": candidate.get("followers"),
        "public_repos": candidate.get("public_repos"),
        "top_language": details.get("top_language"),
        "languages": details.get("languages", []),
        "skills_analysis": details.get("skills_analysis", {}),
        "recent_events": details.get("recent_events", []),
        "top_repos": details.get("top_repos", []),
        "contribution_stats": details.get("contribution_stats", {}),
        "bio": details.get("profile_info", {}).get("bio", ""),
    }
    prompt = f"""
아래 GitHub 공개 데이터만으로 개발자 후보자를 평가하세요.
데이터:
{json.dumps(safe_details, ensure_ascii=False, default=str)[:18000]}

규칙:
- 이름, 이메일, 위치, 회사, 사진, 성별, 나이 등 직무와 무관한 개인정보는 평가에서 제외하세요.
- 값이 '확인 불가' 또는 null이면 점수를 추정하지 말고 gaps에 기록하세요.
- 별 수, 저장소 수 같은 공개 신호만으로 실력·성격을 단정하지 말고 evidence에 한계를 적으세요.
- 모든 claim은 위 데이터의 구체적 필드에 근거해야 합니다.

아래 JSON만 반환하세요:
{{
  "score": 0,
  "dimensions": [
    {{"name":"기술 스택","score":0,"max":20,"evidence":[{{"source":"languages|skills_analysis|repo","claim":"데이터에 근거한 주장","confidence":0.0}}]}},
    {{"name":"프로젝트 품질","score":0,"max":20,"evidence":[]}},
    {{"name":"활동 신호","score":0,"max":20,"evidence":[]}},
    {{"name":"문제 해결 깊이","score":0,"max":20,"evidence":[]}},
    {{"name":"커뮤니티·협업 신호","score":0,"max":20,"evidence":[]}}
  ],
  "summary":"근거 중심 3문장 요약",
  "keywords":["확인된 기술 또는 프로젝트 특성"],
  "strengths":["실제 데이터로 확인된 강점"],
  "gaps":["확인할 수 없는 정보"],
  "risk_flags":["과대해석 위험"],
  "suitable_roles":["근거가 있는 추천 직무"],
  "growth_signal":"확인 가능한 성장 신호와 한계",
  "verification_plan":["면접·원본 저장소에서 확인할 행동"],
  "fairness_guard":{{"excluded_attributes":["이름","이메일","위치","회사"],"evaluated_attributes":["기술·프로젝트·활동의 공개 근거"],"status":"pass"}}
}}
"""
    try:
        response = get_openai_client().chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "당신은 근거 검증형 GitHub 채용 분석가입니다. 반드시 JSON만 반환하고 추측을 금지합니다."},
                {"role": "user", "content": prompt},
            ],
            max_tokens=1500,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        result = json.loads(response.choices[0].message.content or "{}")
        max_scores = {"기술 스택": 20, "프로젝트 품질": 20, "활동 신호": 20, "문제 해결 깊이": 20, "커뮤니티·협업 신호": 20}
        dimensions = []
        for item in result.get("dimensions", []) if isinstance(result.get("dimensions"), list) else []:
            if not isinstance(item, dict):
                continue
            name = str(item.get("name", "평가 항목"))
            maximum = max_scores.get(name, 20)
            try:
                score = max(0.0, min(float(maximum), float(item.get("score", 0) or 0)))
            except (TypeError, ValueError):
                score = 0.0
            evidence = []
            for evidence_item in item.get("evidence", []) if isinstance(item.get("evidence"), list) else []:
                if not isinstance(evidence_item, dict):
                    continue
                try:
                    confidence = float(evidence_item.get("confidence", 0) or 0)
                except (TypeError, ValueError):
                    confidence = 0.0
                evidence.append({
                    "source": str(evidence_item.get("source", "unknown")),
                    "claim": str(evidence_item.get("claim", "확인된 근거 없음")),
                    "confidence": round(max(0.0, min(1.0, confidence)), 2),
                })
            dimensions.append({"name": name, "score": score, "max": maximum, "evidence": evidence or [{"source": "missing", "claim": "확인된 근거 없음", "confidence": 0.0}]})
        if not dimensions:
            raise ValueError("GitHub 분석 차원이 비어 있습니다.")
        grounded = [item for dimension in dimensions for item in dimension["evidence"] if item["source"] != "missing"]
        result.update({
            "version": "github-evidence-v1",
            "dimensions": dimensions,
            "score": round(min(100.0, sum(item["score"] for item in dimensions)), 1),
            "evidence_coverage": round(min(100.0, len(grounded) / max(1, len(dimensions)) * 100), 1),
            "confidence": round(sum(item["confidence"] for item in grounded) / max(1, len(grounded)), 2),
            "gaps": [str(item) for item in result.get("gaps", []) if item][:6] or ["실제 코드 기여도와 협업 맥락은 GitHub 공개 데이터만으로 확인 불가"],
            "risk_flags": [str(item) for item in result.get("risk_flags", []) if item][:6] or ["공개 활동량을 실력의 직접 증거로 해석하지 않음"],
            "verification_plan": [str(item) for item in result.get("verification_plan", []) if item][:6] or ["대표 저장소의 실제 기여와 설계 선택을 면접에서 확인"],
            "fairness_guard": result.get("fairness_guard") if isinstance(result.get("fairness_guard"), dict) else {"status": "pass", "excluded_attributes": ["이름", "이메일", "위치", "회사"], "evaluated_attributes": ["공개 기술·프로젝트 근거"]},
            "decision_trace": ["직무와 무관한 개인정보를 평가에서 제외", "공개 GitHub 신호를 5개 직무 관련 차원으로 분리", f"{len(grounded)}개 근거와 확인 불가 영역을 분리"],
        })
        return json.dumps(result, ensure_ascii=False)
    except Exception as e:
        print(f"[OpenAI structured analysis error] {e}")
        raise RuntimeError("GitHub 후보자 분석을 검증 가능한 형태로 완료하지 못했습니다.") from e

def extract_text_from_file(file_path_or_url):
    """
    파일 경로 또는 URL에서 텍스트를 추출한다. (PDF/텍스트 파일 지원)
    """
    import requests
    import tempfile
    import os
    print(f"[분석 시작] 파일 경로/URL: {file_path_or_url}")
    
    # URL이면 다운로드, 아니면 로컬 파일로 처리
    if file_path_or_url.startswith('http://') or file_path_or_url.startswith('https://'):
        print(f"[분석] URL에서 파일 다운로드 시작: {file_path_or_url}")
        resp = requests.get(file_path_or_url)
        print(f"[분석] 다운로드 응답 상태: {resp.status_code}")
        if resp.status_code != 200:
            print(f"[분석] 다운로드 실패: {resp.status_code} - {resp.text[:200]}")
            raise Exception(f"파일 다운로드 실패: {file_path_or_url}")
        
        print(f"[분석] 다운로드된 파일 크기: {len(resp.content)} bytes")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
            tmp.write(resp.content)
            tmp_path = tmp.name
            print(f"[분석] 임시 파일 생성: {tmp_path}")
    else:
        tmp_path = file_path_or_url
        print(f"[분석] 로컬 파일 사용: {tmp_path}")
    
    # 파일 타입 판별
    mime, _ = mimetypes.guess_type(tmp_path)
    print(f"[분석] 파일 타입: {mime}")
    text = ""
    try:
        if mime == 'application/pdf' or tmp_path.lower().endswith('.pdf'):
            print(f"[분석] PDF 파일 처리 시작")
            reader = PdfReader(tmp_path)
            print(f"[분석] PDF 페이지 수: {len(reader.pages)}")
            for i, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                text += page_text
                print(f"[분석] 페이지 {i+1} 텍스트 길이: {len(page_text)}")
        else:
            print(f"[분석] 텍스트 파일 처리 시작")
            with open(tmp_path, 'r', encoding='utf-8', errors='ignore') as f:
                text = f.read()
                print(f"[분석] 텍스트 파일 길이: {len(text)}")
    except Exception as e:
        print(f"[분석] 텍스트 추출 오류: {e}")
        text = f"[텍스트 추출 실패: {e}]"
    finally:
        if file_path_or_url.startswith('http') and os.path.exists(tmp_path):
            os.remove(tmp_path)
            print(f"[분석] 임시 파일 삭제: {tmp_path}")
    
    print(f"[분석] 최종 추출된 텍스트 길이: {len(text)}")
    print(f"[분석] 텍스트 미리보기: {text[:200]}...")
    return text

def analyze_portfolio_file(file_path_or_url, extra_info=None):
    """
    포트폴리오 파일을 읽어 GPT-4o-mini로 분석한다.
    extra_info: dict (지원자명, 이메일 등 부가정보)
    """
    print(f"[분석 시작] 포트폴리오 분석 시작: {file_path_or_url}")
    text = extract_text_from_file(file_path_or_url)
    
    if not text or len(text.strip()) < 10:
        print(f"[분석] 텍스트가 너무 짧거나 비어있음: {len(text)} 문자")
        return "분석 가능한 포트폴리오 텍스트가 부족합니다. 파일이 비어 있거나 텍스트 추출을 지원하지 않는 형식인지 확인해 주세요."
    
    print(f"[분석] 추출된 텍스트 길이: {len(text)} 문자")
    print(f"[분석] 텍스트 샘플: {text[:300]}...")
    
    prompt = f"""
아래는 한 지원자의 포트폴리오(이력서/자기소개서 등) 내용입니다. 실제 텍스트 일부 또는 전체가 포함되어 있습니다.

{text[:3000]}

이 지원자의 강점, 약점, 기술스택, 경력, 성장 가능성, 기업 적합성 등을 5~10줄로 요약해 주세요.
그리고 100점 만점 기준으로 종합 점수와 근거를 아래 형식으로 출력해 주세요.

이유: [구체적인 평가 근거와 각 항목별 점수] (점수: [총점]점)
종합요약: [3-4줄 요약]
"""
    if extra_info:
        prompt = f"지원자 정보: {extra_info}\n" + prompt
        print(f"[분석] 추가 정보 포함: {extra_info}")
    
    print(f"[분석] OpenAI API 호출 시작")
    messages = [
        {"role": "system", "content": "너는 이력서/포트폴리오를 정확하게 평가하는 AI 전문가야. 각 지원자의 실제 데이터를 바탕으로 객관적으로 점수를 매겨줘."},
        {"role": "user", "content": prompt}
    ]
    result = call_openai_chat(messages, max_tokens=900, temperature=0.5)
    print(f"[분석 완료] 분석 결과 길이: {len(result) if result else 0} 문자")
    return result
