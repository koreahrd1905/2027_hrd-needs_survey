// -*- coding: utf-8 -*-
/**
 * BukangLuckyDrawGame (Version 3.0 - Busan Gwangan Bridge, Interactive Keyboard Drive & Kissing Action)
 * 부산 북항 친수공원 경관수로의 귀여운 상어 '부캉이'와 함께하는
 * 스타벅스 커피쿠폰 럭키드로우 팝업 게임
 * 
 * Major Upgrades:
 * 1. Background: Busan Marine City Skylines + Iconic Gwangan Bridge + "어서와 부캉이 수영장은 처음이지?" Slogan
 * 2. User Control: Interactive Keyboard Arrow Drive (방향키 연타 속도에 따른 가속/감속 & 부스터)
 * 3. On-screen Guide: "키보드 방향키(▶)를 빠르게 눌러 부캉이를 움직이세요!" Banner & Speedometer HUD
 * 4. 100% Goal Action: Flying acrobatic leap towards Starbucks Island with a lovely "Kiss (쪽~ 💋)" and explosion of hearts & fireworks!
 * 5. BGM: "상어가족(Baby Shark)" included with 4 selectable soundtracks
 */

class BukangLuckyDrawGame {
  constructor() {
    this.modalEl = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.audioCtx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.isMuted = false;
    this.currentBgm = 'shark'; // 'shark', 'tropical', 'arcade', 'cafe'
    this.surveyId = '';
    this.phoneNumber = '';
    this.gameState = 'INPUT'; // 'INPUT', 'SWIMMING', 'KISSING', 'FINISHED'
    
    // Interactive Driving Physics
    this.totalDistance = 2000;
    this.distanceTraveled = 0;
    this.swimSpeed = 0; // Starts from 0, driven by keyboard!
    this.baseSpeed = 0.5; // Idle minimum crawl
    this.maxSpeed = 8.5; // Top boost speed on rapid keypress
    this.lastKeyPressTime = 0;
    this.keyPressCount = 0;
    
    // Shark Actor
    this.shark = {
      screenX: 380,
      y: 380,
      baseY: 380,
      size: 75,
      wiggle: 0,
      jumping: false,
      jumpT: 0,
      angle: 0,
      isKissing: false,
      kissT: 0
    };

    // Target (Starbucks Island)
    this.target = {
      screenX: 960,
      y: 260
    };

    this.particles = [];
    this.confetti = [];
    this.hearts = [];
    this.jumpPoints = [350, 950, 1550]; // Mid acrobatic jumps
    this.time = 0;
    this.keyDownHandler = null;

    // Custom Cup Logo (Capture 2 Heungkuk/Taekwang CI Logo)
    this.cupLogoImg = new Image();
    this.cupLogoImg.src = '/static/images/heungkuk_logo.png';
  }

