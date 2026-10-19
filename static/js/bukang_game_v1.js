/**
 * BukangLuckyDrawGame - 행운의 커피 슬롯머신 이벤트
 * 
 * - 사내 저사양 PC / VDI 완벽 최적화 (Canvas 제거, 순수 CSS 하드웨어 가속)
 * - [PC 버전 최적화]
 *   * 상단 슬롯머신 영역 대폭 확대 및 시원한 높이감 (Reel 136px, Frame 480px)
 *   * 우상단 종료(X) 클릭 시 '안내 확인창(계속 참여하기 vs 종료)' 팝업 호출
 * - [모바일 버전 최적화 (Fold, 안드로이드, 아이폰 반응형)]
 *   * 모바일 세로보기: 흥국 CI 40% 축소 (16px 높이), "커피쿠폰 챌린지" 뱃지 숨김으로 공간 극대화
 *   * 동의문 2줄 축소 정리: 한 줄 체크박스 동의문 + 하단 안내문구 짤림 완전 방지
 *   * 모바일 가로보기: 좌측(슬롯머신) + 우측(안내/입력폼) 2분할 가로 레이아웃 완벽 지원
 * - [슬롯 동작 및 연출]
 *   * 1번 릴(1.8초) -> 2번 릴(3.4초) -> 3번 릴 단독 0.8초 고속회전 후 1.6초 감속 서스펜스(5.8초 안착)
 *   * 회전 사운드: 경쾌한 아케이드 듀얼 차임벨
 *   * 잭팟 사운드: 화려하고 웅장한 4화음 브라스 트럼펫 팡파르
 *   * 잭팟 시각효과: 황금빛 테두리 + 마젠타 듀얼 펄스 발광 (.is-jackpot)
 *   * 결과창 딜레이: 잭팟 감상 후 1.5초 후 매끄럽게 전환
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
    this.spinSoundTimer = null;
    this.suspenseTimers = [];
    this.soundStep = 0;
  }

  // 1. Web Audio Synthesizer (경쾌한 아케이드 슬롯 & 풍성한 잭팟 팡파르)
  initAudio() {
    if (!this.audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.audioCtx = new AudioCtx();
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.12, vol = 0.22, startTime = 0) {
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

  // 경쾌한 아케이드 롤링 차임벨 (두 음이 반짝이며 교차)
  playSpinChime() {
    this.soundStep = (this.soundStep + 1) % 2;
    const f1 = this.soundStep === 0 ? 1046.50 : 1318.51; // C6 or E6
    const f2 = this.soundStep === 0 ? 2093.00 : 2637.02; // Overtone
    this.playTone(f1, 'sine', 0.05, 0.18);
    this.playTone(f2, 'triangle', 0.04, 0.10, 0.01);
  }

  // 3번 릴 서스펜스 감속 클릭음
  playSlowTickSound(freq = 680) {
    this.playTone(freq, 'triangle', 0.08, 0.25);
    this.playTone(freq * 0.5, 'sine', 0.06, 0.18, 0.02);
  }

  // 릴 정지 딩 사운드
  playReelStopSound(freq = 1046.50) {
    this.playTone(freq, 'sine', 0.32, 0.32);
    this.playTone(freq * 1.5, 'triangle', 0.22, 0.20, 0.04);
  }

  // 화려하고 풍성한 잭팟 팡파르 (트럼펫 & 브라스 하모니 4화음)
  playJackpotFanfare() {
    if (this.isMuted || !this.audioCtx) return;
    try {
      this.initAudio();

      // 팡파르 아르페지오 (C5 -> E5 -> G5 -> C6)
      const arpeggio = [
        { f: 523.25, d: 0.15, dt: 0.00 },
        { f: 659.25, d: 0.15, dt: 0.13 },
        { f: 783.99, d: 0.15, dt: 0.26 },
        { f: 1046.50, d: 0.35, dt: 0.40 }
      ];
      arpeggio.forEach(n => {
        this.playTone(n.f, 'triangle', n.d, 0.35, n.dt);
        this.playTone(n.f * 1.005, 'sawtooth', n.d * 0.7, 0.15, n.dt);
      });

      // 그랜드 피날레 4중 화음 (C-E-G-C 대합창) at +0.65s (1.3초간 유지)
      const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      chord.forEach(f => {
        this.playTone(f, 'triangle', 1.35, 0.38, 0.65);
        this.playTone(f * 2, 'sine', 0.9, 0.18, 0.68);
      });
    } catch (e) {}
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
    if (this.spinSoundTimer) {
      clearInterval(this.spinSoundTimer);
      this.spinSoundTimer = null;
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

  // [교수님 지시사항 1] 우상단 종료(X) 클릭 시 안내 확인창 팝업 표시
  promptExitConfirmation() {
    if (document.getElementById('bukang-exit-confirm-modal')) return;

    const confirmOverlay = document.createElement('div');
    confirmOverlay.id = 'bukang-exit-confirm-modal';
    confirmOverlay.className = 'bukang-exit-confirm-overlay';
    confirmOverlay.innerHTML = `
      <div class="bukang-exit-confirm-card">
        <div style="font-size:2.5rem;margin-bottom:0.35rem;">🚪</div>
        <h3 style="font-size:1.22rem;font-weight:900;color:#1e293b;margin:0 0 0.45rem 0;">이벤트 참여없이 종료하시겠습니까?</h3>
        <p style="font-size:0.9rem;color:#64748b;margin:0 0 1.25rem 0;line-height:1.55;">
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

  // 브라우저 창 즉시 닫기 / 웹화면 나가기
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

    // 앞선 부캉이 게임 방식 우선 호출
    if (typeof window.handleSurveyAndGameFinish === 'function') {
      window.handleSurveyAndGameFinish();
      return;
    }

    // Direct native close
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
    }, 60);
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
        <div class="slot-cell-icon"><img src="/static/images/coffee.png" alt="커피"></div>
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
        <div class="slot-cell-icon"><img src="/static/images/coffee.png" alt="커피"></div>
        <div class="slot-cell-label">커피</div>
      </div>
    `;

    this.modalEl.innerHTML = `
      <div class="bukang-modal-box" style="max-width: 890px; max-height: min(94vh, 94dvh); border-radius: 18px; overflow-y: auto; overflow-x: hidden; box-shadow: 0 25px 65px rgba(15, 23, 42, 0.45); display: flex; flex-direction: column;">
        
        <!-- Top Signboard Header -->
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
          
          <!-- Top Visual Stage: 흥국CI 단독(가운데 정렬) + 대형 슬롯머신 -->
          <div class="slot-stage-wrap">
            
            <!-- Left: Heungkuk CI Card Only (Pill Shape) -->
            <div class="slot-brand-col">
              <div class="brand-card-item">
                <img src="/static/images/heungkuk_ci.png" alt="흥국금융가족">
              </div>
            </div>

            <!-- Right: Enhanced Large 3-Reel Slot Machine -->
            <div class="slot-frame" id="slot-casing">
              
              <!-- ★ Coffee LUCKY 777 ★ 아케이드 네온 전광판 타이틀 -->
              <div class="slot-marquee-title">
                ★ Coffee LUCKY 777 ★
              </div>
              
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
          </div>

          <!-- Bottom Card: Input & Action Area -->
          <div class="bukang-input-panel" id="bukang-input-view" style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 0.95rem 1.4rem;">
            <div class="bukang-guide-card" style="max-width: 680px; width: 100%;">
              
              <!-- [데스크탑 전용] 커피쿠폰 챌린지 카드 뱃지 (모바일 세로/가로에서는 CSS로 자동 숨김) -->
              <div class="coffee-challenge-card" style="display: inline-flex; align-items: center; gap: 0.65rem; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 16px; padding: 0.35rem 1.15rem; box-shadow: 0 3px 10px rgba(0,0,0,0.08); margin-bottom: 0.45rem;">
                <img src="/static/images/coffee.png" alt="커피" style="height: 30px; width: auto; object-fit: contain;">
                <span style="font-size: 1.02rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em;">
                  커피쿠폰 챌린지 슬롯머신
                </span>
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
                <button class="bukang-start-btn" id="bukang-start-btn" style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: white; border: none; border-radius: 12px; padding: 0.75rem 1.4rem; font-size: 1.02rem; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 0.45rem; box-shadow: 0 6px 16px rgba(2, 132, 199, 0.38); white-space: nowrap;">
                  <span>🎰</span> 슬롯 당기기
                </button>
              </div>

              <!-- 동의문 및 안내문구 (모바일 자동 줄바꿈) -->
              <div class="slot-agreement-box">
                <!-- 1행: 체크박스 + 필수 동의문 -->
                <label style="display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; cursor: pointer; font-size: 0.86rem; color: #1e293b; font-weight: 700;">
                  <input type="checkbox" id="bukang-privacy-check" checked style="width: 16px; height: 16px; accent-color: #0284c7; cursor: pointer; flex-shrink: 0;">
                  <span>(필수) 커피 모바일쿠폰 발송 목적의 개인정보 수집에 동의합니다.</span>
                </label>
                
                <!-- 2행: 안내문구 -->
                <div style="font-size: 0.8rem; color: #64748b; font-weight: 500; line-height: 1.35; text-align: center; word-break: keep-all;">
                  연락처는 당첨자에게 쿠폰발송 용도로만 사용됩니다 (게임 참여는 선택사항이며, 원하지 않으시면 종료(X) 하시기 바랍니다)
                </div>
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

    // [교수님 지시사항 반영] Top Close Button (✕) -> 종료 확인 안내창 띄우기
    const topCloseBtn = document.getElementById('bukang-close-top-btn');
    if (topCloseBtn) {
      topCloseBtn.onclick = (e) => {
        if (e) e.stopPropagation();
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

  // 6. Spin Slot Machine (반응형 셀 높이 계산 & 동작-사운드 완전 일치)
  spinSlotMachine() {
    if (this.isSpinning) return;
    this.isSpinning = true;
    this.initAudio();

    const startBtn = document.getElementById('bukang-start-btn');
    if (startBtn) {
      startBtn.disabled = true;
      startBtn.innerHTML = `<span>🎲</span> 릴 회전 중`;
      startBtn.style.background = '#64748b';
    }

    const strip1 = document.getElementById('reel-strip-1');
    const strip2 = document.getElementById('reel-strip-2');
    const strip3 = document.getElementById('reel-strip-3');

    // 3개 릴 모두 고속 회전 애니메이션 시작
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

    // 경쾌한 아케이드 롤링 사운드 (90ms 간격으로 경쾌하게 울림)
    this.spinSoundTimer = setInterval(() => {
      this.playSpinChime();
    }, 90);

    // [반응형 셀 높이 계산]
    const isMobileLandscape = window.matchMedia('(orientation: landscape) and (max-height: 550px)').matches || (window.innerWidth <= 950 && window.matchMedia('(orientation: landscape)').matches);
    let cellH = 136; // PC 기본: 136px
    if (isMobileLandscape) {
      cellH = 84; // 모바일 가로: 84px
    } else if (window.innerWidth <= 768) {
      cellH = 86; // 모바일 세로: 86px (Z폴더 및 S26 최적화)
    }
    const targetOffset = -(cellH * 4); // Cell 4 is ☕ (커피)

    // [1단계] 1번 릴 정지 (1.8초) -> 딩! (☕ 1개 일치)
    setTimeout(() => {
      if (strip1) {
        strip1.classList.remove('is-spinning');
        strip1.style.transition = 'transform 0.4s cubic-bezier(0.12, 0.9, 0.25, 1.05)';
        strip1.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(1046.50); // C6 맑은 종소리
    }, 1800);

    // [2단계] 2번 릴 정지 (3.4초) -> 딩! (☕ 2개 연속 일치!)
    // * 2번 릴이 멈춰도 3번 릴은 4.2초까지 0.8초 동안 혼자 쌩쌩 돌고 있음 (동시 정지 현상 완벽 해결!)
    setTimeout(() => {
      if (strip2) {
        strip2.classList.remove('is-spinning');
        strip2.style.transition = 'transform 0.4s cubic-bezier(0.12, 0.9, 0.25, 1.05)';
        strip2.style.transform = `translateY(${targetOffset}px)`;
      }
      this.playReelStopSound(1318.51); // E6 더 높은 종소리 (2개 성공!)
    }, 3400);

    // [3단계] 3번 릴 서스펜스 감속 시작 (4.2초) -> 4.2초~5.8초(1.6초간 안 맞을 듯 맞을 듯 천천히 굴러감)
    setTimeout(() => {
      // 빠른 회전음 멈춤
      if (this.spinSoundTimer) {
        clearInterval(this.spinSoundTimer);
        this.spinSoundTimer = null;
      }

      // 3번 릴이 서서히 감속하면서 정확히 5.8초에 ☕ 커피에 안착하도록 설정
      if (strip3) {
        strip3.classList.remove('is-spinning');
        strip3.style.transition = 'transform 1.6s cubic-bezier(0.15, 0.85, 0.35, 1.03)';
        strip3.style.transform = `translateY(${targetOffset}px)`;
      }

      // 3번 릴이 굴러가는 1.6초 동안 동작과 정확히 일치하는 4단계 감속 클릭음
      const tickTimings = [
        { t: 250, f: 800 },
        { t: 650, f: 740 },
        { t: 1100, f: 680 },
        { t: 1550, f: 620 }
      ];
      tickTimings.forEach(item => {
        const timerId = setTimeout(() => {
          this.playSlowTickSound(item.f);
        }, item.t);
        this.suspenseTimers.push(timerId);
      });
    }, 4200);

    // [4단계] 3번 릴 최종 ☕ 안착 (5.8초) -> 화려한 잭팟 팡파르 & 황금빛 발광!
    setTimeout(() => {
      // 1. 화려하고 풍성한 트럼펫 & 브라스 잭팟 팡파르
      this.playJackpotFanfare();

      // 2. 슬롯머신 본체 황금빛 & 마젠타 듀얼 펄스 발광 시작
      const casing = document.getElementById('slot-casing');
      if (casing) {
        casing.classList.add('is-jackpot');
        casing.style.borderColor = '#facc15';
        casing.style.boxShadow = '0 0 45px #facc15, 0 0 65px rgba(236, 0, 140, 0.85), inset 0 0 25px #facc15';
      }

      // 3. 릴 윈도우 3개 테두리 황금빛 발광
      document.querySelectorAll('.slot-reel-window').forEach(el => {
        el.style.borderColor = '#facc15';
        el.style.boxShadow = '0 0 15px #facc15, inset 0 0 12px #facc15';
      });
    }, 5800);

    // [5단계] 응모 접수증 화면 전환 (7.3초, 기존보다 0.9초 더 여유를 두어 잭팟 충분히 감상!)
    setTimeout(() => {
      const inputView = document.getElementById('bukang-input-view');
      const resView = document.getElementById('bukang-result-view');
      
      // 입력창 숨기고 결과 영수증 노출 (상단 슬롯머신은 황금빛으로 계속 빛나며 유지!)
      if (inputView) inputView.style.display = 'none';
      if (resView) resView.style.display = 'flex';

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
    }, 7300);
  }
}

// Global instance for application access
window.BukangLuckyDrawGame = BukangLuckyDrawGame;
window.bukangGameV1 = new BukangLuckyDrawGame();
window.bukangGameV2 = window.bukangGameV1;
window.bukangGame = window.bukangGameV1;
