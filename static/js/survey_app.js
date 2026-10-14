/**
 * 2027 그룹 인재육성 체계 수립 - 구성원 교육 Needs 설문조사 전용 스크립트
 * (29개 문항 렌더링, 구글 스프레드시트 실시간 연동, 부캉이 럭키드로우 게임 모달)
 */
(function() {
  let questionsData = [];
  let isSurveyCompleted = false;

  function showToast(msg) {
    const toast = document.getElementById('toast-msg');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    setTimeout(() => {
      toast.style.display = 'none';
    }, 2800);
  }

  // Window Close & Screen Exit Handler
  window.closeWindowOrExit = function() {
    try {
      window.open('', '_self', '');
      window.close();
    } catch(e) {}

    setTimeout(function() {
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

  // Completion screen rendered after lucky draw ends
  window.handleSurveyAndGameFinish = function() {
    isSurveyCompleted = true;
    try {
      window.open('', '_self', '');
      window.close();
    } catch(e) {}

    renderSurveyCompletionView();
    showToast('🎉 설문 및 럭키드로우 이벤트 응모가 모두 종료되었습니다. 감사합니다!');
  };

  function renderSurveyCompletionView() {
    const mainWrap = document.getElementById('main-content');
    const submitBar = document.getElementById('submit-bar');
    if (submitBar) submitBar.style.display = 'none';

    if (mainWrap) {
      mainWrap.innerHTML = `
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
  }

  // Load Survey Questions
  async function initSurvey() {
    try {
      let res;
      try {
        res = await fetch('/data/questions.json');
        if (!res.ok) res = await fetch('/api/survey/questions');
      } catch(e) {
        res = await fetch('/api/survey/questions');
      }
      questionsData = await res.json();
      renderSurvey();
    } catch(err) {
      console.error('Failed to load questions:', err);
      document.getElementById('survey-form-root').innerHTML = `
        <div style="text-align:center;padding:3rem;color:#dc2626;">
          설문 문항을 불러오는데 실패하였습니다. 새로고침해 주십시오.
        </div>
      `;
    }
  }

  function renderSurvey() {
    const root = document.getElementById('survey-form-root');
    const submitBar = document.getElementById('submit-bar');
    if (!root) return;

    let html = `<form id="survey-form">`;

    questionsData.forEach(sec => {
      html += `
        <section class="survey-section">
          <div class="survey-section-header">
            <h2 class="survey-section-title">${sec.section || sec.title}</h2>
            ${sec.description ? `<p class="survey-section-desc">${sec.description}</p>` : ''}
          </div>
      `;

      // Special Layout for Section 1: 기본 인적사항 (1번, 그리고 2번 & 3번 나란히 2컬럼 배치)
      const isSec1 = (sec.id === 'sec_1' || (sec.section && sec.section.includes('기본 인적사항')));
      
      if (isSec1) {
        const q1 = (sec.questions || []).find(q => q.id === 'q1' || q.type === 'company_and_department');
        const q2 = (sec.questions || []).find(q => q.id === 'q2');
        const q3 = (sec.questions || []).find(q => q.id === 'q3');

        // Q1 렌더링
        if (q1) {
          const compOpts = q1.company_options || [
            "흥국생명", "흥국화재", "흥국증권", "흥국자산운용", "고려저축은행", "예가람저축은행", "티시스", "기타"
          ];
          const deptOpts = q1.options || [
            "관리부문 (선임계리, 준법감시, 감사, 경영기획, 경영지원, 리스크관리, IT, 정보보호, 자산운용 등)",
            "업무부문 (상품전략, 고객업무, 소비자보호 등)",
            "영업부문 (마케팅, GA영업, 전략영업, 다채널영업 등)",
            "기타"
          ];

          html += `
            <div class="question-card" id="q-card-q1">
              <div class="question-title-row">
                <span class="question-num-badge">1</span>
                <div class="question-title-text">${q1.title} <span class="req-star">*</span></div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:0.85rem;">
                <div class="demographic-card-box">
                  <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.95rem;font-weight:700;color:#1e3a8a;margin-bottom:0.6rem;">
                    <span>🏢</span> ${q1.company_label || '소속 회사'} <span class="req-star">*</span>
                  </label>
                  <select name="q1_company" id="select-q1-company" required class="select-styled">
                    <option value="" disabled selected>-- 소속 회사를 선택해 주십시오 --</option>
                    ${compOpts.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </div>
                <div class="demographic-card-box">
                  <label style="display:flex;align-items:center;gap:0.4rem;font-size:0.95rem;font-weight:700;color:#1e3a8a;margin-bottom:0.6rem;">
                    <span>📁</span> ${q1.dept_label || '소속 부문'} <span class="req-star">*</span>
                  </label>
                  <select name="q1_department" id="select-q1-department" required class="select-styled">
                    <option value="" disabled selected>-- 소속 부문을 선택해 주십시오 --</option>
                    ${deptOpts.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          `;
        }

        // Q2 & Q3 나란히 좌우 2컬럼 배치 (발란스 및 시인성 극대화)
        if (q2 && q3) {
          html += `
            <div class="demographics-grid-row">
              <!-- 2번 문항 (직군) -->
              <div class="question-card demographic-card-box" id="q-card-q2" style="margin-bottom:0;border-bottom:none;">
                <div class="question-title-row">
                  <span class="question-num-badge">2</span>
                  <div class="question-title-text">${q2.title} <span class="req-star">*</span></div>
                </div>
                <div style="margin-top:0.75rem;">
                  <select name="q2" id="select-q2" required class="select-styled">
                    <option value="" disabled selected>-- 직군을 선택해 주십시오 --</option>
                    ${(q2.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </div>
              </div>

              <!-- 3번 문항 (직급/직책) -->
              <div class="question-card demographic-card-box" id="q-card-q3" style="margin-bottom:0;border-bottom:none;">
                <div class="question-title-row">
                  <span class="question-num-badge">3</span>
                  <div class="question-title-text">${q3.title} <span class="req-star">*</span></div>
                </div>
                <div style="margin-top:0.75rem;">
                  <select name="q3" id="select-q3" required class="select-styled">
                    <option value="" disabled selected>-- 직급/직책을 선택해 주십시오 --</option>
                    ${(q3.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                  </select>
                </div>
              </div>
            </div>
          `;
        }

      } else {
        // Section 2 ~ 7 일반 문항 렌더링
        (sec.questions || []).forEach(q => {
          const reqBadge = q.required ? `<span class="req-star">*</span>` : '';
          const maxBadge = q.max_select ? `<span class="max-badge">최대 ${q.max_select}개까지 선택 가능</span>` : '';

          html += `
            <div class="question-card" id="q-card-${q.id}">
              <div class="question-title-row">
                <span class="question-num-badge">${q.number || q.id}</span>
                <div class="question-title-text">${q.title} ${reqBadge} ${maxBadge}</div>
              </div>
          `;

          function formatOptionLabel(qId, optText) {
            if (optText.includes('(') && optText.includes(')')) {
              // ' (' 공백+괄호 패턴(부연설명 시작점)이 있으면 그곳을 우선 분리점 기준으로 사용
              const lastSpaceOpen = optText.lastIndexOf(' (');
              let openIdx = optText.indexOf('(');
              let closeIdx = optText.lastIndexOf(')');
              
              if (lastSpaceOpen > 0) {
                openIdx = lastSpaceOpen + 1;
              }

              if (openIdx > 0 && closeIdx > openIdx) {
                const titlePart = optText.substring(0, openIdx).trim();
                const descPart = optText.substring(openIdx, closeIdx + 1).trim();
                return `
                  <div class="option-text-wrap">
                    <span class="option-title-part">${titlePart}</span>
                    <span class="option-desc-part">${descPart}</span>
                  </div>
                `;
              }
            }
            return `<span class="option-title-simple">${optText}</span>`;
          }

          let gridClass = "option-grid";
          if (q.id === 'q8' || q.id === 'q15' || q.id === 'q16' || q.id === 'q18' || q.id === 'q24') {
            gridClass = "option-grid-2col";
          } else if (q.id === 'q27') {
            gridClass = "option-grid-3col";
          }

          if (q.type === 'likert_5') {
            html += `
              <div class="option-grid-5">
                ${(q.options || []).map(opt => `
                  <label class="option-card-label-5">
                    <input type="radio" name="${q.id}" value="${opt}" required />
                    <span>${opt}</span>
                  </label>
                `).join('')}
              </div>
            `;
          } else if (q.type === 'multiple_choice' || q.type === 'checkbox') {
            const maxSel = q.max_select || 0;
            html += `
              <div class="${gridClass}">
                ${(q.options || []).map(opt => `
                  <label class="option-card-label" style="align-items:flex-start;">
                    <input type="checkbox" name="${q.id}" value="${opt}" data-max="${maxSel}" style="margin-top:3px;" />
                    ${formatOptionLabel(q.id, opt)}
                  </label>
                `).join('')}
              </div>
            `;
          } else if (q.type === 'single_choice' || q.type === 'radio') {
            html += `
              <div class="${gridClass}">
                ${(q.options || []).map(opt => `
                  <label class="option-card-label" style="align-items:flex-start;">
                    <input type="radio" name="${q.id}" value="${opt}" ${q.required ? 'required' : ''} style="margin-top:3px;" />
                    ${formatOptionLabel(q.id, opt)}
                  </label>
                `).join('')}
              </div>
            `;
          } else if (q.type === 'textarea') {
            html += `
              <div style="margin-top:0.85rem;">
                <textarea name="${q.id}" rows="3" class="textarea-styled" placeholder="귀하의 소중한 의견을 자유롭게 작성하여 주십시오. (선택 사항)"></textarea>
              </div>
            `;
          } else if (q.type === 'select') {
            html += `
              <div style="margin-top:0.75rem;max-width:480px;">
                <select name="${q.id}" id="select-${q.id}" required class="select-styled">
                  <option value="" disabled selected>-- 선택해 주십시오 --</option>
                  ${(q.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
              </div>
            `;
          }

          if (q.sub_question) {
            const sq = q.sub_question;
            html += `
              <div id="sub-wrap-${q.id}" style="display:none;background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;padding:1.1rem 1.35rem;margin-top:1.1rem;box-shadow:0 2px 6px rgba(220,38,38,0.04);">
                <div style="font-size:0.95rem;font-weight:700;color:#991b1b;margin-bottom:0.6rem;display:flex;align-items:center;gap:0.4rem;">
                  <span>↳</span> [Q${sq.number}] ${sq.title}
                </div>
                <textarea name="${sq.id}" rows="2" placeholder="사유 또는 구체적인 개선 의견을 입력해 주십시오..." class="textarea-styled" style="border-color:#fca5a5;"></textarea>
              </div>
            `;
          }

          html += `</div>`;
        });
      }

      html += `</section>`;
    });

    html += `</form>`;
    root.innerHTML = html;
    if (submitBar) submitBar.style.display = 'block';

    bindSurveyEvents();
  }

  function bindSurveyEvents() {
    // Sub-question display trigger for negative Likert ratings
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        const qid = e.target.name;
        const val = e.target.value;
        const subWrap = document.getElementById(`sub-wrap-${qid}`);
        if (subWrap) {
          if (val.includes('그렇지 않다') || val.includes('불만족') || val.includes('1점') || val.includes('2점')) {
            subWrap.style.display = 'block';
          } else {
            subWrap.style.display = 'none';
          }
        }
      });
    });

    // Checkbox max limit enforcement
    document.querySelectorAll('input[type="checkbox"]').forEach(chk => {
      chk.addEventListener('change', (e) => {
        const max = parseInt(e.target.getAttribute('data-max') || '0', 10);
        if (max > 0) {
          const group = document.querySelectorAll(`input[type="checkbox"][name="${e.target.name}"]`);
          const checkedCount = Array.from(group).filter(c => c.checked).length;
          if (checkedCount > max) {
            e.target.checked = false;
            showToast(`최대 ${max}개까지만 선택하실 수 있습니다.`);
          }
        }
      });
    });

    // Option card styling highlight (for both regular and 5-scale cards)
    document.querySelectorAll('.option-card-label input, .option-card-label-5 input').forEach(input => {
      input.addEventListener('change', () => {
        const name = input.name;
        if (input.type === 'radio') {
          document.querySelectorAll(`input[name="${name}"]`).forEach(r => {
            const parentLabel = r.closest('.option-card-label, .option-card-label-5');
            if (parentLabel) parentLabel.classList.toggle('selected', r.checked);
          });
        } else {
          const parentLabel = input.closest('.option-card-label, .option-card-label-5');
          if (parentLabel) parentLabel.classList.toggle('selected', input.checked);
        }
      });
    });

    const btnSubmit = document.getElementById('btn-submit-survey');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', async (e) => {
        e.preventDefault();
        await submitSurveyForm();
      });
    }
  }

  async function submitSurveyForm() {
    const form = document.getElementById('survey-form');
    if (!form) return;

    // 0. Rigorous Validation for All Required Questions (누락 방지 완전 검증)
    for (const sec of questionsData) {
      for (const q of (sec.questions || [])) {
        if (!q.required) continue;

        let isFilled = false;
        const missingElement = document.getElementById(`q-card-${q.id}`);

        if (q.id === 'q1' || q.type === 'company_and_department') {
          const comp = form.querySelector('[name="q1_company"]')?.value;
          const dept = form.querySelector('[name="q1_department"]')?.value;
          isFilled = !!(comp && dept && comp.trim() && dept.trim());
        } else if (q.type === 'select') {
          const val = form.querySelector(`select[name="${q.id}"]`)?.value;
          isFilled = !!(val && val.trim());
        } else if (q.type === 'likert_5' || q.type === 'single_choice' || q.type === 'radio') {
          isFilled = !!form.querySelector(`input[type="radio"][name="${q.id}"]:checked`);
        } else if (q.type === 'multiple_choice' || q.type === 'checkbox') {
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

    const formDataObj = new FormData(form);
    const answers = {};
    for (const [key, val] of formDataObj.entries()) {
      if (answers[key]) {
        if (Array.isArray(answers[key])) {
          answers[key].push(val);
        } else {
          answers[key] = [answers[key], val];
        }
      } else {
        answers[key] = val;
      }
    }

    const payload = {
      action: 'survey_submit',
      department: answers['q1_department'] || '기타',
      job_group: answers['q2'] || '일반직',
      position: answers['q3'] || '대리',
      delivery_mode: answers['q10'] || '온·오프라인 블렌디드 러닝',
      open_needs: answers['q28'] || answers['q28_open'] || '',
      open_feedback: answers['q29'] || answers['q29_open'] || '',
      answers: answers
    };

    const btnSubmit = document.getElementById('btn-submit-survey');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span>⏳</span> 설문 응답을 등록 중입니다...';

    const googleUrl = window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL.startsWith('http') 
      ? window.GOOGLE_SCRIPT_URL 
      : null;

    try {
      let res;
      if (googleUrl) {
        // Send directly to Google Apps Script (Google Sheets)
        res = await fetch(googleUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        }).then(r => r.json());
      } else {
        // Fallback to local server API
        res = await fetch('/api/survey/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).then(r => r.json());
      }

      if (res && res.success) {
        showToast('🎉 설문 제출 완료! 스타벅스 럭키드로우 이벤트로 연결됩니다.');
        
        window.currentSurveySubmission = {
          id: res.id,
          department: payload.department,
          job_group: payload.job_group,
          position: payload.position
        };

        if (window.bukangGame) {
          setTimeout(() => {
            window.bukangGame.open(res.id);
          }, 400);
        } else {
          setTimeout(() => {
            renderSurveyCompletionView();
          }, 600);
        }
      } else {
        showToast(res.error || '제출에 실패했습니다.');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<span>🎉</span> 설문 제출 및 스타벅스 커피쿠폰 이벤트 응모하기';
      }
    } catch(err) {
      console.error('Submit error:', err);
      showToast('서버 오류로 인해 제출에 실패했습니다.');
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = '<span>🎉</span> 설문 제출 및 스타벅스 커피쿠폰 이벤트 응모하기';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initSurvey();
  });
})();
