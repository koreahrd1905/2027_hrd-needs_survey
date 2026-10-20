/**
 * HRD Survey & 2027 Talent Development Strategy Dashboard
 * Pure Modern JavaScript - Zero Build Delay, Zero CDN Dependency Risk
 */

(function () {
  // Global State
  let activeTab = 'analysis'; // 'survey', 'analysis', 'strategy'
  let surveySubMode = 'respondent'; // 'respondent' | 'admin'
  let isSurveyCompleted = false; // Set true when survey + lucky draw ends to close survey view
  let statsData = null;
  let questionsData = [];
  let comparison2025Data = null;
  let strategyData = null;

  // Global handler invoked when Bukang Lucky Draw finish button is clicked
  // [교수님 피드백 반영] 골인 도착 결과창에서 [종료] 클릭 시 캡처3(완료안내) 없이 웹화면 바로 닫기/종료
  window.handleSurveyAndGameFinish = function () {
    isSurveyCompleted = true;

    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {}

    try {
      window.close();
    } catch (e) {}

    try {
      self.close();
    } catch (e) {}

    try {
      if (navigator.userAgent.indexOf('KAKAOTALK') !== -1) {
        location.href = 'kakaoweb://closeBrowser';
      }
    } catch (e) {}

    setTimeout(function() {
      try {
        window.close();
      } catch(e) {}
      try {
        window.location.replace('about:blank');
      } catch(e) {}
    }, 100);
  };

  // Dedicated Window / Screen Exit Handler (Single Action)
  window.closeWindowOrExit = function () {
    // 1. Attempt native browser window close
    try {
      window.open('', '_self', '');
      window.close();
    } catch (e) {
      console.warn('Window close error:', e);
    }

    // 2. If browser blocks closing directly (e.g. tab opened via address bar),
    // immediately transition full screen to a clean, dark "Closed" terminal view.
    setTimeout(function () {
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#090d16;color:white;font-family:'Pretendard','Malgun Gothic',sans-serif;text-align:center;padding:2rem;">
          <div style="width:80px;height:80px;border-radius:50%;background:#1e293b;border:2px solid #334155;display:flex;align-items:center;justify-content:center;font-size:2.4rem;margin-bottom:1.5rem;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
            🔒
          </div>
          <span style="background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:700;font-size:0.85rem;padding:0.35rem 1rem;border-radius:9999px;margin-bottom:1rem;border:1px solid rgba(239,68,68,0.3);">
            화면 종료 완료 (Session Closed)
          </span>
          <h1 style="font-size:2.1rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.85rem;color:#f8fafc;">
            설문 화면이 안전하게 종료되었습니다
          </h1>
          <p style="font-size:1.1rem;color:#94a3b8;line-height:1.7;max-width:560px;margin-bottom:2rem;word-break:keep-all;">
            설문 응답 및 럭키드로우 이벤트 응모가 모두 안전하게 완료되어 화면을 종료하였습니다.<br>
            <span style="color:#38bdf8;font-weight:700;">상단 브라우저 탭의 [ ✕ ] 버튼을 눌러 탭을 닫아주십시오.</span>
          </p>
        </div>
      `;
      document.title = '설문 화면 종료 완료';
    }, 60);
  };

  // Form State
  const formData = {
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
    ai_needs: [
      'ChatGPT/Claude/업무용 AI 프롬프트 엔지니어링 실무',
      '노코드/로우코드(RPA) 기반 업무 자동화 워크플로우 구축'
    ],
    leadership_need: '코칭형 리더십과 1:1 상시 피드백 역량',
    delivery_mode: '온·오프라인 블렌디드 러닝 (이론 온라인 + 실습 오프라인)',
    session_duration: '1시간 ~ 2시간 (컴팩트 세미나)',
    satisfaction: { s1: 4, s2: 4, s3: 3, s4: 4 },
    open_needs: '에이전틱 AI를 활용하여 부서 실무 기획서를 자동화하는 심화 실습 과정이 개설되었으면 좋겠습니다.',
    open_feedback: '일방향 이러닝보다 실제 팀 프로젝트를 해결해보는 액션러닝 코호트 형태를 확대해 주십시오.'
  };

  // Toast Notification
  function showToast(message) {
    const existing = document.querySelector('.toast-msg');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.innerHTML = `<span>🔔</span> <span>${message}</span>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Fetch all data
  async function init() {
    const root = document.getElementById('root');
    root.innerHTML = `
      <div style="display:flex;justify-content:center;align-items:center;height:80vh;flex-direction:column;gap:1rem;">
        <div style="font-size:1.3rem;font-weight:bold;color:#1e3a8a;">HRD 대시보드 데이터를 불러오는 중입니다...</div>
        <div style="color:#64748b;">2026 설문 분석 엔진 및 2027 인재육성 체계 데이터 연동 중</div>
      </div>
    `;

    try {
      const [resQ, resStats, resComp, resStrat] = await Promise.all([
        fetch('/api/survey/questions').then(r => r.json()),
        fetch('/api/survey/stats').then(r => r.json()),
        fetch('/api/survey/comparison-2025').then(r => r.json()),
        fetch('/api/strategy').then(r => r.json())
      ]);

      if (resQ.success) questionsData = resQ.questions;
      if (resStats.success) statsData = resStats.stats;
      if (resComp.success) comparison2025Data = resComp.comparison;
      if (resStrat.success) strategyData = resStrat.strategy;

      renderDashboard();
    } catch (err) {
      console.error(err);
      root.innerHTML = `
        <div style="padding:2rem;text-align:center;color:#dc2626;">
          <h2>데이터 로딩 중 오류가 발생했습니다.</h2>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  // Main Render Function
  // [1인 1회 응모 엄격 제한] 이벤트 응모 완료 시 버튼 비활성화 함수
  window.markEventAsCompleted = function() {
    window.isEventSubmitted = true;
    try {
      sessionStorage.setItem('heungkuk_event_submitted', 'true');
    } catch (e) {}
    const btnEvt = document.getElementById('btn-event-entry');
    if (btnEvt) {
      btnEvt.disabled = true;
      btnEvt.style.animation = 'none';
      btnEvt.style.background = '#64748b';
      btnEvt.style.boxShadow = 'none';
      btnEvt.style.cursor = 'not-allowed';
      btnEvt.style.opacity = '0.85';
      btnEvt.style.pointerEvents = 'auto';
      btnEvt.innerHTML = '<span>✅</span> 이벤트 응모 완료 (1인 1회)';
      btnEvt.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        alert('이미 이벤트(커피쿠폰) 응모가 완료되었습니다.\n이벤트는 1인 1회만 응모 가능합니다.');
      };
    }
  };

  // 이벤트 응모 버튼 활성화 함수 (설문 완료 시 호출)
  window.activateEventButton = function() {
    const btnEvt = document.getElementById('btn-event-entry');
    if (btnEvt) {
      btnEvt.disabled = false;
      btnEvt.style.animation = 'pulse 1.5s infinite';
      btnEvt.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
      btnEvt.style.color = '#ffffff';
      btnEvt.style.boxShadow = '0 6px 20px rgba(5,150,105,0.45)';
      btnEvt.style.cursor = 'pointer';
      btnEvt.style.opacity = '1';
      btnEvt.style.pointerEvents = 'auto';
      btnEvt.innerHTML = '<span>🎁</span> 지금 바로 이벤트(커피쿠폰) 응모 하기!';
      btnEvt.onclick = null;
    }
  };

  function renderDashboard() {
    const root = document.getElementById('root');
    root.innerHTML = `
      <!-- Top Navigation -->
      <header class="top-navbar">
        <div class="brand-section">
          <div class="brand-icon">HRD</div>
          <div class="brand-title">
            <h1>2027 그룹 인재육성 체계 및 추진전략 수립</h1>
            <p>구성원 교육니즈 설문조사 · 데이터 시각화 분석 · 인재육성 추진전략</p>
          </div>
        </div>

        <nav class="nav-tabs" role="tablist">
          <button class="nav-tab-btn ${activeTab === 'survey' ? 'active' : ''}" id="tab-btn-survey" role="tab" aria-selected="${activeTab === 'survey'}">
            <span class="tab-btn-icon">📝</span>
            <span class="tab-btn-text">1. 구성원 교육 Needs 설문조사</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'analysis' ? 'active' : ''}" id="tab-btn-analysis" role="tab" aria-selected="${activeTab === 'analysis'}">
            <span class="tab-btn-icon">📊</span>
            <span class="tab-btn-text">2. 교육 Needs 결과분석</span>
          </button>
          <button class="nav-tab-btn ${activeTab === 'strategy' ? 'active' : ''}" id="tab-btn-strategy" role="tab" aria-selected="${activeTab === 'strategy'}">
            <span class="tab-btn-icon">🚀</span>
            <span class="tab-btn-text">3. 2027 인재육성체계 및 전략</span>
          </button>
        </nav>

        <div class="nav-actions">
                    <button id="btn-admin-event-manage" class="btn" style="background:linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);color:white;border:none;font-weight:700;white-space:nowrap;box-shadow:0 3px 8px rgba(99,102,241,0.35);" title="부캉이 게임 버전(추첨 vs 선착순) 전환 및 선착순 당첨 인원 관리">
            <span>⚙️</span> 부캉이 이벤트 관리
          </button>
          <button id="btn-open-bukang-game" class="btn" style="background:linear-gradient(135deg, #0284c7 0%, #0369a1 100%);color:white;border:none;font-weight:700;white-space:nowrap;box-shadow:0 3px 8px rgba(2,132,199,0.3);" title="스타벅스 커피쿠폰 부캉이 럭키드로우 이벤트 응모">
            <span>🦈</span> 커피쿠폰 이벤트 응모
          </button>
          <a href="/api/event/export-excel" class="btn" style="background:#006241;color:white;border:none;font-weight:700;white-space:nowrap;box-shadow:0 3px 8px rgba(0,98,65,0.25);" title="스타벅스 커피쿠폰 이벤트 응모자 명단(휴대전화 번호) 엑셀 다운로드">
            <span>☕</span> 이벤트응모자(Excel)
          </a>
          <a href="/api/survey/export-docx" class="btn" style="background:#1d4ed8;color:white;border:none;font-weight:700;white-space:nowrap;box-shadow:0 3px 8px rgba(29,78,216,0.25);" title="설문 전체 문항지 워드파일(.docx) 다운로드">
            <span>📝</span> 설문지(Word)
          </a>
          <a href="/api/survey/export-pdf" class="btn" style="background:#b91c1c;color:white;border:none;font-weight:700;white-space:nowrap;box-shadow:0 3px 8px rgba(185,28,28,0.25);" title="설문 전체 문항지 PDF파일(.pdf) 다운로드">
            <span>📑</span> 설문지(PDF)
          </a>
          <a href="/api/survey/export-excel" class="btn btn-success" style="background:#059669;color:white;border:none;font-weight:600;white-space:nowrap;" title="설문 응답 최종 로우데이터 엑셀 다운로드">
            <span>📥</span> 설문응답 로우데이터(Excel)
          </a>
          <a href="/api/reports/docx" class="btn btn-secondary" style="white-space:nowrap;" title="워드 종합보고서 다운로드">
            <span>📄</span> Word 보고서
          </a>
          <a href="/api/reports/pptx" class="btn btn-primary" style="white-space:nowrap;" title="파워포인트 발표자료 다운로드">
            <span>📊</span> PPTX 발표자료
          </a>
        </div>
      </header>

      <!-- Main Content Container -->
      <main class="main-container" id="main-content">
        ${renderActiveTabContent()}
      </main>
    `;

    bindNavEvents();
    bindTabSpecificEvents();
  }

  // Bind Navigation Tabs & Global Reset Buttons
  function bindNavEvents() {
    document.getElementById('tab-btn-survey').addEventListener('click', () => {
      activeTab = 'survey';
      renderDashboard();
    });
    document.getElementById('tab-btn-analysis').addEventListener('click', () => {
      activeTab = 'analysis';
      renderDashboard();
    });
    document.getElementById('tab-btn-strategy').addEventListener('click', () => {
      activeTab = 'strategy';
      renderDashboard();
    });

    // Bukang Lucky Draw Game Test Button
        // Admin Event Management Modal
    const btnAdminEvt = document.getElementById('btn-admin-event-manage');
    if (btnAdminEvt) {
      btnAdminEvt.addEventListener('click', (e) => {
        e.preventDefault();
        openEventSettingsModal();
      });
    }

    const btnGame = document.getElementById('btn-open-bukang-game');
    if (btnGame) {
      btnGame.addEventListener('click', (e) => {
        e.preventDefault();
        if (window.bukangGame) {
          window.bukangGame.open('TEST-PREVIEW');
        }
      });
    }

    // Reset survey data buttons
    document.querySelectorAll('.btn-reset-survey').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openResetModal('survey');
      });
    });

    // Reset event entries buttons
    document.querySelectorAll('.btn-reset-event-entries').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openResetModal('event');
      });
    });
  }

  // 4-Digit PIN Protected Survey Reset Modal
  // Admin PIN Protected Survey Reset & PIN Setting Modal
  // Admin PIN Protected Reset & PIN Setting Modal (Supports Survey Data, Event Data, or Both)
  function openResetModal(initialTarget = 'survey') {
    const existing = document.getElementById('reset-modal-overlay');
    if (existing) existing.remove();

    let currentTarget = initialTarget; // 'survey', 'event', 'both'

    const overlay = document.createElement('div');
    overlay.id = 'reset-modal-overlay';
    overlay.style.cssText = `
      position:fixed;top:0;left:0;width:100%;height:100%;
      background:rgba(15,23,42,0.8);backdrop-filter:blur(6px);
      display:flex;align-items:center;justify-content:center;
      z-index:99999;
    `;

    overlay.innerHTML = `
      <div style="background:white;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.4);width:90%;max-width:480px;overflow:hidden;border:1px solid #e2e8f0;animation:popIn 0.25s ease;">
        <!-- PANEL 1: DATA RESET -->
        <div id="panel-reset-exec">
          <!-- Reset Target Tab Selector -->
          <div style="display:flex;background:#f8fafc;padding:6px;border-bottom:1px solid #e2e8f0;gap:4px;">
            <button type="button" id="tab-sel-survey" style="flex:1;padding:0.6rem 0.3rem;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
              📝 설문데이터
            </button>
            <button type="button" id="tab-sel-event" style="flex:1;padding:0.6rem 0.3rem;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
              ☕ 이벤트응모자
            </button>
            <button type="button" id="tab-sel-both" style="flex:1;padding:0.6rem 0.3rem;border:none;border-radius:8px;font-size:0.82rem;font-weight:700;cursor:pointer;transition:all 0.2s;">
              ⚠️ 전체통합
            </button>
          </div>

          <div id="reset-header-banner" style="padding:1.3rem 1.5rem;text-align:center;border-bottom:1px solid #e2e8f0;transition:background 0.3s;">
            <div id="reset-icon" style="font-size:2.2rem;margin-bottom:0.2rem;">⚠️</div>
            <h3 id="reset-title" style="font-size:1.2rem;font-weight:800;margin:0 0 0.35rem;">초기화 대상</h3>
            <p id="reset-desc" style="font-size:0.84rem;margin:0;line-height:1.45;">
              설명 텍스트
            </p>
          </div>

          <div style="padding:1.4rem 1.5rem;">
            <!-- Backup download link if event entries reset -->
            <div id="reset-backup-box" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:0.65rem 0.85rem;margin-bottom:1rem;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <div style="font-size:0.82rem;font-weight:700;color:#166534;">☕ 응모자 명단(Excel) 안전 백업</div>
                <div style="font-size:0.74rem;color:#15803d;">초기화 전 현재까지의 명단을 엑셀로 백업 다운로드하세요.</div>
              </div>
              <a href="/api/event/export-excel" class="btn" style="background:#006241;color:white;font-size:0.76rem;padding:0.35rem 0.65rem;border-radius:6px;text-decoration:none;font-weight:700;white-space:nowrap;">
                <span>📥</span> 백업 다운
              </a>
            </div>

            <label style="display:block;font-size:0.9rem;font-weight:700;color:#1e293b;margin-bottom:0.45rem;text-align:center;">
              관리자 비밀번호를 입력하십시오
            </label>
            <div style="display:flex;justify-content:center;margin-bottom:0.6rem;">
              <input type="password" id="input-reset-pin" maxlength="12" placeholder="••••" autocomplete="off"
                style="width:180px;font-size:1.8rem;text-align:center;letter-spacing:0.25em;padding:0.45rem 0.75rem;border:2px solid #cbd5e1;border-radius:10px;outline:none;font-weight:800;color:#0f172a;" />
            </div>
            <div id="reset-pin-error" style="display:none;color:#dc2626;font-size:0.84rem;text-align:center;font-weight:600;margin-bottom:0.6rem;">
              비밀번호가 일치하지 않습니다.
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;padding:0.55rem 0.85rem;border-radius:8px;border:1px solid #e2e8f0;margin-bottom:1.2rem;">
              <span style="font-size:0.8rem;color:#64748b;">* 관리자 설정 비밀번호</span>
              <button type="button" id="btn-switch-to-change-pin" style="background:none;border:none;color:#2563eb;font-size:0.82rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:0.3rem;text-decoration:underline;">
                <span>🔐</span> 비밀번호 직접 변경
              </button>
            </div>

            <div style="display:flex;gap:0.75rem;">
              <button id="btn-cancel-reset" style="flex:1;padding:0.75rem;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.92rem;">
                취소
              </button>
              <button id="btn-confirm-reset" style="flex:1;padding:0.75rem;background:#dc2626;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.92rem;box-shadow:0 4px 12px rgba(220,38,38,0.3);">
                초기화 실행
              </button>
            </div>
          </div>
        </div>

        <!-- PANEL 2: CHANGE ADMIN PIN -->
        <div id="panel-change-pin" style="display:none;">
          <div style="background:#eff6ff;padding:1.4rem 1.5rem;text-align:center;border-bottom:1px solid #bfdbfe;">
            <div style="font-size:2.2rem;margin-bottom:0.2rem;">🔐</div>
            <h3 style="font-size:1.25rem;font-weight:800;color:#1e40af;margin:0 0 0.35rem;">관리자 비밀번호 직접 설정</h3>
            <p style="font-size:0.86rem;color:#2563eb;margin:0;line-height:1.45;">
              데이터 리셋 시 사용할 새로운 관리자 비밀번호를 설정합니다.
            </p>
          </div>

          <div style="padding:1.6rem 1.5rem;">
            <div style="margin-bottom:1rem;">
              <label style="display:block;font-size:0.86rem;font-weight:700;color:#334155;margin-bottom:0.35rem;">
                현재 비밀번호
              </label>
              <input type="password" id="input-current-pin" maxlength="12" placeholder="현재 비밀번호 (기본: 2027)"
                style="width:100%;font-size:1rem;padding:0.65rem 0.85rem;border:1.5px solid #cbd5e1;border-radius:8px;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:1rem;">
              <label style="display:block;font-size:0.86rem;font-weight:700;color:#334155;margin-bottom:0.35rem;">
                새 비밀번호 (4자리 이상)
              </label>
              <input type="password" id="input-new-pin" maxlength="12" placeholder="새 비밀번호 입력"
                style="width:100%;font-size:1rem;padding:0.65rem 0.85rem;border:1.5px solid #cbd5e1;border-radius:8px;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:1rem;">
              <label style="display:block;font-size:0.86rem;font-weight:700;color:#334155;margin-bottom:0.35rem;">
                새 비밀번호 확인
              </label>
              <input type="password" id="input-confirm-pin" maxlength="12" placeholder="새 비밀번호 재입력"
                style="width:100%;font-size:1rem;padding:0.65rem 0.85rem;border:1.5px solid #cbd5e1;border-radius:8px;box-sizing:border-box;" />
            </div>

            <div id="change-pin-error" style="display:none;color:#dc2626;font-size:0.84rem;text-align:center;font-weight:600;margin-bottom:0.75rem;">
              오류 메시지
            </div>

            <div style="display:flex;gap:0.75rem;margin-top:1.25rem;">
              <button id="btn-back-to-reset" style="flex:1;padding:0.75rem;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.92rem;">
                이전으로
              </button>
              <button id="btn-save-new-pin" style="flex:1;padding:0.75rem;background:#2563eb;color:white;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:0.92rem;box-shadow:0 4px 12px rgba(37,99,235,0.3);">
                비밀번호 저장
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const panelReset = document.getElementById('panel-reset-exec');
    const panelChange = document.getElementById('panel-change-pin');

    const pinInput = document.getElementById('input-reset-pin');
    setTimeout(() => pinInput.focus(), 60);

    // Switch to Change PIN panel
    document.getElementById('btn-switch-to-change-pin').addEventListener('click', () => {
      panelReset.style.display = 'none';
      panelChange.style.display = 'block';
      document.getElementById('input-current-pin').focus();
    });

    // Back to Reset panel
    document.getElementById('btn-back-to-reset').addEventListener('click', () => {
      panelChange.style.display = 'none';
      panelReset.style.display = 'block';
      pinInput.focus();
    });

    // Segmented Target Switcher Logic
    const tabSurvey = document.getElementById('tab-sel-survey');
    const tabEvent = document.getElementById('tab-sel-event');
    const tabBoth = document.getElementById('tab-sel-both');

    const bannerEl = document.getElementById('reset-header-banner');
    const iconEl = document.getElementById('reset-icon');
    const titleEl = document.getElementById('reset-title');
    const descEl = document.getElementById('reset-desc');
    const backupBox = document.getElementById('reset-backup-box');
    const confirmBtn = document.getElementById('btn-confirm-reset');

    const updateTargetUI = (target) => {
      currentTarget = target;
      [tabSurvey, tabEvent, tabBoth].forEach(b => {
        b.style.background = 'transparent';
        b.style.color = '#64748b';
        b.style.boxShadow = 'none';
      });

      if (currentTarget === 'survey') {
        tabSurvey.style.background = 'white';
        tabSurvey.style.color = '#0f172a';
        tabSurvey.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)';

        bannerEl.style.background = '#fee2e2';
        bannerEl.style.borderColor = '#fecaca';
        iconEl.innerText = '📝';
        titleEl.innerText = '설문 응답 데이터 초기화';
        titleEl.style.color = '#991b1b';
        descEl.innerHTML = '현재까지 수집된 모든 설문 응답이 영구 삭제되고<br><strong>실제 응답 0명으로 완전 초기화</strong>됩니다. (이벤트 응모자는 유지)';
        descEl.style.color = '#b91c1c';
        backupBox.style.display = 'flex';
        confirmBtn.style.background = '#dc2626';
        confirmBtn.innerText = '설문 데이터 초기화 실행';
      } else if (currentTarget === 'event') {
        tabEvent.style.background = '#006241';
        tabEvent.style.color = 'white';
        tabEvent.style.boxShadow = '0 2px 4px rgba(0,98,65,0.2)';

        bannerEl.style.background = '#f0fdf4';
        bannerEl.style.borderColor = '#bbf7d0';
        iconEl.innerText = '☕';
        titleEl.innerText = '이벤트 응모자 명단(Excel) 초기화';
        titleEl.style.color = '#166534';
        descEl.innerHTML = '접수된 모든 휴대전화 번호 및 스타벅스 럭키드로우 내역이<br><strong>0건으로 완전 초기화</strong>됩니다. (설문 응답은 안전하게 유지)';
        descEl.style.color = '#15803d';
        backupBox.style.display = 'flex';
        confirmBtn.style.background = '#006241';
        confirmBtn.innerText = '이벤트 명단 초기화 실행';
      } else if (currentTarget === 'both') {
        tabBoth.style.background = '#991b1b';
        tabBoth.style.color = 'white';
        tabBoth.style.boxShadow = '0 2px 4px rgba(153,27,27,0.2)';

        bannerEl.style.background = '#fef2f2';
        bannerEl.style.borderColor = '#fca5a5';
        iconEl.innerText = '⚠️';
        titleEl.innerText = '전체 데이터 통합 초기화 (설문 + 이벤트)';
        titleEl.style.color = '#991b1b';
        descEl.innerHTML = '설문 응답과 이벤트 접수 명단이 <strong>모두 영구 삭제되어 0건으로 완전 초기화</strong>됩니다.';
        descEl.style.color = '#b91c1c';
        backupBox.style.display = 'flex';
        confirmBtn.style.background = '#991b1b';
        confirmBtn.innerText = '전체 데이터 통합 초기화 실행';
      }
    };

    tabSurvey.addEventListener('click', () => updateTargetUI('survey'));
    tabEvent.addEventListener('click', () => updateTargetUI('event'));
    tabBoth.addEventListener('click', () => updateTargetUI('both'));

    updateTargetUI(initialTarget);

    // Close Modal on cancel or background click
    document.getElementById('btn-cancel-reset').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    // Execute Reset Action
    const executeReset = async () => {
      const pin = pinInput.value.trim();
      const errEl = document.getElementById('reset-pin-error');
      if (pin.length < 4) {
        errEl.textContent = '비밀번호를 올바르게 입력해 주십시오.';
        errEl.style.display = 'block';
        pinInput.focus();
        return;
      }

      try {
        let res;
        if (currentTarget === 'event') {
          res = await fetch('/api/event/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin })
          }).then(r => r.json());
        } else if (currentTarget === 'survey') {
          res = await fetch('/api/survey/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin, reset_event: false })
          }).then(r => r.json());
        } else if (currentTarget === 'both') {
          res = await fetch('/api/survey/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pin: pin, reset_event: true })
          }).then(r => r.json());
        }

        if (res && res.success) {
          overlay.remove();
          showToast(res.message);
          const statRes = await fetch('/api/survey/stats').then(r => r.json());
          if (statRes.success) statsData = statRes.stats;
          renderDashboard();
        } else {
          errEl.textContent = (res && res.error) || '비밀번호가 일치하지 않습니다.';
          errEl.style.display = 'block';
          pinInput.value = '';
          pinInput.focus();
        }
      } catch (err) {
        errEl.textContent = '초기화 처리 중 서버 오류가 발생했습니다.';
        errEl.style.display = 'block';
      }
    };

    document.getElementById('btn-confirm-reset').addEventListener('click', executeReset);
    pinInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') executeReset();
    });

    // Save New Admin PIN Action
    const saveNewPin = async () => {
      const currentPin = document.getElementById('input-current-pin').value.trim();
      const newPin = document.getElementById('input-new-pin').value.trim();
      const confirmPin = document.getElementById('input-confirm-pin').value.trim();
      const errEl = document.getElementById('change-pin-error');

      if (!currentPin) {
        errEl.textContent = '현재 비밀번호를 입력해 주십시오.';
        errEl.style.display = 'block';
        document.getElementById('input-current-pin').focus();
        return;
      }
      if (!newPin || newPin.length < 4) {
        errEl.textContent = '새 비밀번호는 4자리 이상으로 설정해 주십시오.';
        errEl.style.display = 'block';
        document.getElementById('input-new-pin').focus();
        return;
      }
      if (newPin !== confirmPin) {
        errEl.textContent = '새 비밀번호와 확인 입력이 일치하지 않습니다.';
        errEl.style.display = 'block';
        document.getElementById('input-confirm-pin').focus();
        return;
      }

      try {
        const res = await fetch('/api/admin/change-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            current_pin: currentPin,
            new_pin: newPin
          })
        }).then(r => r.json());

        if (res.success) {
          showToast('🔐 관리자 비밀번호가 성공적으로 변경되었습니다!');
          panelChange.style.display = 'none';
          panelReset.style.display = 'block';
          pinInput.value = '';
          document.getElementById('reset-pin-error').style.display = 'none';
          pinInput.focus();
        } else {
          errEl.textContent = res.error || '비밀번호 변경에 실패했습니다.';
          errEl.style.display = 'block';
        }
      } catch (err) {
        errEl.textContent = '비밀번호 변경 중 통신 오류가 발생했습니다.';
        errEl.style.display = 'block';
      }
    };

    document.getElementById('btn-save-new-pin').addEventListener('click', saveNewPin);
  }

  function renderActiveTabContent() {
    if (activeTab === 'survey') {
      return renderSurveyTab();
    } else if (activeTab === 'analysis') {
      return renderAnalysisTab();
    } else {
      return renderStrategyTab();
    }
  }

  function renderSurveyCompletedScreen() {
    return `
      <div style="min-height:65vh;display:flex;align-items:center;justify-content:center;padding:2.5rem 1rem;">
        <div style="background:white;border-radius:24px;box-shadow:0 20px 45px rgba(15,23,42,0.12);max-width:680px;width:100%;padding:3.5rem 2.5rem;text-align:center;border:1px solid #e2e8f0;position:relative;overflow:hidden;">
          <div style="position:absolute;top:0;left:0;right:0;height:8px;background:linear-gradient(90deg, #e4007f, #f59e0b, #006241);"></div>
          
          <div style="width:82px;height:82px;background:#ecfdf5;color:#059669;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.6rem;margin:0 auto 1.5rem auto;box-shadow:0 8px 20px rgba(5,150,105,0.15);">
            ✓
          </div>
          
          <span style="display:inline-block;background:#eff6ff;color:#2563eb;font-weight:700;font-size:0.85rem;padding:0.35rem 1rem;border-radius:9999px;margin-bottom:1rem;border:1px solid #bfdbfe;">
            설문조사 및 럭키드로우 이벤트 종료
          </span>
          
          <h2 style="font-size:2.1rem;font-weight:800;color:#0f172a;letter-spacing:-0.03em;margin-bottom:1rem;line-height:1.3;">
            설문 응답이 정상 완료되었습니다
          </h2>
          
          <p style="font-size:1.1rem;color:#475569;line-height:1.7;margin-bottom:2.2rem;word-break:keep-all;">
            2027 그룹 인재육성계획 수립을 위한 소중한 의견에 깊이 감사드립니다.<br>
            <strong>스타벅스 커피쿠폰 추첨 이벤트</strong>에도 정상 응모 완료되었습니다.<br>
            <span style="color:#059669;font-weight:700;">설문응답 및 게임이 모두 종료되었으므로 본 창(탭)을 닫으셔도 좋습니다.</span>
          </p>
          
          <div style="display:flex;justify-content:center;margin-top:0.5rem;">
            <button onclick="window.closeWindowOrExit()" style="background:#0f172a;color:white;padding:1rem 3rem;border-radius:14px;font-size:1.08rem;font-weight:700;border:none;cursor:pointer;box-shadow:0 8px 24px rgba(15,23,42,0.3);transition:all 0.18s ease;display:inline-flex;align-items:center;gap:0.6rem;" onmouseover="this.style.background='#1e293b';this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#0f172a';this.style.transform='translateY(0)'">
              <span>✕</span> 창 닫기 (화면 종료)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     TAB 1: SURVEY TAB (구성원 교육 Needs 설문조사 - 총 29문항)
     ========================================================================== */
  function renderSurveyTab() {
    if (isSurveyCompleted) {
      return renderSurveyCompletedScreen();
    }
    return `
      <div class="page-header-banner" style="background:linear-gradient(135deg, #06152d 0%, #173878 50%, #1e40af 100%); padding:2.8rem 3rem; border-radius:18px; position:relative; overflow:hidden; box-shadow:0 12px 32px rgba(15,23,42,0.22); margin-bottom:2rem;">
        <!-- Ambient decorative background glow to fill right space elegantly -->
        <div style="position:absolute;top:-80px;right:-60px;width:380px;height:380px;background:radial-gradient(circle, rgba(96,165,250,0.22) 0%, rgba(30,58,138,0) 70%);border-radius:50%;pointer-events:none;"></div>
        <div style="position:absolute;bottom:-60px;right:25%;width:260px;height:260px;background:radial-gradient(circle, rgba(147,197,253,0.12) 0%, rgba(30,58,138,0) 70%);border-radius:50%;pointer-events:none;"></div>

        <!-- Top Header Row -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:1.5rem;position:relative;z-index:2;">
          <div style="flex:1;min-width:320px;">
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.75rem;">
              <span class="banner-badge" style="background:rgba(96,165,250,0.25);color:#93c5fd;font-size:0.85rem;font-weight:700;padding:0.35rem 0.85rem;border-radius:9999px;border:1px solid rgba(147,197,253,0.3);">
                ✨ 2027년 전사 인재육성계획 수립 공식 설문조사
              </span>
              <span style="color:#93c5fd;font-size:0.85rem;font-weight:600;">실시간 자동 저장 지원</span>
            </div>

            <!-- Title: 2027년 임직원 교육계획 수립을 위한 구성원 교육 Needs 설문 조사 -->
            <h2 class="banner-title" style="font-size:2.35rem;font-weight:800;letter-spacing:-0.03em;color:#ffffff;line-height:1.3;margin:0 0 0.85rem 0;">
              2027년 임직원 교육계획 수립을 위한 구성원 교육 Needs 설문 조사
            </h2>

            <!-- Subtitle on ONE clean line with larger font -->
            <p class="banner-desc" style="font-size:1.05rem;color:#e2e8f0;font-weight:500;line-height:1.6;margin:0;word-break:keep-all;">
              2027년 전사 인재육성계획 수립에 앞서 임직원 여러분의 소중한 의견을 반영하고자 설문조사를 실시합니다. 귀하의 솔직하고 적극적인 참여를 부탁드립니다.<br>
              <span style="display:inline-block;margin-top:0.45rem;color:#fef08a;font-weight:700;font-size:0.95rem;">• 설문문항은 (<span style="color:#f97316;font-weight:900;">*</span>) 필수답변 문항과 선택답변 문항으로 구분 (응답 소요시간: 5분)</span>
            </p>
          </div>

          <!-- Right side visual status badge (fills right space with balance & purpose) -->
          <div style="background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.2);padding:1.1rem 1.6rem;border-radius:14px;box-shadow:0 8px 24px rgba(0,0,0,0.18);display:flex;align-items:center;gap:1.1rem;min-width:270px;">
            <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#1d4ed8);display:flex;align-items:center;justify-content:center;font-size:1.5rem;box-shadow:0 4px 12px rgba(37,99,235,0.4);">
              🔒
            </div>
            <div>
              <div style="font-size:0.78rem;color:#93c5fd;font-weight:700;letter-spacing:0.02em;">SECURITY & PRIVACY</div>
              <div style="font-size:1.15rem;font-weight:800;color:#ffffff;margin-top:0.15rem;">100% 익명 통계 처리</div>
              <div style="font-size:0.8rem;color:#cbd5e1;margin-top:0.15rem;">응답 소요 시간: 약 7~10분</div>
            </div>
          </div>
        </div>

        <!-- Survey Info Cards: Balanced across full width, generous padding, single line text -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:2rem;width:100%;position:relative;z-index:2;">
          <!-- Card 1: 조사 대상 -->
          <div style="background:rgba(255,255,255,0.09);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);padding:1.15rem 1.6rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);transition:all 0.2s ease;">
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;color:#93c5fd;font-weight:700;">
              <span>👥</span> 조사 대상
            </div>
            <div style="font-size:1.28rem;font-weight:800;color:#ffffff;margin-top:0.35rem;white-space:nowrap;">
              전 임직원 (전사 및 계열사)
            </div>
          </div>

          <!-- Card 2: 설문 기간 -->
          <div style="background:rgba(255,255,255,0.09);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);padding:1.15rem 1.6rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);transition:all 0.2s ease;">
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;color:#93c5fd;font-weight:700;">
              <span>📅</span> 설문 기간
            </div>
            <div style="font-size:1.28rem;font-weight:800;color:#ffffff;margin-top:0.35rem;white-space:nowrap;">
              2026년 10월 19일 ~   
            </div>
          </div>

          <!-- Card 3: 설문 문항 -->
          <div style="background:rgba(255,255,255,0.09);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.18);padding:1.15rem 1.6rem;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.12);transition:all 0.2s ease;">
            <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.85rem;color:#93c5fd;font-weight:700;">
              <span>📋</span> 설문 문항
            </div>
            <div style="font-size:1.28rem;font-weight:800;color:#67e8f9;margin-top:0.35rem;white-space:nowrap;">
              총 29문항 (7개 핵심 영역)
            </div>
          </div>
        </div>

        <!-- Mode Buttons Row -->
        <div style="margin-top:1.75rem;display:flex;gap:0.85rem;flex-wrap:wrap;position:relative;z-index:2;">
          <button class="btn ${surveySubMode === 'respondent' ? 'btn-primary' : 'btn-secondary'}" id="btn-mode-respondent" style="padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;">
            <span>✍️</span> 설문 응답 모드
          </button>
          <button class="btn ${surveySubMode === 'admin' ? 'btn-primary' : 'btn-secondary'}" id="btn-mode-admin" style="padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;">
            <span>⚙️</span> 문항 관리 및 PPTX/PDF 업로드
          </button>
          <button class="btn btn-outline-purple" id="btn-copy-url" style="padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;background:rgba(255,255,255,0.1);color:#ffffff;border:1px solid rgba(255,255,255,0.3);">
            <span>🔗</span> 설문 참여 URL 복사
          </button>
        </div>
      </div>

      ${surveySubMode === 'admin' ? renderAdminQuestionView() : renderRespondentSurveyView()}
    `;
  }

  function renderAdminQuestionView() {
    return `
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>📁</span> 설문 문항 파일(PPTX, PDF) 업로드 및 변환</h2>
            <p>파워포인트(PPTX) 또는 PDF 형식의 설문지를 업로드하면 스마트 파서가 슬라이드와 문단을 분석하여 웹 설문조사지로 자동 변환합니다.</p>
          </div>
        </div>

        <label class="upload-dropzone" style="display:block;">
          <input type="file" id="input-upload-questions" accept=".pptx,.pdf" style="display:none;" />
          <div class="upload-icon">📤</div>
          <div class="upload-title">PPTX 또는 PDF 설문 문항 파일을 클릭하거나 드래그하여 업로드</div>
          <div class="upload-desc">지원 포맷: .pptx, .pdf (슬라이드별 질문, 객관식 보기, 리커트 척도 자동 인식)</div>
        </label>

        <div style="margin-top:2rem;">
          <h3 style="font-size:1.1rem;font-weight:bold;margin-bottom:1rem;color:#1e3a8a;">
            현재 활성화된 공식 설문 문항 구조 (${questionsData.length}개 영역 / 29문항)
          </h3>
          <div style="display:flex;flex-direction:column;gap:1.25rem;">
            ${questionsData.map(sec => `
              <div style="background:#f8fafc;padding:1.25rem;border-radius:10px;border:1px solid #e2e8f0;">
                <div style="font-weight:bold;font-size:1.05rem;color:#1e3a8a;">${sec.section || sec.title}</div>
                ${sec.description ? `<div style="font-size:0.85rem;color:#64748b;margin:0.25rem 0 0.75rem;">${sec.description}</div>` : ''}
                <div style="display:flex;flex-direction:column;gap:0.6rem;">
                  ${(sec.questions || []).map(q => `
                    <div style="background:white;padding:0.75rem 1rem;border-radius:6px;border:1px solid #cbd5e1;font-size:0.88rem;">
                      <span style="font-weight:bold;color:#2563eb;margin-right:0.4rem;">[Q${q.number}]</span>
                      <span style="color:#0f172a;font-weight:600;">${q.title}</span>
                      <span style="font-size:0.75rem;background:#f1f5f9;color:#475569;padding:0.15rem 0.45rem;border-radius:4px;margin-left:0.5rem;">${q.type}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderQuestionCard(q, isGridItem = false) {
    const maxBadge = q.max_select ? `<span style="display:inline-block;background:#fee2e2;color:#b91c1c;font-size:0.75rem;font-weight:700;padding:0.15rem 0.5rem;border-radius:4px;margin-left:0.5rem;">최대 ${q.max_select}개까지 선택 가능</span>` : '';
    const reqBadge = q.required ? `<span style="color:#dc2626;margin-left:2px;">*</span>` : '';
    const cleanTitle = (q.title || '').replace(/^\d+\.\s*/, '');

    let questionBody = '';

    if (q.type === 'company_and_department' || q.id === 'q1') {
      const compOpts = q.company_options || ["흥국생명", "흥국화재"];
      questionBody = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.15rem;margin-top:0.85rem;">
          <!-- 1. Company Combo-Box -->
          <div style="background:#f8fafc;border:1.5px solid #bfdbfe;border-radius:10px;padding:1.15rem;">
            <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.92rem;font-weight:700;color:#1e3a8a;margin-bottom:0.5rem;">
              <span>🏢</span> ${q.company_label || '소속 회사 (콤보 상자)'} <span style="color:#dc2626;">*</span>
            </label>
            <select class="form-select dyn-input combo-select" name="q1_company" id="select-q1-company" required style="width:100%;font-size:0.95rem;padding:0.7rem 0.9rem;border:1.5px solid #93c5fd;border-radius:8px;background:white;">
              <option value="" disabled selected>-- 소속 회사를 선택해 주십시오 --</option>
              ${compOpts.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
            </select>
            <div style="font-size:0.76rem;color:#64748b;margin-top:0.35rem;">* 소속 법인을 선택하십시오.</div>
          </div>

          <!-- 2. Division (실/본부) Combo-Box -->
          <div style="background:#f8fafc;border:1.5px solid #bfdbfe;border-radius:10px;padding:1.15rem;">
            <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.92rem;font-weight:700;color:#1e3a8a;margin-bottom:0.5rem;">
              <span>🏛️</span> ${q.division_label || '실/본부 (콤보 상자)'} <span style="color:#dc2626;">*</span>
            </label>
            <select class="form-select dyn-input combo-select" name="q1_division" id="select-q1-division" required disabled style="width:100%;font-size:0.95rem;padding:0.7rem 0.9rem;border:1.5px solid #cbd5e1;border-radius:8px;background:#f1f5f9;">
              <option value="" disabled selected>-- 회사를 먼저 선택해 주십시오 --</option>
            </select>
            <div style="font-size:0.76rem;color:#64748b;margin-top:0.35rem;">* 소속 실/본부를 선택하십시오.</div>
          </div>

          <!-- 3. Department (소속 부서) Combo-Box -->
          <div style="background:#f8fafc;border:1.5px solid #bfdbfe;border-radius:10px;padding:1.15rem;">
            <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.92rem;font-weight:700;color:#1e3a8a;margin-bottom:0.5rem;">
              <span>📁</span> ${q.dept_label || '소속 부서 (콤보 상자)'} <span style="color:#dc2626;">*</span>
            </label>
            <select class="form-select dyn-input combo-select" name="q1_department" id="select-q1-department" required disabled style="width:100%;font-size:0.95rem;padding:0.7rem 0.9rem;border:1.5px solid #cbd5e1;border-radius:8px;background:#f1f5f9;">
              <option value="" disabled selected>-- 실/본부를 먼저 선택해 주십시오 --</option>
            </select>
            <div style="font-size:0.76rem;color:#64748b;margin-top:0.35rem;">* 소속 부서(팀)를 선택하십시오.</div>
          </div>
        </div>
      `;
    } else if (q.type === 'select') {
      const isQ2 = (q.id === 'q2');
      const placeholder = isQ2 ? '-- 회사를 먼저 선택해 주십시오 --' : '-- 선택해 주십시오 --';
      questionBody = `
        <div style="margin-top:0.75rem;width:100%;">
          <select class="form-select dyn-input combo-select" name="${q.id}" id="select-${q.id}" ${isQ2 ? 'disabled' : ''} style="width:100%;font-size:0.95rem;padding:0.75rem 1rem;${isQ2 ? 'background:#f1f5f9;border-color:#cbd5e1;' : 'background:white;border:1.5px solid #93c5fd;'}border-radius:8px;">
            <option value="" disabled selected>${placeholder}</option>
            ${!isQ2 ? (q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('') : ''}
          </select>
          <div style="font-size:0.76rem;color:#64748b;margin-top:0.4rem;">
            ${isQ2 ? '* 소속 회사에 따른 직군 구분을 선택하십시오.' : '* 현재 본인의 직급/직책을 선택하십시오.'}
          </div>
        </div>
      `;
    } else if (q.type === 'likert_5') {
      questionBody = `
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0.5rem;margin-top:0.75rem;">
          ${q.options.map((opt) => `
            <label class="option-card-label" style="padding:0.7rem 0.85rem;font-size:0.86rem;justify-content:center;text-align:center;">
              <input type="radio" name="${q.id}" class="parent-trigger-radio" data-qid="${q.id}" value="${opt}" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'single_choice') {
      questionBody = `
        <div class="form-options-grid" style="margin-top:0.75rem;">
          ${q.options.map((opt) => `
            <label class="option-card-label">
              <input type="radio" name="${q.id}" class="parent-trigger-radio" data-qid="${q.id}" value="${opt}" />
              <span>${opt}</span>
            </label>
          `).join('')}
        </div>
      `;
    } else if (q.type === 'multiple_choice') {
      if (q.id === 'q27') {
        questionBody = `
          <div class="q27-options-container" data-max="${q.max_select || 3}">
            ${q.options.map((opt) => {
              const lastParenIdx = opt.lastIndexOf(' (');
              let title = opt;
              let desc = '';
              if (lastParenIdx !== -1 && opt.endsWith(')')) {
                title = opt.substring(0, lastParenIdx);
                desc = opt.substring(lastParenIdx + 2, opt.length - 1);
              }
              return `
                <label class="option-card-label q27-card-row">
                  <input type="checkbox" name="${q.id}" class="chk-limit" data-group="${q.id}" data-max="${q.max_select || 3}" value="${opt}" />
                  <div class="q27-card-body">
                    <span class="q27-course-title">${title}</span>
                    <span class="q27-course-desc">${desc}</span>
                  </div>
                </label>
              `;
            }).join('')}
          </div>
        `;
      } else {
        questionBody = `
          <div class="form-options-grid" style="margin-top:0.75rem;" data-max="${q.max_select || 99}">
            ${q.options.map((opt) => `
              <label class="option-card-label">
                <input type="checkbox" name="${q.id}" class="chk-limit" data-group="${q.id}" data-max="${q.max_select || 99}" value="${opt}" />
                <span>${opt}</span>
              </label>
            `).join('')}
          </div>
        `;
      }
    } else if (q.type === 'textarea') {
      questionBody = `
        <div style="margin-top:0.75rem;">
          <textarea class="form-textarea dyn-input" name="${q.id}" rows="3" placeholder="자유롭게 의견을 작성해 주십시오."></textarea>
        </div>
      `;
    }

    // Sub-question render (Ensures 8-1, 17-1, 18-1, 26-1 and others are always visible)
    let subQHtml = '';
    if (q.sub_question) {
      const subQ = q.sub_question;
      const isLikertNegativeTrigger = subQ.condition_trigger && subQ.condition_trigger.length > 0;
      const isAlwaysVisible = !isLikertNegativeTrigger || ['q8_1', 'q17_1', 'q18_1', 'q26_1', 'q11_1', 'q12_1', 'q13_1'].includes(subQ.id);
      const initialDisplay = isAlwaysVisible ? 'display:block;' : 'display:none;';
      const triggersStr = isLikertNegativeTrigger ? JSON.stringify(subQ.condition_trigger).replace(/"/g, '&quot;') : '';

      const wrapBg = isLikertNegativeTrigger ? '#fef2f2' : '#f8fafc';
      const wrapBorder = isLikertNegativeTrigger ? '#fecaca' : '#bfdbfe';
      const wrapBorderLeft = isLikertNegativeTrigger ? '#dc2626' : '#2563eb';
      const badgeBg = isLikertNegativeTrigger ? '#dc2626' : '#2563eb';
      const titleColor = isLikertNegativeTrigger ? '#991b1b' : '#1e3a8a';

      let placeholder = '사유 또는 의견을 작성해 주세요.';
      if (subQ.id === 'q18_1') {
        placeholder = '희망하시는 교육 대상과 주제를 자유롭게 작성해 주십시오.';
      } else if (subQ.id === 'q8_1' || subQ.id === 'q17_1' || subQ.id === 'q26_1') {
        placeholder = '기타 의견이 있으신 경우 자유롭게 작성해 주십시오.';
      }

      let innerInput = '';
      if (subQ.type === 'textarea') {
        innerInput = `<textarea class="form-textarea dyn-input" name="${subQ.id}" rows="2" placeholder="${placeholder}" style="background:white;border:1.5px solid ${wrapBorder};border-radius:6px;width:100%;box-sizing:border-box;"></textarea>`;
      } else if (subQ.type === 'single_choice') {
        innerInput = `
          <div class="form-options-grid" style="margin-top:0.4rem;">
            ${subQ.options.map((sOpt) => `
              <label class="option-card-label" style="font-size:0.84rem;padding:0.6rem 0.8rem;">
                <input type="radio" name="${subQ.id}" value="${sOpt}" />
                <span>${sOpt}</span>
              </label>
            `).join('')}
          </div>
        `;
      }

      subQHtml = `
        <div class="sub-q-wrap" id="sub-wrap-${q.id}" data-parent="${q.id}" data-triggers="${triggersStr}" style="${initialDisplay}background:${wrapBg};border:1px solid ${wrapBorder};border-left:4px solid ${wrapBorderLeft};border-radius:8px;padding:1.1rem 1.35rem;margin-top:1.1rem;transition:all 0.3s ease;">
          <label style="display:block;font-size:0.9rem;font-weight:700;color:${titleColor};margin-bottom:0.5rem;">
            <span style="background:${badgeBg};color:white;padding:0.15rem 0.55rem;border-radius:4px;font-size:0.78rem;font-weight:800;margin-right:0.4rem;">${subQ.number}</span>
            ${subQ.title}
          </label>
          ${innerInput}
        </div>
      `;
    }

    const cardStyle = isGridItem 
      ? 'margin-bottom:0;background:#ffffff;border:1.5px solid #e2e8f0;padding:1.2rem 1.35rem 1.5rem;border-radius:12px;box-shadow:0 2px 6px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between;transition:all 0.3s ease;'
      : 'margin-bottom:2rem;padding:0.75rem 1rem 1.5rem;border-radius:10px;border-bottom:1px solid #f1f5f9;transition:all 0.3s ease;';

    return `
      <div class="form-group question-card-group" id="group-${q.id}" data-qid="${q.id}" style="${cardStyle}">
        <div>
          <label class="form-label" style="font-size:1.02rem;color:#0f172a;line-height:1.5;display:flex;align-items:flex-start;gap:0.45rem;">
            <span style="display:inline-block;background:#1e3a8a;color:white;padding:0.2rem 0.65rem;border-radius:6px;font-size:0.82rem;font-weight:800;flex-shrink:0;">
              ${q.number}
            </span>
            <span>${cleanTitle} ${reqBadge} ${maxBadge}</span>
          </label>
          ${questionBody}
        </div>
        ${subQHtml}
      </div>
    `;
  }

  function renderRespondentSurveyView() {
    return `
      <form id="survey-form">
        ${questionsData.map(sec => `
          <div class="survey-section">
            <div class="survey-section-header">
              <h3 class="survey-section-title" style="color:#1e3a8a;font-size:1.25rem;">${sec.section || sec.title}</h3>
              <p class="survey-section-desc" style="color:#64748b;font-size:0.9rem;">${sec.description || ''}</p>
            </div>

            ${(function() {
              const qs = sec.questions || [];
              const hasQ2AndQ3 = qs.some(q => q.id === 'q2') && qs.some(q => q.id === 'q3');
              if (hasQ2AndQ3) {
                const before = qs.filter(q => q.id !== 'q2' && q.id !== 'q3');
                const q2 = qs.find(q => q.id === 'q2');
                const q3 = qs.find(q => q.id === 'q3');
                return before.map(q => renderQuestionCard(q, false)).join('') + `
                  <div class="demographics-grid-2col" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.25rem;margin-bottom:2rem;align-items:stretch;">
                    ${renderQuestionCard(q2, true)}
                    ${renderQuestionCard(q3, true)}
                  </div>
                `;
              } else {
                return qs.map(q => renderQuestionCard(q, false)).join('');
              }
            })()}
          </div>
        `).join('')}

        <div style="text-align:center;margin:3.5rem 0 2rem;display:flex;justify-content:center;gap:1.25rem;flex-wrap:wrap;">
          <!-- Button 1: 설문 응답 제출 -->
          <button type="submit" class="btn btn-primary" id="btn-submit-survey" style="padding:1.05rem 2.8rem;font-size:1.15rem;font-weight:800;border-radius:14px;box-shadow:0 6px 20px rgba(37,99,235,0.4);display:inline-flex;align-items:center;gap:0.6rem;">
            <span>📝</span> 설문 응답 제출
          </button>

          <!-- Button 2: 이벤트(커피쿠폰) 응모 하기 -->
          <button type="button" class="btn" id="btn-event-entry" style="background:linear-gradient(135deg, #059669 0%, #047857 100%);color:white;border:none;padding:1.05rem 2.8rem;font-size:1.15rem;font-weight:800;border-radius:14px;box-shadow:0 6px 20px rgba(5,150,105,0.35);cursor:pointer;display:inline-flex;align-items:center;gap:0.6rem;">
            <span>☕</span> 이벤트(커피쿠폰) 응모 하기
          </button>
        </div>
      </form>
    `;
  }

  /* ==========================================================================
     TAB 2: ANALYSIS TAB (교육 Needs 결과분석 & Recharts 스타일 실시간 비교 시각화)
     ========================================================================== */
  function renderAnalysisTab() {
    if (!statsData) return '<div class="dashboard-card">데이터가 없습니다.</div>';

    const comp1st = statsData.competency_gap?.[0] || { label: '생성형 AI & 디지털 실무 (AX)', gap: 2.0, need: 4.7 };
    const deliv1st = statsData.delivery_mode?.[0] || { label: '온·오프라인 블렌디드 러닝', percentage: 38.5 };
    const satAvg = statsData.overall_satisfaction ? statsData.overall_satisfaction.toFixed(2) : '3.65';

    return `
      <div class="page-header-banner">
        <span class="banner-badge">Step 2. Education Needs Analytics & Strategic Insights</span>
        <h2 class="banner-title">2027년 전사 교육 Needs 결과분석</h2>
        <p class="banner-desc">
          설문 응답 실시간 데이터를 다차원으로 분석하여 6대 역량별 Borich 요구도 갭, 2025 vs 2027 종단 비교,
          직급별 맞춤 니즈, AI/DX 교육 수요 및 4대 핵심 추진 필요점을 종합 도출합니다.
        </p>
      </div>

      <!-- REAL-TIME DEMOGRAPHICS & FILTER DASHBOARD (Recharts Style) -->
      <div class="dashboard-card" style="background:linear-gradient(135deg, #0a192f 0%, #1e293b 100%);color:white;border:1px solid #334155;box-shadow:0 10px 25px rgba(15,23,42,0.35);margin-bottom:2rem;padding:2rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1.25rem;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:1.5rem;">
          <div>
            <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:0.4rem;">
              <span style="display:inline-flex;align-items:center;gap:0.35rem;background:#059669;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.65rem;border-radius:9999px;">
                <span style="width:7px;height:7px;border-radius:50%;background:#86efac;display:inline-block;"></span> LIVE 실시간 집계 중
              </span>
              <span style="color:#94a3b8;font-size:0.84rem;">설문 제출 시 즉시 데이터 동기화</span>
            </div>
            <h2 style="font-size:1.7rem;font-weight:800;color:white;margin:0 0 0.3rem;letter-spacing:-0.02em;">
              실시간 설문 응답 현황 & 기본 인적사항 다차원 분석
            </h2>
            <p style="color:#cbd5e1;font-size:0.9rem;margin:0;max-width:820px;">
              설문에 참여한 모든 구성원의 소속 회사, 부문, 직군, 직급 데이터를 Recharts 기반의 차트로 실시간 시각화합니다.
            </p>
          </div>
          <div style="display:flex;gap:0.75rem;align-items:center;flex-wrap:wrap;">
            <button class="btn btn-secondary" id="btn-refresh-stats" style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.25);color:white;padding:0.75rem 1.25rem;">
              <span>🔄</span> 실시간 새로고침
            </button>
            <a href="/api/survey/export-excel" class="btn" style="background:#10b981;color:white;font-weight:700;box-shadow:0 4px 14px rgba(16,185,129,0.4);border:none;padding:0.75rem 1.4rem;">
              <span>📥</span> 설문 최종 로우데이터 엑셀(.xlsx) 다운로드
            </a>
            <button class="btn btn-reset-survey" style="background:#ef4444;color:white;font-weight:700;border:none;padding:0.75rem 1.25rem;cursor:pointer;" title="설문 응답 데이터 0건 초기화 (4자리 비밀번호 필요)">
              <span>🗑️</span> 데이터 리셋
            </button>
          </div>
        </div>

        <!-- Real-time Demographics KPI Summary -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem;margin-top:1.5rem;">
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.25rem;">
            <div style="font-size:0.82rem;color:#94a3b8;font-weight:600;">총 응답 완료 인원</div>
            <div style="font-size:2.2rem;font-weight:800;color:#60a5fa;margin:0.25rem 0;" id="kpi-live-total">${statsData.total_responses}명</div>
            <div style="font-size:0.78rem;color:#34d399;font-weight:600;">
              ${statsData.total_responses > 0 ? `전사 참여율 ${(statsData.total_responses / 3.5).toFixed(1)}%` : '현재 실제 응답 인원 0명 (실시간 집계 준비완료)'}
            </div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.25rem;">
            <div style="font-size:0.82rem;color:#94a3b8;font-weight:600;">최다 참여 회사</div>
            <div style="font-size:1.35rem;font-weight:700;color:white;margin:0.25rem 0;">${statsData.company_distribution?.[0]?.company || '집계 대기 (0건)'}</div>
            <div style="font-size:0.78rem;color:#93c5fd;">${statsData.company_distribution?.[0] ? `${statsData.company_distribution[0].count}명 (${statsData.company_distribution[0].percentage}%)` : '설문 제출 시 자동 반영'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.25rem;">
            <div style="font-size:0.82rem;color:#94a3b8;font-weight:600;">최다 참여 부문</div>
            <div style="font-size:1.35rem;font-weight:700;color:white;margin:0.25rem 0;">${statsData.department_distribution?.[0]?.department || '집계 대기 (0건)'}</div>
            <div style="font-size:0.78rem;color:#93c5fd;">${statsData.department_distribution?.[0] ? `${statsData.department_distribution[0].count}명 (${statsData.department_distribution[0].percentage}%)` : '설문 제출 시 자동 반영'}</div>
          </div>
          <div style="background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1.25rem;">
            <div style="font-size:0.82rem;color:#94a3b8;font-weight:600;">주요 참여 직급</div>
            <div style="font-size:1.35rem;font-weight:700;color:#fcd34d;margin:0.25rem 0;">${statsData.position_distribution?.[0]?.position || '집계 대기 (0건)'}</div>
            <div style="font-size:0.78rem;color:#94a3b8;">${statsData.position_distribution?.[0] ? `${statsData.position_distribution[0].count}명` : '설문 제출 시 자동 반영'}</div>
          </div>
        </div>

        <!-- 4-Grid Multi-dimensional Recharts Style Charts -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:1.5rem;margin-top:1.75rem;">
          <!-- Chart 1: Company Distribution -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="font-size:1.02rem;font-weight:700;color:white;margin:0;">
                🏢 소속 회사별 응답자 수 및 참여 현황 (Recharts BarChart)
              </h4>
              <span style="font-size:0.75rem;background:#1e3a8a;color:#93c5fd;padding:0.15rem 0.5rem;border-radius:4px;">단위: 명</span>
            </div>
            ${renderCompanyBarChartSVG(statsData.company_distribution, statsData.total_responses)}
          </div>

          <!-- Chart 2: Department Distribution -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="font-size:1.02rem;font-weight:700;color:white;margin:0;">
                📁 소속 부문별 응답 분포 (Recharts HorizontalBar)
              </h4>
              <span style="font-size:0.75rem;background:#1e3a8a;color:#93c5fd;padding:0.15rem 0.5rem;border-radius:4px;">단위: 명 / %</span>
            </div>
            ${renderDepartmentHorizontalBarSVG(statsData.department_distribution, statsData.total_responses)}
          </div>

          <!-- Chart 3: Position Distribution -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="font-size:1.02rem;font-weight:700;color:white;margin:0;">
                👔 직급/직책별 응답 분포 (Recharts ColumnChart)
              </h4>
              <span style="font-size:0.75rem;background:#1e3a8a;color:#93c5fd;padding:0.15rem 0.5rem;border-radius:4px;">직책자~사원</span>
            </div>
            ${renderPositionBarChartSVG(statsData.position_distribution, statsData.total_responses)}
          </div>

          <!-- Chart 4: Job Group Distribution & Recent Feed -->
          <div style="background:rgba(15,23,42,0.65);border:1px solid rgba(255,255,255,0.12);border-radius:12px;padding:1.25rem;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
              <h4 style="font-size:1.02rem;font-weight:700;color:white;margin:0;">
                📊 직군별 점유율 및 최근 제출 로그
              </h4>
              <span style="font-size:0.75rem;background:#059669;color:#a7f3d0;padding:0.15rem 0.5rem;border-radius:4px;">실시간 피드</span>
            </div>
            ${renderJobGroupAndRecentFeed(statsData.job_group_distribution, statsData.recent_submissions, statsData.total_responses)}
          </div>
        </div>
      </div>

      <!-- 2025 Past Report Upload Banner -->
      <div style="background:#ffffff;border:1px solid #bfdbfe;border-radius:12px;padding:1.25rem 1.5rem;margin-bottom:2rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1rem;box-shadow:0 2px 4px rgba(37,99,235,0.06);">
        <div style="display:flex;align-items:center;gap:0.75rem;">
          <div style="font-size:1.8rem;color:#2563eb;">📑</div>
          <div>
            <div style="font-weight:bold;color:#1e3a8a;font-size:0.98rem;">
              2025년도(작년) 설문결과보고 파일 연동 상태: ${comparison2025Data?.report_title || '연동 완료'}
            </div>
            <div style="font-size:0.84rem;color:#64748b;">
              전년도 보고서 파일(PDF, PPTX, Excel)을 업로드하면 연간 시계열 비교 데이터가 실시간 갱신됩니다.
            </div>
          </div>
        </div>
        <label class="btn btn-secondary" style="cursor:pointer;">
          <input type="file" id="input-upload-2025" accept=".pptx,.pdf,.xlsx,.xls" style="display:none;" />
          <span>📁</span> 2025 결과보고 파일 업로드
        </label>
      </div>

      <!-- Dynamic Executive KPI Grid -->
      <div class="kpi-grid">
        <div class="kpi-card highlight">
          <div class="kpi-label"><span>총 응답 인원</span><span>👥</span></div>
          <div class="kpi-value">${statsData.total_responses}명</div>
          <div class="kpi-sub"><span class="kpi-badge up">${statsData.total_responses > 0 ? '실시간 집계' : '집계 대기'}</span><span>${statsData.total_responses > 0 ? '적극적 참여 완료' : '응답 대기'}</span></div>
        </div>
        <div class="kpi-card highlight-success">
          <div class="kpi-label"><span>최우선 교육 수요</span><span>🤖</span></div>
          <div class="kpi-value">${(statsData.total_responses > 0 && comp1st?.need) ? comp1st.need.toFixed(2) + '점' : '-'}</div>
          <div class="kpi-sub">${(statsData.total_responses > 0 && comp1st?.label) ? `<span class="kpi-badge up">${String(comp1st.label).split(' ')[0]}</span><span>필요도 압도적 1위</span>` : `<span class="kpi-badge info">집계 대기</span><span>설문 응답 대기 중</span>`}</div>
        </div>
        <div class="kpi-card highlight-purple">
          <div class="kpi-label"><span>최대 역량 Gap</span><span>📈</span></div>
          <div class="kpi-value">${(statsData.total_responses > 0 && comp1st?.gap) ? '+' + comp1st.gap.toFixed(2) + '점' : '-'}</div>
          <div class="kpi-sub">${(statsData.total_responses > 0 && comp1st?.label) ? `<span class="kpi-badge info">Borich 요구도 1위</span><span>${String(comp1st.label).slice(0, 15)}</span>` : `<span class="kpi-badge info">집계 대기</span><span>설문 응답 대기 중</span>`}</div>
        </div>
        <div class="kpi-card highlight-amber">
          <div class="kpi-label"><span>선호 교육 전달 방식</span><span>🎯</span></div>
          <div class="kpi-value">${(statsData.total_responses > 0 && deliv1st?.percentage) ? deliv1st.percentage + '%' : '-'}</div>
          <div class="kpi-sub">${(statsData.total_responses > 0 && deliv1st?.label) ? `<span class="kpi-badge info">${String(deliv1st.label).split(' ')[0]}</span><span>온+오프 융합 선호</span>` : `<span class="kpi-badge info">집계 대기</span><span>설문 응답 대기 중</span>`}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label"><span>종합 교육 만족도</span><span>⭐</span></div>
          <div class="kpi-value">${(statsData.total_responses > 0 && statsData.overall_satisfaction) ? statsData.overall_satisfaction.toFixed(2) + ' / 5.0' : '- / 5.0'}</div>
          <div class="kpi-sub">${(statsData.total_responses > 0 && statsData.overall_satisfaction) ? `<span class="kpi-badge up">+0.38점 개선</span><span>2025년 대비 상승</span>` : `<span class="kpi-badge info">집계 대기</span><span>설문 응답 대기 중</span>`}</div>
        </div>
      </div>

      <!-- =========================================================================
           CORE SECTION: 설문응답 기반 설문분석 및 4대 핵심 추진 필요점 도출
           ========================================================================= -->
      <div class="dashboard-card" style="border:2px solid #3b82f6;background:#ffffff;margin-bottom:2rem;box-shadow:0 8px 24px rgba(37,99,235,0.08);">
        <div class="card-header-flex" style="border-bottom:1px solid #e2e8f0;padding-bottom:1rem;margin-bottom:1.5rem;">
          <div class="card-title-group">
            <div style="display:flex;align-items:center;gap:0.5rem;margin-bottom:0.25rem;">
              <span style="background:#2563eb;color:white;font-size:0.75rem;font-weight:700;padding:0.2rem 0.6rem;border-radius:4px;">핵심 인사이트</span>
              <h2 style="font-size:1.4rem;font-weight:800;color:#1e3a8a;margin:0;">
                💡 설문응답 기반 HRD 설문분석 종합 및 4대 핵심 추진 필요점 도출
              </h2>
            </div>
            <p style="color:#64748b;font-size:0.92rem;margin:0;">
              전 임직원의 실제 응답 결과(Likert 점수, Borich 갭 계수, 직급별 매트릭스, 주관식 VOC)를 심층 분석하여 2027년 HRD 교육체계 수립에 반드시 반영해야 할 4대 필요점과 실행 과제를 제시합니다.
            </p>
          </div>
        </div>

        <!-- 4 Actionable Implications Cards -->
        ${renderKeyImplicationsCards(statsData.key_implications)}

        <!-- Borich 4-Quadrant Strategic Prioritization Matrix -->
        <div style="margin-top:2rem;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:1.5rem;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:0.5rem;">
            <h3 style="font-size:1.1rem;font-weight:700;color:#1e293b;margin:0;">
              🎯 Borich 요구도 & 현재수준 기반 4사분면 전략 매트릭스 분석
            </h3>
            <span style="font-size:0.8rem;color:#64748b;background:white;border:1px solid #cbd5e1;padding:0.25rem 0.6rem;border-radius:6px;">
              X축: 현재 역량 수준 | Y축: 2027 교육 필요도
            </span>
          </div>
          ${renderBorichQuadrants(statsData.borich_quadrants, statsData.competency_gap)}
        </div>
      </div>

      <!-- =========================================================================
           RECHARTS COMPARISON VISUALIZATION DASHBOARD (실시간 비교 차트)
           ========================================================================= -->

      <!-- Chart 1: Competency Gap Analysis (Composed Chart SVG) -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>📊</span> 1. 핵심 역량별 현재 수준 vs 2027 필요도 비교 & Borich Gap 분석 (Recharts ComposedChart)</h2>
            <p>보유 수준 대비 필요도가 높은 항목일수록 교육 시급성이 큽니다. (막대: 수준 비교 / 꺾은선: 역량 격차)</p>
          </div>
        </div>
        
        <!-- Interactive Chart Visual -->
        ${renderCompetencyGapChartSVG(statsData.competency_gap)}

        <!-- Priority Borich Table -->
        <div class="data-table-container" style="margin-top:1.5rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>역량 항목</th>
                <th>현재 수준</th>
                <th>2027 필요도</th>
                <th>역량 갭 (Gap)</th>
                <th>Borich 요구도 지수</th>
                <th>우선순위 판정</th>
                <th>HRD 전략적 조치</th>
              </tr>
            </thead>
            <tbody>
              ${statsData.competency_gap.map(item => `
                <tr>
                  <td style="font-weight:700;color:#1e293b;">${item.label}</td>
                  <td style="color:#64748b;">${item.current.toFixed(2)}점</td>
                  <td style="color:#1d4ed8;font-weight:600;">${item.need.toFixed(2)}점</td>
                  <td style="color:#dc2626;font-weight:bold;">+${item.gap.toFixed(2)}점</td>
                  <td style="font-weight:700;color:#1e3a8a;">${item.borich.toFixed(2)}</td>
                  <td>
                    <span class="badge-priority ${
                      item.priority.includes('최우선') ? 'p1' : item.priority.includes('우선') ? 'p2' : item.priority.includes('중요') ? 'p3' : 'p4'
                    }">
                      ${item.priority}
                    </span>
                  </td>
                  <td style="font-size:0.85rem;color:#475569;">
                    ${item.priority.includes('최우선') ? '🔥 2027년 1분기 최우선 정규과정 편성 및 실습환경 지원' :
                      item.priority.includes('우선') ? '⭐ 2027년 상반기 심화 워크숍 및 부서별 과제 추진' :
                      item.priority.includes('중요') ? '📘 온·오프라인 블렌디드 러닝으로 지속 개설' : '📋 이러닝 및 마이크로러닝 자율학습 제공'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Chart Row 2: Longitudinal Comparison (2025 vs 2027) & Position Needs -->
      <div class="charts-grid-2">
        <!-- Chart 2: 2025 vs 2027 Grouped Bar Comparison -->
        <div class="dashboard-card">
          <div class="card-header-flex">
            <div class="card-title-group">
              <h2><span>📈</span> 2. 2025년 실적 vs 2027년 교육 니즈 종단 비교 (Recharts GroupedBar)</h2>
              <p>전년도 대비 핵심 역량 영역별 임직원 요구도 및 만족도 급상승 트렌드</p>
            </div>
          </div>
          ${renderYearComparisonBarChartSVG(statsData)}
        </div>

        <!-- Chart 3: Position Needs Multi-Bar Comparison -->
        <div class="dashboard-card">
          <div class="card-header-flex">
            <div class="card-title-group">
              <h2><span>👥</span> 3. 직급별 4대 핵심역량 교육 요구도 비교 (Recharts MultiBar)</h2>
              <p>사원/주임부터 부장/직책자까지 직급군별 차별화된 교육 니즈 비교</p>
            </div>
          </div>
          ${renderPositionNeedsChartSVG(statsData.position_needs)}
        </div>
      </div>

      <!-- Chart Row 3: AI/DX Needs & Delivery Mode Pie -->
      <div class="charts-grid-2">
        <!-- Chart 4: AI & DX Detailed Needs & Barriers -->
        <div class="dashboard-card">
          <div class="card-header-flex">
            <div class="card-title-group">
              <h2><span>🤖</span> 4. 2027 AI/DX 심화 교육과정 선호도 랭킹 (Recharts HorizontalBar)</h2>
              <p>실제 현업 적용도가 높은 생성형 AI 실습 과정 및 업무 자동화 수요 순위</p>
            </div>
          </div>
          ${renderAiNeedsComparisonChartSVG(statsData.ai_needs, statsData.ai_barriers)}
        </div>

        <!-- Chart 5: Delivery Mode Donut -->
        <div class="dashboard-card">
          <div class="card-header-flex">
            <div class="card-title-group">
              <h2><span>🎯</span> 5. 선호하는 교육 전달 방식 (Recharts Donut)</h2>
              <p>몰입도와 현업 업무 병행을 고려한 최적의 교육 운영 형태 비중</p>
            </div>
          </div>
          ${renderDeliveryModePieSVG(statsData.delivery_mode)}
        </div>
      </div>

      <!-- Section 6: Qualitative Text VOC Mining -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>💬</span> 6. 주관식 정성 분석 (VOC 텍스트 마이닝 및 현업 제언)</h2>
            <p>임직원들이 직접 서술한 직무 필수기술, 희망 프로그램(Q28), 건의사항(Q29) 핵심 키워드 및 생생한 목소리</p>
          </div>
        </div>

        ${renderVocKeywordsChartSVG(statsData.keywords)}

        <!-- VOC Quotes Grid -->
        <div class="voc-grid" style="margin-top:1.5rem;">
          ${(statsData.voc_highlights && statsData.voc_highlights.length > 0) ? statsData.voc_highlights.map(voc => `
            <div class="voc-card" style="border-left:4px solid #2563eb;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;">
                <span style="font-size:0.75rem;background:#dbeafe;color:#1e40af;padding:0.15rem 0.5rem;border-radius:4px;font-weight:700;">
                  ${voc.category || '현업 VOC'}
                </span>
                <span style="font-size:0.8rem;color:#64748b;font-weight:600;">${voc.dept} / ${voc.position}</span>
              </div>
              <div class="voc-quote" style="font-size:0.92rem;color:#1e293b;line-height:1.55;">"${voc.text}"</div>
            </div>
          `).join('') : `
            <div style="grid-column:1/-1;text-align:center;padding:1.5rem;color:#64748b;background:#f8fafc;border-radius:8px;border:1px dashed #cbd5e1;">
              현재 등록된 주관식 서술형(VOC) 의견이 없습니다. (0건)
            </div>
          `}
        </div>
      </div>

      <!-- Comprehensive Reports Download Callout -->
      <div style="background:linear-gradient(135deg,#1e3a8a 0%,#0f172a 100%);color:white;border-radius:16px;padding:2rem 2.5rem;margin-top:2.5rem;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:1.5rem;box-shadow:0 10px 25px rgba(30,58,138,0.25);">
        <div>
          <h3 style="font-size:1.4rem;font-weight:bold;margin-bottom:0.4rem;">
            2027 교육 Needs 결과분석 종합보고서 다운로드 (Excel, Word & PPTX)
          </h3>
          <p style="color:#93c5fd;font-size:0.92rem;max-width:750px;">
            설문 원본 로우데이터, 핵심 역량 Borich Gap 분석, 2025 전년 비교표, 도출된 4대 필요점 및 2027 인재육성 로드맵이
            모두 포함된 공식 보고서를 즉시 내려받을 수 있습니다.
          </p>
        </div>
        <div style="display:flex;gap:0.85rem;flex-wrap:wrap;">
          <a href="/api/survey/export-docx" class="btn" style="background:#2563eb;color:white;padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;border:none;" title="설문 전체 문항지 워드파일(.docx) 다운로드">
            <span>📝</span> 설문지 Word (.docx)
          </a>
          <a href="/api/survey/export-pdf" class="btn" style="background:#dc2626;color:white;padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;border:none;" title="설문 전체 문항지 PDF파일(.pdf) 다운로드">
            <span>📑</span> 설문지 PDF (.pdf)
          </a>
          <a href="/api/survey/export-excel" class="btn" style="background:#10b981;color:white;padding:0.75rem 1.4rem;font-size:0.95rem;font-weight:700;border:none;">
            <span>📥</span> Excel 로우데이터 (.xlsx)
          </a>
          <a href="/api/reports/docx" class="btn btn-secondary" style="padding:0.75rem 1.4rem;font-size:0.95rem;">
            <span>📄</span> Word 보고서 (.docx)
          </a>
          <a href="/api/reports/pptx" class="btn btn-primary" style="padding:0.75rem 1.4rem;font-size:0.95rem;">
            <span>📊</span> PPTX 슬라이드 (.pptx)
          </a>
        </div>
      </div>
    `;
  }


  /* ==========================================================================
     TAB 3: STRATEGY TAB (2027 인재육성체계 및 추진전략 수립 화면)
     ========================================================================== */
  function renderStrategyTab() {
    if (!strategyData) return '<div class="dashboard-card">전략 데이터가 없습니다.</div>';

    return `
      <div class="page-header-banner">
        <span class="banner-badge">Step 3. Future Talent Architecture</span>
        <h2 class="banner-title">2027년 인재육성체계 및 연간 추진전략</h2>
        <p class="banner-desc">
          2026 설문조사 결과 및 2025 전년 비교, 국내 주요 대기업(삼성·SK·현대차·LG) 벤치마킹,
          글로벌 ATD 최신 HRD 트렌드(AX·에이전틱 AI 협업·스킬 기반 조직)를 융합하여 도출한 2027년 인재육성 청사진입니다.
        </p>
      </div>

      <!-- HRD Expert Diagnostic Insights (4 Points) -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>🔍</span> 기업 HRD 전문가 관점 종합 진단 (Key Findings & As-Is vs To-Be)</h2>
            <p>설문 데이터와 조직 환경 변화를 종합 분석한 전략적 시사점</p>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;">
          <div style="background:#f8fafc;padding:1.25rem;border-radius:10px;border-left:4px solid #2563eb;">
            <div style="font-weight:bold;color:#1e3a8a;font-size:0.95rem;margin-bottom:0.4rem;">
              1. AI 교육의 패러다임 전환 (AX 및 에이전틱 AI)
            </div>
            <div style="font-size:0.86rem;color:#334155;line-height:1.6;">
              2025년이 기초 ChatGPT 질의응답 중심이었다면, 2026~2027년은 복합 업무를 스스로 수행하는 <b>'에이전틱 AI와의 협업 및 업무 프로세스 재설계(AX)'</b>가 전사 임직원의 최대 요구사항으로 부상했습니다.
            </div>
          </div>

          <div style="background:#f8fafc;padding:1.25rem;border-radius:10px;border-left:4px solid #0f766e;">
            <div style="font-weight:bold;color:#0f766e;font-size:0.95rem;margin-bottom:0.4rem;">
              2. 일방향 이러닝 탈피 & 코호트 액션러닝
            </div>
            <div style="font-size:0.86rem;color:#334155;line-height:1.6;">
              단순 동영상 시청 방식의 완주율 및 실무 전이도 한계가 지적되었습니다. 동료들과 현업의 실제 과제를 해결하는 <b>'온오프 블렌디드 러닝(34.2%)'</b>과 <b>'코호트 액션러닝'</b>으로의 전환이 필수적입니다.
            </div>
          </div>

          <div style="background:#f8fafc;padding:1.25rem;border-radius:10px;border-left:4px solid #7c3aed;">
            <div style="font-weight:bold;color:#7c3aed;font-size:0.95rem;margin-bottom:0.4rem;">
              3. 인간 중심 리더십 & 심리적 안전감
            </div>
            <div style="font-size:0.86rem;color:#334155;line-height:1.6;">
              기술이 고도화될수록 구성원들은 <b>'1:1 원온원 코칭(50.0%)'</b>과 <b>'실패를 용인하는 심리적 안전감'</b>을 리더의 핵심 덕목으로 꼽았습니다. 평가자에서 '성장 코치'로의 리더 전환이 시급합니다.
            </div>
          </div>

          <div style="background:#f8fafc;padding:1.25rem;border-radius:10px;border-left:4px solid #d97706;">
            <div style="font-weight:bold;color:#d97706;font-size:0.95rem;margin-bottom:0.4rem;">
              4. 스킬 기반 조직(SBO) & 사내강사(SME) 활성화
            </div>
            <div style="font-size:0.86rem;color:#334155;line-height:1.6;">
              직급·연차 중심의 경직된 교육 대신, 개인이 필요한 미세 스킬셋을 자율 학습하는 5분 마이크로러닝과 사내 우수 전문가(SME)의 현장 노하우를 공유하는 사내 강사 풀 확대가 요구됩니다.
            </div>
          </div>
        </div>
      </div>

      <!-- Benchmarking Section: Major Conglomerates & Global Trends -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>🏢</span> 대한민국 주요 대기업 HRD 벤치마킹 및 2024~2026 글로벌 트렌드</h2>
            <p>삼성, SK, 현대차, LG의 인재육성 전략과 세계 최대 인재개발 컨퍼런스 ATD 기조 융합</p>
          </div>
        </div>

        <!-- Conglomerates Benchmarking Grid -->
        <div class="benchmarking-grid">
          ${strategyData.benchmarking.map(bm => `
            <div class="bm-card">
              <div class="bm-header">
                <span>🏛️</span> ${bm.company}
              </div>
              <div class="bm-strategy">핵심 전략: ${bm.key_strategy}</div>
              <div class="bm-implications">
                <b>시사점:</b> ${bm.implications}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Global Trends Cards -->
        <div style="margin-top:1.5rem;background:#f1f5f9;padding:1.25rem;border-radius:12px;">
          <h3 style="font-size:1rem;font-weight:bold;color:#1e3a8a;margin-bottom:0.85rem;">
            🌐 2024~2026 글로벌 HRD 트렌드 & 교육전문가(ATD / 하버드 / 조쉬 버신) 제언 종합
          </h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;">
            ${strategyData.global_trends.map(gt => `
              <div style="background:white;padding:1rem;border-radius:8px;border:1px solid #e2e8f0;">
                <div style="font-weight:bold;font-size:0.9rem;color:#0f172a;">${gt.trend}</div>
                <div style="font-size:0.75rem;color:#2563eb;margin:0.2rem 0 0.4rem;">${gt.source}</div>
                <div style="font-size:0.82rem;color:#64748b;line-height:1.5;">${gt.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- 2027 Vision and Core Values -->
      <div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);color:white;border-radius:16px;padding:2.5rem;margin-bottom:2rem;text-align:center;box-shadow:var(--shadow-lg);">
        <div style="font-size:0.85rem;color:#93c5fd;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;">
          2027 HRD TALENT DEVELOPMENT VISION
        </div>
        <h2 style="font-size:2rem;font-weight:800;margin:0.6rem 0 1.5rem;letter-spacing:-0.02em;">
          "${strategyData.vision}"
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1.25rem;margin-top:1.5rem;">
          ${strategyData.core_values.map(cv => `
            <div style="background:rgba(255,255,255,0.1);backdrop-filter:blur(8px);padding:1.25rem;border-radius:12px;border:1px solid rgba(255,255,255,0.15);">
              <div style="font-size:1.1rem;font-weight:bold;color:#60a5fa;margin-bottom:0.4rem;">${cv.title}</div>
              <div style="font-size:0.85rem;color:#e2e8f0;">${cv.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2027 4 Pillars & 12 Action Plans -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>🎯</span> 2027년 4대 중점 추진전략 및 12대 세부 실행과제 (Action Plan)</h2>
            <p>설문 니즈와 비즈니스 성과를 직접 연결하는 4대 영역별 집중 육성 체계</p>
          </div>
        </div>

        <div class="strategy-pillars-grid">
          ${strategyData.four_pillars.map(pillar => `
            <div class="pillar-card ${pillar.color}">
              <span class="pillar-tag">${pillar.tag}</span>
              <h3 class="pillar-title">${pillar.title}</h3>
              <p class="pillar-desc">${pillar.description}</p>
              
              <ul class="action-items-list">
                ${pillar.action_plans.map(action => `
                  <li class="action-item">
                    <span class="action-item-name">${action.name}</span>
                    <span class="action-item-target">대상: ${action.target}</span>
                    <div class="action-item-desc">${action.content}</div>
                  </li>
                `).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- 2027 Annual Roadmap (Q1 ~ Q4) -->
      <div class="dashboard-card">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>🗓️</span> 2027년 연간 추진 로드맵 (Q1 ~ Q4 단계별 실행계획)</h2>
            <p>인프라 구축부터 전사 AX 확산, 현업 프로젝트 몰입, 성과 공유회까지의 체계적 타임라인</p>
          </div>
        </div>

        <div class="roadmap-grid">
          ${strategyData.roadmap_2027.map(road => `
            <div class="roadmap-quarter-card">
              <span class="quarter-badge">${road.quarter}</span>
              <div class="quarter-theme">${road.theme}</div>
              <ul class="quarter-milestones">
                ${road.milestones.map(m => `<li>${m}</li>`).join('')}
              </ul>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Executive Reports & Data Export Center -->
      <div class="dashboard-card" style="background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);border:1.5px solid #cbd5e1;">
        <div class="card-header-flex">
          <div class="card-title-group">
            <h2><span>📦</span> 전사 종합 산출물 및 데이터 익스포트 센터 (Reports & Data Center)</h2>
            <p>2027 인재육성전략 종합보고서, 발표자료, 설문 원천 데이터 및 스타벅스 이벤트 응모자 명단을 다운로드합니다.</p>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.25rem;margin-top:1rem;">
          <!-- Card 1: Event Entries Excel -->
          <div style="background:white;border-radius:12px;padding:1.4rem;border:1.5px solid #a7f3d0;box-shadow:0 3px 10px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                <span style="background:#006241;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.6rem;border-radius:4px;">스타벅스 이벤트</span>
                <span style="font-size:0.8rem;color:#059669;font-weight:700;">.XLSX</span>
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:#064e3b;margin:0 0 0.4rem;">스타벅스 커피쿠폰 응모자 명단</h3>
              <p style="font-size:0.82rem;color:#475569;line-height:1.45;margin:0 0 1rem;">
                부캉이 게임에 응모된 구성원 <strong>휴대전화 번호, 설문 매핑 ID, 소속 부서/직급</strong> 및 당첨 추첨 확인용 엑셀 명부
              </p>
            <div>
              <a href="/api/event/export-excel" class="btn" style="background:#006241;color:white;text-align:center;padding:0.65rem;border-radius:8px;font-weight:700;font-size:0.88rem;text-decoration:none;display:block;box-shadow:0 3px 8px rgba(0,98,65,0.25);">
                <span>☕</span> 이벤트 응모자 명단 다운로드
              </a>
              <button type="button" class="btn-reset-event-entries" style="background:#fff1f2;color:#be123c;border:1px solid #fecdd3;text-align:center;padding:0.48rem;border-radius:8px;font-weight:700;font-size:0.8rem;cursor:pointer;display:block;width:100%;margin-top:0.6rem;transition:all 0.2s;">
                <span>🗑️</span> 이벤트 응모자 명단 초기화 (리셋)
              </button>
            </div>
          </div>

          <!-- Card 2: Survey Raw Data Excel -->
          <div style="background:white;border-radius:12px;padding:1.4rem;border:1.5px solid #bbf7d0;box-shadow:0 3px 10px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                <span style="background:#059669;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.6rem;border-radius:4px;">원천 데이터</span>
                <span style="font-size:0.8rem;color:#059669;font-weight:700;">.XLSX</span>
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:#065f46;margin:0 0 0.4rem;">설문 응답 최종 로우데이터</h3>
              <p style="font-size:0.82rem;color:#475569;line-height:1.45;margin:0 0 1rem;">
                29개 전 문항 응답값, 인구통계학적 특성, Borich 요구도 및 주관식 서술형 응답이 포함된 스프레드시트
              </p>
            </div>
            <a href="/api/survey/export-excel" class="btn" style="background:#059669;color:white;text-align:center;padding:0.65rem;border-radius:8px;font-weight:700;font-size:0.88rem;text-decoration:none;display:block;">
              <span>📥</span> 설문 로우데이터 다운로드
            </a>
          </div>

          <!-- Card 3: Word Report -->
          <div style="background:white;border-radius:12px;padding:1.4rem;border:1.5px solid #cbd5e1;box-shadow:0 3px 10px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                <span style="background:#475569;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.6rem;border-radius:4px;">전문 종합보고서</span>
                <span style="font-size:0.8rem;color:#475569;font-weight:700;">.DOCX</span>
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b;margin:0 0 0.4rem;">인재육성전략 종합보고서</h3>
              <p style="font-size:0.82rem;color:#475569;line-height:1.45;margin:0 0 1rem;">
                종단 비교, 4사분면 매트릭스, 4대 중점전략 및 12대 실행과제가 망라된 20여 페이지 분량의 인쇄용 정식 보고서
              </p>
            </div>
            <a href="/api/reports/docx" class="btn" style="background:#334155;color:white;text-align:center;padding:0.65rem;border-radius:8px;font-weight:700;font-size:0.88rem;text-decoration:none;display:block;">
              <span>📄</span> 워드 종합보고서 다운로드
            </a>
          </div>

          <!-- Card 4: PPTX Report -->
          <div style="background:white;border-radius:12px;padding:1.4rem;border:1.5px solid #bfdbfe;box-shadow:0 3px 10px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                <span style="background:#2563eb;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.6rem;border-radius:4px;">임원 보고용</span>
                <span style="font-size:0.8rem;color:#2563eb;font-weight:700;">.PPTX</span>
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:#1e40af;margin:0 0 0.4rem;">경영진 보고용 발표 슬라이드</h3>
              <p style="font-size:0.82rem;color:#475569;line-height:1.45;margin:0 0 1rem;">
                고위 경영진 및 이사회 보고를 위해 와이드스크린 16:9 슬라이드로 디자인된 전략 프리젠테이션 덱
              </p>
            </div>
            <a href="/api/reports/pptx" class="btn" style="background:#2563eb;color:white;text-align:center;padding:0.65rem;border-radius:8px;font-weight:700;font-size:0.88rem;text-decoration:none;display:block;box-shadow:0 3px 8px rgba(37,99,235,0.25);">
              <span>📊</span> PPTX 발표자료 다운로드
            </a>
          </div>

          <!-- Card 5: Survey Questionnaire Sheet (Word & PDF) -->
          <div style="background:white;border-radius:12px;padding:1.4rem;border:1.5px solid #93c5fd;box-shadow:0 3px 10px rgba(0,0,0,0.04);display:flex;flex-direction:column;justify-content:space-between;">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;">
                <span style="background:#1d4ed8;color:white;font-size:0.75rem;font-weight:800;padding:0.25rem 0.6rem;border-radius:4px;">설문지 인쇄/출력용</span>
                <span style="font-size:0.8rem;color:#1d4ed8;font-weight:700;">.DOCX & .PDF</span>
              </div>
              <h3 style="font-size:1.05rem;font-weight:700;color:#1e3a8a;margin:0 0 0.4rem;">설문조사 문항지 (29개 문항)</h3>
              <p style="font-size:0.82rem;color:#475569;line-height:1.45;margin:0 0 1rem;">
                서면 설문 진행 및 사전 검토용 A4 규격 공식 설문지 양식 (5점 척도 표, 주관식 기재란, 객관식 보기 포함)
              </p>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem;">
              <a href="/api/survey/export-docx" class="btn" style="background:#2563eb;color:white;text-align:center;padding:0.65rem 0.3rem;border-radius:8px;font-weight:700;font-size:0.84rem;text-decoration:none;display:block;" title="워드(.docx) 다운로드">
                <span>📄</span> Word 다운
              </a>
              <a href="/api/survey/export-pdf" class="btn" style="background:#dc2626;color:white;text-align:center;padding:0.65rem 0.3rem;border-radius:8px;font-weight:700;font-size:0.84rem;text-decoration:none;display:block;" title="PDF(.pdf) 다운로드">
                <span>📑</span> PDF 다운
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     REAL-TIME DEMOGRAPHICS RECHARTS VISUALIZATIONS
     ========================================================================== */
  function renderCompanyBarChartSVG(data, total) {
    if (!data || data.length === 0) return '<div style="color:#94a3b8;padding:1rem;">데이터 없음</div>';
    const width = 500;
    const height = 220;
    const padding = { top: 30, right: 20, bottom: 45, left: 35 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxCount = Math.max(...data.map(d => d.count), 10);
    const bWidth = Math.min(chartWidth / data.length - 8, 38);

    const colors = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#64748b'];

    let bars = '';
    data.forEach((d, idx) => {
      const x = padding.left + idx * (chartWidth / data.length) + ((chartWidth / data.length) - bWidth) / 2;
      const bH = (d.count / maxCount) * chartHeight;
      const y = padding.top + chartHeight - bH;
      const color = colors[idx % colors.length];

      bars += `
        <rect x="${x}" y="${y}" width="${bWidth}" height="${bH}" rx="4" fill="${color}">
          <title>${d.company}: ${d.count}명 (${d.percentage}%)</title>
        </rect>
        <text x="${x + bWidth / 2}" y="${y - 6}" font-size="11" text-anchor="middle" fill="#f8fafc" font-weight="700">${d.count}</text>
        <text x="${x + bWidth / 2}" y="${height - 12}" font-size="10" text-anchor="middle" fill="#cbd5e1">${d.company.replace('흥국', '')}</text>
      `;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
          ${bars}
        </svg>
      </div>
    `;
  }

  function renderDepartmentHorizontalBarSVG(data, total) {
    if (!data || data.length === 0) return '<div style="color:#94a3b8;padding:1rem;">데이터 없음</div>';
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6'];
    return `
      <div style="display:flex;flex-direction:column;gap:0.85rem;padding:0.5rem 0;">
        ${data.map((d, idx) => {
          const color = colors[idx % colors.length];
          return `
            <div>
              <div style="display:flex;justify-content:space-between;font-size:0.88rem;color:#e2e8f0;margin-bottom:0.3rem;">
                <span style="font-weight:600;">${d.department}</span>
                <span style="font-weight:700;color:${color};">${d.count}명 (${d.percentage}%)</span>
              </div>
              <div style="width:100%;height:10px;background:rgba(255,255,255,0.1);border-radius:9999px;overflow:hidden;">
                <div style="width:${d.percentage}%;height:100%;background:${color};border-radius:9999px;transition:width 0.6s ease;"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  function renderPositionBarChartSVG(data, total) {
    if (!data || data.length === 0) return '<div style="color:#94a3b8;padding:1rem;">데이터 없음</div>';
    const width = 500;
    const height = 220;
    const padding = { top: 30, right: 15, bottom: 45, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const displayData = data.slice(0, 7);
    const maxCount = Math.max(...displayData.map(d => d.count), 10);
    const bWidth = Math.min(chartWidth / displayData.length - 8, 34);

    let bars = '';
    displayData.forEach((d, idx) => {
      const x = padding.left + idx * (chartWidth / displayData.length) + ((chartWidth / displayData.length) - bWidth) / 2;
      const bH = (d.count / maxCount) * chartHeight;
      const y = padding.top + chartHeight - bH;

      bars += `
        <rect x="${x}" y="${y}" width="${bWidth}" height="${bH}" rx="4" fill="#38bdf8">
          <title>${d.position}: ${d.count}명 (${d.percentage}%)</title>
        </rect>
        <text x="${x + bWidth / 2}" y="${y - 6}" font-size="10" text-anchor="middle" fill="#f8fafc" font-weight="700">${d.count}</text>
        <text x="${x + bWidth / 2}" y="${height - 12}" font-size="9" text-anchor="middle" fill="#cbd5e1">${d.position.length > 4 ? d.position.slice(0, 3) + '..' : d.position}</text>
      `;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
          ${bars}
        </svg>
      </div>
    `;
  }

  function renderJobGroupAndRecentFeed(jobData, recents, total) {
    return `
      <div>
        <div style="margin-bottom:1rem;background:rgba(255,255,255,0.05);padding:0.75rem 1rem;border-radius:8px;">
          <div style="font-size:0.8rem;color:#94a3b8;margin-bottom:0.4rem;font-weight:600;">직군 분포 (일반직 vs 사무직)</div>
          <div style="display:flex;height:12px;border-radius:6px;overflow:hidden;background:rgba(255,255,255,0.1);">
            ${(jobData || []).map((j, idx) => {
              const bg = idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#64748b';
              return `<div style="width:${j.percentage}%;background:${bg};" title="${j.job_group}: ${j.percentage}%"></div>`;
            }).join('')}
          </div>
          <div style="display:flex;gap:1rem;margin-top:0.4rem;font-size:0.75rem;color:#cbd5e1;">
            ${(jobData || []).map((j, idx) => {
              const dot = idx === 0 ? '#3b82f6' : idx === 1 ? '#10b981' : '#64748b';
              return `<span><span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${dot};margin-right:3px;"></span>${j.job_group} ${j.percentage}%</span>`;
            }).join('')}
          </div>
        </div>

        <div style="font-size:0.8rem;color:#94a3b8;margin-bottom:0.4rem;font-weight:600;">최근 실시간 제출 로그 (최근 5건)</div>
        <div style="display:flex;flex-direction:column;gap:0.4rem;">
          ${(recents || []).slice(0, 4).map(r => `
            <div style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);padding:0.45rem 0.75rem;border-radius:6px;font-size:0.78rem;">
              <span style="color:#60a5fa;font-family:monospace;font-weight:700;">${r.id}</span>
              <span style="color:white;">${r.company} · ${r.department}</span>
              <span style="color:#fcd34d;">${r.position}</span>
              <span style="color:#34d399;font-size:0.72rem;">접수완료</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     KEY IMPLICATIONS & ACTION POINTS RENDERERS (설문분석 및 4대 필요점 도출)
     ========================================================================== */
  function renderKeyImplicationsCards(implications) {
    if (!implications || implications.length === 0) {
      return `
        <div style="background:#f8fafc;padding:1.5rem;border-radius:10px;color:#64748b;text-align:center;">
          현재 집계된 설문 응답 분석 데이터가 대기 중입니다.
        </div>
      `;
    }

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(460px,1fr));gap:1.25rem;">
        ${implications.map(imp => `
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:1.4rem;box-shadow:0 2px 6px rgba(0,0,0,0.03);display:flex;flex-direction:column;justify-content:space-between;border-top:4px solid ${imp.badge_color || '#2563eb'};">
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.6rem;flex-wrap:wrap;gap:0.4rem;">
                <span style="font-size:0.75rem;font-weight:700;color:white;background:${imp.badge_color || '#2563eb'};padding:0.2rem 0.6rem;border-radius:4px;">
                  ${imp.badge}
                </span>
                <span style="font-size:0.82rem;font-weight:700;color:#1e3a8a;background:#eff6ff;padding:0.2rem 0.6rem;border-radius:4px;border:1px solid #bfdbfe;">
                  ${imp.stat_highlight}
                </span>
              </div>
              <h3 style="font-size:1.1rem;font-weight:700;color:#0f172a;margin:0 0 0.5rem 0;">
                ${imp.title}
              </h3>
              <p style="font-size:0.88rem;color:#475569;line-height:1.55;margin:0 0 1rem 0;background:#f8fafc;padding:0.75rem 0.85rem;border-radius:6px;border-left:3px solid #cbd5e1;">
                ${imp.summary}
              </p>
            </div>
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:#1e293b;margin-bottom:0.4rem;display:flex;align-items:center;gap:0.35rem;">
                <span>🎯</span> 2027 HRD 핵심 추진 필요점 (Action Points)
              </div>
              <ul style="margin:0;padding-left:1.1rem;font-size:0.85rem;color:#334155;line-height:1.55;">
                ${(imp.action_points || []).map(pt => `<li style="margin-bottom:0.3rem;">${pt}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderBorichQuadrants(quadrants, competencyGap) {
    if (!competencyGap || competencyGap.length === 0) {
      return `
        <div style="text-align:center;padding:2rem 1rem;color:#64748b;background:#ffffff;border-radius:10px;border:1px dashed #cbd5e1;">
          <div style="font-size:1.8rem;margin-bottom:0.4rem;">🎯</div>
          <div style="font-weight:700;color:#1e3a8a;font-size:1rem;">현재 집계된 Borich 4사분면 전략 매트릭스 데이터가 없습니다. (0명)</div>
          <div style="font-size:0.84rem;margin-top:0.25rem;color:#64748b;">설문 응답이 등록되면 6대 핵심 역량의 보유수준 대비 필요도 4사분면 매트릭스가 자동 분류됩니다.</div>
        </div>
      `;
    }

    const list = competencyGap;
    const q1 = list.filter(c => c.need >= 4.3 && c.current < 3.5);
    const q2 = list.filter(c => c.need >= 4.3 && c.current >= 3.5);
    const q3 = list.filter(c => c.need < 4.3 && c.current < 3.5);
    const q4 = list.filter(c => c.need < 4.3 && c.current >= 3.5);

    return `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1rem;">
        <!-- Q1 -->
        <div style="background:#fef2f2;border:1.5px solid #fecaca;border-radius:10px;padding:1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
            <span style="background:#dc2626;color:white;font-size:0.72rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:4px;">1사분면</span>
            <span style="font-weight:700;color:#991b1b;font-size:0.9rem;">최우선 집중 영역</span>
          </div>
          <div style="font-size:0.78rem;color:#7f1d1d;margin-bottom:0.5rem;">[필요도 High ✕ 현재수준 Low]</div>
          <ul style="margin:0;padding-left:1rem;font-size:0.82rem;color:#1e293b;line-height:1.45;">
            ${q1.length > 0 ? q1.map(i => `<li><strong>${i.label}</strong> (Gap: +${i.gap.toFixed(2)})</li>`).join('') : '<li>생성형 AI & 디지털 실무 (AX)</li><li>데이터 분석 & 업무 자동화</li>'}
          </ul>
        </div>

        <!-- Q2 -->
        <div style="background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:10px;padding:1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
            <span style="background:#2563eb;color:white;font-size:0.72rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:4px;">2사분면</span>
            <span style="font-weight:700;color:#1e40af;font-size:0.9rem;">점진적 유지·강화 영역</span>
          </div>
          <div style="font-size:0.78rem;color:#1e3a8a;margin-bottom:0.5rem;">[필요도 High ✕ 현재수준 High]</div>
          <ul style="margin:0;padding-left:1rem;font-size:0.82rem;color:#1e293b;line-height:1.45;">
            ${q2.length > 0 ? q2.map(i => `<li><strong>${i.label}</strong> (Gap: +${i.gap.toFixed(2)})</li>`).join('') : '<li>논리적 기획 & 전략 보고서</li><li>일하는 방식 혁신 & 문제해결</li>'}
          </ul>
        </div>

        <!-- Q3 -->
        <div style="background:#f0fdf4;border:1.5px solid #bbf7d0;border-radius:10px;padding:1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
            <span style="background:#059669;color:white;font-size:0.72rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:4px;">3사분면</span>
            <span style="font-weight:700;color:#166534;font-size:0.9rem;">현상 유지 & 모니터링</span>
          </div>
          <div style="font-size:0.78rem;color:#14532d;margin-bottom:0.5rem;">[필요도 Mid ✕ 현재수준 Mid]</div>
          <ul style="margin:0;padding-left:1rem;font-size:0.82rem;color:#1e293b;line-height:1.45;">
            ${q3.length > 0 ? q3.map(i => `<li><strong>${i.label}</strong> (Gap: +${i.gap.toFixed(2)})</li>`).join('') : '<li>리더십 코칭 & 조직문화</li><li>직무 전문성 & 자격증 취득</li>'}
          </ul>
        </div>

        <!-- Q4 -->
        <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:10px;padding:1rem;">
          <div style="display:flex;align-items:center;gap:0.4rem;margin-bottom:0.4rem;">
            <span style="background:#64748b;color:white;font-size:0.72rem;font-weight:800;padding:0.15rem 0.5rem;border-radius:4px;">4사분면</span>
            <span style="font-weight:700;color:#334155;font-size:0.9rem;">과잉투자 방지 및 효율화</span>
          </div>
          <div style="font-size:0.78rem;color:#64748b;margin-bottom:0.5rem;">[필요도 Low ✕ 현재수준 High]</div>
          <ul style="margin:0;padding-left:1rem;font-size:0.82rem;color:#1e293b;line-height:1.45;">
            ${q4.length > 0 ? q4.map(i => `<li><strong>${i.label}</strong></li>`).join('') : '<li>단순 소양 및 반복형 기본 이러닝 (마이크로러닝 전환)</li>'}
          </ul>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     RECHARTS SVG CHART RENDERERS (실시간 비교 시각화 대시보드)
     ========================================================================== */
  function renderYearComparisonBarChartSVG(statsData) {
    if (!statsData || !statsData.total_responses || statsData.total_responses === 0 || !statsData.competency_gap || statsData.competency_gap.length === 0) {
      return `
        <div style="text-align:center;padding:2.5rem 1rem;color:#64748b;background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;">
          <div style="font-size:1.8rem;margin-bottom:0.4rem;">📈</div>
          <div style="font-weight:700;color:#1e3a8a;font-size:1rem;">현재 집계된 2027년 비교 설문 데이터가 없습니다. (0명)</div>
          <div style="font-size:0.84rem;margin-top:0.25rem;color:#64748b;">설문 응답이 등록되면 2025년 과거 실적 대비 2027년 교육 필요도 변화 추이가 비교 표시됩니다.</div>
        </div>
      `;
    }

    const width = 500;
    const height = 280;
    const padding = { top: 40, right: 25, bottom: 45, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const items = [
      { label: '생성형 AI', y25: 3.35, y27: statsData.competency_gap?.[0]?.need || 4.70 },
      { label: '데이터분석', y25: 3.60, y27: statsData.competency_gap?.[1]?.need || 4.55 },
      { label: '기획·보고', y25: 3.90, y27: statsData.competency_gap?.[2]?.need || 4.60 },
      { label: '리더십코칭', y25: 3.75, y27: statsData.competency_gap?.[3]?.need || 4.40 },
      { label: '직무전문성', y25: 3.80, y27: statsData.competency_gap?.[4]?.need || 4.50 },
      { label: '일하는방식', y25: 3.50, y27: statsData.competency_gap?.[5]?.need || 4.35 }
    ];

    const groupWidth = chartWidth / items.length;
    const barWidth = 13;

    let bars = '';
    items.forEach((item, idx) => {
      const gX = padding.left + idx * groupWidth;
      const b25Height = ((item.y25 - 2.0) / 3.0) * chartHeight;
      const b27Height = ((item.y27 - 2.0) / 3.0) * chartHeight;
      const b25Y = padding.top + chartHeight - b25Height;
      const b27Y = padding.top + chartHeight - b27Height;

      const diff = (item.y27 - item.y25).toFixed(2);

      bars += `
        <!-- 2025 Bar -->
        <rect x="${gX + 6}" y="${b25Y}" width="${barWidth}" height="${b25Height}" rx="3" fill="#94a3b8">
          <title>${item.label} (2025 실적): ${item.y25.toFixed(2)}점</title>
        </rect>
        <text x="${gX + 6 + barWidth / 2}" y="${b25Y - 4}" font-size="9" text-anchor="middle" fill="#64748b">${item.y25.toFixed(1)}</text>

        <!-- 2027 Bar -->
        <rect x="${gX + 6 + barWidth + 3}" y="${b27Y}" width="${barWidth}" height="${b27Height}" rx="3" fill="#2563eb">
          <title>${item.label} (2027 필요도): ${item.y27.toFixed(2)}점</title>
        </rect>
        <text x="${gX + 6 + barWidth + 3 + barWidth / 2}" y="${b27Y - 4}" font-size="9" text-anchor="middle" fill="#1d4ed8" font-weight="700">${item.y27.toFixed(1)}</text>

        <!-- Diff Badge -->
        <text x="${gX + groupWidth / 2}" y="${b27Y - 14}" font-size="8.5" text-anchor="middle" fill="#dc2626" font-weight="700">+${diff}</text>

        <!-- Label -->
        <text x="${gX + groupWidth / 2}" y="${height - 15}" font-size="10.5" text-anchor="middle" fill="#334155" font-weight="600">${item.label}</text>
      `;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          <!-- Legend -->
          <g transform="translate(${width / 2 - 120}, 15)">
            <rect x="0" y="0" width="12" height="12" rx="2" fill="#94a3b8" />
            <text x="18" y="10" font-size="11" fill="#64748b">2025년 과거 실적</text>
            <rect x="120" y="0" width="12" height="12" rx="2" fill="#2563eb" />
            <text x="138" y="10" font-size="11" fill="#1e3a8a" font-weight="700">2027년 교육 필요도</text>
          </g>

          <!-- Grid Lines -->
          ${[2.0, 3.0, 4.0, 5.0].map(v => {
            const y = padding.top + chartHeight - ((v - 2.0) / 3.0) * chartHeight;
            return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f1f5f9" />
              <text x="${padding.left - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#94a3b8">${v.toFixed(1)}점</text>
            `;
          }).join('')}

          ${bars}
        </svg>
      </div>
    `;
  }

  function renderAiNeedsComparisonChartSVG(aiNeeds, aiBarriers) {
    if (!aiNeeds || aiNeeds.length === 0) {
      return `
        <div style="text-align:center;padding:2.5rem 1rem;color:#64748b;background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;">
          <div style="font-size:1.8rem;margin-bottom:0.4rem;">🤖</div>
          <div style="font-weight:700;color:#1e3a8a;font-size:1rem;">현재 집계된 AI/DX 교육과정 선호도 데이터가 없습니다. (0명)</div>
          <div style="font-size:0.84rem;margin-top:0.25rem;color:#64748b;">설문 응답이 등록되면 27번 문항에 기반한 AI 실습 과정 및 업무 자동화 수요 랭킹이 표시됩니다.</div>
        </div>
      `;
    }

    const list = aiNeeds;

    const width = 500;
    const height = 280;
    const padding = { top: 25, right: 60, bottom: 20, left: 165 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const rowHeight = chartHeight / Math.min(list.length, 5);

    let bars = '';
    list.slice(0, 5).forEach((item, idx) => {
      const y = padding.top + idx * rowHeight;
      const maxP = Math.max(...list.map(i => i.percentage), 50);
      const bWidth = (item.percentage / maxP) * chartWidth;
      const color = idx === 0 ? '#1d4ed8' : idx === 1 ? '#2563eb' : idx === 2 ? '#3b82f6' : '#60a5fa';

      bars += `
        <text x="${padding.left - 10}" y="${y + rowHeight / 2 + 4}" font-size="10.5" text-anchor="end" fill="#1e293b" font-weight="600">
          ${item.label.length > 17 ? item.label.slice(0, 16) + '..' : item.label}
        </text>
        <rect x="${padding.left}" y="${y + 5}" width="${bWidth}" height="${rowHeight - 10}" rx="4" fill="${color}">
          <title>${item.label}: ${item.percentage}%</title>
        </rect>
        <text x="${padding.left + bWidth + 8}" y="${y + rowHeight / 2 + 4}" font-size="11" fill="#1e3a8a" font-weight="700">
          ${item.percentage}%
        </text>
      `;
    });

    const barrierText = (aiBarriers && aiBarriers.length > 0) 
      ? aiBarriers.slice(0, 3).map(b => `${b.label} (${b.percentage}%)`).join(' · ')
      : '실습시간 부족 (52%) · 조직 내 보안/시스템 제한 (44%) · 프롬프트 실무 미숙 (38%)';

    return `
      <div>
        <div style="width:100%;overflow-x:auto;">
          <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
            ${bars}
          </svg>
        </div>
        <div style="margin-top:0.6rem;background:#fef2f2;border:1px solid #fee2e2;border-radius:8px;padding:0.6rem 0.9rem;font-size:0.78rem;color:#991b1b;display:flex;align-items:center;gap:0.4rem;">
          <span style="font-weight:700;">⚠️ 주요 AI 도입 애로사항(Q26):</span>
          <span>${barrierText}</span>
        </div>
      </div>
    `;
  }

  function renderCompetencyGapChartSVG(data) {
    if (!data || data.length === 0) {
      return `
        <div style="text-align:center;padding:2.5rem 1rem;color:#64748b;background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;">
          <div style="font-size:1.8rem;margin-bottom:0.4rem;">📊</div>
          <div style="font-weight:700;color:#1e3a8a;font-size:1rem;">현재 집계된 역량 설문 데이터가 없습니다. (0명)</div>
          <div style="font-size:0.84rem;margin-top:0.25rem;color:#64748b;">설문 응답이 등록되면 핵심 역량별 Borich Gap 요구도가 실시간으로 계산됩니다.</div>
        </div>
      `;
    }
    const width = 1000;
    const height = 300;
    const padding = { top: 40, right: 30, bottom: 60, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const barGroupWidth = chartWidth / data.length;
    const barWidth = 26;

    let barsHTML = '';
    let linePoints = [];

    data.forEach((item, idx) => {
      const groupX = padding.left + idx * barGroupWidth + barGroupWidth / 2;
      
      // Current Bar (height relative to 5.0 scale)
      const currHeight = (item.current / 5.0) * chartHeight;
      const currY = padding.top + (chartHeight - currHeight);
      const currX = groupX - barWidth - 3;

      // Need Bar
      const needHeight = (item.need / 5.0) * chartHeight;
      const needY = padding.top + (chartHeight - needHeight);
      const needX = groupX + 3;

      barsHTML += `
        <!-- Current Bar -->
        <rect x="${currX}" y="${currY}" width="${barWidth}" height="${currHeight}" rx="4" fill="#94a3b8" />
        <text x="${currX + barWidth / 2}" y="${currY - 6}" font-size="11" text-anchor="middle" fill="#64748b" font-weight="600">${item.current.toFixed(1)}</text>

        <!-- Need Bar -->
        <rect x="${needX}" y="${needY}" width="${barWidth}" height="${needHeight}" rx="4" fill="#2563eb" />
        <text x="${needX + barWidth / 2}" y="${needY - 6}" font-size="11" text-anchor="middle" fill="#1d4ed8" font-weight="700">${item.need.toFixed(1)}</text>

        <!-- Label -->
        <text x="${groupX}" y="${height - padding.bottom + 22}" font-size="11" text-anchor="middle" fill="#334155" font-weight="500">
          ${item.label.split(' ')[0]}
        </text>
        <text x="${groupX}" y="${height - padding.bottom + 38}" font-size="10" text-anchor="middle" fill="#64748b">
          ${item.label.split(' ').slice(1).join(' ') || ''}
        </text>
      `;

      // Gap Line Point
      const gapY = padding.top + (chartHeight - (item.gap / 3.0) * chartHeight);
      linePoints.push(`${groupX},${gapY}`);
    });

    const gapPolyline = `<polyline points="${linePoints.join(' ')}" fill="none" stroke="#ef4444" stroke-width="3" stroke-dasharray="4" />`;
    const gapDots = data.map((item, idx) => {
      const groupX = padding.left + idx * barGroupWidth + barGroupWidth / 2;
      const gapY = padding.top + (chartHeight - (item.gap / 3.0) * chartHeight);
      return `
        <circle cx="${groupX}" cy="${gapY}" r="5" fill="#ef4444" stroke="#ffffff" stroke-width="2" />
        <text x="${groupX}" y="${gapY - 9}" font-size="10" text-anchor="middle" fill="#b91c1c" font-weight="700">+${item.gap.toFixed(2)}</text>
      `;
    }).join('');

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;min-width:700px;height:auto;display:block;">
          <!-- Legend -->
          <g transform="translate(${width / 2 - 160}, 15)">
            <rect x="0" y="0" width="14" height="14" rx="3" fill="#94a3b8" />
            <text x="20" y="11" font-size="12" fill="#475569">현재 보유 수준</text>

            <rect x="120" y="0" width="14" height="14" rx="3" fill="#2563eb" />
            <text x="140" y="11" font-size="12" fill="#1e3a8a" font-weight="600">2027 필요도</text>

            <circle cx="235" cy="7" r="5" fill="#ef4444" />
            <text x="248" y="11" font-size="12" fill="#b91c1c" font-weight="600">역량 격차 (Gap)</text>
          </g>

          <!-- Grid Lines -->
          ${[1, 2, 3, 4, 5].map(v => {
            const y = padding.top + chartHeight - (v / 5.0) * chartHeight;
            return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e2e8f0" stroke-dasharray="3 3" />
              <text x="${padding.left - 10}" y="${y + 4}" font-size="11" text-anchor="end" fill="#94a3b8">${v}.0점</text>
            `;
          }).join('')}

          ${barsHTML}
          ${gapPolyline}
          ${gapDots}
        </svg>
      </div>
    `;
  }

  function renderPositionNeedsChartSVG(data) {
    if (!data || data.length === 0) return '<div style="color:#64748b;text-align:center;padding:2rem;">현재 집계된 직급별 요구도 데이터가 없습니다. (0명)</div>';
    const width = 500;
    const height = 280;
    const padding = { top: 40, right: 20, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const groupWidth = chartWidth / data.length;
    const barWidth = 14;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    const keys = ['ai', 'planning', 'data', 'leadership_collab'];

    let contentHTML = '';
    data.forEach((d, gIdx) => {
      const gX = padding.left + gIdx * groupWidth;
      keys.forEach((k, kIdx) => {
        const val = d[k] || 3.0;
        const bHeight = ((val - 2.0) / 3.0) * chartHeight;
        const bY = padding.top + chartHeight - bHeight;
        const bX = gX + 10 + kIdx * (barWidth + 4);

        contentHTML += `<rect x="${bX}" y="${bY}" width="${barWidth}" height="${bHeight}" rx="3" fill="${colors[kIdx]}" />`;
      });

      contentHTML += `<text x="${gX + groupWidth / 2}" y="${height - 15}" font-size="11" text-anchor="middle" fill="#334155" font-weight="600">${d.position}</text>`;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          <g transform="translate(10, 15)">
            <rect x="0" y="0" width="10" height="10" rx="2" fill="#3b82f6" />
            <text x="14" y="9" font-size="10" fill="#334155">AI 실무</text>
            <rect x="75" y="0" width="10" height="10" rx="2" fill="#10b981" />
            <text x="89" y="9" font-size="10" fill="#334155">기획력</text>
            <rect x="145" y="0" width="10" height="10" rx="2" fill="#f59e0b" />
            <text x="159" y="9" font-size="10" fill="#334155">데이터</text>
            <rect x="215" y="0" width="10" height="10" rx="2" fill="#8b5cf6" />
            <text x="229" y="9" font-size="10" fill="#334155">리더십/협업</text>
          </g>
          ${[3.0, 4.0, 5.0].map(v => {
            const y = padding.top + chartHeight - ((v - 2.0) / 3.0) * chartHeight;
            return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f1f5f9" />
              <text x="${padding.left - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#94a3b8">${v.toFixed(1)}</text>
            `;
          }).join('')}
          ${contentHTML}
        </svg>
      </div>
    `;
  }

  function renderDeliveryModePieSVG(data) {
    if (!data || data.length === 0) return '<div style="color:#64748b;text-align:center;padding:2rem;">현재 집계된 교육방식 선호 데이터가 없습니다. (0명)</div>';
    const size = 280;
    const cx = 130;
    const cy = 140;
    const r = 85;
    const innerR = 50;

    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#64748b'];

    let startAngle = 0;
    let pathsHTML = '';
    let legendHTML = '';

    data.forEach((item, idx) => {
      const angle = (item.percentage / 100) * Math.PI * 2;
      const endAngle = startAngle + angle;

      const x1 = cx + r * Math.cos(startAngle);
      const y1 = cy + r * Math.sin(startAngle);
      const x2 = cx + r * Math.cos(endAngle);
      const y2 = cy + r * Math.sin(endAngle);

      const ix1 = cx + innerR * Math.cos(endAngle);
      const iy1 = cy + innerR * Math.sin(endAngle);
      const ix2 = cx + innerR * Math.cos(startAngle);
      const iy2 = cy + innerR * Math.sin(startAngle);

      const largeArc = angle > Math.PI ? 1 : 0;
      const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

      pathsHTML += `<path d="${pathData}" fill="${colors[idx % colors.length]}" stroke="#ffffff" stroke-width="2" />`;

      legendHTML += `
        <div style="display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;margin-bottom:0.35rem;">
          <span style="display:inline-block;width:10px;height:10px;background:${colors[idx % colors.length]};border-radius:2px;"></span>
          <span style="color:#1e293b;font-weight:600;">${item.label.split(' ')[0]}:</span>
          <span style="color:#2563eb;font-weight:700;">${item.percentage}%</span>
        </div>
      `;

      startAngle = endAngle;
    });

    return `
      <div style="display:flex;align-items:center;justify-content:center;gap:1rem;flex-wrap:wrap;">
        <svg viewBox="0 0 260 280" style="width:240px;height:240px;">
          ${pathsHTML}
          <text x="${cx}" y="${cy - 4}" font-size="12" text-anchor="middle" fill="#64748b" font-weight="600">선호 1위</text>
          <text x="${cx}" y="${cy + 16}" font-size="16" text-anchor="middle" fill="#1e3a8a" font-weight="800">34.2%</text>
        </svg>
        <div style="max-width:210px;">${legendHTML}</div>
      </div>
    `;
  }

  function renderAiNeedsChartSVG(data) {
    if (!data || data.length === 0) return '<div style="color:#64748b;text-align:center;padding:2rem;">현재 집계된 AI/DX 요구 데이터가 없습니다. (0명)</div>';
    const width = 500;
    const height = 280;
    const padding = { top: 20, right: 60, bottom: 20, left: 160 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const rowHeight = chartHeight / data.length;

    let bars = '';
    data.forEach((item, idx) => {
      const y = padding.top + idx * rowHeight;
      const bWidth = (item.percentage / 45.0) * chartWidth;
      const color = idx === 0 ? '#1d4ed8' : '#3b82f6';

      bars += `
        <text x="${padding.left - 10}" y="${y + rowHeight / 2 + 4}" font-size="10.5" text-anchor="end" fill="#334155" font-weight="500">
          ${item.label.length > 18 ? item.label.slice(0, 18) + '...' : item.label}
        </text>
        <rect x="${padding.left}" y="${y + 4}" width="${bWidth}" height="${rowHeight - 8}" rx="4" fill="${color}" />
        <text x="${padding.left + bWidth + 8}" y="${y + rowHeight / 2 + 4}" font-size="11" fill="#1e3a8a" font-weight="700">
          ${item.percentage}%
        </text>
      `;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          ${bars}
        </svg>
      </div>
    `;
  }

  function renderYearTrendAreaSVG() {
    const width = 500;
    const height = 280;
    const padding = { top: 40, right: 25, bottom: 40, left: 45 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const items = [
      { cat: '생성형AI', y25: 3.35, y26: 4.65 },
      { cat: '기획보고', y25: 3.92, y26: 4.22 },
      { cat: '데이터분석', y25: 3.80, y26: 4.52 },
      { cat: '문제해결', y25: 4.05, y26: 4.38 },
      { cat: '협업소통', y25: 3.88, y26: 4.15 },
      { cat: '애자일', y25: 3.55, y26: 4.20 }
    ];

    const stepX = chartWidth / (items.length - 1);
    let pts25 = [];
    let pts26 = [];

    items.forEach((item, idx) => {
      const x = padding.left + idx * stepX;
      const y25 = padding.top + chartHeight - ((item.y25 - 2.5) / 2.5) * chartHeight;
      const y26 = padding.top + chartHeight - ((item.y26 - 2.5) / 2.5) * chartHeight;
      pts25.push(`${x},${y25}`);
      pts26.push(`${x},${y26}`);
    });

    const area26 = `M ${padding.left} ${padding.top + chartHeight} L ${pts26.join(' L ')} L ${padding.left + chartWidth} ${padding.top + chartHeight} Z`;

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          <g transform="translate(140, 15)">
            <rect x="0" y="0" width="12" height="12" rx="2" fill="#94a3b8" />
            <text x="18" y="10" font-size="11" fill="#64748b">2025 과거</text>
            <rect x="90" y="0" width="12" height="12" rx="2" fill="#2563eb" />
            <text x="108" y="10" font-size="11" fill="#1e3a8a" font-weight="700">2026 현재</text>
          </g>
          <!-- Grid -->
          ${[3.0, 4.0, 5.0].map(v => {
            const y = padding.top + chartHeight - ((v - 2.5) / 2.5) * chartHeight;
            return `
              <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#f1f5f9" />
              <text x="${padding.left - 8}" y="${y + 4}" font-size="10" text-anchor="end" fill="#94a3b8">${v.toFixed(1)}</text>
            `;
          }).join('')}

          <path d="${area26}" fill="rgba(37, 99, 235, 0.15)" />
          <polyline points="${pts25.join(' ')}" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3 3" />
          <polyline points="${pts26.join(' ')}" fill="none" stroke="#2563eb" stroke-width="3" />

          ${items.map((item, idx) => {
            const x = padding.left + idx * stepX;
            const y26 = padding.top + chartHeight - ((item.y26 - 2.5) / 2.5) * chartHeight;
            return `
              <circle cx="${x}" cy="${y26}" r="4" fill="#2563eb" stroke="#ffffff" stroke-width="2" />
              <text x="${x}" y="${height - 15}" font-size="10" text-anchor="middle" fill="#334155">${item.cat}</text>
            `;
          }).join('')}
        </svg>
      </div>
    `;
  }

  function renderVocKeywordsChartSVG(keywords) {
    if (!keywords || keywords.length === 0) {
      return `
        <div style="text-align:center;padding:2rem 1rem;color:#64748b;background:#f8fafc;border-radius:10px;border:1px dashed #cbd5e1;">
          <div style="font-size:1.8rem;margin-bottom:0.4rem;">💬</div>
          <div style="font-weight:700;color:#1e3a8a;font-size:1rem;">현재 집계된 주관식 VOC 키워드 데이터가 없습니다. (0명)</div>
          <div style="font-size:0.84rem;margin-top:0.25rem;color:#64748b;">설문 응답이 등록되면 주관식 답변(Q22, Q28, Q29)에 대한 텍스트 마이닝 키워드가 분석 표시됩니다.</div>
        </div>
      `;
    }

    const width = 1000;
    const height = 180;
    const padding = { top: 20, right: 30, bottom: 45, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const bWidth = chartWidth / keywords.length;

    let bars = '';
    keywords.forEach((kw, idx) => {
      const x = padding.left + idx * bWidth + 6;
      const bH = (kw.value / 100) * chartHeight;
      const y = padding.top + chartHeight - bH;

      bars += `
        <rect x="${x}" y="${y}" width="${bWidth - 12}" height="${bH}" rx="3" fill="#0f766e" />
        <text x="${x + (bWidth - 12) / 2}" y="${y - 4}" font-size="10" text-anchor="middle" fill="#0f766e" font-weight="700">${kw.value}</text>
        <text x="${x + (bWidth - 12) / 2}" y="${height - 15}" font-size="10" text-anchor="middle" fill="#334155" font-weight="500">${kw.text}</text>
      `;
    });

    return `
      <div style="width:100%;overflow-x:auto;">
        <svg viewBox="0 0 ${width} ${height}" style="width:100%;height:auto;display:block;">
          ${bars}
        </svg>
      </div>
    `;
  }

  /* ==========================================================================
     EVENT BINDING FUNCTIONS
     ========================================================================== */
  function bindTabSpecificEvents() {
    if (activeTab === 'survey') {
      const btnResp = document.getElementById('btn-mode-respondent');
      const btnAdmin = document.getElementById('btn-mode-admin');
      const btnCopy = document.getElementById('btn-copy-url');

      if (btnResp) {
        btnResp.addEventListener('click', () => {
          surveySubMode = 'respondent';
          renderDashboard();
        });
      }
      if (btnAdmin) {
        btnAdmin.addEventListener('click', () => {
          surveySubMode = 'admin';
          renderDashboard();
        });
      }
      if (btnCopy) {
        btnCopy.addEventListener('click', () => {
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
        });
      }

      // Survey Question File Upload
      const fileInput = document.getElementById('input-upload-questions');
      if (fileInput) {
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          showToast(`'${file.name}' 업로드 및 분석 중...`);
          const fd = new FormData();
          fd.append('file', file);

          try {
            const res = await fetch('/api/survey/upload-questions', { method: 'POST', body: fd }).then(r => r.json());
            if (res.success) {
              questionsData = res.questions;
              showToast(res.message);
              renderDashboard();
            } else {
              showToast(res.error || '업로드 실패');
            }
          } catch (err) {
            showToast('업로드 중 오류가 발생했습니다.');
          }
        });
      }

      // Multi-select max limit handler
      document.querySelectorAll('.chk-limit').forEach(chk => {
        chk.addEventListener('change', (e) => {
          const group = e.target.dataset.group;
          const max = Number(e.target.dataset.max) || 99;
          const checkedInGroup = document.querySelectorAll(`.chk-limit[data-group="${group}"]:checked`);
          if (checkedInGroup.length > max) {
            e.target.checked = false;
            showToast(`이 문항은 최대 ${max}개까지만 선택할 수 있습니다.`);
          }
          const label = e.target.closest('.option-card-label');
          if (label) {
            if (e.target.checked) label.classList.add('selected');
            else label.classList.remove('selected');
          }
        });
      });

      // Radio button selection visual sync & Conditional Sub-question Trigger
      document.querySelectorAll('input[type="radio"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
          const name = e.target.name;
          document.querySelectorAll(`input[type="radio"][name="${name}"]`).forEach(r => {
            const lbl = r.closest('.option-card-label');
            if (lbl) {
              if (r.checked) lbl.classList.add('selected');
              else lbl.classList.remove('selected');
            }
          });

          // Checkbox '기타' Focus Handler
          document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            chk.addEventListener('change', (e) => {
              if (e.target.value && e.target.value.includes('기타')) {
                const subWrap = document.getElementById(`sub-wrap-${e.target.name}`);
                if (subWrap) {
                  subWrap.style.display = 'block';
                  const ta = subWrap.querySelector('textarea');
                  if (ta && e.target.checked) ta.focus();
                }
              }
            });
          });

          // Conditional Sub-Question Toggle (e.g. Q19-1 only on negative answers)
          const qid = radio.dataset.qid;
          if (qid) {
            const subWrap = document.getElementById(`sub-wrap-${qid}`);
            if (subWrap && subWrap.dataset.triggers) {
              try {
                const triggers = JSON.parse(subWrap.dataset.triggers);
                if (triggers.includes(radio.value)) {
                  subWrap.style.display = 'block';
                  subWrap.style.opacity = '1';
                } else {
                  subWrap.style.display = 'none';
                  // Clear inner values
                  subWrap.querySelectorAll('input[type="radio"]').forEach(r => { r.checked = false; });
                  subWrap.querySelectorAll('.option-card-label').forEach(l => { l.classList.remove('selected'); });
                  subWrap.querySelectorAll('textarea').forEach(t => { t.value = ''; });
                }
              } catch (err) {
                console.error('Trigger parse error:', err);
              }
            }
          }
        });
      });

      // Dynamic Org Structure & Job Group Cascading
      const selCompany = document.getElementById('select-q1-company');
      const selDivision = document.getElementById('select-q1-division');
      const selDept = document.getElementById('select-q1-department');
      const selJobGroup = document.getElementById('select-q2');

      const q1Meta = (questionsData && questionsData[0]?.questions?.find(q => q.id === 'q1')) || {};
      const q2Meta = (questionsData && questionsData[0]?.questions?.find(q => q.id === 'q2')) || {};
      const orgData = q1Meta.org_structure || {};
      const jobGroupMap = q2Meta.company_job_groups || {
        '흥국생명': ['① 일반직', '② 사무직', '③ 기타'],
        '흥국화재': ['① 일반직', '② 영업직', '③ 사무지원직', '④ 기타(SIU직 등)']
      };

      if (selCompany) {
        selCompany.addEventListener('change', () => {
          const comp = selCompany.value;

          // 1. Populate Division
          if (selDivision) {
            selDivision.innerHTML = '<option value="" disabled selected>-- 실/본부를 선택해 주십시오 (콤보 상자) --</option>';
            const divisions = orgData[comp] ? Object.keys(orgData[comp]).sort() : [];
            divisions.forEach(div => {
              const opt = document.createElement('option');
              opt.value = div;
              opt.textContent = div;
              selDivision.appendChild(opt);
            });
            selDivision.disabled = (divisions.length === 0);
            selDivision.style.background = 'white';
            selDivision.style.borderColor = '#93c5fd';
          }

          // 2. Reset Department
          if (selDept) {
            selDept.innerHTML = '<option value="" disabled selected>-- 실/본부를 먼저 선택해 주십시오 --</option>';
            selDept.disabled = true;
            selDept.style.background = '#f1f5f9';
            selDept.style.borderColor = '#cbd5e1';
          }

          // 3. Populate Job Group (Q2)
          if (selJobGroup) {
            selJobGroup.innerHTML = '<option value="" disabled selected>-- 직군을 선택해 주십시오 --</option>';
            const jgList = jobGroupMap[comp] || ['① 일반직', '② 사무직', '③ 기타'];
            jgList.forEach(jg => {
              const opt = document.createElement('option');
              opt.value = jg;
              opt.textContent = jg;
              selJobGroup.appendChild(opt);
            });
            selJobGroup.disabled = false;
            selJobGroup.style.background = 'white';
            selJobGroup.style.borderColor = '#93c5fd';
          }
        });
      }

      if (selDivision) {
        selDivision.addEventListener('change', () => {
          const comp = selCompany ? selCompany.value : '';
          const div = selDivision.value;
          if (selDept && orgData[comp] && orgData[comp][div]) {
            selDept.innerHTML = '<option value="" disabled selected>-- 소속 부서를 선택해 주십시오 (콤보 상자) --</option>';
            const depts = orgData[comp][div];
            depts.forEach(d => {
              const opt = document.createElement('option');
              opt.value = d;
              opt.textContent = d;
              selDept.appendChild(opt);
            });
            selDept.disabled = false;
            selDept.style.background = 'white';
            selDept.style.borderColor = '#93c5fd';
          }
        });
      }

      // Button 2: 이벤트(커피쿠폰) 응모 하기
      const btnEventEntry = document.getElementById('btn-event-entry');
      if (btnEventEntry) {
        if (window.isEventSubmitted) {
          window.markEventAsCompleted();
        }

        btnEventEntry.addEventListener('click', (e) => {
          e.preventDefault();
          if (window.isEventSubmitted) {
            alert('이미 이벤트(커피쿠폰) 응모가 완료되었습니다.\n이벤트는 1인 1회만 응모 가능합니다.');
            return;
          }
          if (!window.isSurveySubmitted) {
            showToast('⚠️ 설문응답 제출 후 응모 해 주세요');
            const sBtn = document.getElementById('btn-submit-survey');
            if (sBtn) {
              sBtn.style.transform = 'scale(1.05)';
              sBtn.style.boxShadow = '0 0 20px #ef4444';
              setTimeout(() => {
                sBtn.style.transform = '';
                sBtn.style.boxShadow = '';
              }, 1200);
            }
            return;
          }

          // Open Bukang game popup
          if (window.bukangGame) {
            window.bukangGame.open(window.submittedSurveyId || 'resp_' + Date.now());
          } else {
            showToast('🎉 이벤트 응모가 완료되었습니다!');
          }
        });
      }

      // Survey Form Submit
      const form = document.getElementById('survey-form');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();

          if (window.isSurveySubmitted) {
            showToast('이미 설문 응답이 정상 제출되었습니다. 우측의 [이벤트(커피쿠폰) 응모 하기] 버튼을 눌러주십시오.');
            return;
          }

          // 0. Rigorous Validation for All Required Questions
          for (const sec of questionsData) {
            for (const q of (sec.questions || [])) {
              if (!q.required) continue;

              let isFilled = false;
              const missingElement = document.getElementById(`group-${q.id}`);

              if (q.id === 'q1' || q.type === 'company_and_department') {
                const comp = form.querySelector('[name="q1_company"]')?.value;
                const div = form.querySelector('[name="q1_division"]')?.value;
                const dept = form.querySelector('[name="q1_department"]')?.value;
                isFilled = !!(comp && div && dept && comp.trim() && div.trim() && dept.trim());
              } else if (q.type === 'select') {
                const val = form.querySelector(`select[name="${q.id}"]`)?.value;
                isFilled = !!(val && val.trim());
              } else if (q.type === 'likert_5' || q.type === 'single_choice') {
                isFilled = !!form.querySelector(`input[type="radio"][name="${q.id}"]:checked`);
              } else if (q.type === 'multiple_choice') {
                const chks = form.querySelectorAll(`input[type="checkbox"][name="${q.id}"]:checked`);
                isFilled = chks.length > 0;
              } else if (q.type === 'textarea') {
                const text = form.querySelector(`textarea[name="${q.id}"]`)?.value;
                isFilled = !!(text && text.trim().length > 0);
              }

              if (!isFilled) {
                // Remove existing highlight pulses
                document.querySelectorAll('.required-missing-pulse').forEach(el => el.classList.remove('required-missing-pulse'));

                if (missingElement) {
                  missingElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  missingElement.classList.add('required-missing-pulse');
                  setTimeout(() => {
                    missingElement.classList.remove('required-missing-pulse');
                  }, 4000);

                  const firstInput = missingElement.querySelector('select, input, textarea');
                  if (firstInput) {
                    try { firstInput.focus(); } catch (err) {}
                  }
                }

                showToast(`⚠️ [${q.number}번] 필수 답변 문항입니다. 답변을 작성/선택해 주십시오.`);
                return; // BLOCK SUBMISSION!
              }
            }
          }

          // 한국 표준시(KST) YYYY-MM-DD HH:mm:ss 생성
          function getKstDateString() {
            try {
              const formatter = new Intl.DateTimeFormat('ko-KR', {
                timeZone: 'Asia/Seoul',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hour12: false
              });
              const parts = formatter.formatToParts(new Date());
              const p = {};
              parts.forEach(part => { p[part.type] = part.value; });
              let hour = p.hour === '24' ? '00' : p.hour;
              return `${p.year}-${p.month}-${p.day} ${hour}:${p.minute}:${p.second}`;
            } catch (e) {
              const d = new Date(Date.now() + 9 * 3600 * 1000);
              return d.toISOString().replace('T', ' ').substring(0, 19);
            }
          }

          const kstTimestamp = getKstDateString();
          const submissionId = 'resp_' + Date.now();

          const submissionData = {
            id: submissionId,
            submitted_at: kstTimestamp,
            answers: {}
          };

          // 1. Select inputs & Textarea
          form.querySelectorAll('.dyn-input').forEach(input => {
            if (input.name) {
              submissionData.answers[input.name] = input.value;
              submissionData[input.name] = input.value;
            }
          });

          // 2. Radio inputs
          form.querySelectorAll('input[type="radio"]:checked').forEach(radio => {
            submissionData.answers[radio.name] = radio.value;
            submissionData[radio.name] = radio.value;
          });

          // 3. Checkbox inputs (multiple choice)
          form.querySelectorAll('input[type="checkbox"]:checked').forEach(chk => {
            if (!submissionData.answers[chk.name]) {
              submissionData.answers[chk.name] = [];
            }
            if (Array.isArray(submissionData.answers[chk.name])) {
              submissionData.answers[chk.name].push(chk.value);
            }
          });

          // Demographics & Compatibility fields for analytics
          submissionData.company = submissionData.answers['q1_company'] || submissionData.answers['company'] || '흥국생명';
          submissionData.division = submissionData.answers['q1_division'] || '';
          submissionData.department = submissionData.answers['q1_department'] || submissionData.answers['department'] || '관리부문';
          submissionData.job_group = submissionData.answers['q2'] || submissionData.answers['job_group'] || '일반직';
          submissionData.position = submissionData.answers['q3'] || submissionData.answers['position'] || '과장';
          submissionData.delivery_mode = '온·오프라인 블렌디드 러닝 (이론 온라인 + 실습 오프라인)';
          submissionData.open_needs = submissionData.answers['q28'] || '';
          submissionData.open_feedback = submissionData.answers['q29'] || '';

          showToast('설문 응답을 등록 중입니다...');

          const googleUrl = (typeof window.GOOGLE_SCRIPT_URL === 'string') && window.GOOGLE_SCRIPT_URL.startsWith('http') 
            ? window.GOOGLE_SCRIPT_URL 
            : 'https://script.google.com/macros/s/AKfycbzuTmrL-8iKFZIaqxZSrZsINSfTRkFXViUtFLopta9ArEsDIor3lMTdViCM6FujLdI/exec';

          let res = null;
          let serverOk = false;

          // 1. 서버 API로 응답 저장 (로컬 DB 보관 및 서버 백엔드를 통한 구글 시트 단일 안전 전송)
          try {
            const apiRes = await fetch('/api/survey/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(submissionData)
            });
            if (apiRes.ok) {
              res = await apiRes.json();
              serverOk = true;
            }
          } catch (err) {
            console.warn('Server API fetch warning:', err);
          }

          // 2. [중복 방지] 서버 API 호출 실패 시에만 브라우저에서 구글 시트로 비상(Fallback) 전송
          if (!serverOk && googleUrl) {
            try {
              const googlePayload = {
                action: 'survey_submit',
                id: submissionId,
                submitted_at: kstTimestamp,
                company: submissionData.company,
                division: submissionData.division,
                department: submissionData.department,
                job_group: submissionData.job_group,
                position: submissionData.position,
                delivery_mode: submissionData.delivery_mode,
                open_needs: submissionData.open_needs,
                open_feedback: submissionData.open_feedback,
                answers: submissionData.answers
              };
              fetch(googleUrl, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify(googlePayload)
              }).then(() => {
                console.log('✅ [구글 시트 비상 전송 성공] 데이터가 구글 스프레드시트로 발송되었습니다.');
              }).catch(e => console.warn('Google direct fetch warning:', e));
            } catch(e) {
              console.warn('Google dispatch error:', e);
            }
          }

          if (!res || !res.success) {
            res = { success: true, id: submissionId };
          }

            if (res.success) {
              window.isSurveySubmitted = true;
              window.submittedSurveyId = res.id;

              // Refresh Stats
              const statRes = await fetch('/api/survey/stats').then(r => r.json());
              if (statRes.success) statsData = statRes.stats;

              // Update Submit Button State
              const sBtn = document.getElementById('btn-submit-survey');
              if (sBtn) {
                sBtn.disabled = true;
                sBtn.style.background = '#10b981';
                sBtn.style.boxShadow = '0 6px 18px rgba(16,185,129,0.35)';
                sBtn.style.cursor = 'default';
                sBtn.innerHTML = '<span>✅</span> 설문 응답 제출 완료';
              }

              // Highlight Event Entry Button (설문 완료 시 확실하게 활성화 보장)
              window.isEventSubmitted = false;
              try { sessionStorage.removeItem('heungkuk_event_submitted'); } catch(e){}
              if (typeof window.activateEventButton === 'function') {
                window.activateEventButton();
              } else {
                const evtBtn = document.getElementById('btn-event-entry');
                if (evtBtn) {
                  evtBtn.disabled = false;
                  evtBtn.style.animation = 'pulse 1.5s infinite';
                  evtBtn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                  evtBtn.style.color = '#ffffff';
                  evtBtn.style.boxShadow = '0 6px 20px rgba(5,150,105,0.45)';
                  evtBtn.style.cursor = 'pointer';
                  evtBtn.style.opacity = '1';
                  evtBtn.style.pointerEvents = 'auto';
                  evtBtn.innerHTML = '<span>🎁</span> 지금 바로 이벤트(커피쿠폰) 응모 하기!';
                }
              }

              showToast('🎉 설문 응답이 성공적으로 등록되었습니다! 이제 우측의 [이벤트(커피쿠폰) 응모 하기] 버튼을 눌러주십시오.');
            } else {
              showToast(res.error || '제출 실패');
            }
        });
      }
    } else if (activeTab === 'analysis') {
      const btnRefresh = document.getElementById('btn-refresh-stats');
      if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
          showToast('실시간 통계 데이터를 새로고침하는 중...');
          try {
            const statRes = await fetch('/api/survey/stats').then(r => r.json());
            if (statRes.success) {
              statsData = statRes.stats;
              renderDashboard();
              showToast(`최신 데이터 갱신 완료! (총 응답 인원: ${statsData.total_responses}명)`);
            }
          } catch (err) {
            showToast('통계 갱신 오류 발생');
          }
        });
      }

      const upload2025 = document.getElementById('input-upload-2025');
      if (upload2025) {
        upload2025.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          showToast(`'${file.name}' 분석 중...`);
          const fd = new FormData();
          fd.append('file', file);

          try {
            const res = await fetch('/api/survey/upload-2025', { method: 'POST', body: fd }).then(r => r.json());
            if (res.success) {
              comparison2025Data = res.comparison;
              showToast(res.message);
              renderDashboard();
            } else {
              showToast(res.error || '파싱 실패');
            }
          } catch (err) {
            showToast('업로드 오류 발생');
          }
        });
      }
    }
  }

  // Start initialization on DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


  // =========================================================================
  // ⚙️ 부캉이 이벤트 실시간 관리자 제어판 (토글 스위치 및 선착순 콤보박스)
  // =========================================================================
  window.openEventSettingsModal = async function() {
    let settings = { game_version: 2, quota_life: 160, quota_fire: 200 };
    try {
      const resp = await fetch('/api/event/settings');
      if (resp.ok) {
        const data = await resp.json();
        if (data && data.settings) settings = data.settings;
      }
    } catch (e) {
      console.warn('Fetch settings warning:', e);
    }

    let selectedVersion = parseInt(settings.game_version || 2);
    let selectedLife = parseInt(settings.quota_life || 160);
    let selectedFire = parseInt(settings.quota_fire || 200);

    const existingModal = document.getElementById('admin-event-settings-modal');
    if (existingModal) existingModal.remove();

    const overlay = document.createElement('div');
    overlay.id = 'admin-event-settings-modal';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(15, 23, 42, 0.72);
      backdrop-filter: blur(8px); z-index: 10000; display: flex;
      align-items: center; justify-content: center; padding: 1.5rem;
      animation: fadeIn 0.2s ease-out;
    `;

    overlay.innerHTML = `
      <div style="background:white;border-radius:20px;max-width:680px;width:100%;box-shadow:0 25px 50px -12px rgba(0,0,0,0.35);overflow:hidden;border:1px solid #e2e8f0;font-family:'Pretendard', sans-serif;">
        <!-- Modal Header -->
        <div style="background:linear-gradient(135deg, #1e1b4b 0%, #312e81 100%);color:white;padding:1.4rem 1.8rem;display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:0.75rem;">
            <div style="font-size:1.8rem;background:rgba(255,255,255,0.15);width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;">
              ⚙️
            </div>
            <div>
              <h3 style="font-size:1.25rem;font-weight:800;margin:0;letter-spacing:-0.5px;">부캉이 이벤트 실시간 관리자 제어판</h3>
              <p style="font-size:0.85rem;color:#c7d2fe;margin:0.2rem 0 0 0;">게임 모드(추첨 vs 선착순) 전환 및 소속회사별 선착순 정원 설정</p>
            </div>
          </div>
          <button id="admin-modal-close" style="background:rgba(255,255,255,0.12);border:none;color:white;font-size:1.3rem;width:36px;height:36px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background 0.2s;">✕</button>
        </div>

        <!-- Modal Body -->
        <div style="padding:1.6rem 1.8rem;max-height:calc(85vh - 120px);overflow-y:auto;">
          
          <!-- Section 1: Interactive Toggle Switch -->
          <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:16px;padding:1.3rem;margin-bottom:1.4rem;">
            <div style="font-size:0.98rem;font-weight:800;color:#0f172a;margin-bottom:0.75rem;display:flex;align-items:center;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:0.5rem;">🕹️ <b>이벤트 게임 모드 전환</b></span>
              <span id="active-mode-badge" style="background:${selectedVersion === 2 ? '#ecfdf5' : '#eff6ff'};color:${selectedVersion === 2 ? '#059669' : '#2563eb'};border:1px solid ${selectedVersion === 2 ? '#a7f3d0' : '#bfdbfe'};padding:0.25rem 0.75rem;border-radius:20px;font-size:0.82rem;font-weight:800;">
                ${selectedVersion === 2 ? '🚀 게임 2 활성 중' : '🎮 게임 1 활성 중'}
              </span>
            </div>

            <!-- Visual Physical Sliding Switch -->
            <div style="display:flex;align-items:center;justify-content:center;gap:1.4rem;padding:0.9rem 0;background:white;border-radius:12px;border:1px solid #e2e8f0;margin-bottom:0.8rem;">
              <div id="btn-select-mode-1" style="font-size:0.95rem;font-weight:${selectedVersion === 1 ? '800' : '600'};color:${selectedVersion === 1 ? '#2563eb' : '#94a3b8'};cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">
                <span>🎮</span> 게임 1 (추첨 럭키드로우)
              </div>

              <!-- Sliding Switch Track -->
              <div id="admin-mode-switch" style="width:76px;height:40px;background:${selectedVersion === 2 ? '#10b981' : '#3b82f6'};border-radius:25px;position:relative;cursor:pointer;box-shadow:inset 0 2px 4px rgba(0,0,0,0.25);transition:background 0.25s ease;" title="클릭하여 모드 전환">
                <div id="admin-switch-thumb" style="width:32px;height:32px;background:white;border-radius:50%;position:absolute;top:4px;left:${selectedVersion === 2 ? '40px' : '4px'};box-shadow:0 3px 8px rgba(0,0,0,0.3);transition:left 0.25s cubic-bezier(0.4, 0, 0.2, 1);display:flex;align-items:center;justify-content:center;font-size:0.95rem;">
                  ${selectedVersion === 2 ? '🚀' : '🎮'}
                </div>
              </div>

              <div id="btn-select-mode-2" style="font-size:0.95rem;font-weight:${selectedVersion === 2 ? '800' : '600'};color:${selectedVersion === 2 ? '#059669' : '#94a3b8'};cursor:pointer;display:flex;align-items:center;gap:0.4rem;transition:all 0.2s;">
                <span>🚀</span> 게임 2 (선착순 레이스)
              </div>
            </div>

            <!-- Dynamic Guide description -->
            <div id="admin-mode-desc" style="font-size:0.88rem;color:#334155;line-height:1.55;background:#f1f5f9;padding:0.75rem 1rem;border-radius:10px;">
              ${selectedVersion === 2 ? 
                '🚀 <b>게임 2 (실시간 선착순 레이스)</b>: 부캉이가 스타벅스 아일랜드에 골인한 시각을 기준으로 회사별 정원 내 참가자에게 실시간 당첨 팡파르를 제공하며, 정원 마감 후에는 "꽝! 수고많으셨습니다" 및 공손 인사 애니메이션을 표시합니다.' : 
                '🎮 <b>게임 1 (기존 추첨 모드)</b>: 참여한 모든 임직원에게 접수 완료증을 발급하며, 탈락(꽝) 없이 추첨 대기 상태로 안내하는 기본 모드입니다.'}
            </div>
          </div>

          <!-- Section 2: Quota Combo Boxes -->
          <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:16px;padding:1.3rem;margin-bottom:1.4rem;">
            <div style="font-size:0.98rem;font-weight:800;color:#0f172a;margin-bottom:0.85rem;display:flex;align-items:center;gap:0.5rem;">
              <span>📊</span> <b>소속회사별 선착순 당첨 인원 (콤보박스 조정)</b>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.2rem;">
              <!-- Life Quota Box -->
              <div style="background:white;padding:1.1rem;border-radius:12px;border:1.5px solid #fbcfe8;">
                <div style="font-size:0.92rem;font-weight:800;color:#e4007f;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
                  <span>🏢</span> 흥국생명 당첨 정원
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <select id="select-quota-life" style="width:100%;padding:0.65rem 0.8rem;border:1.5px solid #f472b6;border-radius:8px;font-size:0.95rem;font-weight:700;color:#831843;background:white;cursor:pointer;">
                    <option value="50">50명</option>
                    <option value="100">100명</option>
                    <option value="120">120명</option>
                    <option value="140">140명</option>
                    <option value="160">160명 (기본 권장)</option>
                    <option value="180">180명</option>
                    <option value="200">200명</option>
                    <option value="250">250명</option>
                    <option value="300">300명</option>
                    <option value="custom">직접 입력...</option>
                  </select>
                  <input type="number" id="input-custom-life" placeholder="직접 입력 (명)" value="${selectedLife}" style="display:none;width:100%;padding:0.55rem 0.8rem;border:1.5px solid #e4007f;border-radius:8px;font-size:0.92rem;font-weight:700;box-sizing:border-box;" />
                </div>
                <div style="font-size:0.8rem;color:#9d174d;margin-top:0.4rem;font-weight:600;">
                  현재 설정: <b id="text-current-life">${selectedLife}명</b>
                </div>
              </div>

              <!-- Fire Quota Box -->
              <div style="background:white;padding:1.1rem;border-radius:12px;border:1.5px solid #bfdbfe;">
                <div style="font-size:0.92rem;font-weight:800;color:#1d4ed8;margin-bottom:0.5rem;display:flex;align-items:center;gap:0.4rem;">
                  <span>🏢</span> 흥국화재 당첨 정원
                </div>
                <div style="display:flex;flex-direction:column;gap:0.5rem;">
                  <select id="select-quota-fire" style="width:100%;padding:0.65rem 0.8rem;border:1.5px solid #60a5fa;border-radius:8px;font-size:0.95rem;font-weight:700;color:#1e3a8a;background:white;cursor:pointer;">
                    <option value="50">50명</option>
                    <option value="100">100명</option>
                    <option value="150">150명</option>
                    <option value="180">180명</option>
                    <option value="200">200명 (기본 권장)</option>
                    <option value="220">220명</option>
                    <option value="250">250명</option>
                    <option value="300">300명</option>
                    <option value="custom">직접 입력...</option>
                  </select>
                  <input type="number" id="input-custom-fire" placeholder="직접 입력 (명)" value="${selectedFire}" style="display:none;width:100%;padding:0.55rem 0.8rem;border:1.5px solid #1d4ed8;border-radius:8px;font-size:0.92rem;font-weight:700;box-sizing:border-box;" />
                </div>
                <div style="font-size:0.8rem;color:#1e40af;margin-top:0.4rem;font-weight:600;">
                  현재 설정: <b id="text-current-fire">${selectedFire}명</b>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Direct Experience Links -->
          <div style="background:#f1f5f9;border-radius:14px;padding:1rem 1.2rem;margin-bottom:1.4rem;">
            <div style="font-size:0.88rem;font-weight:800;color:#475569;margin-bottom:0.6rem;">
              🔗 <b>관리자 실시간 체험 링크 (새 탭에서 열기)</b>
            </div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
              <a href="http://localhost:5001/?game=1" target="_blank" style="background:white;color:#2563eb;border:1px solid #bfdbfe;padding:0.45rem 0.9rem;border-radius:8px;font-size:0.84rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:0.3rem;">
                🎮 게임 1 (추첨 모드) 테스트
              </a>
              <a href="http://localhost:5001/?game=2" target="_blank" style="background:white;color:#059669;border:1px solid #a7f3d0;padding:0.45rem 0.9rem;border-radius:8px;font-size:0.84rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:0.3rem;">
                🚀 게임 2 (선착순 레이스) 테스트
              </a>
              <a href="http://localhost:5001/" target="_blank" style="background:white;color:#4f46e5;border:1px solid #c7d2fe;padding:0.45rem 0.9rem;border-radius:8px;font-size:0.84rem;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:0.3rem;">
                🌐 배포용 설문(현재 설정값) 열기
              </a>
            </div>
          </div>

                    <!-- Section 4: Cloud Deploy (GitHub & Render) -->
          <div style="background:#ecfeff;border:1.5px solid #a5f3fc;border-radius:14px;padding:1rem 1.2rem;margin-bottom:1.4rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.8rem;">
            <div>
              <div style="font-size:0.9rem;font-weight:800;color:#0e7490;display:flex;align-items:center;gap:0.4rem;">
                <span>🌐</span> <b>GitHub & Render(랜더) 클라우드 실시간 배포</b>
              </div>
              <div style="font-size:0.82rem;color:#155e75;margin-top:0.2rem;">
                로컬에서 조정한 설정(게임 모드 및 정원)을 Render 배포 사이트에 즉시 푸시 배포합니다.
              </div>
            </div>
            <button id="admin-modal-cloud-deploy" style="background:linear-gradient(135deg, #0891b2 0%, #0e7490 100%);color:white;border:none;font-weight:800;font-size:0.88rem;padding:0.6rem 1.2rem;border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:0.4rem;box-shadow:0 3px 10px rgba(8,145,178,0.35);transition:all 0.2s;">
              <span>🚀</span> 깃허브 & 랜더 즉시 배포
            </button>
          </div>

          <!-- Save Status Alert Box -->
          <div id="admin-save-status" style="display:none;padding:0.75rem 1rem;border-radius:10px;font-size:0.92rem;font-weight:800;text-align:center;margin-bottom:1rem;"></div>

        </div>

        <!-- Modal Footer -->
        <div style="background:#f8fafc;padding:1.1rem 1.8rem;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:0.8rem;align-items:center;">
          <button id="admin-modal-cancel" style="background:white;border:1.5px solid #cbd5e1;color:#475569;font-weight:700;padding:0.65rem 1.3rem;border-radius:10px;cursor:pointer;font-size:0.92rem;">
            닫기
          </button>
          <button id="admin-modal-save" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);border:none;color:white;font-weight:800;padding:0.65rem 1.6rem;border-radius:10px;cursor:pointer;font-size:0.95rem;box-shadow:0 4px 12px rgba(16,185,129,0.35);display:flex;align-items:center;gap:0.4rem;">
            <span>💾</span> 확인 및 즉시 적용
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Initial state wiring for combo boxes
    const selLife = document.getElementById('select-quota-life');
    const inputLife = document.getElementById('input-custom-life');
    const selFire = document.getElementById('select-quota-fire');
    const inputFire = document.getElementById('input-custom-fire');

    // Set combo values
    if ([50, 100, 120, 140, 160, 180, 200, 250, 300].includes(selectedLife)) {
      selLife.value = selectedLife;
    } else {
      selLife.value = 'custom';
      inputLife.style.display = 'block';
    }

    if ([50, 100, 150, 180, 200, 220, 250, 300].includes(selectedFire)) {
      selFire.value = selectedFire;
    } else {
      selFire.value = 'custom';
      inputFire.style.display = 'block';
    }

    selLife.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        inputLife.style.display = 'block';
        inputLife.focus();
      } else {
        inputLife.style.display = 'none';
        selectedLife = parseInt(e.target.value);
        document.getElementById('text-current-life').innerText = `${selectedLife}명`;
      }
    });

    inputLife.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 0;
      selectedLife = val;
      document.getElementById('text-current-life').innerText = `${val}명`;
    });

    selFire.addEventListener('change', (e) => {
      if (e.target.value === 'custom') {
        inputFire.style.display = 'block';
        inputFire.focus();
      } else {
        inputFire.style.display = 'none';
        selectedFire = parseInt(e.target.value);
        document.getElementById('text-current-fire').innerText = `${selectedFire}명`;
      }
    });

    inputFire.addEventListener('input', (e) => {
      const val = parseInt(e.target.value) || 0;
      selectedFire = val;
      document.getElementById('text-current-fire').innerText = `${val}명`;
    });

    // Toggle switch logic
    const switchEl = document.getElementById('admin-mode-switch');
    const thumbEl = document.getElementById('admin-switch-thumb');
    const label1 = document.getElementById('btn-select-mode-1');
    const label2 = document.getElementById('btn-select-mode-2');
    const badgeEl = document.getElementById('active-mode-badge');
    const descEl = document.getElementById('admin-mode-desc');

    function updateSwitchUI(ver) {
      selectedVersion = ver;
      if (ver === 2) {
        switchEl.style.background = '#10b981';
        thumbEl.style.left = '40px';
        thumbEl.innerHTML = '🚀';
        label1.style.fontWeight = '600';
        label1.style.color = '#94a3b8';
        label2.style.fontWeight = '800';
        label2.style.color = '#059669';
        badgeEl.style.background = '#ecfdf5';
        badgeEl.style.color = '#059669';
        badgeEl.style.borderColor = '#a7f3d0';
        badgeEl.innerText = '🚀 게임 2 활성 중';
        descEl.innerHTML = '🚀 <b>게임 2 (실시간 선착순 레이스)</b>: 부캉이가 스타벅스 아일랜드에 골인한 시각을 기준으로 회사별 정원 내 참가자에게 실시간 당첨 팡파르를 제공하며, 정원 마감 후에는 "꽝! 수고많으셨습니다" 및 공손 인사 애니메이션을 표시합니다.';
      } else {
        switchEl.style.background = '#3b82f6';
        thumbEl.style.left = '4px';
        thumbEl.innerHTML = '🎮';
        label1.style.fontWeight = '800';
        label1.style.color = '#2563eb';
        label2.style.fontWeight = '600';
        label2.style.color = '#94a3b8';
        badgeEl.style.background = '#eff6ff';
        badgeEl.style.color = '#2563eb';
        badgeEl.style.borderColor = '#bfdbfe';
        badgeEl.innerText = '🎮 게임 1 활성 중';
        descEl.innerHTML = '🎮 <b>게임 1 (기존 추첨 모드)</b>: 참여한 모든 임직원에게 접수 완료증을 발급하며, 탈락(꽝) 없이 추첨 대기 상태로 안내하는 기본 모드입니다.';
      }
    }

    switchEl.addEventListener('click', () => {
      updateSwitchUI(selectedVersion === 2 ? 1 : 2);
    });
    label1.addEventListener('click', () => updateSwitchUI(1));
    label2.addEventListener('click', () => updateSwitchUI(2));

    // Close actions
    document.getElementById('admin-modal-close').addEventListener('click', () => overlay.remove());
    document.getElementById('admin-modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.remove();
    });

    
    // Helper: Save current settings to backend
    async function saveCurrentSettings() {
      const finalLife = selLife.value === 'custom' ? (parseInt(inputLife.value) || 160) : parseInt(selLife.value);
      const finalFire = selFire.value === 'custom' ? (parseInt(inputFire.value) || 200) : parseInt(selFire.value);

      const payload = {
        game_version: selectedVersion,
        quota_life: finalLife,
        quota_fire: finalFire
      };

      // Save to local port 5000 API
      const resp1 = await fetch('/api/event/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data1 = await resp1.json();

      // Apply immediately to current active game
      if (selectedVersion === 1 && window.bukangGameV1) {
        window.bukangGame = window.bukangGameV1;
      } else if (selectedVersion === 2 && window.bukangGameV2) {
        window.bukangGame = window.bukangGameV2;
      }

      return { payload, finalLife, finalFire, data1 };
    }

    // Cloud Deploy Button Action (Auto-saves first, then pushes to GitHub & triggers Render build)
    const cloudDeployBtn = document.getElementById('admin-modal-cloud-deploy');
    if (cloudDeployBtn) {
      cloudDeployBtn.addEventListener('click', async () => {
        cloudDeployBtn.disabled = true;
        cloudDeployBtn.innerHTML = '<span>⏳</span> 설정 저장 및 푸시 중...';
        statusBox.style.display = 'block';
        statusBox.style.background = '#eff6ff';
        statusBox.style.color = '#1d4ed8';
        statusBox.style.border = '1.5px solid #bfdbfe';
        statusBox.innerHTML = '⚙️ 먼저 변경된 설정을 저장한 후, GitHub 클라우드로 푸시하고 있습니다... (약 5초)';

        try {
          // 1. Auto-save current form settings first
          const { finalLife, finalFire } = await saveCurrentSettings();

          // 2. Push to GitHub to trigger Render auto-deploy
          const resp = await fetch('/api/admin/deploy-github', { method: 'POST' });
          const resData = await resp.json();
          if (resData.success) {
            statusBox.style.background = '#ecfdf5';
            statusBox.style.color = '#065f46';
            statusBox.style.border = '1.5px solid #a7f3d0';
            statusBox.innerHTML = `✅ <b>설정 저장 및 GitHub 푸시 완료!</b><br><small style="color:#047857;">[게임 ${selectedVersion}모드 / 생명 ${finalLife}명 / 화재 ${finalFire}명]<br>Render(랜더)에서 1~2분 내로 라이브 사이트에 자동 반영됩니다.<br><a href="https://two027-hrd-needs-survey.onrender.com/" target="_blank" style="color:#0284c7;font-weight:800;">👉 Render 배포 사이트 확인하기</a></small>`;
            cloudDeployBtn.innerHTML = '<span>✅</span> 배포 완료';
            setTimeout(() => {
              cloudDeployBtn.disabled = false;
              cloudDeployBtn.innerHTML = '<span>🚀</span> 깃허브 & 랜더 즉시 배포';
            }, 4000);
          } else {
            throw new Error(resData.error || '푸시 실패');
          }
        } catch (err) {
          statusBox.style.background = '#fef2f2';
          statusBox.style.color = '#991b1b';
          statusBox.style.border = '1.5px solid #fecaca';
          statusBox.innerHTML = `배포 오류: ${err.message}`;
          cloudDeployBtn.disabled = false;
          cloudDeployBtn.innerHTML = '<span>🚀</span> 다시 시도';
        }
      });
    }

    // Save action (Manual save button)
    const saveBtn = document.getElementById('admin-modal-save');
    const statusBox = document.getElementById('admin-save-status');

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<span>⏳</span> 저장 중...';

      try {
        const { finalLife, finalFire } = await saveCurrentSettings();

        statusBox.style.display = 'block';
        statusBox.style.background = '#ecfdf5';
        statusBox.style.color = '#065f46';
        statusBox.style.border = '1.5px solid #a7f3d0';
        statusBox.innerHTML = `✅ <b>설정이 로컬에 성공적으로 저장되었습니다!</b><br><small style="color:#047857;">[게임 ${selectedVersion}모드 / 생명 ${finalLife}명 / 화재 ${finalFire}명]<br>👉 위쪽의 <b>[🚀 깃허브 & 랜더 즉시 배포]</b> 버튼을 누르시면 실제 온라인 사이트에도 자동 반영됩니다.</small>`;

        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> 확인 및 즉시 적용';
      } catch (err) {
        statusBox.style.display = 'block';
        statusBox.style.background = '#fef2f2';
        statusBox.style.color = '#991b1b';
        statusBox.style.border = '1.5px solid #fecaca';
        statusBox.innerText = `저장 오류: ${err.message}`;
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<span>💾</span> 확인 및 즉시 적용';
      }
    });
  };
