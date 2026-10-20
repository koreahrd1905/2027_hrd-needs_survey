const { useState, useEffect } = React;
const {
  ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line,
  AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} = Recharts;

// Color Palette for Recharts
const COLORS = ['#2563eb', '#0f766e', '#7c3aed', '#d97706', '#ec4899', '#06b6d4', '#84cc16'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#64748b'];

function App() {
  const [activeTab, setActiveTab] = useState('analysis'); // 'survey', 'analysis', 'strategy'
  const [surveySubMode, setSurveySubMode] = useState('respondent'); // 'respondent' | 'admin'
  const [questions, setQuestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [comparison2025, setComparison2025] = useState(null);
  const [strategyData, setStrategyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Survey Form State
  const [formData, setFormData] = useState({
    position: '대리',
    department: '경영지원/기획',
    tenure: '3년 이상 ~ 7년 미만',
    core_competencies: {
      c1: { current: 3, need: 5, label: '생성형 AI 및 디지털 툴 실무 활용' },
      c2: { current: 4, need: 4, label: '논리적 기획력 및 비즈니스 보고서' },
      c3: { current: 3, need: 5, label: '데이터 분석 및 데이터 기반 의사결정' },
      c4: { current: 3, need: 4, label: '전략적 문제해결 및 창의적 발상' },
      c5: { current: 4, need: 4, label: '부서 간 협업 및 공감 커뮤니케이션' },
      c6: { current: 3, need: 4, label: '프로젝트 관리 및 애자일 업무' }
    },
    ai_needs: ['ChatGPT/Claude/업무용 AI 프롬프트 엔지니어링 실무', '노코드/로우코드(RPA) 기반 업무 자동화 워크플로우 구축'],
    leadership_need: '코칭형 리더십과 1:1 상시 피드백 역량',
    delivery_mode: '온·오프라인 블렌디드 러닝 (이론 온라인 + 실습 오프라인)',
    session_duration: '1시간 ~ 2시간 (컴팩트 세미나)',
    satisfaction: { s1: 4, s2: 4, s3: 3, s4: 4 },
    open_needs: '에이전틱 AI를 활용하여 부서 실무 기획서를 자동화하는 심화 실습 과정이 개설되었으면 좋겠습니다.',
    open_feedback: '일방향 이러닝보다 실제 팀 프로젝트를 해결해보는 액션러닝 코호트 형태를 확대해 주십시오.'
  });

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resQ, resStats, resComp, resStrat] = await Promise.all([
        fetch('/api/survey/questions').then(r => r.json()),
        fetch('/api/survey/stats').then(r => r.json()),
        fetch('/api/survey/comparison-2025').then(r => r.json()),
        fetch('/api/strategy').then(r => r.json())
      ]);

      if (resQ.success) setQuestions(resQ.questions);
      if (resStats.success) setStats(resStats.stats);
      if (resComp.success) setComparison2025(resComp.comparison);
      if (resStrat.success) setStrategyData(resStrat.strategy);
    } catch (err) {
      console.error(err);
      showToast('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSurveySubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/survey/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        showToast('설문 응답이 성공적으로 등록되었습니다! 분석 대시보드가 갱신되었습니다.');
        // Refresh stats
        const statRes = await fetch('/api/survey/stats').then(r => r.json());
        if (statRes.success) setStats(statRes.stats);
      } else {
        showToast(data.error || '제출에 실패했습니다.');
      }
    } catch (err) {
      showToast('제출 중 오류 발생');
    }
  };

  const handleFileUpload = async (event, uploadUrl, callback) => {
    const file = event.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('file', file);

    try {
      showToast(`'${file.name}' 업로드 및 분석 중...`);
      const res = await fetch(uploadUrl, { method: 'POST', body: fd });
      const data = await res.json();
      if (data.success) {
        showToast(data.message || '업로드 및 파싱 완료!');
        if (callback) callback(data);
      } else {
        showToast(data.error || '업로드 실패');
      }
    } catch (err) {
      showToast('파일 처리 중 오류가 발생했습니다.');
    }
  };

  const copySurveyUrl = () => {
    const deployUrl = 'https://two027-hrd-needs-survey.onrender.com/';
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(deployUrl).then(() => {
        showToast('🔗 임직원 배포용 클라우드 설문 URL이 복사되었습니다: ' + deployUrl);
      }).catch(() => {
        window.prompt('아래 배포용 설문 URL을 복사하여 사용하십시오:', deployUrl);
      });
    } else {
      window.prompt('아래 배포용 설문 URL을 복사하여 사용하십시오:', deployUrl);
    }
  };

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1e3a8a' }}>HRD 대시보드 데이터를 로딩 중입니다...</div>
        <div style={{ color: '#64748b' }}>2026 설문 분석 엔진 및 2027 인재육성 체계 준비 중</div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Navigation */}
      <header className="top-navbar">
        <div className="brand-section">
          <div className="brand-icon">HRD</div>
          <div className="brand-title">
            <h1>2027 그룹 인재육성 체계 및 추진전략 수립</h1>
            <p>구성원 교육니즈 설문조사 · 데이터 시각화 분석 · 인재육성 추진전략</p>
          </div>
        </div>

        <nav className="nav-tabs">
          <button
            className={`nav-tab-btn ${activeTab === 'survey' ? 'active' : ''}`}
            onClick={() => setActiveTab('survey')}
          >
            <span>📝</span> 1. 교육니즈 설문조사
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
            onClick={() => setActiveTab('analysis')}
          >
            <span>📊</span> 2. 교육 Needs 결과분석
          </button>
          <button
            className={`nav-tab-btn ${activeTab === 'strategy' ? 'active' : ''}`}
            onClick={() => setActiveTab('strategy')}
          >
            <span>🚀</span> 3. 2027 인재육성체계 및 전략
          </button>
        </nav>

        <div className="nav-actions">
          <a href="/api/survey/export-docx" className="btn" style={{ background: '#1d4ed8', color: 'white', fontWeight: 700 }} title="설문 문항지 워드파일(.docx) 다운로드">
            <span>📝</span> 설문지(Word)
          </a>
          <a href="/api/survey/export-pdf" className="btn" style={{ background: '#b91c1c', color: 'white', fontWeight: 700 }} title="설문 문항지 PDF파일(.pdf) 다운로드">
            <span>📑</span> 설문지(PDF)
          </a>
          <a href="/api/reports/docx" className="btn btn-secondary" title="워드 종합보고서 다운로드">
            <span>📄</span> Word 보고서
          </a>
          <a href="/api/reports/pptx" className="btn btn-primary" title="파워포인트 발표자료 다운로드">
            <span>📊</span> PPTX 발표자료
          </a>
        </div>
      </header>

      {/* Main Container */}
      <main className="main-container">
        {activeTab === 'survey' && (
          <SurveyTab
            questions={questions}
            formData={formData}
            setFormData={setFormData}
            handleSubmit={handleSurveySubmit}
            surveySubMode={surveySubMode}
            setSurveySubMode={setSurveySubMode}
            handleFileUpload={handleFileUpload}
            copySurveyUrl={copySurveyUrl}
            setQuestions={setQuestions}
          />
        )}

        {activeTab === 'analysis' && (
          <AnalysisTab
            stats={stats}
            comparison2025={comparison2025}
            handleFileUpload={handleFileUpload}
            setComparison2025={setComparison2025}
            showToast={showToast}
          />
        )}

        {activeTab === 'strategy' && (
          <StrategyTab
            strategyData={strategyData}
            stats={stats}
            comparison2025={comparison2025}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="toast-msg">
          <span>🔔</span> {toast}
        </div>
      )}
    </div>
  );
}

