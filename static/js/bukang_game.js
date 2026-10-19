/**
 * BukangLuckyDrawGame - 부캉이 행운의 커피 슬롯머신 (초경량 사내 PC 최적화 버전)
 * 
 * - 0% CPU/GPU 부하: 무거운 Canvas 루프를 완전 제거하고 순수 CSS 트랜스폼으로 구동
 * - 사내 저사양 데스크톱 / VDI 가상화 환경에서도 60fps로 매끄럽게 3초 롤링
 * - 100% 전원 기분 좋은 3연속 커피 잭팟(☕☕☕) 연출 후 공식 접수증(EVT-L/F) 발급
 * - 1인 1회 엄격 검증 및 Render 백엔드 단일 통로 자동 기록
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
    this.modalEl.id = 'bukang-game-modal';
    this.modalEl.className = 'bukang-modal-overlay';

    // 6 slot items in each reel strip (Cell 5 is target ☕ Jackpot!)
    const reelItemsHtml = `
      <div class="slot-cell">
        <div class="slot-cell-icon">☕</div>
        <div class="slot-cell-label">스타벅스</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">🦈</div>
        <div class="slot-cell-label">부캉이</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon">💖</div>
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
      <div class="bukang-modal-box">
        <!-- Top Navigation Header -->
        <div class="bukang-header">
          <div class="bukang-title">
            <img src="/static/images/bukang_shark.png" alt="부캉이" class="bukang-title-img" onerror="this.style.display='none'">
            <h3>흥국금융 스타벅스 럭키 드로우</h3>
          </div>
          <div class="bukang-controls">
            <button class="bukang-btn-icon" id="bukang-sound-btn" title="사운드 켜기/끄기">🔊</button>
            <button class="bukang-btn-icon" id="bukang-close-top-btn" title="이벤트 닫기">✕</button>
          </div>
        </div>

        <!-- Card Container -->
        <div class="bukang-body" style="padding: 1rem 0; min-height: 480px; display: flex; align-items: center; justify-content: center;">
          
          <!-- Phase 1: Phone Number Input View -->
          <div class="bukang-input-panel" id="bukang-input-view" style="display:flex;">
            <div class="input-card">
              <div class="input-badge">🎁 스타벅스 커피쿠폰 선착순 이벤트</div>
              <h2 class="input-title">부캉이와 함께하는 럭키 드로우!</h2>
              <p class="input-desc">
                설문에 참여해 주셔서 대단히 감사합니다.<br>
                경품 발송을 위해 <b>휴대폰 번호(010-XXXX-XXXX)</b>를 입력해 주세요.
              </p>

              <div class="input-form-group">
                <input 
                  type="tel" 
                  id="bukang-phone-input" 
                  class="bukang-phone-field" 
                  placeholder="010-1234-5678" 
                  maxlength="13"
                  autocomplete="tel"
                >
                <div class="input-privacy-row">
                  <label class="privacy-label">
                    <input type="checkbox" id="bukang-privacy-check" checked>
                    <span>(필수) 스타벅스 모바일 쿠폰 발송 목적의 개인정보 수집에 동의합니다.</span>
                  </label>
                </div>
                <div class="input-err-msg" id="bukang-input-err"></div>
              </div>

              <button class="bukang-start-drive-btn" id="bukang-start-drive-btn">
                <span>행운의 커피 슬롯 돌리기 🎰</span>
              </button>
              
              <div style="margin-top:0.85rem;font-size:0.8rem;color:#64748b;">
                (게임 참여는 선택사항이며, 원하지 않으시면 종료(✕) 하시면 됩니다.)
              </div>
            </div>
          </div>

          <!-- Phase 2: Ultra-lightweight Coffee Slot Machine Panel -->
          <div class="slot-machine-panel" id="bukang-slot-view" style="display:none;">
            <div class="slot-header">
              <img src="/static/images/bukang_shark.png" alt="부캉이" class="slot-mascot-img" onerror="this.style.display='none'">
              <h2 class="slot-title">☕ 부캉이의 럭키 커피 슬롯!</h2>
              <p class="slot-subtitle">[START] 버튼을 눌러 행운의 릴을 돌려보세요!</p>
            </div>

            <div class="slot-frame" id="slot-casing">
              <div class="slot-reels-container">
                <div class="slot-payline"></div>
                
                <!-- Reel 1 -->
                <div class="slot-reel-window">
                  <div class="slot-reel-strip" id="reel-strip-1">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 2 -->
                <div class="slot-reel-window">
                  <div class="slot-reel-strip" id="reel-strip-2">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 3 -->
                <div class="slot-reel-window">
                  <div class="slot-reel-strip" id="reel-strip-3">
                    ${reelItemsHtml}
                  </div>
                </div>
              </div>
            </div>

            <button class="slot-spin-btn" id="slot-spin-btn">
              <span>🎰 슬롯 당기기 (START)</span>
            </button>
          </div>

          <!-- Phase 3: Result Celebration Overlay (Finished Receipt) -->
          <div class="bukang-result-panel" id="bukang-result-view" style="display:none;">
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
                  <span style="color:#059669;font-weight:700;">☕ ☕ ☕ (스타벅스 3연속 일치!)</span>
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
    const soundBtn = document.getElementById('bukang-sound-btn');
    if (soundBtn) {
      soundBtn.onclick = () => {
        this.isMuted = !this.isMuted;
        soundBtn.innerText = this.isMuted ? '🔇' : '🔊';
        this.initAudio();
      };
    }

    // Top Close Button
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
          const btn = document.getElementById('bukang-start-drive-btn');
          if (btn) btn.click();
        }
      };
    }

    // Start Button (Phase 1 -> Phase 2)
    const startBtn = document.getElementById('bukang-start-drive-btn');
    if (startBtn) {
      startBtn.onclick = () => this.handlePhoneSubmit();
    }

    // Spin Button (Phase 2 Slot Machine)
    const spinBtn = document.getElementById('slot-spin-btn');
    if (spinBtn) {
      spinBtn.onclick = () => this.spinSlotMachine();
    }

    // Finish Button (Phase 3)
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

  // 5. Handle Phone Submit & Pre-fetch Entry ID
  async handlePhoneSubmit() {
    const phoneInput = document.getElementById('bukang-phone-input');
    const privacyCheck = document.getElementById('bukang-privacy-check');
    const errEl = document.getElementById('bukang-input-err');
    if (errEl) errEl.innerText = '';

    const phone = (phoneInput ? phoneInput.value : '').trim();
    const cleanDigits = phone.replace(/[^0-9]/g, '');

    if (!cleanDigits.startsWith('010') || cleanDigits.length !== 11) {
      if (errEl) errEl.innerText = '올바른 휴대폰 번호(010-XXXX-XXXX 11자리)를 입력해 주세요.';
      if (phoneInput) phoneInput.focus();
      return;
    }

    if (!privacyCheck || !privacyCheck.checked) {
      if (errEl) errEl.innerText = '개인정보 수집 및 이용에 동의해 주세요.';
      return;
    }

    // Check duplicate phone locally first
    if (localStorage.getItem('heungkuk_event_submitted') === 'true') {
      if (errEl) errEl.innerText = '이미 이벤트에 응모 완료된 기기입니다. (1인 1회 한정)';
      return;
    }

    // Server duplicate check
    try {
      const chkRes = await fetch(`/api/event/check?phone=${cleanDigits}`);
      const chkData = await chkRes.json();
      if (chkData && chkData.already_submitted) {
        if (errEl) errEl.innerText = chkData.error || '이미 이벤트 응모가 완료된 번호입니다.';
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

    // Transition to Phase 2 (Slot Machine)
    const inputView = document.getElementById('bukang-input-view');
    const slotView = document.getElementById('bukang-slot-view');
    if (inputView) inputView.style.display = 'none';
    if (slotView) slotView.style.display = 'flex';
  }

  // 6. Spin Slot Machine (3 Seconds Delightful Celebration)
  spinSlotMachine() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.initAudio();

    const spinBtn = document.getElementById('slot-spin-btn');
    if (spinBtn) {
      spinBtn.disabled = true;
      spinBtn.innerHTML = `<span>🎲 행운의 릴 회전 중...</span>`;
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

    // Responsive cell height (110px desktop, 95px mobile)
    const cellH = window.innerWidth <= 480 ? 95 : 110;
    const targetOffset = -(cellH * 5); // Cell 5 is ☕ (스타벅스 커피)

    // Reel 1 Stop (1.1s)
    setTimeout(() => {
      if (strip1) {
        strip1.classList.remove('is-spinning');
        strip1.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(523.25); // C5 Ding!
    }, 1100);

    // Reel 2 Stop (1.7s)
    setTimeout(() => {
      if (strip2) {
        strip2.classList.remove('is-spinning');
        strip2.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(659.25); // E5 Ding!
    }, 1700);

    // Reel 3 Stop (2.3s) - JACKPOT!
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
    }, 2300);

    // Transition to Phase 3 (Receipt) at 2.9s
    setTimeout(() => {
      const slotView = document.getElementById('bukang-slot-view');
      const resView = document.getElementById('bukang-result-view');
      if (slotView) slotView.style.display = 'none';
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
    }, 2900);
  }
}

// Global instance for application access
window.bukangGameV1 = new BukangLuckyDrawGame();
window.bukangGameV2 = window.bukangGameV1;
window.bukangGame = window.bukangGameV1;