  // ==========================================================================
  // 1. Web Audio Synthesizer (Zero External Dependencies)
  // ==========================================================================
  initAudio() {
    if (!this.audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.audioCtx = new AudioContext();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.16, startTime = 0) {
    if (this.isMuted || !this.audioCtx || freq <= 0) return;
    try {
      const t = this.audioCtx.currentTime + startTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {
      // ignore
    }
  }

  playSplashSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(320, 'triangle', 0.28, 0.22);
    this.playTone(480, 'sine', 0.22, 0.18, 0.05);
    this.playTone(660, 'triangle', 0.16, 0.14, 0.1);
  }

  playKissSound() {
    if (this.isMuted || !this.audioCtx) return;
    // Sweet kiss sound (high chirping pop)
    this.playTone(784, 'sine', 0.12, 0.25);
    this.playTone(1046, 'sine', 0.2, 0.3, 0.06);
    this.playTone(1318, 'triangle', 0.28, 0.25, 0.12);
  }

  playVictoryFanfare() {
    if (this.isMuted || !this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50];
    const delays = [0, 0.12, 0.24, 0.38, 0.52, 0.68];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, 0.25, delays[idx]);
    });
  }

  // 4 Selectable BGM Melodies
  getMelodyTrack(name) {
    const C4 = 261.63, D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88;
    const C5 = 523.25, D5 = 587.33, E5 = 659.25, F5 = 698.46, G5 = 783.99, A5 = 880.00;
    const Fs4 = 369.99, Bb4 = 466.16;

    if (name === 'shark') {
      // "아기상어 뚜 루루 뚜루~"
      return {
        tempo: 165,
        type: 'sine',
        notes: [
          { f: D4, d: 0.14 }, { f: E4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.04 },
          { f: G4, d: 0.12 }, { f: G4, d: 0.12 }, { f: G4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.08 },
          { f: D4, d: 0.14 }, { f: E4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.04 },
          { f: G4, d: 0.12 }, { f: G4, d: 0.12 }, { f: G4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.08 },
          { f: D4, d: 0.14 }, { f: E4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.04 },
          { f: G4, d: 0.12 }, { f: G4, d: 0.12 }, { f: G4, d: 0.14 }, { f: G4, d: 0.18 }, { f: 0, d: 0.08 },
          { f: G4, d: 0.22 }, { f: G4, d: 0.22 }, { f: Fs4, d: 0.45 }, { f: 0, d: 0.2 }
        ]
      };
    } else if (name === 'tropical') {
      return {
        tempo: 220,
        type: 'triangle',
        notes: [
          { f: C5, d: 0.15 }, { f: E5, d: 0.15 }, { f: G5, d: 0.2 }, { f: A5, d: 0.25 },
          { f: G5, d: 0.15 }, { f: E5, d: 0.2 }, { f: D5, d: 0.2 }, { f: C5, d: 0.3 },
          { f: E5, d: 0.15 }, { f: F5, d: 0.15 }, { f: G5, d: 0.25 }, { f: E5, d: 0.35 }
        ]
      };
    } else if (name === 'arcade') {
      return {
        tempo: 150,
        type: 'square',
        notes: [
          { f: E5, d: 0.1 }, { f: E5, d: 0.1 }, { f: 0, d: 0.08 }, { f: E5, d: 0.1 },
          { f: 0, d: 0.08 }, { f: C5, d: 0.1 }, { f: E5, d: 0.18 }, { f: G5, d: 0.25 },
          { f: 0, d: 0.15 }, { f: G4, d: 0.22 }, { f: 0, d: 0.15 }
        ]
      };
    } else {
      return {
        tempo: 240,
        type: 'sine',
        notes: [
          { f: F4, d: 0.2 }, { f: A4, d: 0.2 }, { f: C5, d: 0.2 }, { f: D5, d: 0.3 },
          { f: C5, d: 0.2 }, { f: Bb4, d: 0.2 }, { f: A4, d: 0.25 }, { f: G4, d: 0.35 }
        ]
      };
    }
  }

  startBGM(trackName = null) {
    if (trackName) this.currentBgm = trackName;
    this.stopBGM();
    this.initAudio();
    this.bgmPlaying = true;

    const track = this.getMelodyTrack(this.currentBgm);
    let noteIdx = 0;

    this.bgmTimer = setInterval(() => {
      if (!this.bgmPlaying || this.isMuted) return;
      const note = track.notes[noteIdx % track.notes.length];
      if (note.f > 0) {
        this.playTone(note.f, track.type, note.d, 0.09);
        if (noteIdx % 3 === 0) {
          this.playTone(note.f / 2, 'triangle', note.d * 1.5, 0.06);
        }
      }
      noteIdx++;
    }, track.tempo);
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // ==========================================================================
  // 2. Open Modal & Setup UI
  // ==========================================================================
  open(surveyId = '') {
    this.surveyId = surveyId;
    this.phoneNumber = '';
    this.gameState = 'INPUT';
    this.distanceTraveled = 0;
    this.swimSpeed = 0;
    this.jumpTriggered = [false, false, false];
    this.createModalDOM();
    this.initAudio();
    this.startBGM(this.currentBgm);
  }

  close() {
    this.stopBGM();
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
      this.keyDownHandler = null;
    }
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    if (this.modalEl && this.modalEl.parentNode) {
      this.modalEl.parentNode.removeChild(this.modalEl);
      this.modalEl = null;
    }
  }

  createModalDOM() {
    const existing = document.getElementById('bukang-lucky-modal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'bukang-lucky-modal';
    overlay.className = 'bukang-modal-overlay';
    overlay.innerHTML = `
      <div class="bukang-modal-box">
        <!-- Header -->
        <div class="bukang-header">
          <div class="bukang-title">
            <span class="bukang-icon">🦈</span>
            <div>
              <h3>설문 응답 감사 스타벅스 커피쿠폰 럭키드로우</h3>
              <p>부산 북항 친수공원의 귀여운 상어 <b>'부캉이'</b>와 함께 해운대 앞바다를 신나게 달려보세요!</p>
            </div>
          </div>
          <div class="bukang-actions">
            <button class="bukang-btn-icon" id="bukang-mute-btn" title="음악 켜기/끄기">
              ${this.isMuted ? '🔇' : '🔊'}
            </button>
            <button class="bukang-btn-icon" id="bukang-close-top-btn" title="닫기">✕</button>
          </div>
        </div>

        <!-- Game Screen Wrap -->
        <div class="bukang-body">
          <!-- Canvas Game Area (1200 x 580) -->
          <canvas id="bukang-canvas" width="1200" height="580"></canvas>

          <!-- Interactive Keyboard Drive Notification Banner (Pulsing Bar) -->
          <div id="bukang-keyboard-guide" style="display:none;position:absolute;top:16px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg, rgba(234, 88, 12, 0.95), rgba(220, 38, 38, 0.95));backdrop-filter:blur(6px);color:white;padding:0.65rem 1.8rem;border-radius:30px;font-size:1.05rem;font-weight:800;box-shadow:0 6px 20px rgba(220,38,38,0.45);border:2px solid #fef08a;z-index:20;display:flex;align-items:center;gap:0.6rem;animation:guidePulse 1.2s infinite alternate;white-space:nowrap;">
            <span style="font-size:1.3rem;">⌨️</span>
            <span>키보드 방향키(▶)를 빠르게 눌러 부캉이를 움직이세요! (클릭 연타도 가능)</span>
          </div>

          <!-- Speedometer & Progress Bar Overlay -->
          <div id="bukang-progress-bar-wrap" style="display:none;position:absolute;bottom:20px;left:30px;right:30px;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);border-radius:20px;padding:0.75rem 1.6rem;color:white;border:1px solid rgba(255,255,255,0.3);z-index:15;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.92rem;font-weight:800;margin-bottom:0.4rem;">
              <span>🏁 해운대 마린시티 & 광안대교</span>
              <span id="bukang-speed-text" style="color:#38bdf8;font-size:1.05rem;">속도: 0 km/h</span>
              <span id="bukang-dist-text" style="color:#fef08a;">남은 거리: 2,000m (0%)</span>
              <span>☕ 흥국금융 골인</span>
            </div>
            <div style="width:100%;height:12px;background:rgba(255,255,255,0.2);border-radius:6px;overflow:hidden;position:relative;">
              <div id="bukang-progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #38bdf8, #facc15, #f59e0b);border-radius:6px;transition:width 0.08s linear;"></div>
            </div>
          </div>

          <!-- Input Panel (Initial) -->
          <div class="bukang-input-panel" id="bukang-input-view">
            <div class="bukang-guide-card">
              <div class="shark-badge" style="font-size:0.92rem;padding:0.3rem 0.9rem;">🦈 마스코트 부캉이 출동 준비</div>
              <h4 style="font-size:1.35rem;font-weight:800;color:#0f172a;margin:0.5rem 0 0.5rem 0;letter-spacing:-0.02em;">"당신의 행운을 위해 부산 앞바다를 신나게 헤엄쳐 갈게요!"</h4>
              <p style="font-size:1.15rem;font-weight:600;color:#1e293b;margin:0 0 1.3rem 0;line-height:1.6;letter-spacing:-0.02em;word-break:keep-all;">
                휴대전화 번호를 입력하시면 부캉이가 <span style="color:#d97706;background:#fef3c7;padding:0.2rem 0.55rem;border-radius:8px;font-weight:800;border:1px solid #fde68a;">🏷️ 번호 꼬리표</span>를 달고 <span style="color:#e4007f;font-weight:800;background:#fdf2f8;padding:0.2rem 0.55rem;border-radius:8px;border:1px solid #fbcfe8;">흥국금융</span>으로 출발합니다.
              </p>
              
              <div class="phone-input-row">
                <span class="input-icon">📱</span>
                <input type="tel" id="bukang-phone-input" placeholder="010-1234-5678" maxlength="13" autofocus />
                <button class="bukang-start-btn" id="bukang-start-btn">
                  <span>🦈</span> START (부캉이 출발!)
                </button>
              </div>
              <div class="phone-err-msg" id="bukang-phone-err" style="display:none;"></div>
            </div>
          </div>

          <!-- Result Celebration Overlay (Finished) -->
          <div class="bukang-result-panel" id="bukang-result-view" style="display:none;">
            <div class="result-card">
              <div class="result-badge">🎉 럭키드로우 응모 접수 완료!</div>
              <h2 class="result-title">"당신의 행운을 부캉이가 기원합니다!"</h2>
              <div class="result-sub-text">
                ☕ 스타벅스 e-Gift Card 추첨 이벤트에 정상 응모되었습니다.<br>
                <b>(설문조사 종료 후 공정하게 추첨하여 개별 모바일 쿠폰으로 안내 발송 드립니다)</b>
              </div>

              <div class="entry-receipt">
                <div class="receipt-row">
                  <span>접수 번호</span>
                  <strong id="receipt-id">EVT-${Math.floor(Math.random() * 8999 + 1000)}</strong>
                </div>
                <div class="receipt-row">
                  <span>응모 번호</span>
                  <strong id="receipt-phone">010-****-0000</strong>
                </div>
                <div class="receipt-row">
                  <span>골인 미션</span>
                  <span>흥국금융에 사랑의 뽀뽀(쪽~ 💋) 성공!</span>
                </div>
                <div class="receipt-row">
                  <span>항해 기록</span>
                  <span>광안대교 & 해운대 2,000m 완주 성공!</span>
                </div>
              </div>

              <div class="result-btn-row">
                <button class="bukang-finish-btn" id="bukang-finish-btn">
                  <span>✨</span> 럭키드로우 게임 종료
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    this.modalEl = overlay;
    this.canvas = document.getElementById('bukang-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.bindEvents();
    this.initCanvasGame();
  }

  bindEvents() {
    const phoneInput = document.getElementById('bukang-phone-input');
    const startBtn = document.getElementById('bukang-start-btn');
    const finishBtn = document.getElementById('bukang-finish-btn');
    const closeTopBtn = document.getElementById('bukang-close-top-btn');
    const muteBtn = document.getElementById('bukang-mute-btn');
    const errEl = document.getElementById('bukang-phone-err');

    // BGM is permanently set to 'shark' (상어가족)
    this.currentBgm = 'shark';

    // Phone Auto-hyphen
    phoneInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/[^0-9]/g, '');
      if (val.length > 3 && val.length <= 7) {
        val = val.slice(0, 3) + '-' + val.slice(3);
      } else if (val.length > 7) {
        val = val.slice(0, 3) + '-' + val.slice(3, 7) + '-' + val.slice(7, 11);
      }
      e.target.value = val;
      errEl.style.display = 'none';
    });

    startBtn.addEventListener('click', async () => {
      const raw = phoneInput.value.replace(/[^0-9]/g, '');
      if (raw.length < 10 || !raw.startsWith('010')) {
        errEl.innerText = '올바른 휴대전화 번호 (010-XXXX-XXXX)를 입력해 주십시오.';
        errEl.style.display = 'block';
        phoneInput.focus();
        return;
      }

      // 1인 1회 한정 응모 사전 검증
      try {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span>⏳</span> 중복 확인 중...';
        let chkRes;
      if (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL.startsWith('http')) {
        chkRes = await fetch(window.GOOGLE_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({ action: 'event_check', phone: raw })
        }).then(r => r.json());
      } else {
        chkRes = await fetch(`/api/event/check?phone=${encodeURIComponent(raw)}`).then(r => r.json());
      }
        if (chkRes && chkRes.already_submitted) {
          errEl.innerHTML = `⚠️ 이미 이벤트 응모가 완료된 번호입니다. (${phoneInput.value})<br><strong>이벤트 응모는 1인 1회로 한정됩니다.</strong>`;
          errEl.style.display = 'block';
          startBtn.disabled = false;
          startBtn.innerHTML = '<span>🦈</span> START (부캉이 출발!)';
          phoneInput.focus();
          return;
        }
      } catch (err) {
        console.warn('Check phone error:', err);
      }

      startBtn.disabled = false;
      startBtn.innerHTML = '<span>🦈</span> START (부캉이 출발!)';
      this.phoneNumber = phoneInput.value;
      this.startSwimming();
    });

    phoneInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') startBtn.click();
    });

    finishBtn.addEventListener('click', () => {
      this.close();
      if (typeof window.handleSurveyAndGameFinish === 'function') {
        window.handleSurveyAndGameFinish();
      } else {
        try {
          window.open('', '_self', '');
          window.close();
        } catch (e) {
          console.warn('Window close error:', e);
        }
      }
    });

    closeTopBtn.addEventListener('click', () => {
      this.close();
    });

    muteBtn.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      muteBtn.innerText = this.isMuted ? '🔇' : '🔊';
      if (!this.isMuted) {
        this.initAudio();
        this.startBGM(this.currentBgm);
      }
    });

    // ========================================================================
    // Interactive Keyboard Drive Event Listeners
    // ========================================================================
    this.keyDownHandler = (e) => {
      if (this.gameState !== 'SWIMMING') return;

      // ArrowRight, ArrowUp, Space, Enter trigger forward drive impulse
      if (['ArrowRight', 'ArrowUp', ' ', 'Enter', 'd', 'D', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        this.triggerDriveImpulse();
      }
    };
    window.addEventListener('keydown', this.keyDownHandler);

    // Also support mouse/touch click on canvas as impulse
    this.canvas.addEventListener('click', () => {
      if (this.gameState === 'SWIMMING') {
        this.triggerDriveImpulse();
      }
    });
  }

  // Keyboard Impulse booster
  triggerDriveImpulse() {
    this.initAudio();
    const now = performance.now();
    const interval = now - this.lastKeyPressTime;
    this.lastKeyPressTime = now;

    // The faster the user taps, the higher the speed boost
    let boost = 1.6;
    if (interval < 220) {
      boost = 2.4; // Rapid tapping booster
    }

    this.swimSpeed = Math.min(this.swimSpeed + boost, this.maxSpeed);

    // Small wave splash sound occasionally
    if (Math.random() < 0.4) {
      this.playTone(380 + Math.random() * 120, 'sine', 0.08, 0.12);
    }
  }

  // ==========================================================================
  // 3. Game Loop & Interactive Physics
  // ==========================================================================
  initCanvasGame() {
    this.shark = {
      screenX: 380,
      y: 380,
      baseY: 380,
      size: 75,
      wiggle: 0,
      jumping: false,
      jumpT: 0,
      angle: 0,
      isKissing: false,
      kissT: 0
    };
    this.distanceTraveled = 0;
    this.swimSpeed = 0;
    this.jumpTriggered = [false, false, false];
    this.particles = [];
    this.confetti = [];
    this.hearts = [];
    this.time = 0;

    const renderLoop = () => {
      this.updateGame();
      this.drawGame();
      this.animId = requestAnimationFrame(renderLoop);
    };
    this.animId = requestAnimationFrame(renderLoop);
  }

  startSwimming() {
    this.gameState = 'SWIMMING';
    document.getElementById('bukang-input-view').style.display = 'none';

    // Show Guide & Progress HUD
    const guideEl = document.getElementById('bukang-keyboard-guide');
    if (guideEl) guideEl.style.display = 'flex';
    const progressWrap = document.getElementById('bukang-progress-bar-wrap');
    if (progressWrap) progressWrap.style.display = 'block';

    this.initAudio();
    this.startBGM(this.currentBgm);
    this.playTone(440, 'sine', 0.2, 0.2);
    this.playTone(660, 'triangle', 0.25, 0.25, 0.1);

    // Backend submission (Supports Google Apps Script & Local Flask)
    const eventPayload = {
      action: 'event_submit',
      survey_id: this.surveyId,
      phone: this.phoneNumber,
      department: (window.currentSurveySubmission && window.currentSurveySubmission.department) || '',
      job_group: (window.currentSurveySubmission && window.currentSurveySubmission.job_group) || '',
      position: (window.currentSurveySubmission && window.currentSurveySubmission.position) || ''
    };
    const eventUrl = (window.GOOGLE_SCRIPT_URL && window.GOOGLE_SCRIPT_URL.startsWith('http')) 
      ? window.GOOGLE_SCRIPT_URL 
      : '/api/event/submit';
    
    fetch(eventUrl, {
      method: 'POST',
      headers: { 'Content-Type': (eventUrl.startsWith('http') && eventUrl.includes('script.google.com')) ? 'text/plain;charset=utf-8' : 'application/json' },
      body: JSON.stringify(eventPayload)
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.entry_id) {
        const receiptIdEl = document.getElementById('receipt-id');
        if (receiptIdEl) receiptIdEl.innerText = data.entry_id;
      }
    })
    .catch(err => console.warn('Event submit log:', err));
  }

  updateGame() {
    this.time += 0.05;

    // Swimming phase driven by user keypresses
    if (this.gameState === 'SWIMMING') {
      // Natural Friction decay
      this.swimSpeed *= 0.965;
      if (this.swimSpeed < this.baseSpeed) {
        this.swimSpeed = this.baseSpeed; // Minimum crawl
      }

      this.distanceTraveled += this.swimSpeed;
      const progress = Math.min(this.distanceTraveled / this.totalDistance, 1.0);

      // Speed in km/h for HUD display
      const kmh = Math.floor(this.swimSpeed * 8.5);
      const isBooster = this.swimSpeed > 5.5;

      // Update HUDs
      const progFill = document.getElementById('bukang-progress-fill');
      const distText = document.getElementById('bukang-dist-text');
      const speedText = document.getElementById('bukang-speed-text');

      if (progFill) progFill.style.width = `${Math.floor(progress * 100)}%`;
      if (distText) distText.innerText = `남은 거리: ${Math.max(0, Math.floor(this.totalDistance - this.distanceTraveled))}m (${Math.floor(progress * 100)}%)`;
      if (speedText) {
        speedText.innerHTML = `속도: <b>${kmh} km/h</b> ${isBooster ? '<span style="color:#f43f5e;font-weight:900;">🔥 부스터!</span>' : ''}`;
      }

      const s = this.shark;
      s.wiggle += 0.15 + (this.swimSpeed * 0.05);

      // Natural zigzag swimming on sea surface
      const zigZagY = Math.sin(this.distanceTraveled * 0.02) * 28;

      // Mid-jumps at points
      this.jumpPoints.forEach((pt, idx) => {
        if (!this.jumpTriggered[idx] && this.distanceTraveled >= pt) {
          this.jumpTriggered[idx] = true;
          s.jumping = true;
          s.jumpT = 0;
          this.playSplashSound();
          this.createWaterSplash(s.screenX, s.baseY, 28);
        }
      });

      if (s.jumping) {
        s.jumpT += 0.04;
        const arc = Math.sin(s.jumpT * Math.PI) * 150;
        s.y = s.baseY + zigZagY - arc;
        s.angle = -Math.cos(s.jumpT * Math.PI) * 0.85;

        if (s.jumpT >= 1.0) {
          s.jumping = false;
          s.jumpT = 0;
          s.angle = 0;
          this.playSplashSound();
          this.createWaterSplash(s.screenX, s.baseY, 32);
        }
      } else {
        s.y = s.baseY + zigZagY;
        s.angle = Math.sin(s.wiggle) * 0.12;
      }

      // Water bubble particles behind shark (more on high speed)
      const bubbleCount = isBooster ? 2 : 1;
      for (let b = 0; b < bubbleCount; b++) {
        if (Math.random() < 0.7) {
          this.particles.push({
            x: s.screenX - 55,
            y: s.y + (Math.random() * 20 - 10),
            vx: -(Math.random() * 4 + this.swimSpeed),
            vy: (Math.random() - 0.5) * 2,
            rad: Math.random() * 6 + 3,
            alpha: 0.85,
            color: isBooster ? '#fef08a' : '#ffffff'
          });
        }
      }

      // Check Target Hit (100% Reached -> Trigger Kissing Leap Action!)
      if (this.distanceTraveled >= this.totalDistance) {
        this.triggerKissingAction();
      }
    }

    // Kissing Animation Sequence
    if (this.gameState === 'KISSING') {
      const s = this.shark;
      s.kissT += 0.035;

      // Fly and leap towards Starbucks Island at (960, 260)
      const startX = 380;
      const targetX = 910; // Right beside Starbucks island
      const startY = 380;
      const targetY = 250;

      const t = Math.min(s.kissT, 1.0);
      s.screenX = startX + (targetX - startX) * t;
      const jumpArc = Math.sin(t * Math.PI) * 180;
      s.y = startY + (targetY - startY) * t - jumpArc;
      s.angle = -0.3 + Math.sin(t * Math.PI) * 0.5;

      // When reaching near peak & island -> KISS!
      if (t >= 0.95 && !s.hasKissed) {
        s.hasKissed = true;
        this.onKissHit();
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.alpha -= 0.025;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // Update Hearts
    for (let i = this.hearts.length - 1; i >= 0; i--) {
      const h = this.hearts[i];
      h.x += h.vx;
      h.y += h.vy;
      h.size += 0.3;
      h.alpha -= 0.015;
      if (h.alpha <= 0) this.hearts.splice(i, 1);
    }

    // Update Confetti & Fireworks
    for (let i = this.confetti.length - 1; i >= 0; i--) {
      const c = this.confetti[i];
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.12;
      c.rotation += c.rotSpeed;
      c.alpha -= 0.008;
      if (c.y > 580 || c.alpha <= 0) this.confetti.splice(i, 1);
    }

    if (this.gameState === 'FINISHED' && Math.random() < 0.22) {
      this.spawnFireworks(Math.random() * 950 + 150, Math.random() * 220 + 50);
    }
  }

  // Trigger 100% Kissing leap action
  triggerKissingAction() {
    this.gameState = 'KISSING';
    this.shark.isKissing = true;
    this.shark.kissT = 0;
    this.shark.hasKissed = false;
    this.playSplashSound();
    this.createWaterSplash(this.shark.screenX, this.shark.baseY, 30);

    // Hide keyboard guide banner
    const guideEl = document.getElementById('bukang-keyboard-guide');
    if (guideEl) guideEl.style.display = 'none';
  }

  // When Bukang kisses Starbucks Island
  onKissHit() {
    this.playKissSound();
    this.playVictoryFanfare();

    // Spawn lovely hearts!
    for (let i = 0; i < 25; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 4 + 2;
      this.hearts.push({
        x: 930 + (Math.random() * 30 - 15),
        y: 250 + (Math.random() * 30 - 15),
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 2,
        size: Math.random() * 16 + 12,
        alpha: 1.0,
        color: '#f43f5e'
      });
    }

    // Massive Fireworks!
    const targetScreenX = 960;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.spawnFireworks(targetScreenX + (Math.random() * 160 - 80), 220 + (Math.random() * 80 - 40));
      }, i * 180);
    }

    // Mask phone number for receipt (010-****-1234)
    let masked = this.phoneNumber;
    const parts = this.phoneNumber.split('-');
    if (parts.length === 3) {
      masked = `${parts[0]}-****-${parts[2]}`;
    }
    const receiptPhoneEl = document.getElementById('receipt-phone');
    if (receiptPhoneEl) receiptPhoneEl.innerText = masked;

    // Show result view after 1.4s
    setTimeout(() => {
      this.gameState = 'FINISHED';
      const resView = document.getElementById('bukang-result-view');
      if (resView) resView.style.display = 'flex';
    }, 1400);
  }

  createWaterSplash(x, y, count = 24) {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI / count) * i + Math.PI;
      const spd = Math.random() * 6.5 + 3.0;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 3,
        rad: Math.random() * 5 + 3,
        alpha: 0.9,
        color: '#bae6fd'
      });
    }
  }

  spawnFireworks(x, y) {
    const colors = ['#f59e0b', '#ec4899', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#facc15'];
    for (let i = 0; i < 55; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = Math.random() * 7.5 + 2.5;
      this.confetti.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 10 + 5,
        rotation: Math.random() * Math.PI,
        rotSpeed: (Math.random() - 0.5) * 0.3,
        alpha: 1.0
      });
    }
  }

  // ==========================================================================
  // 4. Drawing Canvas Elements with Busan Marine City & Gwangan Bridge
  // ==========================================================================
  drawGame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scroll = this.distanceTraveled;

    ctx.clearRect(0, 0, w, h);

    // 1) Sky Gradient & Sun (0 ~ 320px)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 320);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.5, '#38bdf8');
    skyGrad.addColorStop(0.85, '#bae6fd');
    skyGrad.addColorStop(1, '#fef08a'); // Warm sunset glow near sea horizon
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 320);

    // Warm Big Sun
    ctx.save();
    ctx.beginPath();
    ctx.arc(140, 75, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 35;
    ctx.fill();
    ctx.restore();

    // 2) Slogan Banner: "어서와 부캉이 수영장은 처음이지?"
    ctx.save();
    ctx.font = '900 24px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Banner background pill
    const sloganText = '어서와 부캉이 수영장은 처음이지? 🦈🌊';
    const textWidth = ctx.measureText(sloganText).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.beginPath();
    ctx.roundRect(w / 2 - textWidth / 2 - 25, 20, textWidth + 50, 42, 21);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text glowing fill
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(sloganText, w / 2, 41);
    ctx.restore();

    // 3) Busan Haeundae Marine City Skyscrapers (Parallax: 0.12)
    this.drawHaeundaeSkyscrapers(scroll * 0.12);

    // 4) Busan Iconic Gwangan Bridge (Parallax: 0.22)
    this.drawGwanganBridge(scroll * 0.22);

    // Clouds (Parallax: 0.3)
    const cloud1X = ((240 - scroll * 0.28) % 1500 + 1500) % 1500 - 100;
    const cloud2X = ((780 - scroll * 0.32) % 1500 + 1500) % 1500 - 100;
    const cloud3X = ((1250 - scroll * 0.24) % 1500 + 1500) % 1500 - 100;
    this.drawCloud(cloud1X, 85, 1.2);
    this.drawCloud(cloud2X, 70, 1.4);
    this.drawCloud(cloud3X, 95, 1.1);

    // 5) Busan Coastal Sea & Dynamic Waves (320 ~ 580px)
    const seaGrad = ctx.createLinearGradient(0, 320, 0, h);
    seaGrad.addColorStop(0, '#0284c7');
    seaGrad.addColorStop(0.35, '#0369a1');
    seaGrad.addColorStop(1, '#075985');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 320, w, h - 320);

    // Wave Layer 1
    ctx.fillStyle = 'rgba(14, 165, 233, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 320);
    for (let x = 0; x <= w; x += 45) {
      const y = 320 + Math.sin((x + scroll * 0.7) * 0.03 + this.time * 2) * 8;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Wave Layer 2 (Front)
    ctx.fillStyle = 'rgba(2, 132, 199, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, 360);
    for (let x = 0; x <= w; x += 40) {
      const y = 360 + Math.cos((x + scroll) * 0.04 + this.time * 3) * 10;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();

    // Wave crest foams
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = 15; x < w; x += 60) {
      const y = 360 + Math.cos((x + scroll) * 0.04 + this.time * 3) * 10;
      ctx.moveTo(x - 20, y);
      ctx.lineTo(x + 20, y);
    }
    ctx.stroke();

    // 6) Draw Target: Starbucks Island / Buoy
    const remainingDist = this.totalDistance - this.distanceTraveled;
    let targetScreenX = 960;
    if (this.gameState === 'SWIMMING' && remainingDist > 450) {
      targetScreenX = 960 + (remainingDist - 450);
    }
    if (targetScreenX < w + 150) {
      this.drawStarbucksIsland(targetScreenX, 260);
    }

    // 7) Draw Particles
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8) Draw Shark "Bukang-i" with Tag Ribbon
    this.drawShark(this.shark);

    // 9) Draw Kissing Hearts
    this.hearts.forEach(ht => {
      ctx.save();
      ctx.globalAlpha = ht.alpha;
      ctx.fillStyle = ht.color;
      ctx.translate(ht.x, ht.y);
      // Draw Heart Path
      ctx.beginPath();
      const s = ht.size / 16;
      ctx.moveTo(0, -5 * s);
      ctx.bezierCurveTo(-10 * s, -18 * s, -20 * s, 0, 0, 18 * s);
      ctx.bezierCurveTo(20 * s, 0, 10 * s, -18 * s, 0, -5 * s);
      ctx.fill();
      ctx.restore();
    });

    // 10) Draw Confetti & Fireworks
    this.confetti.forEach(c => {
      ctx.save();
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = c.color;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    });

    // Kissing Label (쪽~ 💋)
    if (this.shark.hasKissed && this.gameState !== 'FINISHED') {
      ctx.save();
      ctx.font = '900 36px "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.textAlign = 'center';
      ctx.strokeText('쪽~ ♥ 💋', 930, 190);
      ctx.fillText('쪽~ ♥ 💋', 930, 190);
      ctx.restore();
    }
  }

  // Draw Haeundae Marine City & LCT Highrises
  drawHaeundaeSkyscrapers(offset) {
    const ctx = this.ctx;
    ctx.save();
    const seaY = 320;
    const buildingDefs = [
      { w: 55, h: 180, color: '#334155' },
      { w: 75, h: 220, color: '#1e293b' },
      { w: 45, h: 150, color: '#475569' },
      { w: 90, h: 240, color: '#0f172a' },
      { w: 60, h: 190, color: '#1e3a8a' },
      { w: 50, h: 160, color: '#334155' },
      { w: 80, h: 210, color: '#1e293b' }
    ];

    const cycleW = buildingDefs.reduce((acc, b) => acc + b.w + 15, 0);
    const startX = -((offset % cycleW) + cycleW) % cycleW;

    for (let x = startX - cycleW; x < 1200 + cycleW; ) {
      for (const b of buildingDefs) {
        ctx.fillStyle = b.color;
        ctx.fillRect(x, seaY - b.h, b.w, b.h);

        // Building Antennas & Roof details
        ctx.fillStyle = '#64748b';
        ctx.fillRect(x + b.w / 2 - 2, seaY - b.h - 18, 4, 18);
        ctx.beginPath();
        ctx.arc(x + b.w / 2, seaY - b.h - 18, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ef4444'; // Red beacon light
        ctx.fill();

        // Window Lights
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        for (let wy = seaY - b.h + 15; wy < seaY - 10; wy += 18) {
          for (let wx = x + 8; wx < x + b.w - 8; wx += 14) {
            if (Math.sin(wx * 2 + wy) > -0.2) {
              ctx.fillRect(wx, wy, 6, 8);
            }
          }
        }
        x += b.w + 15;
      }
    }
    ctx.restore();
  }

  // Draw Busan Gwangan Bridge (광안대교 다이아몬드 브릿지)
  drawGwanganBridge(offset) {
    const ctx = this.ctx;
    ctx.save();
    const seaY = 320;
    const bridgeW = 750;
    const startX = -((offset % bridgeW) + bridgeW) % bridgeW;

    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';

    for (let bx = startX - bridgeW; bx < 1200 + bridgeW; bx += bridgeW) {
      // 1. Double Main Suspension Towers (2단 주탑)
      const tower1X = bx + 220;
      const tower2X = bx + 520;
      const towerH = 145;
      const deckY = seaY - 32;

      [tower1X, tower2X].forEach(tx => {
        // Tower Legs
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(tx - 12, seaY);
        ctx.lineTo(tx - 6, seaY - towerH);
        ctx.lineTo(tx + 6, seaY - towerH);
        ctx.lineTo(tx + 12, seaY);
        ctx.stroke();

        // Tower Crossbeams (트러스 X 프레임)
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx - 10, seaY - 45);
        ctx.lineTo(tx + 10, seaY - 45);
        ctx.moveTo(tx - 8, seaY - 95);
        ctx.lineTo(tx + 8, seaY - 95);
        ctx.moveTo(tx - 6, seaY - towerH + 10);
        ctx.lineTo(tx + 6, seaY - towerH + 10);
        ctx.stroke();
      });

      // 2. Main Suspension Cables (포물선 주케이블)
      ctx.lineWidth = 3;
      ctx.beginPath();
      // Center span curve between 2 towers
      ctx.moveTo(tower1X, seaY - towerH);
      ctx.quadraticCurveTo((tower1X + tower2X) / 2, deckY + 8, tower2X, seaY - towerH);
      // Left outer anchor curve
      ctx.moveTo(tower1X, seaY - towerH);
      ctx.quadraticCurveTo(bx + 60, deckY, bx, deckY);
      // Right outer anchor curve
      ctx.moveTo(tower2X, seaY - towerH);
      ctx.quadraticCurveTo(bx + bridgeW - 60, deckY, bx + bridgeW, deckY);
      ctx.stroke();

      // 3. Vertical Suspension Wires (수직 행어 로프)
      ctx.lineWidth = 1;
      for (let wx = tower1X + 16; wx < tower2X; wx += 22) {
        const t = (wx - tower1X) / (tower2X - tower1X);
        const cableY = (1 - t) * (1 - t) * (seaY - towerH) + 2 * (1 - t) * t * (deckY + 8) + t * t * (seaY - towerH);
        ctx.beginPath();
        ctx.moveTo(wx, cableY);
        ctx.lineTo(wx, deckY);
        ctx.stroke();
      }

      // 4. Double Deck Roadway (2층 교량 상판)
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(bx, deckY);
      ctx.lineTo(bx + bridgeW, deckY);
      ctx.stroke();

      // Deck night illuminations
      ctx.fillStyle = '#fef08a';
      for (let lx = bx + 10; lx < bx + bridgeW; lx += 25) {
        ctx.fillRect(lx, deckY - 3, 3, 3);
      }
    }
    ctx.restore();
  }

  drawCloud(x, y, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 18 * scale, 0, Math.PI * 2);
    ctx.arc(x + 18 * scale, y - 10 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.arc(x + 42 * scale, y - 5 * scale, 20 * scale, 0, Math.PI * 2);
    ctx.arc(x + 58 * scale, y, 16 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Cute Shark "부캉이" (Plumper, Larger Pinkfong Mommy Shark Style)
  drawShark(s) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(s.screenX, s.y);
    // Larger size as requested (scale 1.85x)
    ctx.scale(1.85, 1.85);
    ctx.rotate(s.angle);

    const tailWiggle = Math.sin(s.wiggle) * 12;
    const SHARK_PINK = '#ff2a85';       // Rich, vibrant candy hot pink
    const SHARK_DARK_PINK = '#d9006c';  // Accent dark pink
    const SHARK_BELLY = '#ffffff';      // Pure crisp white underbelly

    // 1. Little Orange Fish Friends behind shark (distributed above & below tag ribbon)
    const fishSchool = [
      { x: -95, y: -26, s: 0.95 },
      { x: -125, y: -22, s: 1.1 },
      { x: -150, y: -28, s: 0.85 },
      { x: -105, y: 26, s: 1.0 },
      { x: -135, y: 30, s: 1.15 }
    ];
    ctx.save();
    ctx.fillStyle = '#f59e0b';
    fishSchool.forEach((f, idx) => {
      const waveY = Math.sin(this.time * 6 + idx) * 3;
      const fx = f.x + (tailWiggle * 0.2);
      const fy = f.y + waveY;
      
      // Little Fish Body
      ctx.beginPath();
      ctx.ellipse(fx, fy, 6.5 * f.s, 4 * f.s, 0, 0, Math.PI * 2);
      ctx.fill();
      // Little Fish Tail
      ctx.beginPath();
      ctx.moveTo(fx - 4 * f.s, fy);
      ctx.lineTo(fx - 10 * f.s, fy - 4 * f.s);
      ctx.lineTo(fx - 10 * f.s, fy + 4 * f.s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // 2. Tag Ribbon attached to shark tail (Safe inside canvas, 100% visible phone number)
    const phoneText = this.phoneNumber || '010-XXXX-XXXX';
    const tagWaveY = Math.sin(this.time * 7) * 4;
    const ropeStartX = -48 + tailWiggle * 0.4;
    const ropeEndX = -66 + tailWiggle * 0.2;
    const ropeEndY = tagWaveY;

    // Golden Rope connecting tail to tag
    ctx.save();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ropeStartX, 0);
    ctx.quadraticCurveTo(-58 + tailWiggle * 0.3, ropeEndY + 2, ropeEndX, ropeEndY);
    ctx.stroke();
    ctx.restore();

    // Yellow Number Tag Flag (Width 94px = 174px on screen, fits phone number perfectly)
    const tagW = 94;
    const tagH = 25;
    const tagBoxX = ropeEndX - tagW;
    const tagBoxY = ropeEndY - tagH / 2;

    ctx.save();
    // Subtle drop shadow for tag flag
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    // Tag Background & Border
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(tagBoxX, tagBoxY, tagW, tagH, 6);
    ctx.fill();
    ctx.stroke();

    // Tag Eyelet Hole (Ring where rope attaches)
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(ropeEndX - 5, ropeEndY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Phone Number Text (Bold & crisp centered)
    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 10px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📱 ' + phoneText, tagBoxX + (tagW - 6) / 2, ropeEndY);
    ctx.restore();

    // 3. Caudal Fin (Tail - Curvy crescent with upper & lower lobes)
    ctx.fillStyle = SHARK_PINK;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.quadraticCurveTo(-50 + tailWiggle * 0.4, -18, -68 + tailWiggle, -36); // Upper tip
    ctx.quadraticCurveTo(-58 + tailWiggle, 0, -68 + tailWiggle, 30);          // Lower tip
    ctx.quadraticCurveTo(-50 + tailWiggle * 0.4, 18, -42, 4);
    ctx.closePath();
    ctx.fill();

    // 4. Dorsal Fin (등지느러미 - Smooth, curvy wave-like dorsal fin)
    ctx.fillStyle = SHARK_PINK;
    ctx.beginPath();
    ctx.moveTo(16, -18);
    ctx.bezierCurveTo(8, -42, 2, -56, -10, -56); // Sharp back-leaning curve
    ctx.quadraticCurveTo(-3, -34, -18, -18);     // Trailing edge
    ctx.closePath();
    ctx.fill();

    // 5. Pectoral Fin (가슴지느러미 - Chubby, rounded bottom fin)
    ctx.fillStyle = SHARK_PINK;
    ctx.beginPath();
    ctx.moveTo(-2, 18);
    ctx.quadraticCurveTo(-14, 38, -12, 46); // Down-back tip
    ctx.quadraticCurveTo(4, 34, 18, 18);
    ctx.closePath();
    ctx.fill();

    // 6. Chubby Main Pink Body & Head (통통하고 둥근 예쁜 실루엣)
    ctx.fillStyle = SHARK_PINK;
    ctx.beginPath();
    ctx.moveTo(-42, 0);
    ctx.bezierCurveTo(-20, -22, 10, -22, 26, -18); // Plump chubby forehead
    ctx.quadraticCurveTo(46, -14, 60, -4);         // Cute upturned snout tip
    // Smiling mouth cut-out
    ctx.quadraticCurveTo(46, 6, 28, 8);            // Mouth corner
    ctx.bezierCurveTo(22, 22, -10, 22, -26, 16);   // Plump chubby belly line
    ctx.quadraticCurveTo(-36, 10, -42, 4);
    ctx.closePath();
    ctx.fill();

    // 7. Plump White Underbelly & Lower Jaw
    ctx.fillStyle = SHARK_BELLY;
    ctx.beginPath();
    ctx.moveTo(28, 8);                             // Mouth corner
    ctx.quadraticCurveTo(38, 11, 48, 13);          // Smiling lower jaw tip
    ctx.bezierCurveTo(28, 22, 0, 22, -22, 16);     // Chubby white belly curve
    ctx.quadraticCurveTo(-35, 10, -40, 4);         // Tapers to tail
    ctx.quadraticCurveTo(-15, 8, 0, 9);            // Smooth belly dividing boundary
    ctx.quadraticCurveTo(16, 9, 28, 8);
    ctx.closePath();
    ctx.fill();

    // 8. Open Mouth Detail: Cute Pink Tongue
    ctx.fillStyle = '#ff007f';
    ctx.beginPath();
    ctx.ellipse(36, 9.5, 5, 3.2, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // 9. Cute Nostril Dot on Snout
    ctx.fillStyle = SHARK_DARK_PINK;
    ctx.beginPath();
    ctx.arc(52, -5, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 10. Gills (3 Cute Pink Curved Slits)
    ctx.strokeStyle = SHARK_DARK_PINK;
    ctx.lineWidth = 2.0;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(4 + i * 5, 2, 5.5, Math.PI * 0.72, Math.PI * 1.28);
      ctx.stroke();
    }

    // 11. Soft Rosy Pink Cheek Blush (통통하고 발그레한 볼터치)
    ctx.fillStyle = 'rgba(255, 130, 185, 0.55)';
    ctx.beginPath();
    ctx.arc(16, 3, 6, 0, Math.PI * 2);
    ctx.fill();

    // 12. Big Sparkling Cartoon Eyes with 3 Curved Eyelashes (엄마상어 속눈썹)
    // Eye White
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(26, -7, 7.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Big Black Pupil
    ctx.fillStyle = '#111827';
    ctx.beginPath();
    ctx.ellipse(27.5, -7, 5.8, 6.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Twinkling White Highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(26, -8.5, 2.4, 0, Math.PI * 2);  // Main big twinkle
    ctx.fill();
    ctx.beginPath();
    ctx.arc(29, -5.5, 1.2, 0, Math.PI * 2);  // Secondary mini twinkle
    ctx.fill();

    // 3 Distinct Curved Black Eyelashes arching upwards
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    const lashes = [
      { sx: 21, sy: -12.5, ex: 15, ey: -19 }, // Back eyelash
      { sx: 26, sy: -14.5, ex: 24, ey: -22 }, // Mid eyelash
      { sx: 31, sy: -13, ex: 34, ey: -19 }    // Front eyelash
    ];
    lashes.forEach(l => {
      ctx.beginPath();
      ctx.moveTo(l.sx, l.sy);
      ctx.lineTo(l.ex, l.ey);
      ctx.stroke();
    });

    // 13. Cheerful Smile or Kissing Mouth (Kiss mode)
    if (s.isKissing) {
      // Pouting Kiss Lips (쪽~ 💋)
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(60, 0, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(59, -1.2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name tag badge "부캉이"
    ctx.fillStyle = '#ff2a85';
    ctx.font = 'bold 9.5px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2.2;
    ctx.strokeText('부캉이', 0, -32);
    ctx.fillText('부캉이', 0, -32);

    ctx.restore();
  }

  // Draw Starbucks Coupon Island / Cup Buoy
  drawStarbucksIsland(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1.55, 1.55);

    // Floating bobbing motion
    const bob = Math.sin(this.time * 2.5) * 6;
    ctx.translate(0, bob);

    // Glowing Aura
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -10, 48, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 30;
    ctx.fill();
    ctx.restore();

    // Golden Floating Island Base
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 18, 48, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Water ripple under buoy
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, 22, 54, 8, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Starbucks Cup Body
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-22, 12);
    ctx.lineTo(22, 12);
    ctx.lineTo(26, -34);
    ctx.lineTo(-26, -34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // -------------------------------------------------------------
    // Center Cup Logo: Capture 2 Logo (흥국/태광 시그니처 마젠타 CI 로고)
    // Replaces previous green siren circle & star as requested
    // -------------------------------------------------------------
    if (this.cupLogoImg && this.cupLogoImg.complete && this.cupLogoImg.naturalWidth > 0) {
      ctx.drawImage(this.cupLogoImg, -16, -21.5, 32, 21.6);
    } else {
      // Crisp vector fallback with exact geometry and color (#e4007f)
      ctx.save();
      ctx.fillStyle = '#e4007f';
      
      // Left Top Square
      ctx.fillRect(-16, -21.5, 8.8, 8.8);
      
      // Left Bottom Square
      ctx.fillRect(-16, -9.0, 8.8, 8.5);
      
      // Right Rotated Diamond (Rhombus)
      ctx.beginPath();
      ctx.moveTo(5.2, -10.7 - 10.8);
      ctx.lineTo(5.2 + 10.8, -10.7);
      ctx.lineTo(5.2, -10.7 + 10.8);
      ctx.lineTo(5.2 - 10.8, -10.7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Cup Lid
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-28, -42, 56, 9, 3);
    ctx.fill();
    ctx.stroke();

    // Green Straw
    ctx.fillStyle = '#006241';
    ctx.fillRect(4, -58, 5, 18);

    // Banner Title Above Island
    ctx.fillStyle = '#006241';
    ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText('☕ 스타벅스 e-Gift', 0, -66);
    ctx.fillText('☕ 스타벅스 e-Gift', 0, -66);

    ctx.restore();
  }
}

// Global instance for application access
window.bukangGame = new BukangLuckyDrawGame();