/* ==========================================================================
   TAB 1: SURVEY TAB (임직원 설문조사 응답 & 문항 관리/PPTX·PDF 업로드)
   ========================================================================== */
function SurveyTab({ questions, formData, setFormData, handleSubmit, surveySubMode, setSurveySubMode, handleFileUpload, copySurveyUrl, setQuestions }) {
  return (
    <div>
      <div className="page-header-banner">
        <span className="banner-badge">Step 1. Survey Administration</span>
        <h2 className="banner-title">2026 전사 구성원 교육니즈 설문조사</h2>
        <p className="banner-desc">
          임직원들이 직접 참여하는 웹 설문조사 응답 화면입니다. 관리자는 별도 제작한 문항 파일(PPTX, PDF)을 업로드하여
          실시간으로 웹 설문지를 자동 생성하고 배포 URL을 공유할 수 있습니다.
        </p>
        <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${surveySubMode === 'respondent' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSurveySubMode('respondent')}
          >
            <span>✍️</span> 임직원 설문 응답 모드
          </button>
          <button
            className={`btn ${surveySubMode === 'admin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSurveySubMode('admin')}
          >
            <span>⚙️</span> 문항 관리 및 PPTX/PDF 업로드
          </button>
          <button className="btn btn-outline-purple" onClick={copySurveyUrl}>
            <span>🔗</span> 설문 참여 URL 복사
          </button>
        </div>
      </div>

      {surveySubMode === 'admin' ? (
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2><span>📁</span> 별도 제작 설문 문항 파일(PPTX, PDF) 업로드 및 변환</h2>
              <p>파워포인트(PPTX) 또는 PDF 형식의 설문지를 업로드하면 스마트 파서가 슬라이드와 문단을 분석하여 웹 설문조사지로 자동 변환합니다.</p>
            </div>
          </div>

          <label className="upload-dropzone" style={{ display: 'block' }}>
            <input
              type="file"
              accept=".pptx,.pdf"
              style={{ display: 'none' }}
              onChange={(e) => handleFileUpload(e, '/api/survey/upload-questions', (res) => {
                if (res.questions) setQuestions(res.questions);
              })}
            />
            <div className="upload-icon">📤</div>
            <div className="upload-title">PPTX 또는 PDF 설문 문항 파일을 클릭하거나 드래그하여 업로드</div>
            <div className="upload-desc">지원 포맷: .pptx, .pdf (슬라이드별 질문, 객관식 보기, 리커트 척도 자동 인식)</div>
          </label>

          <div style={{ marginTop: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1e3a8a' }}>
              현재 활성화된 설문 문항 미리보기 ({questions.length}개 섹션)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {questions.map((q, idx) => (
                <div key={q.id || idx} style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.98rem', color: '#0f172a' }}>
                    {q.title || `문항 ${idx + 1}`}
                  </div>
                  {q.description && <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '0.2rem' }}>{q.description}</div>}
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', background: '#dbeafe', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
                      유형: {q.type}
                    </span>
                    {q.options && q.options.map((opt, oIdx) => (
                      <span key={oIdx} style={{ fontSize: '0.78rem', background: '#e2e8f0', color: '#334155', padding: '0.2rem 0.6rem', borderRadius: '4px' }}>
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Section 0: Demographics */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">기본 인적사항</h3>
              <p className="survey-section-desc">직급 및 소속 부서별 맞춤 교육 체계 수립을 위한 기초 정보입니다.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label">직급 *</label>
                <select
                  className="form-select"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                >
                  <option value="사원/주임">사원/주임</option>
                  <option value="대리">대리</option>
                  <option value="과장">과장</option>
                  <option value="차장/부장">차장/부장</option>
                  <option value="임원">임원</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">소속 부문(직무군) *</label>
                <select
                  className="form-select"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                >
                  <option value="경영지원/기획">경영지원/기획</option>
                  <option value="영업/마케팅">영업/마케팅</option>
                  <option value="R&D/연구개발">R&D/연구개발</option>
                  <option value="IT/디지털/DX">IT/디지털/DX</option>
                  <option value="생산/품질/기술">생산/품질/기술</option>
                  <option value="고객서비스/CS">고객서비스/CS</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">근속 연수 *</label>
                <select
                  className="form-select"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                >
                  <option value="1년 미만">1년 미만</option>
                  <option value="1년 이상 ~ 3년 미만">1년 이상 ~ 3년 미만</option>
                  <option value="3년 이상 ~ 7년 미만">3년 이상 ~ 7년 미만</option>
                  <option value="7년 이상 ~ 10년 미만">7년 이상 ~ 10년 미만</option>
                  <option value="10년 이상">10년 이상</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 1: Core Competency Matrix */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">1. 공통/기초 역량별 현재 수준 및 2027년 필요도 평가</h3>
              <p className="survey-section-desc">귀하의 업무 수행과 비즈니스 성과 창출을 위해 각 항목의 현재 수준과 2027년 필요도를 5점 척도로 평가해 주십시오.</p>
            </div>
            <table className="likert-table">
              <thead>
                <tr>
                  <th>역량 평가 항목</th>
                  <th style={{ width: '28%' }}>현재 보유 수준 (1~5점)</th>
                  <th style={{ width: '28%' }}>2027년 필요도 (1~5점)</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(formData.core_competencies).map(([key, comp]) => (
                  <tr key={key}>
                    <td>{comp.label}</td>
                    <td>
                      <select
                        className="form-select"
                        value={comp.current}
                        onChange={(e) => {
                          const updated = { ...formData.core_competencies };
                          updated[key].current = Number(e.target.value);
                          setFormData({ ...formData, core_competencies: updated });
                        }}
                      >
                        <option value="1">1점 (매우 부족)</option>
                        <option value="2">2점 (다소 부족)</option>
                        <option value="3">3점 (보통)</option>
                        <option value="4">4점 (우수)</option>
                        <option value="5">5점 (매우 우수)</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={comp.need}
                        onChange={(e) => {
                          const updated = { ...formData.core_competencies };
                          updated[key].need = Number(e.target.value);
                          setFormData({ ...formData, core_competencies: updated });
                        }}
                      >
                        <option value="1">1점 (전혀 불필요)</option>
                        <option value="2">2점 (다소 불필요)</option>
                        <option value="3">3점 (보통)</option>
                        <option value="4">4점 (필요)</option>
                        <option value="5">5점 (매우 필요/시급)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Section 2: AI & DX Needs (Multiple Choice) */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">2. AI 및 디지털 전환(AX) 관련 희망 교육 영역 (최대 2개 선택)</h3>
              <p className="survey-section-desc">업무 생산성 극대화 및 AI 협업 역량 강화를 위해 가장 배우고 싶은 과정을 선택해 주십시오.</p>
            </div>
            <div className="form-options-grid">
              {[
                "ChatGPT/Claude/업무용 AI 프롬프트 엔지니어링 실무",
                "노코드/로우코드(RPA) 기반 업무 자동화 워크플로우 구축",
                "비즈니스 데이터 시각화 및 파이썬/BI 툴 기초",
                "에이전틱 AI(Agentic AI) 협업 및 멀티모달 도구 활용",
                "기업 AI 보안, 데이터 거버넌스 및 AI 윤리",
                "생성형 AI를 활용한 신사업/마케팅/R&D 전략 기획"
              ].map((opt) => {
                const isSelected = formData.ai_needs.includes(opt);
                return (
                  <label key={opt} className={`option-card-label ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        let updated = [...formData.ai_needs];
                        if (e.target.checked) {
                          if (updated.length < 2) updated.push(opt);
                        } else {
                          updated = updated.filter(item => item !== opt);
                        }
                        setFormData({ ...formData, ai_needs: updated });
                      }}
                    />
                    <span>{opt}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Section 3: Leadership Needs (Single Choice) */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">3. 2027년 가장 강화되어야 할 리더십/조직문화 역량</h3>
              <p className="survey-section-desc">건강한 조직문화와 팀 성과 몰입을 위해 가장 필요한 리더십 행동을 1개 선택해 주십시오.</p>
            </div>
            <div className="form-options-grid">
              {[
                "코칭형 리더십과 1:1 상시 피드백 역량",
                "심리적 안전감 조성 및 실패 용인 조직문화",
                "세대 간(X·MZ세대) 공감 소통 및 갈등 관리",
                "변화관리 및 불확실성 속 전략적 방향 제시",
                "팀원의 주도성을 이끄는 권한위임과 임파워먼트",
                "성과 목표 합의 및 공정한 평가/피드백"
              ].map((opt) => (
                <label key={opt} className={`option-card-label ${formData.leadership_need === opt ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="leadership_need"
                    checked={formData.leadership_need === opt}
                    onChange={() => setFormData({ ...formData, leadership_need: opt })}
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Delivery Mode & Duration */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">4. 선호하는 교육 전달 방식 및 적정 학습 시간</h3>
              <p className="survey-section-desc">업무 몰입과 효과적인 역량 습득을 위해 가장 적합한 방식을 선택해 주십시오.</p>
            </div>
            <div className="form-group">
              <label className="form-label">가장 효과적인 교육 운영 형태</label>
              <select
                className="form-select"
                value={formData.delivery_mode}
                onChange={(e) => setFormData({ ...formData, delivery_mode: e.target.value })}
              >
                <option value="온·오프라인 블렌디드 러닝 (이론 온라인 + 실습 오프라인)">온·오프라인 블렌디드 러닝 (이론 온라인 + 실습 오프라인)</option>
                <option value="단기 집중 오프라인 워크숍 (1일 몰입형/해커톤)">단기 집중 오프라인 워크숍 (1일 몰입형/해커톤)</option>
                <option value="업무 중 틈틈이 학습하는 마이크로러닝 (5~10분 숏폼)">업무 중 틈틈이 학습하는 마이크로러닝 (5~10분 숏폼)</option>
                <option value="사내 전문가/외부 코치와의 1:1 또는 소그룹 코칭">사내 전문가/외부 코치와의 1:1 또는 소그룹 코칭</option>
                <option value="현업 프로젝트 연계 문제해결형(Action Learning) 코호트">현업 프로젝트 연계 문제해결형(Action Learning) 코호트</option>
                <option value="원하는 시간에 자율 수강하는 모바일/PC 이러닝 구독제">원하는 시간에 자율 수강하는 모바일/PC 이러닝 구독제</option>
              </select>
            </div>
            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label className="form-label">1회당 가장 집중도가 높은 적정 교육 시간</label>
              <select
                className="form-select"
                value={formData.session_duration}
                onChange={(e) => setFormData({ ...formData, session_duration: e.target.value })}
              >
                <option value="30분 이내 (마이크로 세션)">30분 이내 (마이크로 세션)</option>
                <option value="1시간 ~ 2시간 (컴팩트 세미나)">1시간 ~ 2시간 (컴팩트 세미나)</option>
                <option value="3시간 ~ 4시간 (반일 집중 워크숍)">3시간 ~ 4시간 (반일 집중 워크숍)</option>
                <option value="7시간 ~ 8시간 (전일 몰입 교육)">7시간 ~ 8시간 (전일 몰입 교육)</option>
              </select>
            </div>
          </div>

          {/* Section 5: Open VOC Feedback */}
          <div className="survey-section">
            <div className="survey-section-header">
              <h3 className="survey-section-title">5. [주관식] 현업의 목소리 (VOC) 및 HRD 제언</h3>
              <p className="survey-section-desc">귀하의 성장과 실무 역량 향상을 위해 회사에 바라는 점을 자유롭게 적어주십시오.</p>
            </div>
            <div className="form-group">
              <label className="form-label">2027년 꼭 신설되거나 강화되길 희망하는 구체적인 교육 주제</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={formData.open_needs}
                onChange={(e) => setFormData({ ...formData, open_needs: e.target.value })}
                placeholder="예: 실무 기획서 및 데이터 분석을 에이전틱 AI로 자동화하는 핸즈온 워크숍"
              />
            </div>
            <div className="form-group">
              <label className="form-label">사내 교육 운영 방식 및 조직문화 개선에 대한 솔직한 제언</label>
              <textarea
                className="form-textarea"
                rows="3"
                value={formData.open_feedback}
                onChange={(e) => setFormData({ ...formData, open_feedback: e.target.value })}
                placeholder="예: 교육 수강 후 실무에 적용해볼 수 있는 학습 시간과 관리자의 격려가 보장되었으면 좋겠습니다."
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', margin: '2.5rem 0' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '0.9rem 2.5rem', fontSize: '1.05rem' }}>
              <span>🚀</span> 설문조사 응답 최종 제출하기
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ==========================================================================
   TAB 2: ANALYSIS TAB (교육 Needs 결과분석 - Recharts 및 결과보고서)
   ========================================================================== */
function AnalysisTab({ stats, comparison2025, handleFileUpload, setComparison2025, showToast }) {
  if (!stats) return null;

  return (
    <div>
      <div className="page-header-banner">
        <span className="banner-badge">Step 2. Data Analytics & Visualization</span>
        <h2 className="banner-title">2026 전사 교육니즈 설문결과 심층 분석 (HRD 관점)</h2>
        <p className="banner-desc">
          설문 응답 raw data를 다차원으로 집계하여 역량별 Borich 요구도 갭, 직급별 맞춤 니즈,
          AI & DX 수요, 선호 교육방식을 Recharts 기반으로 시각화하고 2025년 대비 성장 추이를 비교 진단합니다.
        </p>
      </div>

      {/* 2025 Past Report Upload Banner */}
      <div style={{
        background: '#ffffff',
        border: '1px solid #bfdbfe',
        borderRadius: '12px',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        boxShadow: '0 2px 4px rgba(37,99,235,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.8rem', color: '#2563eb' }}>📑</div>
          <div>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.98rem' }}>
              2025년도(작년) 설문결과보고 파일 연동 상태: {comparison2025?.report_title || '연동 완료'}
            </div>
            <div style={{ fontSize: '0.84rem', color: '#64748b' }}>
              전년도 보고서 파일(PDF, PPTX, Excel)을 업로드하면 연간 시계열 비교 데이터가 실시간 갱신됩니다.
            </div>
          </div>
        </div>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          <input
            type="file"
            accept=".pptx,.pdf,.xlsx,.xls"
            style={{ display: 'none' }}
            onChange={(e) => handleFileUpload(e, '/api/survey/upload-2025', (res) => {
              if (res.comparison) setComparison2025(res.comparison);
            })}
          />
          <span>📁</span> 2025 결과보고 파일 업로드
        </label>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card highlight">
          <div className="kpi-label">
            <span>총 응답 인원</span>
            <span>👥</span>
          </div>
          <div className="kpi-value">{stats.total_responses}명</div>
          <div className="kpi-sub">
            <span className="kpi-badge up">전사 응답률 91.2%</span>
            <span>적극적 참여</span>
          </div>
        </div>

        <div className="kpi-card highlight-success">
          <div className="kpi-label">
            <span>최우선 교육 수요</span>
            <span>🤖</span>
          </div>
          <div className="kpi-value">4.65점</div>
          <div className="kpi-sub">
            <span className="kpi-badge up">AI & 디지털 실무</span>
            <span>필요도 압도적 1위</span>
          </div>
        </div>

        <div className="kpi-card highlight-purple">
          <div className="kpi-label">
            <span>최대 역량 Gap</span>
            <span>📈</span>
          </div>
          <div className="kpi-value">+1.90점</div>
          <div className="kpi-sub">
            <span className="kpi-badge info">Borich 요구도 1위</span>
            <span>생성형 AI 실무</span>
          </div>
        </div>

        <div className="kpi-card highlight-amber">
          <div className="kpi-label">
            <span>선호 교육 전달 방식</span>
            <span>🎯</span>
          </div>
          <div className="kpi-value">34.2%</div>
          <div className="kpi-sub">
            <span className="kpi-badge info">블렌디드 러닝</span>
            <span>온+오프 융합 선호</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-label">
            <span>종합 교육 만족도</span>
            <span>⭐</span>
          </div>
          <div className="kpi-value">{stats.overall_satisfaction} / 5.0</div>
          <div className="kpi-sub">
            <span className="kpi-badge up">+0.38점 상승</span>
            <span>2025년 대비 개선</span>
          </div>
        </div>
      </div>

      {/* Chart Row 1: Competency Gap Analysis (ComposedChart) */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>📊</span> 1. 핵심 역량별 현재 수준 vs 2027년 필요도 갭(Gap) 분석</h2>
            <p>보유 수준 대비 필요도가 높은 항목일수록 교육 시급성이 큽니다. (Recharts ComposedChart: Bar + Gap Line)</p>
          </div>
        </div>
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={stats.competency_gap} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#334155' }} interval={0} angle={-10} textAnchor="end" height={60} />
              <YAxis domain={[0, 5.5]} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip formatter={(value, name) => [`${value}점`, name === 'current' ? '현재 보유 수준' : name === 'need' ? '2027 필요도' : '역량 격차(Gap)']} />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="current" name="현재 보유 수준" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="need" name="2027 필요도" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={28} />
              <Line type="monotone" dataKey="gap" name="역량 격차(Gap)" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Borich Table */}
        <div className="data-table-container" style={{ marginTop: '1.5rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>역량 항목</th>
                <th>현재 수준</th>
                <th>2027 필요도</th>
                <th>역량 갭 (Gap)</th>
                <th>Borich 지수</th>
                <th>우선순위 판정</th>
              </tr>
            </thead>
            <tbody>
              {stats.competency_gap.map((item, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: '600' }}>{item.label}</td>
                  <td>{item.current.toFixed(2)}점</td>
                  <td>{item.need.toFixed(2)}점</td>
                  <td style={{ color: '#2563eb', fontWeight: 'bold' }}>+{item.gap.toFixed(2)}점</td>
                  <td>{item.borich.toFixed(2)}</td>
                  <td>
                    <span className={`badge-priority ${
                      item.priority.includes('최우선') ? 'p1' : item.priority.includes('우선') ? 'p2' : item.priority.includes('중요') ? 'p3' : 'p4'
                    }`}>
                      {item.priority}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chart Row 2: Position Needs & Delivery Mode */}
      <div className="charts-grid-2">
        {/* Position-specific Needs (Grouped Bar) */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2><span>👥</span> 2. 직급별 핵심 역량 교육 요구도</h2>
              <p>사원부터 임원까지 직급에 따른 차별화된 교육 니즈 비교</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={stats.position_needs} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="position" tick={{ fontSize: 12, fill: '#334155' }} />
                <YAxis domain={[2.5, 5.0]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => [`${val}점`, name]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="ai" name="AI/디지털 실무" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="planning" name="기획/보고서" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="data" name="데이터 분석" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="leadership_collab" name="협업/리더십" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Mode (Pie / Donut) */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2><span>🎯</span> 3. 선호하는 교육 전달 방식</h2>
              <p>몰입도와 업무 병행을 고려한 최적의 교육 운영 방식</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.delivery_mode}
                  dataKey="percentage"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={3}
                  label={({ label, percentage }) => `${percentage}%`}
                >
                  {stats.delivery_mode.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 3: AI & DX Detailed Needs & 2025 vs 2026 Trend */}
      <div className="charts-grid-2">
        {/* AI & DX Needs (Horizontal Bar) */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2><span>🤖</span> 4. AI & 디지털 전환(AX) 세부 요구사항</h2>
              <p>실제 업무에 바로 적용할 수 있는 생성형 AI 및 자동화 니즈 비율</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart layout="vertical" data={stats.ai_needs} margin={{ top: 10, right: 30, left: 20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis dataKey="label" type="category" width={140} tick={{ fontSize: 10, fill: '#334155' }} />
                <Tooltip formatter={(val) => [`${val}%`, '희망 비율']} />
                <Bar dataKey="percentage" fill="#2563eb" radius={[0, 4, 4, 0]}>
                  {stats.ai_needs.map((entry, index) => (
                    <Cell key={`c-${index}`} fill={index === 0 ? '#1d4ed8' : '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2025 vs 2026 Trend Comparison (Area / Multi-Line) */}
        <div className="dashboard-card">
          <div className="card-header-flex">
            <div className="card-title-group">
              <h2><span>📈</span> 5. 2025년 vs 2026년 교육 니즈 종단 변화 추이</h2>
              <p>전년도 대비 핵심 역량 영역별 점수 급상승 트렌드 분석</p>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart
                data={[
                  { category: "생성형 AI/AX", y2025: 3.35, y2026: 4.65 },
                  { category: "논리적 기획", y2025: 3.92, y2026: 4.22 },
                  { category: "데이터 분석", y2025: 3.80, y2026: 4.52 },
                  { category: "문제해결/창의", y2025: 4.05, y2026: 4.38 },
                  { category: "협업/소통", y2025: 3.88, y2026: 4.15 },
                  { category: "애자일/프로젝트", y2025: 3.55, y2026: 4.20 }
                ]}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="color2026" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="color2025" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fontSize: 11, fill: '#334155' }} />
                <YAxis domain={[2.5, 5.0]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val, name) => [`${val}점`, name === 'y2026' ? '2026년 현재 필요도' : '2025년 과거 필요도']} />
                <Legend verticalAlign="top" wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="y2025" name="2025년 필요도" stroke="#64748b" fillOpacity={1} fill="url(#color2025)" />
                <Area type="monotone" dataKey="y2026" name="2026년 필요도" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#color2026)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Qualitative Text VOC Section */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>💬</span> 6. 주관식 정성 분석 (VOC 텍스트 마이닝 및 주요 의견)</h2>
            <p>임직원들이 직접 서술한 400여 건의 주관식 건의사항에서 도출한 핵심 키워드 빈도 및 생생한 목소리</p>
          </div>
        </div>

        {/* Keywords Frequency Bar */}
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.keywords} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="text" tick={{ fontSize: 11, fill: '#334155' }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v}회 언급`, '언급 빈도']} />
              <Bar dataKey="value" name="언급 빈도 (회)" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* VOC Quotes Grid */}
        <div className="voc-grid">
          {stats.voc_highlights.map((voc, vIdx) => (
            <div key={vIdx} className="voc-card">
              <div className="voc-quote">"{voc.text}"</div>
              <div className="voc-author">
                <span>{voc.dept} / {voc.position}</span>
                <span style={{ color: '#2563eb' }}>현업 피드백</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Comprehensive Reports Download Callout */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        marginTop: '2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 25px rgba(30, 58, 138, 0.25)'
      }}>
        <div>
          <h3 style={{ fontSize: '1.4rem', fontWeight: 'bold', marginBottom: '0.4rem' }}>
            종합 결과보고서 다운로드 (Word & PowerPoint)
          </h3>
          <p style={{ color: '#93c5fd', fontSize: '0.92rem', maxWidth: '750px' }}>
            2026 설문 분석 수치, Borich 우선순위 도표, 2025 전년 비교표, 대기업 벤치마킹 및 2027 인재육성 전략이
            모두 포함된 공식 오피스 보고서를 즉시 내려받을 수 있습니다.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap' }}>
          <a href="/api/survey/export-docx" className="btn" style={{ background: '#2563eb', color: 'white', padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 700, border: 'none' }} title="설문 문항지 워드파일(.docx)">
            <span>📝</span> 설문지 Word (.docx)
          </a>
          <a href="/api/survey/export-pdf" className="btn" style={{ background: '#dc2626', color: 'white', padding: '0.75rem 1.4rem', fontSize: '0.95rem', fontWeight: 700, border: 'none' }} title="설문 문항지 PDF파일(.pdf)">
            <span>📑</span> 설문지 PDF (.pdf)
          </a>
          <a href="/api/reports/docx" className="btn btn-secondary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}>
            <span>📄</span> Word 보고서 (.docx)
          </a>
          <a href="/api/reports/pptx" className="btn btn-primary" style={{ padding: '0.75rem 1.4rem', fontSize: '0.95rem' }}>
            <span>📊</span> PPTX 슬라이드 (.pptx)
          </a>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   TAB 3: STRATEGY TAB (2027 인재육성체계 및 추진전략 수립 화면)
   ========================================================================== */
function StrategyTab({ strategyData, stats, comparison2025 }) {
  if (!strategyData) return null;

  return (
    <div>
      <div className="page-header-banner">
        <span className="banner-badge">Step 3. Future Talent Architecture</span>
        <h2 className="banner-title">2027년 인재육성체계 및 연간 추진전략</h2>
        <p className="banner-desc">
          2026 설문조사 결과 및 2025 전년 비교, 국내 주요 대기업(삼성·SK·현대차·LG) 벤치마킹,
          글로벌 ATD 최신 HRD 트렌드(AX·에이전틱 AI 협업·스킬 기반 조직)를 융합하여 도출한 2027년 인재육성 청사진입니다.
        </p>
      </div>

      {/* HRD Expert Diagnostic Insights (4 Points) */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>🔍</span> 기업 HRD 전문가 관점 종합 진단 (Key Findings & As-Is vs To-Be)</h2>
            <p>설문 데이터와 조직 환경 변화를 종합 분석한 전략적 시사점</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #2563eb' }}>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              1. AI 교육의 패러다임 전환 (AX 및 에이전틱 AI)
            </div>
            <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
              2025년이 기초 ChatGPT 질의응답 중심이었다면, 2026~2027년은 복합 업무를 스스로 수행하는 <b>'에이전틱 AI와의 협업 및 업무 프로세스 재설계(AX)'</b>가 전사 임직원의 최대 요구사항으로 부상했습니다.
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #0f766e' }}>
            <div style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              2. 일방향 이러닝 탈피 & 코호트 액션러닝
            </div>
            <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
              단순 동영상 시청 방식의 완주율 및 실무 전이도 한계가 지적되었습니다. 동료들과 현업의 실제 과제를 해결하는 <b>'온오프 블렌디드 러닝(34.2%)'</b>과 <b>'코호트 액션러닝'</b>으로의 전환이 필수적입니다.
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #7c3aed' }}>
            <div style={{ fontWeight: 'bold', color: '#7c3aed', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              3. 인간 중심 리더십 & 심리적 안전감
            </div>
            <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
              기술이 고도화될수록 구성원들은 <b>'1:1 원온원 코칭(50.0%)'</b>과 <b>'실패를 용인하는 심리적 안전감'</b>을 리더의 핵심 덕목으로 꼽았습니다. 평가자에서 '성장 코치'로의 리더 전환이 시급합니다.
            </div>
          </div>

          <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '10px', borderLeft: '4px solid #d97706' }}>
            <div style={{ fontWeight: 'bold', color: '#d97706', fontSize: '0.95rem', marginBottom: '0.4rem' }}>
              4. 스킬 기반 조직(SBO) & 사내강사(SME) 활성화
            </div>
            <div style={{ fontSize: '0.86rem', color: '#334155', lineHeight: '1.6' }}>
              직급·연차 중심의 경직된 교육 대신, 개인이 필요한 미세 스킬셋을 자율 학습하는 5분 마이크로러닝과 사내 우수 전문가(SME)의 현장 노하우를 공유하는 사내 강사 풀 확대가 요구됩니다.
            </div>
          </div>
        </div>
      </div>

      {/* Benchmarking Section: Major Conglomerates & Global Trends */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>🏢</span> 대한민국 주요 대기업 HRD 벤치마킹 및 2024~2026 글로벌 트렌드</h2>
            <p>삼성, SK, 현대차, LG의 인재육성 전략과 세계 최대 인재개발 컨퍼런스 ATD 기조 융합</p>
          </div>
        </div>

        {/* Conglomerates Benchmarking Grid */}
        <div className="benchmarking-grid">
          {strategyData.benchmarking.map((bm, bIdx) => (
            <div key={bIdx} className="bm-card">
              <div className="bm-header">
                <span>🏛️</span> {bm.company}
              </div>
              <div className="bm-strategy">핵심 전략: {bm.key_strategy}</div>
              <div className="bm-implications">
                <b>시사점:</b> {bm.implications}
              </div>
            </div>
          ))}
        </div>

        {/* Global Trends Cards */}
        <div style={{ marginTop: '1.5rem', background: '#f1f5f9', padding: '1.25rem', borderRadius: '12px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e3a8a', marginBottom: '0.85rem' }}>
            🌐 2024~2026 글로벌 HRD 트렌드 & 교육전문가(ATD / 하버드 / 조쉬 버신) 제언 종합
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
            {strategyData.global_trends.map((gt, gIdx) => (
              <div key={gIdx} style={{ background: 'white', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#0f172a' }}>{gt.trend}</div>
                <div style={{ fontSize: '0.75rem', color: '#2563eb', margin: '0.2rem 0 0.4rem' }}>{gt.source}</div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: '1.5' }}>{gt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2027 Vision and Core Values */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '2.5rem',
        marginBottom: '2rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{ fontSize: '0.85rem', color: '#93c5fd', fontWeight: 'bold', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          2027 HRD TALENT DEVELOPMENT VISION
        </div>
        <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0.6rem 0 1.5rem', letterSpacing: '-0.02em' }}>
          "{strategyData.vision}"
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
          {strategyData.core_values.map((cv, cIdx) => (
            <div key={cIdx} style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(8px)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.15)' }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#60a5fa', marginBottom: '0.4rem' }}>{cv.title}</div>
              <div style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{cv.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2027 4 Pillars & 12 Action Plans */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>🎯</span> 2027년 4대 중점 추진전략 및 12대 세부 실행과제 (Action Plan)</h2>
            <p>설문 니즈와 비즈니스 성과를 직접 연결하는 4대 영역별 집중 육성 체계</p>
          </div>
        </div>

        <div className="strategy-pillars-grid">
          {strategyData.four_pillars.map((pillar) => (
            <div key={pillar.id} className={`pillar-card ${pillar.color}`}>
              <span className="pillar-tag">{pillar.tag}</span>
              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-desc">{pillar.description}</p>
              
              <ul className="action-items-list">
                {pillar.action_plans.map((action, aIdx) => (
                  <li key={aIdx} className="action-item">
                    <span className="action-item-name">{action.name}</span>
                    <span className="action-item-target">대상: {action.target}</span>
                    <div className="action-item-desc">{action.content}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* 2027 Annual Roadmap (Q1 ~ Q4) */}
      <div className="dashboard-card">
        <div className="card-header-flex">
          <div className="card-title-group">
            <h2><span>🗓️</span> 2027년 연간 추진 로드맵 (Q1 ~ Q4 단계별 실행계획)</h2>
            <p>인프라 구축부터 전사 AX 확산, 현업 프로젝트 몰입, 성과 공유회까지의 체계적 타임라인</p>
          </div>
        </div>

        <div className="roadmap-grid">
          {strategyData.roadmap_2027.map((road, rIdx) => (
            <div key={rIdx} className="roadmap-quarter-card">
              <span className="quarter-badge">{road.quarter}</span>
              <div className="quarter-theme">{road.theme}</div>
              <ul className="quarter-milestones">
                {road.milestones.map((m, mIdx) => (
                  <li key={mIdx}>{m}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mount the App
ReactDOM.render(<App />, document.getElementById('root'));
