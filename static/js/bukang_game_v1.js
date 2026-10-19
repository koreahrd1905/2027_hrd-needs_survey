/**
 * BukangLuckyDrawGame - 행운의 커피 슬롯머신 이벤트
 * 
 * - 사내 저사양 PC / VDI 완벽 최적화 (Canvas 제거, 순수 CSS 하드웨어 가속)
 * - 좌측 2단 카드: 흥국금융 CI + COFFEE e-Gift 쿠폰 (Coffee.png 탑재)
 * - 우측: ★ Coffee LUCKY 777 ★ 대형 3구 슬롯머신
 * - 3단계 가슴 조리는 서스펜스 릴 연출 (Reel 1 -> Reel 2 -> Reel 3 슬로우모션 잭팟 ☕☕☕)
 * - 일체형 화면: 슬롯 결과(☕☕☕)와 응모 접수증(EVT-L/F)이 상하로 동시에 함께 노출
 * - 모바일/PC 반응형 & 아래 짤림 완전 방지 컴팩트 패딩
 * - 중복 전화번호 체크 시에만 적색(Red) 경고 메시지 표시
 * - 종료 버튼 클릭 시 캡처 5 화면 없이 브라우저 즉시 닫기 / 나가기 (앞선 부캉이 게임 방식 완벽 적용)
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
    this.suspenseTimers = [];
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

  playSlowTickSound() {
    this.playTone(720, 'triangle', 0.06, 0.16);
  }

  playReelStopSound(freq = 523) {
    this.playTone(freq, 'sine', 0.22, 0.25);
    this.playTone(freq * 1.5, 'triangle', 0.15, 0.15, 0.04);
  }

  playJackpotSound() {
    if (this.isMuted || !this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const delays = [0, 0.1, 0.2, 0.32, 0.46, 0.62];
    notes.forEach((f, idx) => {
      this.playTone(f, 'triangle', 0.38, 0.26, delays[idx]);
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
    if (this.suspenseTimers && this.suspenseTimers.length > 0) {
      this.suspenseTimers.forEach(t => clearTimeout(t));
      this.suspenseTimers = [];
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  // [교수님 지시사항 반영] 종료 버튼 클릭 시 캡처 5 화면 없이 브라우저 즉시 닫기 / 나가기
  exitCleanly() {
    this.close();
    window.isEventSubmitted = true;
    try {
      localStorage.setItem('heungkuk_event_submitted', 'true');
      sessionStorage.setItem('heungkuk_event_submitted', 'true');
    } catch (e) {}
    if (typeof window.markEventAsCompleted === 'function') {
      try { window.markEventAsCompleted(); } catch (e) {}
    }

    // 앞선 부캉이 게임에서 사용한 방식 우선 호출
    if (typeof window.handleSurveyAndGameFinish === 'function') {
      window.handleSurveyAndGameFinish();
      return;
    }

    // Direct multi-strategy window close
    try { window.open('', '_self', ''); window.close(); } catch (e) {}
    try { window.close(); } catch (e) {}
    try { self.close(); } catch (e) {}
    try {
      if (navigator.userAgent.indexOf('KAKAOTALK') !== -1) {
        location.href = 'kakaoweb://closeBrowser';
      }
    } catch (e) {}

    setTimeout(() => {
      try { window.close(); } catch (e) {}
      try { window.location.replace('about:blank'); } catch (e) {}
      document.body.innerHTML = `
        <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#090d16;color:white;font-family:'Pretendard','Malgun Gothic',sans-serif;text-align:center;padding:1.5rem;box-sizing:border-box;">
          <div style="width:72px;height:72px;border-radius:50%;background:#1e293b;border:2px solid #334155;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin-bottom:1.25rem;">
            🔒
          </div>
          <span style="background:rgba(239,68,68,0.2);color:#fca5a5;font-weight:700;font-size:0.85rem;padding:0.35rem 1rem;border-radius:9999px;margin-bottom:1rem;border:1px solid rgba(239,68,68,0.3);">
            화면 종료 완료 (Session Closed)
          </span>
          <h1 style="font-size:1.85rem;font-weight:800;letter-spacing:-0.03em;margin-bottom:0.85rem;color:#f8fafc;word-break:keep-all;">
            설문 및 이벤트 참여가 모두 완료되었습니다
          </h1>
          <p style="font-size:1.05rem;color:#94a3b8;line-height:1.7;max-width:540px;margin-bottom:2rem;word-break:keep-all;">
            소중한 의견에 감사드립니다.<br>
            <span style="color:#38bdf8;font-weight:700;">상단 브라우저 탭의 [ ✕ ] 버튼을 눌러 창을 닫아주십시오.</span>
          </p>
        </div>
      `;
      document.title = '설문 및 이벤트 종료 완료';
    }, 80);
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
      this.exitCleanly();
    };
  }

  // 3. Create Modal DOM
  createModalDOM() {
    if (this.modalEl) this.close();

    this.modalEl = document.createElement('div');
    this.modalEl.id = 'bukang-lucky-modal';
    this.modalEl.className = 'bukang-modal-overlay';

    // 5 slot items in each reel strip (Cell 0 and Cell 4 are target ☕ Jackpot!)
    const reelItemsHtml = `
      <div class="slot-cell">
        <div class="slot-cell-icon"><img src="/static/images/coffee.png" style="height:52px;width:auto;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));" alt="커피"></div>
        <div class="slot-cell-label">커피</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon" style="font-size:2.5rem;">💎</div>
        <div class="slot-cell-label">흥국금융</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon" style="font-size:2.5rem;">🍀</div>
        <div class="slot-cell-label">행운클로버</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon" style="font-size:2.5rem;">🎁</div>
        <div class="slot-cell-label">선물상자</div>
      </div>
      <div class="slot-cell">
        <div class="slot-cell-icon"><img src="/static/images/coffee.png" style="height:52px;width:auto;object-fit:contain;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));" alt="커피"></div>
        <div class="slot-cell-label">커피</div>
      </div>
    `;

    this.modalEl.innerHTML = `
      <div class="bukang-modal-box" style="max-width: 860px; max-height: min(94vh, 94dvh); border-radius: 18px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 25px 65px rgba(15, 23, 42, 0.45); display: flex; flex-direction: column;">
        
        <!-- Top Signboard Header (상단/좌측 간판 타이틀) -->
        <div class="bukang-header" style="background: linear-gradient(90deg, #0284c7 0%, #0369a1 100%); padding: 0.75rem 1.4rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #bae6fd; flex-shrink: 0;">
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
        <div class="bukang-body" style="background: #ffffff; display: flex; flex-direction: column; width: 100%; flex: 1;">
          
          <!-- Top Visual Stage: Heungkuk CI & COFFEE e-Gift 쿠폰 (좌측 2단 카드) + ★ Coffee LUCKY 777 ★ (우측 슬롯머신) -->
          <div class="slot-stage-wrap" style="background: linear-gradient(135deg, #091e3a 0%, #0f274a 55%, #064e3b 100%); padding: 1.15rem 1.4rem; display: flex; align-items: center; justify-content: center; gap: 1.5rem; position: relative; border-bottom: 3px solid #f59e0b; box-sizing: border-box; width: 100%;">
            
            <!-- Left: 2-Tier Brand Column (흥국 CI + COFFEE e-Gift 쿠폰 상하 배치) -->
            <div class="slot-brand-col" style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center; justify-content: center;">
              <!-- Upper Card: Heungkuk CI -->
              <div class="brand-card-item" style="background: #ffffff; border-radius: 12px; padding: 0.55rem 1rem; width: 220px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-height: 48px;">
                <img src="/static/images/heungkuk_ci.png" alt="흥국금융가족" style="height: 35px; width: auto; object-fit: contain;">
              </div>
              <!-- Lower Card: COFFEE e-Gift 쿠폰 (Coffee.png 탑재) -->
              <div class="brand-card-item" style="background: #ffffff; border-radius: 12px; padding: 0.55rem 1rem; width: 220px; box-shadow: 0 4px 15px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; box-sizing: border-box; min-height: 48px;">
                <div style="display: flex; align-items: center; gap: 0.6rem;">
                  <img src="/static/images/coffee.png" alt="커피" style="height: 34px; width: auto; object-fit: contain;">
                  <div style="font-size: 0.94rem; font-weight: 900; color: #0f172a; letter-spacing: -0.01em;">
                    COFFEE  e-Gift 쿠폰
                  </div>
                </div>
              </div>
            </div>

            <!-- Right: Enhanced Large 3-Reel Slot Machine -->
            <div class="slot-frame" id="slot-casing" style="background: linear-gradient(145deg, #1e293b, #0f172a); border: 4px solid #f59e0b; border-radius: 18px; padding: 0.8rem 1.1rem; box-shadow: 0 15px 35px rgba(0,0,0,0.45); width: 410px; max-width: 100%; box-sizing: border-box; position: relative;">
              <div style="text-align: center; color: #facc15; font-size: 0.92rem; font-weight: 900; letter-spacing: 2px; margin-bottom: 0.45rem; text-shadow: 0 0 10px #f59e0b;">
                ★ Coffee LUCKY 777 ★
              </div>
              <div class="slot-reels-container" style="display: flex; gap: 0.75rem; justify-content: center; align-items: center; background: #020617; padding: 0.65rem; border-radius: 14px; position: relative; border: 2px solid #334155;">
                <div class="slot-payline" style="position: absolute; top: 50%; left: 0; right: 0; height: 2px; background: rgba(250, 204, 21, 0.85); box-shadow: 0 0 8px #facc15; pointer-events: none; z-index: 5; transform: translateY(-50%);"></div>
                
                <!-- Reel 1 -->
                <div class="slot-reel-window" style="width: 104px; height: 115px; background: #ffffff; border-radius: 10px; overflow: hidden; position: relative; box-shadow: inset 0 8px 16px rgba(0,0,0,0.25), inset 0 -8px 16px rgba(0,0,0,0.25); border: 2px solid #94a3b8;">
                  <div class="slot-reel-strip" id="reel-strip-1" style="display: flex; flex-direction: column; position: absolute; top: 0; left: 0; width: 100%;">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 2 -->
                <div class="slot-reel-window" style="width: 104px; height: 115px; background: #ffffff; border-radius: 10px; overflow: hidden; position: relative; box-shadow: inset 0 8px 16px rgba(0,0,0,0.25), inset 0 -8px 16px rgba(0,0,0,0.25); border: 2px solid #94a3b8;">
                  <div class="slot-reel-strip" id="reel-strip-2" style="display: flex; flex-direction: column; position: absolute; top: 0; left: 0; width: 100%;">
                    ${reelItemsHtml}
                  </div>
                </div>

                <!-- Reel 3 -->
                <div class="slot-reel-window" style="width: 104px; height: 115px; background: #ffffff; border-radius: 10px; overflow: hidden; position: relative; box-shadow: inset 0 8px 16px rgba(0,0,0,0.25), inset 0 -8px 16px rgba(0,0,0,0.25); border: 2px solid #94a3b8;">
                  <div class="slot-reel-strip" id="reel-strip-3" style="display: flex; flex-direction: column; position: absolute; top: 0; left: 0; width: 100%;">
                    ${reelItemsHtml}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Card: Input & Action Area -->
          <div class="bukang-input-panel" id="bukang-input-view" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1rem 1.4rem;">
            <div class="bukang-guide-card" style="max-width: 680px; width: 100%;">
              
              <!-- Badge -->
              <div class="shark-badge" style="display: inline-block; background: #e0f2fe; color: #0369a1; font-size: 0.88rem; font-weight: 800; padding: 0.25rem 0.95rem; border-radius: 20px; border: 1.5px solid #bae6fd; margin-bottom: 0.35rem;">
                커피 쿠폰 챌린지 슬롯머신
              </div>

              <!-- Main Instruction -->
              <p style="font-size: 1.02rem; font-weight: 700; color: #1e293b; margin: 0.15rem 0 0.65rem 0;">
                선물 받을 연락처를 입력 후 <span style="color:#0284c7;background:#e0f2fe;padding:0.18rem 0.55rem;border-radius:6px;font-weight:800;border:1.5px solid #7dd3fc;display:inline-block;">'슬롯 당기기'</span> 버튼을 클릭하세요.
              </p>

              <!-- Phone Input & Start Button Row -->
              <div class="phone-input-row" style="display: flex; justify-content: center; align-items: center; gap: 0.65rem; max-width: 520px; margin: 0 auto 0.65rem auto;">
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

              <!-- Horizontal Meta Row (체크박스 + 안내 좌우 배치!) -->
              <div class="slot-meta-row" style="display: flex; align-items: center; justify-content: space-between; gap: 0.85rem; max-width: 650px; margin: 0.5rem auto 0 auto; background: #f8fafc; padding: 0.5rem 0.95rem; border-radius: 12px; border: 1px solid #e2e8f0; box-sizing: border-box;">
                <!-- Left: Checkbox -->
                <label style="display: inline-flex; align-items: center; gap: 0.45rem; cursor: pointer; font-size: 0.84rem; color: #1e293b; font-weight: 600; text-align: left;">
                  <input type="checkbox" id="bukang-privacy-check" checked style="width: 17px; height: 17px; accent-color: #0284c7; cursor: pointer; flex-shrink: 0;">
                  <span>(필수) 커피 모바일쿠폰 발송 목적의 개인정보 수집에 동의합니다.</span>
                </label>
                <!-- Right: Notice -->
                <div style="font-size: 0.78rem; color: #64748b; font-weight: 500; white-space: nowrap; text-align: right; line-height: 1.3;">
                  연락처는 당첨자에게 쿠폰 발송 용도로만 사용됩니다.
                </div>
              </div>

              <!-- Sub Guidance -->
              <div style="margin-top: 0.4rem; font-size: 0.8rem; color: #0284c7; font-weight: 500;">
                (게임 참여는 선택사항이며, 원하지 않으시면 종료(✕) 하시면 됩니다.)
              </div>

              <!-- Red Error Message Container (중복 전화번호 체크 시에만 적색 노출) -->
              <div class="phone-err-msg" id="bukang-phone-err" style="color: #ef4444; font-size: 0.92rem; font-weight: 800; margin-top: 0.45rem; display: none; line-height: 1.4;"></div>
            </div>
          </div>

          <!-- Phase 3: Result Celebration Overlay (Finished Receipt - 일체형 화면으로 슬롯과 함께 노출!) -->
          <div class="bukang-result-panel" id="bukang-result-view" style="display:none; padding: 0.75rem 1.2rem; flex-direction: column; align-items: center;">
            <div class="result-card" style="padding: 0.75rem 1.25rem; max-width: 520px; width: 100%; margin: 0 auto; box-shadow: 0 12px 30px rgba(0,0,0,0.25); border: 2.5px solid #facc15; border-radius: 16px; background: #ffffff; text-align: center; box-sizing: border-box;">
              <div class="result-badge" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; font-size: 0.82rem; font-weight: 800; padding: 0.2rem 0.85rem; border-radius: 20px; display: inline-block; margin-bottom: 0.3rem;">
                응모 접수 완료
              </div>
              <h2 class="result-title" style="font-size: 1.22rem; font-weight: 900; color: #1e3a8a; margin: 0 0 0.25rem 0; letter-spacing: -0.02em;">
                선착순 이벤트에 정상 응모되었습니다
              </h2>
              <div class="result-sub-text" style="font-size: 0.86rem; color: #475569; margin-bottom: 0.5rem; line-height: 1.35;">
                선착순 000명에게 모바일 쿠폰을 보내드립니다<br>
                <span style="color:#0284c7;font-weight:700;font-size:0.8rem;">(발송일 : 10월 30일 이후)</span>
              </div>

              <div class="entry-receipt" style="padding: 0.45rem 0.85rem; margin-bottom: 0.55rem; font-size: 0.82rem; background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; text-align: left;">
                <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.2rem 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #64748b;">접수 번호</span>
                  <strong id="receipt-id" style="color: #0f172a; font-family: monospace; font-size: 0.94rem;">발급 중...</strong>
                </div>
                <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.2rem 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #64748b;">응모 번호</span>
                  <strong id="receipt-phone" style="color: #0f172a; font-family: monospace; font-size: 0.94rem;">010-****-0000</strong>
                </div>
                <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.2rem 0; border-bottom: 1px solid #f1f5f9;">
                  <span style="color: #64748b;">슬롯 결과</span>
                  <span style="color: #059669; font-weight: 700;">☕ ☕ ☕ (커피 3연속 잭팟 성공!)</span>
                </div>
                <div class="receipt-row" style="display: flex; justify-content: space-between; padding: 0.2rem 0;">
                  <span style="color: #64748b;">응모 확인</span>
                  <span style="color: #0284c7; font-weight: 700;">선착순 정상 접수 완료</span>
                </div>
              </div>

              <div class="result-btn-row" style="display: flex; justify-content: center; margin-top: 0.35rem;">
                <button class="bukang-finish-btn" id="bukang-finish-btn" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; border: none; border-radius: 12px; padding: 0.62rem 2.8rem; font-size: 1.02rem; font-weight: 800; cursor: pointer; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); transition: all 0.2s ease;">
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

    // Finish Button (Clean Exit without Capture 5)
    const finishBtn = document.getElementById('bukang-finish-btn');
    if (finishBtn) {
      finishBtn.onclick = () => {
        this.exitCleanly();
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

    // Start enhanced heart-throbbing suspense slot spin
    this.spinSlotMachine();
  }

  // 6. Spin Slot Machine (Enhanced Heart-Throbbing Suspense Spin - 가슴 조리는 연출)
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

    // Start rapid spinning animation for all 3 reels
    if (strip1) {
      strip1.style.transition = 'none';
      strip1.classList.add('is-spinning');
    }
    if (strip2) {
      strip2.style.transition = 'none';
      strip2.classList.add('is-spinning');
    }
    if (strip3) {
      strip3.style.transition = 'none';
      strip3.classList.add('is-spinning');
    }

    // Tick tick tick audio
    this.tickTimer = setInterval(() => {
      this.playTickSound();
    }, 100);

    // Responsive cell height (115px desktop, 98px mobile)
    const cellH = window.innerWidth <= 768 ? 98 : 115;
    const targetOffset = -(cellH * 4); // Cell 4 is ☕ (커피)

    // Reel 1 Stop (1.8s) -> Ding!
    setTimeout(() => {
      if (strip1) {
        strip1.classList.remove('is-spinning');
        strip1.style.transition = 'transform 0.42s cubic-bezier(0.15, 0.9, 0.25, 1.05)';
        strip1.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(523.25); // C5 Ding!
    }, 1800);

    // Reel 2 Stop (3.2s) -> Ding! (2 out of 3 matched!)
    setTimeout(() => {
      if (strip2) {
        strip2.classList.remove('is-spinning');
        strip2.style.transition = 'transform 0.42s cubic-bezier(0.15, 0.9, 0.25, 1.05)';
        strip2.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(659.25); // E5 Ding!
    }, 3200);

    // Reel 3 Suspense (3.2s ~ 5.8s: dramatic slow-motion creeping deceleration!)
    setTimeout(() => {
      if (this.tickTimer) {
        clearInterval(this.tickTimer);
        this.tickTimer = null;
      }

      if (strip3) {
        strip3.classList.remove('is-spinning');
        // Dramatic slow suspense transition (2.6 seconds of agonizing slow-down)
        strip3.style.transition = 'transform 2.6s cubic-bezier(0.06, 0.88, 0.15, 1.02)';
        strip3.style.transform = `translateY(${targetOffset}px)`;
      }

      // Progressive slow ticks during Reel 3 deceleration
      const tickDelays = [200, 500, 900, 1400, 2000, 2400];
      tickDelays.forEach(d => {
        const t = setTimeout(() => {
          this.playSlowTickSound();
        }, d);
        this.suspenseTimers.push(t);
      });
    }, 3200);

    // Reel 3 Complete Lock (5.8s) -> JACKPOT ☕☕☕ Fanfare!
    setTimeout(() => {
      this.playJackpotSound();

      const casing = document.getElementById('slot-casing');
      if (casing) casing.classList.add('is-jackpot');
    }, 5800);

    // Transition to Phase 3 (Arrival Receipt - 일체형 화면으로 슬롯과 함께 노출!) at 6.4s
    setTimeout(() => {
      const inputView = document.getElementById('bukang-input-view');
      const resView = document.getElementById('bukang-result-view');
      
      // Slide out input view, slide in result view (Top slot machine stays 100% visible!)
      if (inputView) inputView.style.display = 'none';
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
    }, 6400);
  }
}

// Global instance for application access
window.BukangLuckyDrawGame = BukangLuckyDrawGame;
window.bukangGameV1 = new BukangLuckyDrawGame();
window.bukangGameV2 = window.bukangGameV1;
window.bukangGame = window.bukangGameV1;
