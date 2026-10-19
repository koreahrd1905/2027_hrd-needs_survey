/**
 * BukangLuckyDrawGame - 행운의 커피 슬롯머신 이벤트
 * 
 * - 사내 저사양 PC / VDI 완벽 최적화 (Canvas 제거, 순수 CSS 하드웨어 가속)
 * - 흥국금융 CI + 스타벅스 로고 + 3구 럭키 커피 슬롯머신 스테이지
 * - 캡처 3 스타일의 깔끔한 입력창 및 슬롯 당기기 버튼
 * - 중복 전화번호 입력 시에만 적색(Red) 경고 메시지 표시
 * - 3연속 커피 잭팟(☕☕☕) 연출 후 공식 접수증(EVT-L/F) 발급
 */

class BukangLuckyDrawGame {
  constructor() {
    this.modalEl = null;
    this.audioCtx = null;
    this.isMuted = false;
    this.surveyId = '';
    this.phoneNumber = '';
    this.serverResult = null;
    this.serverEntryId = '';
    this.isSpinning = false;
    this.tickTimer = null;
  }

  // 1. Web Audio Synthesizer (무설치 경량 사운드)
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, vol = 0.18, startTime = 0) {
    if (this.isMuted || !this.audioCtx || freq <= 0) return;
    try {
      const t = this.audioCtx.currentTime + startTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  playTickSound() {
    this.playTone(850, 'triangle', 0.035, 0.1);
  }

  playReelStopSound(freq = 523) {
    this.playTone(freq, 'sine', 0.22, 0.25);
    this.playTone(freq * 1.5, 'triangle', 0.15, 0.15, 0.04);
  }

  playJackpotSound() {
    if (this.isMuted || !this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    const delays = [0, 0.1, 0.2, 0.32, 0.48];
    notes.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.35, 0.25, delays[idx]);
    });
  }

  // 2. Open Modal
  open(surveyId = '') {
    this.surveyId = surveyId || (window.submittedSurveyId || 'resp_' + Date.now());
    this.phoneNumber = '';
    this.serverResult = null;
    this.serverEntryId = '';
    this.isSpinning = false;
    this.createModalDOM();
    this.initAudio();
  }

  close() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  promptExitConfirmation() {
    if (document.getElementById('bukang-exit-confirm-modal')) return;

    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'bukang-exit-confirm-modal';
    confirmOverlay.className = 'bukang-exit-confirm-overlay';
    confirmOverlay.innerHTML = `
      <div class="bukang-exit-confirm-card">
        <div style="font-size:2.4rem;margin-bottom:0.4rem;">🚪</div>
        <h3 style="font-size:1.25rem;font-weight:900;color:#1e293b;margin:0 0 0.45rem 0;">이벤트 참여없이 종료하시겠습니까?</h3>
        <p style="font-size:0.92rem;color:#64748b;margin:0 0 1.25rem 0;line-height:1.5;">
          설문 응답은 정상 제출 완료되었습니다.<br>
          <strong style="color:#ef4444;">'종료 (웹 나가기)'</strong>를 누르시면 화면이 즉시 종료됩니다.
        </p>
        <div style="display:flex;gap:0.75rem;justify-content:center;">
          <button class="bukang-exit-btn-cancel" id="btn-cancel-exit">
            계속 참여하기
          </button>
          <button class="bukang-exit-btn-confirm" id="btn-confirm-exit">
            종료 (웹 나가기)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(confirmOverlay);

    document.getElementById('btn-cancel-exit').onclick = () => {
      confirmOverlay.remove();
    };

    document.getElementById('btn-confirm-exit').onclick = () => {
      confirmOverlay.remove();
      this.close();
      window.isEventSubmitted = true;
      try {
        localStorage.setItem('heungkuk_event_submitted', 'true');
        sessionStorage.setItem('heungkuk_event_submitted', 'true');
      } catch (e) {}
      if (typeof window.markEventAsCompleted === 'function') {
        window.markEventAsCompleted();
      }
      this.renderSurveyCompletionView();
    };
  }

  renderSurveyCompletionView() {
    const root = document.getElementById('root') || document.body;
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#f0f9ff 0%,#e0f2fe 100%);padding:1.5rem;font-family:'Pretendard',sans-serif;">
        <div style="max-width:520px;width:100%;background:#ffffff;border-radius:24px;box-shadow:0 20px 45px rgba(2,132,199,0.18);padding:3rem 2rem;text-align:center;border:2px solid #bae6fd;">
          <div style="font-size:3.5rem;margin-bottom:1rem;">🎉</div>
          <h2 style="font-size:1.65rem;font-weight:900;color:#0f172a;margin-bottom:0.75rem;">설문이 성공적으로 완료되었습니다!</h2>
          <p style="font-size:1rem;color:#475569;line-height:1.65;margin-bottom:2rem;">
            2027 그룹 인재육성 체계 수립을 위한 소중한 의견에<br>진심으로 감사드립니다.
          </p>
          <div style="padding:1rem 1.25rem;background:#f8fafc;border-radius:14px;border:1px dashed #cbd5e1;color:#64748b;font-size:0.9rem;">
            본 창을 닫으셔도 좋습니다. 오늘도 보람찬 하루 되십시오!
          </div>
        </div>
      </div>
    `;
  }

  // 3. Create Modal DOM
  createModalDOM() {
    if (this.modalEl) this.close();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'bukang-lucky-modal';
    this.modalEl.className = 'bukang-modal-overlay';

    // 5 slot items in each reel strip (Cell 4 is target ☕ Jackpot!)
    const reelItemsHtml = `
      <div class="slot-cell">
        <div class="slot-cell-icon">☕</div>
        <div class="slot-cell-label">스타벅스</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">💎</div>
        <div class="slot-cell-label">흥국금융</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">🍀</div>
        <div class="slot-cell-label">행운클로버</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">🎁</div>
        <div class="slot-cell-label">선물상자</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">☕</div>
        <div class="slot-cell-label">스타벅스</div>
      </div>
    `;

    this.modalEl.innerHTML = `
      <div class="bukang-modal-box" style="max-width: 860px; border-radius: 18px; overflow: hidden; box-shadow: 0 25px 65px rgba(15, 23, 42, 0.45);">
        
        <!-- Top Signboard Header (상단/좌측 간판 타이틀) -->
        <div class="bukang-header" style="background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%); padding: 0.85rem 1.4rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #bae6fd;">
          <div class="bukang-title" style="display: flex; align-items: center; gap: 0.6rem;">
            <span style="font-size: 1.55rem; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));">☕</span>
            <h3 style="margin: 0; font-size: 1.25rem; font-weight: 900; color: #ffffff; letter-spacing: -0.02em; text-shadow: 0 2px 4px rgba(0,0,0,0.25);">
              행운의 커피 슬롯머신 이벤트
            </h3>
          </div>
          <div class="bukang-actions" style="display: flex; align-items: center; gap: 0.5rem;">
            <button class="bukang-btn-icon" id="bukang-mute-btn" title="사운드 켜기/끄기">🔊</button>
            <button class="bukang-btn-icon" id="bukang-close-top-btn" title="이벤트 닫기">✕</button>
          </div>
        </div>

        <!-- Main Body -->
        <div class="bukang-body" style="background: #ffffff; display: flex; flex-direction: column; width: 100%;">
          
          <!-- Top Visual Stage: Heungkuk CI + Luxury Coffee Slot Machine + Starbucks -->
          <div class="slot-stage-wrap" style="background: linear-gradient(135deg, #091e3a 0%, #0f274a 55%, #064e3b 100%); padding: 1.5rem 1.25rem; display: flex; align-items: center; justify-content: space-around; gap: 1rem; position: relative; border-bottom: 3px solid #f59e0b; flex-wrap: wrap;">
            
            <!-- Left: Heungkuk CI Brand Card -->
            <div class="brand-badge-card" style="background: #ffffff; padding: 0.6rem 1.1rem; border-radius: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center;">
              <img src="/static/images/heungkuk_ci.png" alt="흥국금융가족" style="height: 38px; width: auto; object-fit: contain;">
            </div>

            <!-- Center: 3-Reel Lucky Coffee Slot Machine -->
            <div class="slot-frame" id="slot-casing" style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 3px solid #f59e0b; border-radius: 16px; padding: 0.75rem 1rem; box-shadow: 0 15px 35px rgba(0,0,0,0.45); max-width: 380px; width: 100%;">
              <div style="text-align: center; color: #facc15; font-size: 0.8rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 0.4rem; text-shadow: 0 0 8px #f59e0b;">
                ★ STARBUCKS LUCKY 777 ★
              </div>
              <div class="slot-reels-container" style="display: flex; gap: 0.65rem; justify-content: center; align-items: center; background: #020617; padding: 0.6rem; border-radius: 12px; position: relative; border: 2px solid #334155;">
                <div class="slot-payline"></div>
                
                <!-- Reel 1 -->
                <div class="slot-reel-window" style="width: 88px; height: 100px;">
                  <div class="slot-reel-strip" id="reel-strip-1">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 2 -->
                <div class="slot-reel-window" style="width: 88px; height: 100px;">
                  <div class="slot-reel-strip" id="reel-strip-2">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 3 -->
                <div class="slot-reel-window" style="width: 88px; height: 100px;">
                  <div class="slot-reel-strip" id="reel-strip-3">
                    ${reelItemsHtml}
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Starbucks Coffee e-Gift Card Badge -->
            <div class="brand-badge-card" style="background: #ffffff; padding: 0.6rem 1rem; border-radius: 14px; box-shadow: 0 8px 20px rgba(0,0,0,0.25); display: flex; align-items: center; gap: 0.6rem;">
              <span style="font-size: 1.8rem;">☕</span>
              <div style="text-align: left;">
                <div style="font-size: 0.74rem; font-weight: 900; color: #00704A; letter-spacing: 0.5px;">STARBUCKS</div>
                <div style="font-size: 0.86rem; font-weight: 800; color: #0f172a;">e-Gift 쿠폰</div>
              </div>
            </div>
          </div>

          <!-- Bottom Card: Input & Action (Capture 3 Layout) -->
          <div class="bukang-input-panel" id="bukang-input-view" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1.25rem 1.4rem;">
            <div class="bukang-guide-card" style="max-width: 680px; width: 100%;">
              
              <!-- Badge (Capture 3 style) -->
              <div class="shark-badge" style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 0.86rem; font-weight: 800; padding: 0.25rem 0.95rem; border-radius: 20px; border: 1.5px solid #bae6fd; margin-bottom: 0.5rem;">
                ☕ 실시간 선착순 골인 챌린지 (버전 2)
              </div>

              <!-- Main Instruction -->
              <p style="font-size: 1.05rem; font-weight: 700; color: #1e293b; margin: 0.2rem 0 0.95rem 0;">
                선물 받을 연락처를 입력 후 <span style="color:#0284c7;background:#e0f2fe;padding:0.18rem 0.6rem;border-radius:6px;font-weight:800;border:1.5px solid #7dd3fc;display:inline-block;">'슬롯 당기기'</span> 버튼을 클릭하세요.
              </p>

              <!-- Phone Input & Start Button Row -->
              <div class="phone-input-row" style="display: flex; justify-content: center; align-items: center; gap: 0.65rem; max-width: 520px; margin: 0 auto;">
                <span class="input-icon" style="font-size: 1.6rem;">📱</span>
                <input 
                  type="tel" 
                  id="bukang-phone-input" 
                  placeholder="010-1234-5678" 
                  maxlength="13"
                  autocomplete="tel"
                  style="flex: 1; padding: 0.82rem 1.1rem; font-size: 1.15rem; font-weight: 700; border: 2px solid #bae6fd; border-radius: 12px; outline: none; text-align: center; letter-spacing: 1.5px; color: #0369a1; background: #f0f9ff;"
                >
                <button class="bukang-start-btn" id="bukang-start-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 12px; padding: 0.82rem 1.6rem; font-size: 1.05rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; box-shadow: 0 6px 16px rgba(2, 132, 199, 0.38); white-space: nowrap;">
                  <span>🎰</span> 슬롯 당기기 (START)
                </button>
              </div>

              <!-- Privacy Checkbox -->
              <div style="margin-top: 0.8rem; display: flex; justify-content: center;">
                <label style="display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.88rem; color: #334155; font-weight: 600;">
                  <input type="checkbox" id="bukang-privacy-check" checked style="width: 17px; height: 17px; accent-color: #0284c7; cursor: pointer;">
                  <span>(필수) 스타벅스 모바일 쿠폰 발송 목적의 개인정보 수집에 동의합니다.</span>
                </label>
              </div>

              <!-- Red Error Message Container (중복 전화번호 체크 시에만 적색 노출) -->
              <div class="phone-err-msg" id="bukang-phone-err" style="color: #ef4444; font-size: 0.94rem; font-weight: 800; margin-top: 0.5rem; display: none; line-height: 1.4;"></div>

              <!-- Guidance Box (Capture 3 style) -->
              <div style="margin-top: 1rem; font-size: 0.94rem; font-weight: 600; color: #1e3a8a; line-height: 1.6; background: #f0f9ff; padding: 0.75rem 1.4rem; border-radius: 12px; border: 1.5px solid #bae6fd; display: inline-block; max-width: 640px; text-align: center; box-shadow: 0 2px 8px rgba(186,230,253,0.35);">
                연락처는 당첨자에게 쿠폰 발송 용도로만 사용됩니다.<br>
                <span style="color: #0284c7; font-weight: 500;">(게임 참여는 선택사항이며, 원하지 않으시면 종료(✕) 하시면 됩니다.)</span>
              </div>
            </div>
          </div>

          <!-- Phase 3: Result Celebration Overlay (Finished Receipt) -->
          <div class="bukang-result-panel" id="bukang-result-view" style="display:none; padding: 1.5rem 1rem;">
            <div class="result-card">
              <div class="result-badge">응모 접수 완료</div>
              <h2 class="result-title">선착순 이벤트에 정상 응모되었습니다</h2>
              <div class="result-sub-text">
                선착순 000명에게 모바일 쿠폰을 보내드립니다<br>
                <span style="color:#0284c7;font-weight:600;font-size:0.86rem;">(발송일 : 10월 30일 이후)</span>
              </div>

              <div class="entry-receipt">
                <div class="receipt-row">
                  <span>접수 번호</span>
                  <strong id="receipt-id">발급 중...</strong>
                </div>
                <div class="receipt-row">
                  <span>응모 번호</span>
                  <strong id="receipt-phone">010-****-0000</strong>
                </div>
                <div class="receipt-row">
                  <span>슬롯 결과</span>
                  <span style="color:#059669;font-weight:700;">☕ ☕ ☕ (스타벅스 3연속 잭팟 성공!)</span>
                </div>
                <div class="receipt-row">
                  <span>응모 확인</span>
                  <span style="color:#0284c7;font-weight:700;">선착순 정상 접수 완료</span>
                </div>
              </div>

              <div class="result-btn-row">
                <button class="bukang-finish-btn" id="bukang-finish-btn">
                  종료
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.appendChild(this.modalEl);
    this.bindEvents();
  }

  // 4. Bind Events
  bindEvents() {
    // Sound Toggle
    const soundBtn = document.getElementById('bukang-mute-btn');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.isMuted = !this.isMuted;
        soundBtn.innerText = this.isMuted ? '🔇' : '🔊';
        this.initAudio();
      };
    }

    // Top Close Button (✕)
    const topCloseBtn = document.getElementById('bukang-close-top-btn');
    if (topCloseBtn) {
      topCloseBtn.onclick = () => {
        this.promptExitConfirmation();
      };
    }

    // Phone Auto-hyphen
    const phoneInput = document.getElementById('bukang-phone-input');
    if (phoneInput) {
      phoneInput.oninput = (e) => {
        let val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length > 11) val = val.slice(0, 11);
        if (val.length > 7) {
          val = `${val.slice(0, 3)}-${val.slice(3, 7)}-${val.slice(7)}`;
        } else if (val.length > 3) {
          val = `${val.slice(0, 3)}-${val.slice(3)}`;
        }
        e.target.value = val;
      };

      phoneInput.onkeydown = (e) => {
        if (e.key === 'Enter') {
          const btn = document.getElementById('bukang-start-btn');
          if (btn) btn.click();
        }
      };
    }

    // Start Button (Trigger Validation -> Spin -> Result)
    const startBtn = document.getElementById('bukang-start-btn');
    if (startBtn) {
      startBtn.onclick = () => this.handlePhoneSubmit();
    }

    // Finish Button
    const finishBtn = document.getElementById('bukang-finish-btn');
    if (finishBtn) {
      finishBtn.onclick = () => {
        this.close();
        window.isEventSubmitted = true;
        try {
          localStorage.setItem('heungkuk_event_submitted', 'true');
          sessionStorage.setItem('heungkuk_event_submitted', 'true');
        } catch (e) {}
        if (typeof window.markEventAsCompleted === 'function') {
          window.markEventAsCompleted();
        }
        this.renderSurveyCompletionView();
      };
    }
  }

  // 5. Handle Phone Submit & Server Check
  async handlePhoneSubmit() {
    const phoneInput = document.getElementById('bukang-phone-input');
    const privacyCheck = document.getElementById('bukang-privacy-check');
    const errEl = document.getElementById('bukang-phone-err');
    
    if (errEl) {
      errEl.style.display = 'none';
      errEl.innerText = '';
    }

    const phone = (phoneInput ? phoneInput.value : '').trim();
    const cleanDigits = phone.replace(/[^0-9]/g, '');

    if (!cleanDigits.startsWith('010') || cleanDigits.length !== 11) {
      if (errEl) {
        errEl.innerText = '올바른 휴대폰 번호(010-XXXX-XXXX 11자리)를 입력해 주세요.';
        errEl.style.display = 'block';
      }
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!privacyCheck || !privacyCheck.checked) {
      if (errEl) {
        errEl.innerText = '개인정보 수집 및 이용에 동의해 주세요.';
        errEl.style.display = 'block';
      }
      return;
    }

    // Server duplicate phone check
    const startBtn = document.getElementById('bukang-start-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = `<span>⏳</span> 번호 확인 중...`;
    }

    try {
      const chkRes = await fetch(`/api/event/check?phone=${cleanDigits}`);
      const chkData = await chkRes.json();
      if (chkData && chkData.already_submitted) {
        if (errEl) {
          errEl.innerText = '이미 이벤트에 응모 완료된 전화번호입니다. (1인 1회 한정)';
          errEl.style.display = 'block';
        }
        if (startBtn) {
          startBtn.disabled = false;
          startBtn.innerHTML = `<span>🎰</span> 슬롯 당기기 (START)`;
        }
        return;
      }
    } catch (e) {}

    this.phoneNumber = phone;
    this.initAudio();

    // Mask phone number for receipt
    let masked = this.phoneNumber;
    const parts = this.phoneNumber.split('-');
    if (parts.length === 3) {
      masked = `${parts[0]}-****-${parts[2]}`;
    }
    const receiptPhoneEl = document.getElementById('receipt-phone');
    if (receiptPhoneEl) receiptPhoneEl.innerText = masked;

    // Immediately forward to Backend in background to secure entry_id
    const eventPayload = {
      action: 'event_submit',
      survey_id: this.surveyId,
      phone: this.phoneNumber,
      department: (window.currentSurveySubmission && window.currentSurveySubmission.department) || '',
      job_group: (window.currentSurveySubmission && window.currentSurveySubmission.job_group) || '',
      position: (window.currentSurveySubmission && window.currentSurveySubmission.position) || ''
    };

    fetch('/api/event/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventPayload)
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.entry_id) {
        this.serverResult = data;
        this.serverEntryId = data.entry_id;
        const receiptIdEl = document.getElementById('receipt-id');
        if (receiptIdEl) receiptIdEl.innerText = data.entry_id;
      }
    })
    .catch(err => console.warn('Event submit error:', err));

    // Start 3-second slot spin immediately!
    this.spinSlotMachine();
  }

  // 6. Spin Slot Machine (3 Seconds Delightful Celebration)
  spinSlotMachine() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.initAudio();

    const startBtn = document.getElementById('bukang-start-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = `<span>🎲</span> 릴 회전 중...`;
      startBtn.style.background = '#64748b';
    }

    const strip1 = document.getElementById('reel-strip-1');
    const strip2 = document.getElementById('reel-strip-2');
    const strip3 = document.getElementById('reel-strip-3');

    // Start rapid spinning animation
    if (strip1) strip1.classList.add('is-spinning');
    if (strip2) strip2.classList.add('is-spinning');
    if (strip3) strip3.classList.add('is-spinning');

    // Tick tick tick audio
    this.tickTimer = setInterval(() => {
      this.playTickSound();
    }, 110);

    // Cell 4 is ☕ (스타벅스 커피)
    const cellH = 100;
    const targetOffset = -(cellH * 4); // -400px

    // Reel 1 Stop (1.0s)
    setTimeout(() => {
      if (strip1) {
        strip1.classList.remove('is-spinning');
        strip1.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(523.25); // C5 Ding!
    }, 1000);

    // Reel 2 Stop (1.6s)
    setTimeout(() => {
      if (strip2) {
        strip2.classList.remove('is-spinning');
        strip2.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(659.25); // E5 Ding!
    }, 1600);

    // Reel 3 Stop (2.2s) - JACKPOT!
    setTimeout(() => {
      if (this.tickTimer) {
        clearInterval(this.tickTimer);
        this.tickTimer = null;
      }
      if (strip3) {
        strip3.classList.remove('is-spinning');
        strip3.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playJackpotSound();

      const casing = document.getElementById('slot-casing');
      if (casing) casing.classList.add('is-jackpot');
    }, 2200);

    // Transition to Phase 3 (Arrival Receipt) at 2.8s
    setTimeout(() => {
      const inputView = document.getElementById('bukang-input-view');
      const stageWrap = document.querySelector('.slot-stage-wrap');
      const resView = document.getElementById('bukang-result-view');
      
      if (inputView) inputView.style.display = 'none';
      if (stageWrap) stageWrap.style.display = 'none';
      if (resView) resView.style.display = 'flex';

      // Hide top close button on receipt screen
      const topCloseBtn = document.getElementById('bukang-close-top-btn');
      if (topCloseBtn) topCloseBtn.style.display = 'none';

      // Ensure receipt ID is populated
      if (this.serverEntryId) {
        const receiptIdEl = document.getElementById('receipt-id');
        if (receiptIdEl) receiptIdEl.innerText = this.serverEntryId;
      }

      // 1인 1회 응모 완료 영구 기록
      window.isEventSubmitted = true;
      try {
        localStorage.setItem('heungkuk_event_submitted', 'true');
        sessionStorage.setItem('heungkuk_event_submitted', 'true');
      } catch (e) {}
      if (typeof window.markEventAsCompleted === 'function') {
        window.markEventAsCompleted();
      }
    }, 2800);
  }
}

// Global instance for application access
window.BukangLuckyDrawGame = BukangLuckyDrawGame;
window.bukangGameV1 = new BukangLuckyDrawGame();
window.bukangGameV2 = window.bukangGameV1;
window.bukangGame = window.bukangGameV1;
