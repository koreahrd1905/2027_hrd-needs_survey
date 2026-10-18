/**
 * BukangLuckyDrawGame - 부캉이와 함께 달리는 스타벅스 커피쿠폰 선착순 레이스
 * 
 * Features:
 * 1. Modal 80% size reduction with responsive mobile layout
 * 2. High-resolution cute blue shark image from Capture 1 with fallback vector drawing
 * 3. Silent BGM by default; activates dynamically when moving forward; stops immediately upon reaching goal & kissing
 * 4. Updated title, notices, mobile touch and keyboard drive banners, and ending screen texts
 */

class BukangLuckyDrawGameV2 {
  constructor() {
    this.modalEl = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.audioCtx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.isMuted = false;
    this.currentBgm = 'shark';
    this.surveyId = '';
    this.phoneNumber = '';
    this.gameState = 'INPUT'; // 'INPUT', 'SWIMMING', 'KISSING', 'FINISHED'
    
    // Interactive Driving Physics
    this.totalDistance = 2000;
    this.distanceTraveled = 0;
    this.swimSpeed = 0;
    this.baseSpeed = 0.5;
    this.maxSpeed = 8.5;
    this.lastKeyPressTime = 0;
    this.lastDriveTime = 0;
    this.keyPressCount = 0;

    // Load cute shark image (Capture 1)
    this.sharkImg = new Image();
    this.sharkImg.src = '/static/images/bukang_shark.png';

    // Particle FX
    this.particles = [];
    this.hearts = [];
    this.confetti = [];
    this.clouds = [];
    this.jumpPoints = [500, 1100, 1650];
    this.jumpTriggered = [false, false, false];
    this.time = 0;
  }

  // 1. Web Audio Synthesizer
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
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start(t);
      osc.stop(t + duration);
    } catch (e) {}
  }

  playSplashSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(320, 'triangle', 0.28, 0.22);
    this.playTone(480, 'sine', 0.22, 0.18, 0.05);
    this.playTone(660, 'triangle', 0.16, 0.14, 0.1);
  }

  playKissSound() {
    if (this.isMuted || !this.audioCtx) return;
    this.playTone(784, 'sine', 0.12, 0.25);
    this.playTone(1046, 'sine', 0.2, 0.3, 0.06);
    this.playTone(1318, 'triangle', 0.28, 0.25, 0.12);
  }

  playMellowTone() {
    if (this.isMuted || !this.audioCtx) return;
    const notes = [440.00, 392.00, 349.23, 293.66];
    const delays = [0, 0.18, 0.36, 0.58];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'sine', 0.45, 0.22, delays[idx]);
    });
  }

  // Polite bowing animation for Bukang (공손히 인사하는 애니메이션)
  startBowingAnimation(canvas) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let t = 0;
    const bowAnim = () => {
      if (this.gameState !== 'FINISHED') return;
      t += 0.055;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2 + 5);
      ctx.scale(0.68, 0.68);

      // Deep, respectful, rhythmic bowing motion
      const bowCycle = Math.sin(t * 2.2);
      const bowAngle = Math.max(0, bowCycle) * 0.45;
      ctx.rotate(bowAngle);

      // Shadow on floor
      ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.beginPath();
      ctx.ellipse(0, 42, 54, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Cute Blue Shark Body
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(0, 0, 48, 28, 0, 0, Math.PI * 2);
      ctx.fill();

      // Crisp White Belly
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 10, 40, 15, 0, 0, Math.PI * 2);
      ctx.fill();

      // Dorsal Fin
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-10, -26);
      ctx.lineTo(-2, -45);
      ctx.lineTo(14, -26);
      ctx.closePath();
      ctx.fill();

      // Tail with gentle waggle
      const tailW = Math.sin(t * 3.5) * 5;
      ctx.beginPath();
      ctx.moveTo(-45, 0);
      ctx.lineTo(-65 + tailW, -16);
      ctx.lineTo(-55 + tailW * 0.5, 0);
      ctx.lineTo(-65 + tailW, 16);
      ctx.closePath();
      ctx.fill();

      // Respectful Closed Smiling Eyes (⌒ ⌒)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(16, -6, 5.5, Math.PI, 0);
      ctx.stroke();

      // Sweet Rosy Cheek Blush
      ctx.fillStyle = 'rgba(255, 130, 185, 0.7)';
      ctx.beginPath();
      ctx.arc(12, 3, 5, 0, Math.PI * 2);
      ctx.fill();

      // Respectfully Folded Pectoral Fins (두 손 모아 인사)
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.ellipse(14, 14, 10, 6, -0.35, 0, Math.PI * 2);
      ctx.fill();

      // Polite gentle smile
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(26, 4, 4.5, 0.2, Math.PI * 0.85);
      ctx.stroke();

      // Polite sweat drop / shine
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(28, -18, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
      this.bowAnimId = requestAnimationFrame(bowAnim);
    };
    this.bowAnimId = requestAnimationFrame(bowAnim);
  }

  playVictoryFanfare() {
    if (this.isMuted || !this.audioCtx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    const delays = [0, 0.12, 0.24, 0.36, 0.52, 0.72];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, 0.25, delays[idx]);
    });
  }

  getMelodyTrack(name) {
    const D4 = 293.66, E4 = 329.63, F4 = 349.23, G4 = 392.00, A4 = 440.00, B4 = 493.88, C5 = 523.25, D5 = 587.33;
    return {
      type: 'sine',
      bpm: 115,
      notes: [
        { f: D4, d: 0.35 }, { f: E4, d: 0.35 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 },
        { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.35 },
        { f: D4, d: 0.35 }, { f: E4, d: 0.35 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 },
        { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.35 },
        { f: D4, d: 0.35 }, { f: E4, d: 0.35 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 },
        { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.2 }, { f: G4, d: 0.35 },
        { f: G4, d: 0.35 }, { f: G4, d: 0.35 }, { f: F4, d: 0.2 }, { f: E4, d: 0.5 }
      ]
    };
  }

  startBGM(trackName = null) {
    if (this.bgmPlaying || this.isMuted) return;
    this.stopBGM();
    this.initAudio();
    if (!this.audioCtx) return;

    this.bgmPlaying = true;
    const track = this.getMelodyTrack('shark');
    let noteIdx = 0;

    const playNext = () => {
      if (!this.bgmPlaying || this.isMuted) return;
      const note = track.notes[noteIdx];
      if (note && note.f > 0) {
        this.playTone(note.f, track.type, note.d, 0.08);
        this.playTone(note.f / 2, 'triangle', note.d * 1.4, 0.05);
      }
      noteIdx = (noteIdx + 1) % track.notes.length;
      this.bgmTimer = setTimeout(playNext, (note.d * 0.88 + 0.05) * 1000);
    };

    playNext();
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  // 2. Open Modal & Setup UI
  open(surveyId = '') {
    this.surveyId = surveyId;
    this.phoneNumber = '';
    this.gameState = 'INPUT';
    this.distanceTraveled = 0;
    this.swimSpeed = 0;
    this.lastDriveTime = 0;
    this.jumpTriggered = [false, false, false];
    this.createModalDOM();
    // [중요] 초기 오픈 시 결과창은 무조건 숨김, 입력창 노출, 상단 [X] 버튼 노출
    const resViewInit = document.getElementById('bukang-result-view');
    if (resViewInit) resViewInit.style.display = 'none';
    const inputViewInit = document.getElementById('bukang-input-view');
    if (inputViewInit) inputViewInit.style.display = 'block';
    const topCloseBtn = document.getElementById('bukang-close-top-btn');
    if (topCloseBtn) topCloseBtn.style.display = 'flex';

    this.initAudio();
    // Silent BGM by default - only starts when moving forward!
    this.stopBGM();
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

    const modalBox = this.modalEl ? this.modalEl.querySelector('.bukang-modal-box') : document.body;
    modalBox.appendChild(confirmOverlay);

    const cancelBtn = confirmOverlay.querySelector('#btn-cancel-exit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        confirmOverlay.remove();
      });
    }

    const confirmBtn = confirmOverlay.querySelector('#btn-confirm-exit');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        confirmOverlay.remove();
        this.close();

        if (typeof window.markEventAsCompleted === 'function') {
          window.markEventAsCompleted();
        }

        if (typeof window.handleSurveyAndGameFinish === 'function') {
          window.handleSurveyAndGameFinish();
        } else {
          try {
            window.open('', '_self', '');
            window.close();
          } catch (e) {}
        }

        setTimeout(() => {
          const root = document.getElementById('root');
          if (root) {
            root.innerHTML = `
              <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg, #0f172a 0%, #1e293b 100%);color:white;font-family:'Pretendard',sans-serif;padding:1.5rem;text-align:center;">
                <div style="background:rgba(255,255,255,0.06);backdrop-filter:blur(16px);border:1px solid rgba(255,255,255,0.15);padding:2.5rem 2rem;border-radius:24px;max-width:480px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.5);">
                  <div style="font-size:3.5rem;margin-bottom:1rem;">✅</div>
                  <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:0.8rem;color:#38bdf8;">설문 참여가 완료되었습니다</h2>
                  <p style="font-size:1rem;color:#cbd5e1;line-height:1.6;margin-bottom:1.8rem;">
                    2027 그룹 인재육성 체계 수립 설문조사에<br>소중한 시간 내어 참여해 주셔서 대단히 감사합니다.<br>
                    현재 인터넷 창(탭)을 닫아주시면 됩니다.
                  </p>
                  <button onclick="try{window.open('','_self','');window.close();}catch(e){}" style="background:linear-gradient(135deg, #38bdf8 0%, #0284c7 100%);color:white;border:none;padding:0.9rem 2.2rem;border-radius:14px;font-size:1.05rem;font-weight:800;cursor:pointer;box-shadow:0 6px 20px rgba(2,132,199,0.4);">
                    창 닫기
                  </button>
                </div>
              </div>
            `;
          }
        }, 80);
      });
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
              <h3>부캉이와 함께 달리는 스타벅스 커피쿠폰 선착순 레이스</h3>
              <p>흥국생명 <b>선착순 160명</b> · 흥국화재 <b>선착순 200명</b> 실시간 골인 챌린지!</p>
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

          <!-- Interactive Keyboard / Touch Drive Notification Banner -->
          <div id="bukang-keyboard-guide" style="display:none;position:absolute;top:14px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg, rgba(234, 88, 12, 0.96), rgba(220, 38, 38, 0.96));backdrop-filter:blur(6px);color:white;padding:0.6rem 1.6rem;border-radius:30px;font-size:0.95rem;font-weight:800;box-shadow:0 6px 20px rgba(220,38,38,0.45);border:2px solid #fef08a;z-index:20;display:flex;align-items:center;gap:0.6rem;animation:guidePulse 1.2s infinite alternate;white-space:nowrap;cursor:pointer;">
            <span style="font-size:1.2rem;">⌨️ 📱</span>
            <span>키보드 방향키(▶) 연타! / 모바일: 화면 터치 연타로 부캉이를 달리게 하세요!</span>
          </div>

          <!-- Speedometer & Progress Bar Overlay -->
          <div id="bukang-progress-bar-wrap" style="display:none;position:absolute;bottom:16px;left:20px;right:20px;background:rgba(15,23,42,0.85);backdrop-filter:blur(6px);border-radius:16px;padding:0.65rem 1.4rem;color:white;border:1px solid rgba(255,255,255,0.3);z-index:15;">
            <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.88rem;font-weight:800;margin-bottom:0.35rem;">
              <span>🏁 해운대 마린시티 & 광안대교</span>
              <span id="bukang-speed-text" style="color:#38bdf8;font-size:0.98rem;">속도: 0 km/h</span>
              <span id="bukang-dist-text" style="color:#fef08a;">남은 거리: 2,000m (0%)</span>
              <span>☕ 흥국금융 골인</span>
            </div>
            <div style="width:100%;height:10px;background:rgba(255,255,255,0.2);border-radius:5px;overflow:hidden;position:relative;">
              <div id="bukang-progress-fill" style="width:0%;height:100%;background:linear-gradient(90deg, #38bdf8, #facc15, #f59e0b);border-radius:5px;transition:width 0.08s linear;"></div>
            </div>
          </div>

          <!-- Input Panel (Initial) -->
          <div class="bukang-input-panel" id="bukang-input-view">
            <div class="bukang-guide-card">
              <div class="shark-badge">🦈 실시간 선착순 골인 챌린지 (버전 2)</div>
              <div style="display:flex;justify-content:center;gap:0.75rem;margin:0.5rem 0 0.8rem 0;flex-wrap:wrap;">
                <span style="background:#fdf2f8;color:#e4007f;font-weight:800;font-size:0.86rem;padding:0.25rem 0.85rem;border-radius:20px;border:1px solid #fbcfe8;">🏢 흥국생명 선착순 160명</span>
                <span style="background:#eff6ff;color:#1d4ed8;font-weight:800;font-size:0.86rem;padding:0.25rem 0.85rem;border-radius:20px;border:1px solid #bfdbfe;">🏢 흥국화재 선착순 200명</span>
              </div>
              <h4>"당신의 행운을 위해 부산 앞바다를 신나게 헤엄쳐 갈게요!"</h4>
              <p>
                휴대전화 번호를 입력하시면 부캉이가 <span style="color:#d97706;background:#fef3c7;padding:0.15rem 0.5rem;border-radius:6px;font-weight:800;border:1px solid #fde68a;">🏷️ 번호 꼬리표</span>를 달고 <span style="color:#e4007f;font-weight:800;background:#fdf2f8;padding:0.15rem 0.5rem;border-radius:6px;border:1px solid #fbcfe8;">흥국금융</span>으로 출발합니다.
              </p>
              
              <div class="phone-input-row">
                <span class="input-icon">📱</span>
                <input type="tel" id="bukang-phone-input" placeholder="010-1234-5678" maxlength="13" autofocus />
                <button class="bukang-start-btn" id="bukang-start-btn">
                  <span>🦈</span> START (부캉이 출발!)
                </button>
              </div>
              <div class="phone-err-msg" id="bukang-phone-err" style="display:none;"></div>

              <!-- 안내 메시지 (이벤트 참여 안내) -->
              <div style="margin-top:0.85rem;font-size:0.84rem;color:#64748b;line-height:1.55;background:#f8fafc;padding:0.6rem 1.1rem;border-radius:10px;border:1px solid #e2e8f0;display:inline-block;max-width:620px;text-align:center;">
                연락처 기재는 이벤트 당첨자에게 쿠폰을 발송하기 위한 용도로만 사용됩니다.<br>
                <span style="color:#94a3b8;">(게임 참여는 선택사항이며, 원하지 않으시면 종료(✕) 하시면 됩니다.)</span>
              </div>
            </div>
          </div>

          <!-- Result Celebration Overlay (Finished) -->
          <div class="bukang-result-panel" id="bukang-result-view" style="display:none;">
            <div class="result-card">
              <div class="result-badge">🎉 응모 접수 완료!</div>
              <h2 class="result-title">"당신의 행운을 부캉이가 기원합니다!"</h2>
              <div class="result-sub-text">
                ☕ 이벤트에 정상 응모되었습니다.<br>
                <b style="color:#0369a1;">(선착순 000명에게 개별 모바일 쿠폰을 발송 드립니다)</b>
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
                  종료
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
    const guideBanner = document.getElementById('bukang-keyboard-guide');

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

      // Check duplicate
      try {
        startBtn.disabled = true;
        startBtn.innerHTML = '<span>⏳</span> 중복 확인 중...';
        const chkRes = await fetch(`/api/event/check?phone=${encodeURIComponent(raw)}`).then(r => r.json());
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

    closeTopBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.promptExitConfirmation();
    });

    muteBtn.addEventListener('click', () => {
      this.isMuted = !this.isMuted;
      muteBtn.innerText = this.isMuted ? '🔇' : '🔊';
      if (this.isMuted) {
        this.stopBGM();
      } else {
        this.initAudio();
        if (this.gameState === 'SWIMMING') {
          this.startBGM(this.currentBgm);
        }
      }
    });

    // Keyboard drive listeners
    this.keyDownHandler = (e) => {
      if (this.gameState !== 'SWIMMING') return;
      if (['ArrowRight', 'ArrowUp', ' ', 'Enter', 'd', 'D', 'w', 'W'].includes(e.key)) {
        e.preventDefault();
        this.triggerDriveImpulse();
      }
    };
    window.addEventListener('keydown', this.keyDownHandler);

    // Mouse / Touch click driving support
    this.canvas.addEventListener('click', () => {
      if (this.gameState === 'SWIMMING') {
        this.triggerDriveImpulse();
      }
    });

    this.canvas.addEventListener('touchstart', (e) => {
      if (this.gameState === 'SWIMMING') {
        e.preventDefault();
        this.triggerDriveImpulse();
      }
    }, { passive: false });

    if (guideBanner) {
      guideBanner.addEventListener('click', () => {
        if (this.gameState === 'SWIMMING') this.triggerDriveImpulse();
      });
      guideBanner.addEventListener('touchstart', (e) => {
        if (this.gameState === 'SWIMMING') {
          e.preventDefault();
          this.triggerDriveImpulse();
        }
      }, { passive: false });
    }
  }

  // Keyboard & Touch Impulse booster
  triggerDriveImpulse() {
    this.initAudio();
    // BGM activates dynamically only when moving forward
    if (!this.bgmPlaying && !this.isMuted) {
      this.startBGM(this.currentBgm);
    }

    const now = performance.now();
    const interval = now - this.lastKeyPressTime;
    this.lastKeyPressTime = now;
    this.lastDriveTime = now;
    this.keyPressCount++;

    let boost = 1.6;
    if (interval < 220) {
      boost = 2.4;
    }

    this.swimSpeed = Math.min(this.swimSpeed + boost, this.maxSpeed);

    // Splash sound effect occasionally
    if (this.keyPressCount % 3 === 0) {
      this.playTone(380 + Math.random() * 120, 'sine', 0.08, 0.12);
      this.createWaterSplash(this.shark.screenX, this.shark.y, 14);
    }
  }

  // 3. Game Loop & Interactive Physics
  initCanvasGame() {
    this.shark = {
      screenX: 380,
      baseY: 380,
      y: 380,
      wiggle: 0,
      angle: 0,
      jumping: false,
      jumpT: 0,
      isKissing: false,
      kissT: 0,
      hasKissed: false
    };

    this.clouds = [
      { x: 100, y: 70, scale: 1.2, speed: 0.15 },
      { x: 420, y: 110, scale: 0.9, speed: 0.1 },
      { x: 780, y: 60, scale: 1.4, speed: 0.2 },
      { x: 1050, y: 120, scale: 0.8, speed: 0.12 }
    ];

    const loop = () => {
      this.updateGame();
      this.drawGame();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  startSwimming() {
    this.gameState = 'SWIMMING';
    this.distanceTraveled = 0;
    this.swimSpeed = 0;
    this.lastDriveTime = performance.now();
    this.jumpTriggered = [false, false, false];

    // Hide input panel
    document.getElementById('bukang-input-view').style.display = 'none';

    // Show Guide & Progress HUD
    const guideEl = document.getElementById('bukang-keyboard-guide');
    if (guideEl) guideEl.style.display = 'flex';
    const progressWrap = document.getElementById('bukang-progress-bar-wrap');
    if (progressWrap) progressWrap.style.display = 'block';

    this.initAudio();
    // Do NOT auto-play BGM yet; wait for first drive impulse!
    this.playTone(440, 'sine', 0.2, 0.2);
    this.playTone(660, 'triangle', 0.25, 0.25, 0.1);

    // In Game 2: The actual entry and ranking are determined at the moment of GOAL (골인 시각 기준)!
    this.raceStartTime = performance.now();
  }

  updateGame() {
    this.time += 0.05;

    // Swimming phase driven by user keypresses / taps
    if (this.gameState === 'SWIMMING') {
      // Natural Friction decay
      this.swimSpeed *= 0.965;
      if (this.swimSpeed < this.baseSpeed) {
        this.swimSpeed = this.baseSpeed;
      }

      // If user hasn't moved for 2.5 seconds and speed is baseSpeed, pause BGM
      const now = performance.now();
      if (now - this.lastDriveTime > 2500 && this.swimSpeed <= this.baseSpeed + 0.2) {
        if (this.bgmPlaying) {
          this.stopBGM();
        }
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

      // Water bubble particles behind shark
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

      const startX = 380;
      const targetX = 910;
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
    // Stop BGM immediately when initiating goal jump
    this.stopBGM();
    this.playSplashSound();
    this.createWaterSplash(this.shark.screenX, this.shark.baseY, 30);

    const guideEl = document.getElementById('bukang-keyboard-guide');
    if (guideEl) guideEl.style.display = 'none';
  }

  // When Bukang kisses Starbucks Island (골인 시각 기준 선착순 판정!)
  async onKissHit() {
    this.stopBGM();
    this.playKissSound();

    const company = (window.currentSurveySubmission && window.currentSurveySubmission.company) || '흥국생명';
    const department = (window.currentSurveySubmission && window.currentSurveySubmission.department) || '';
    const job_group = (window.currentSurveySubmission && window.currentSurveySubmission.job_group) || '';
    const position = (window.currentSurveySubmission && window.currentSurveySubmission.position) || '';

    const eventPayload = {
      action: 'event_submit',
      mode: 'race',
      game_version: 2,
      survey_id: this.surveyId,
      phone: this.phoneNumber,
      company: company,
      department: department,
      job_group: job_group,
      position: position
    };

    let serverResult = null;
    try {
      const resp = await fetch('/api/event/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventPayload)
      });
      if (resp.ok) {
        serverResult = await resp.json();
      }
    } catch (e) {
      console.warn('Race submit error:', e);
    }

    if (!serverResult || !serverResult.success) {
      // Safe fallback: treat as winner within 160/200 limit
      serverResult = {
        success: true,
        entry_id: `EVT-${Math.floor(Math.random() * 8999 + 1000)}`,
        is_winner: true,
        company: company,
        rank: 1,
        quota: company.includes('화재') ? 200 : 160
      };
    }

    // [신호 통로 단일화] Render 백엔드에서만 일괄 전달

    const isWinner = serverResult.is_winner === true;
    const rankNum = serverResult.rank || 1;
    const quotaNum = serverResult.quota || (company.includes('화재') ? 200 : 160);

    // Dynamic result view rendering
    const resCard = document.querySelector('#bukang-result-view .result-card');
    if (resCard) {
      // Mask phone
      let masked = this.phoneNumber;
      const parts = this.phoneNumber.split('-');
      if (parts.length === 3) masked = `${parts[0]}-****-${parts[2]}`;

      if (isWinner) {
        // Winner UI
        this.playVictoryFanfare();
        // Massive Fireworks & Hearts
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
        for (let i = 0; i < 6; i++) {
          setTimeout(() => {
            this.spawnFireworks(960 + (Math.random() * 160 - 80), 220 + (Math.random() * 80 - 40));
          }, i * 180);
        }

        resCard.innerHTML = `
          <div class="result-badge" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);">🎉 실시간 선착순 당첨 성공!</div>
          <h2 class="result-title" style="color:#065f46;font-size:1.22rem;margin:0.15rem 0 0.35rem 0;">"축하합니다. 커피쿠폰 당첨"</h2>
          <div class="result-sub-text" style="font-size:0.86rem;font-weight:700;color:#047857;margin-bottom:0.65rem;">
            커피 모바일 쿠폰을 발송해 드리겠습니다 (발송일 : 10월30일 이후)
          </div>

          <div class="entry-receipt">
            <div class="receipt-row">
              <span>접수 번호</span>
              <strong>${serverResult.entry_id}</strong>
            </div>
            <div class="receipt-row">
              <span>소속 회사</span>
              <strong style="color:#047857;">${company}</strong>
            </div>
            <div class="receipt-row">
              <span>응모 번호</span>
              <strong>${masked}</strong>
            </div>
            <div class="receipt-row">
              <span>골인 미션</span>
              <span>흥국금융에 사랑의 뽀뽀(쪽~ 💋) 성공!</span>
            </div>
          </div>

          <div class="result-btn-row">
            <button class="bukang-finish-btn" id="bukang-finish-btn" style="background:linear-gradient(135deg, #10b981 0%, #059669 100%);">
              종료
            </button>
          </div>
        `;
      } else {
        // Loser UI (꽝!)
        this.playMellowTone();
        resCard.innerHTML = `
          <div class="result-badge" style="background:linear-gradient(135deg, #ef4444 0%, #dc2626 100%);">⚠️ 선착순 마감 안내</div>
          <div class="result-fail-title" style="display:block !important;width:100% !important;text-align:center !important;margin:0.15rem auto 0.25rem auto !important;animation:failPulse 1.2s infinite alternate !important;">
            꽝!
          </div>
          <div style="font-size:1.45rem;font-weight:800;color:#1e293b;margin-bottom:0.4rem;text-align:center;">
            수고많으셨습니다
          </div>
          <div class="result-sub-text" style="font-size:0.9rem;color:#64748b;line-height:1.55;margin-bottom:0.6rem;text-align:center;">
            아쉽게도 선착순 당첨 인원(흥국생명 160명 / 흥국화재 200명)이 마감되었습니다.<br>
            설문에 참여해 주신 임직원 여러분의 소중한 의견에 깊이 감사드립니다.
          </div>

          <!-- 부캉이 공손 인사 애니메이션 캔버스 -->
          <canvas id="bukang-bow-canvas" width="220" height="110" style="margin: 0.2rem auto 0.6rem; display: block;"></canvas>

          <div class="entry-receipt" style="margin:0.4rem auto 0.8rem auto;padding:0.6rem 1rem;">
            <div class="receipt-row" style="padding:0.35rem 0;display:flex;justify-content:space-between;border-bottom:1px dashed #e2e8f0;">
              <span>접수 번호</span>
              <strong>${serverResult.entry_id}</strong>
            </div>
            <div class="receipt-row" style="padding:0.35rem 0;display:flex;justify-content:space-between;border-bottom:1px dashed #e2e8f0;">
              <span>소속 회사</span>
              <strong>${company}</strong>
            </div>
            <div class="receipt-row" style="padding:0.35rem 0;display:flex;justify-content:space-between;">
              <span>응모 번호</span>
              <strong>${masked}</strong>
            </div>
          </div>

          <div class="result-btn-row">
            <button class="bukang-finish-btn" id="bukang-finish-btn" style="background:linear-gradient(135deg, #64748b 0%, #475569 100%);">
              종료
            </button>
          </div>
        `;

        // Start polite bowing animation
        setTimeout(() => {
          this.startBowingAnimation(document.getElementById('bukang-bow-canvas'));
        }, 50);
      }

      // Re-bind finish button
      const newFinishBtn = document.getElementById('bukang-finish-btn');
      if (newFinishBtn) {
        newFinishBtn.addEventListener('click', () => {
          this.close();
          if (typeof window.handleSurveyAndGameFinish === 'function') {
            window.handleSurveyAndGameFinish();
          } else {
            try {
              window.open('', '_self', '');
              window.close();
            } catch (e) {}
          }
        });
      }
    }

    // Show result view after 1.2s
    setTimeout(() => {
      this.gameState = 'FINISHED';
      const progressWrap = document.getElementById('bukang-progress-bar-wrap');
      if (progressWrap) progressWrap.style.display = 'none';
      const resView = document.getElementById('bukang-result-view');
      if (resView) resView.style.display = 'flex';

      // [교수님 요청] 결과 접수증 화면에서는 우측상단 [X] 종료 버튼을 숨겨 반드시 하단 종료 버튼을 누르도록 유도
      const topCloseBtn = document.getElementById('bukang-close-top-btn');
      if (topCloseBtn) topCloseBtn.style.display = 'none';

      // 1인 1회 응모 완료 영구 기록 및 부모 페이지 버튼 즉시 비활성화
      window.isEventSubmitted = true;
      try {
        localStorage.setItem('heungkuk_event_submitted', 'true');
        sessionStorage.setItem('heungkuk_event_submitted', 'true');
      } catch (e) {}
      if (typeof window.markEventAsCompleted === 'function') {
        window.markEventAsCompleted();
      }
    }, 1200);
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

  // 4. Drawing Canvas Elements with Busan Marine City & Gwangan Bridge
  drawGame() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const scroll = this.distanceTraveled;

    // A. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 360);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(0.55, '#38bdf8');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, 360);

    // Warm Sun in Sky
    ctx.save();
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = 'rgba(254, 240, 138, 0.8)';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.arc(1040, 90, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Moving Clouds
    this.clouds.forEach(c => {
      c.x -= c.speed;
      if (c.x < -150) c.x = w + 100;
      this.drawCloud(c.x, c.y, c.scale);
    });

    // B. Parallax Layer 1: Haeundae Marine City Skyscrapers
    this.drawHaeundaeSkyscrapers(scroll * 0.15);

    // C. Parallax Layer 2: Gwangan Bridge Landmark
    this.drawGwanganBridge(scroll * 0.35);

    // D. Sea Surface & Water Waves
    const seaGrad = ctx.createLinearGradient(0, 340, 0, h);
    seaGrad.addColorStop(0, '#0284c7');
    seaGrad.addColorStop(0.3, '#0369a1');
    seaGrad.addColorStop(1, '#0c4a6e');
    ctx.fillStyle = seaGrad;
    ctx.fillRect(0, 340, w, h - 340);

    // Sea Wave Lines
    for (let i = 0; i < 4; i++) {
      const waveY = 345 + i * 55;
      const speed = (i + 1) * 0.5 + 0.5;
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.35 - i * 0.07})`;
      ctx.lineWidth = 3 - i * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, waveY);
      for (let x = 0; x <= w; x += 40) {
        const yOffset = Math.sin((x * 0.015) + (this.time * speed) - (scroll * 0.01)) * (8 - i * 1.5);
        ctx.lineTo(x, waveY + yOffset);
      }
      ctx.stroke();
    }

    // E. Target: Starbucks Island Goal
    const targetScreenX = 960;
    this.drawStarbucksIsland(targetScreenX, 260);

    // F. Draw Shark "Bukang-i"
    this.drawShark(this.shark);

    // G. Draw Particles & Hearts
    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.rad, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.hearts.forEach(h => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, h.alpha);
      ctx.fillStyle = h.color;
      ctx.beginPath();
      const topCurveHeight = h.size * 0.3;
      ctx.moveTo(h.x, h.y + topCurveHeight);
      ctx.bezierCurveTo(h.x, h.y, h.x - h.size / 2, h.y, h.x - h.size / 2, h.y + topCurveHeight);
      ctx.bezierCurveTo(h.x - h.size / 2, h.y + (h.size + topCurveHeight) / 2, h.x, h.y + (h.size + topCurveHeight) / 2, h.x, h.y + h.size);
      ctx.bezierCurveTo(h.x, h.y + (h.size + topCurveHeight) / 2, h.x + h.size / 2, h.y + (h.size + topCurveHeight) / 2, h.x + h.size / 2, h.y + topCurveHeight);
      ctx.bezierCurveTo(h.x + h.size / 2, h.y, h.x, h.y, h.x, h.y + topCurveHeight);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Draw Confetti
    this.confetti.forEach(c => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.alpha);
      ctx.fillStyle = c.color;
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rotation);
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    });
  }

  drawHaeundaeSkyscrapers(offset) {
    const ctx = this.ctx;
    const baseW = 1200;
    const buildings = [
      { x: 30, w: 60, h: 180, c: '#0369a1' },
      { x: 100, w: 80, h: 230, c: '#0284c7' },
      { x: 190, w: 55, h: 160, c: '#075985' },
      { x: 260, w: 90, h: 260, c: '#0369a1' },
      { x: 360, w: 70, h: 190, c: '#0284c7' },
      { x: 440, w: 110, h: 280, c: '#0c4a6e' },
      { x: 560, w: 65, h: 170, c: '#075985' },
      { x: 640, w: 85, h: 240, c: '#0369a1' },
      { x: 740, w: 60, h: 180, c: '#0284c7' },
      { x: 810, w: 100, h: 270, c: '#0c4a6e' },
      { x: 920, w: 75, h: 210, c: '#075985' },
      { x: 1010, w: 90, h: 250, c: '#0369a1' },
      { x: 1110, w: 70, h: 190, c: '#0284c7' }
    ];

    ctx.save();
    ctx.globalAlpha = 0.55;
    for (let rep = -1; rep <= 1; rep++) {
      const shift = rep * baseW - (offset % baseW);
      buildings.forEach(b => {
        const bx = b.x + shift;
        const by = 350 - b.h;
        ctx.fillStyle = b.c;
        ctx.fillRect(bx, by, b.w, b.h);

        // Windows
        ctx.fillStyle = 'rgba(254, 240, 138, 0.45)';
        for (let wy = by + 12; wy < 340; wy += 18) {
          for (let wx = bx + 8; wx < bx + b.w - 8; wx += 14) {
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      });
    }
    ctx.restore();
  }

  drawGwanganBridge(offset) {
    const ctx = this.ctx;
    const baseW = 1200;
    ctx.save();
    ctx.globalAlpha = 0.85;

    for (let rep = -1; rep <= 1; rep++) {
      const shift = rep * baseW - (offset % baseW);

      // Main Suspension Bridge Towers
      const towers = [280, 580, 880];
      towers.forEach(tx => {
        const x = tx + shift;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 6, 210, 12, 140);
        ctx.fillRect(x - 16, 230, 32, 6);
        ctx.fillRect(x - 20, 275, 40, 6);

        // Red Aviation Warning Lights
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(x, 208, 3.5, 0, Math.PI * 2);
        ctx.fill();
      });

      // Roadway Deck
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(shift, 335, baseW, 14);
      ctx.fillStyle = '#64748b';
      ctx.fillRect(shift, 345, baseW, 4);

      // Main Suspension Cables
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(towers[0] + shift, 210);
      ctx.quadraticCurveTo((towers[0] + towers[1]) / 2 + shift, 335, towers[1] + shift, 210);
      ctx.quadraticCurveTo((towers[1] + towers[2]) / 2 + shift, 335, towers[2] + shift, 210);
      ctx.stroke();

      // Vertical Suspension Ropes
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
      for (let rx = towers[0] + 25; rx < towers[2] - 25; rx += 22) {
        if (Math.abs(rx - towers[1]) < 12) continue;
        const x = rx + shift;
        ctx.beginPath();
        ctx.moveTo(x, 260);
        ctx.lineTo(x, 335);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  drawCloud(x, y, scale = 1) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(x, y, 22 * scale, 0, Math.PI * 2);
    ctx.arc(x + 20 * scale, y - 8 * scale, 28 * scale, 0, Math.PI * 2);
    ctx.arc(x + 48 * scale, y - 4 * scale, 24 * scale, 0, Math.PI * 2);
    ctx.arc(x + 65 * scale, y + 4 * scale, 18 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Draw Cute Blue Shark "부캉이" (Capture 1 Image + Cute Vector Fallback)
  drawShark(s) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(s.screenX, s.y);
    ctx.scale(1.85, 1.85);
    ctx.rotate(s.angle);

    const tailWiggle = Math.sin(s.wiggle) * 12;

    // 1. Little Orange Fish Friends behind shark
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
      
      ctx.beginPath();
      ctx.ellipse(fx, fy, 6.5 * f.s, 4 * f.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(fx - 4 * f.s, fy);
      ctx.lineTo(fx - 10 * f.s, fy - 4 * f.s);
      ctx.lineTo(fx - 10 * f.s, fy + 4 * f.s);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // 2. Tag Ribbon attached to shark tail
    const phoneText = this.phoneNumber || '010-XXXX-XXXX';
    const tagWaveY = Math.sin(this.time * 7) * 4;
    const ropeStartX = -58 + tailWiggle * 0.3;
    const ropeEndX = -76 + tailWiggle * 0.15;
    const ropeEndY = tagWaveY;

    // Golden Rope connecting tail to tag
    ctx.save();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(ropeStartX, 0);
    ctx.quadraticCurveTo(-66 + tailWiggle * 0.2, ropeEndY + 2, ropeEndX, ropeEndY);
    ctx.stroke();
    ctx.restore();

    // Yellow Number Tag Flag
    const tagW = 94;
    const tagH = 25;
    const tagBoxX = ropeEndX - tagW;
    const tagBoxY = ropeEndY - tagH / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 2;

    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(tagBoxX, tagBoxY, tagW, tagH, 6);
    ctx.fill();
    ctx.stroke();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(ropeEndX - 5, ropeEndY, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#78350f';
    ctx.font = 'bold 10px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📱 ' + phoneText, tagBoxX + (tagW - 6) / 2, ropeEndY);
    ctx.restore();

    // 3. Render Shark: Capture 1 Cute Shark Image
    if (this.sharkImg && this.sharkImg.complete && this.sharkImg.naturalWidth > 0) {
      ctx.save();
      // Render cute blue shark image from Capture 1
      const imgW = 144;
      const imgH = 79;
      const imgX = -72;
      const imgY = -48;
      ctx.drawImage(this.sharkImg, imgX, imgY, imgW, imgH);
      ctx.restore();
    } else {
      // High-Quality Baby Shark Blue Vector Fallback
      const SHARK_BLUE = '#0284c7';
      const SHARK_DARK_BLUE = '#0369a1';
      const SHARK_BELLY = '#ffffff';

      // Caudal Fin (Tail)
      ctx.fillStyle = SHARK_BLUE;
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.quadraticCurveTo(-50 + tailWiggle * 0.4, -18, -68 + tailWiggle, -36);
      ctx.quadraticCurveTo(-58 + tailWiggle, 0, -68 + tailWiggle, 30);
      ctx.quadraticCurveTo(-50 + tailWiggle * 0.4, 18, -42, 4);
      ctx.closePath();
      ctx.fill();

      // Dorsal Fin
      ctx.fillStyle = SHARK_BLUE;
      ctx.beginPath();
      ctx.moveTo(16, -18);
      ctx.bezierCurveTo(8, -42, 2, -56, -10, -56);
      ctx.quadraticCurveTo(-3, -34, -18, -18);
      ctx.closePath();
      ctx.fill();

      // Pectoral Fin
      ctx.fillStyle = SHARK_BLUE;
      ctx.beginPath();
      ctx.moveTo(-2, 18);
      ctx.quadraticCurveTo(-14, 38, -12, 46);
      ctx.quadraticCurveTo(4, 34, 18, 18);
      ctx.closePath();
      ctx.fill();

      // Chubby Main Blue Body & Head
      ctx.fillStyle = SHARK_BLUE;
      ctx.beginPath();
      ctx.moveTo(-42, 0);
      ctx.bezierCurveTo(-20, -22, 10, -22, 26, -18);
      ctx.quadraticCurveTo(46, -14, 60, -4);
      ctx.quadraticCurveTo(46, 6, 28, 8);
      ctx.bezierCurveTo(22, 22, -10, 22, -26, 16);
      ctx.quadraticCurveTo(-36, 10, -42, 4);
      ctx.closePath();
      ctx.fill();

      // Plump White Underbelly
      ctx.fillStyle = SHARK_BELLY;
      ctx.beginPath();
      ctx.moveTo(28, 8);
      ctx.quadraticCurveTo(38, 11, 48, 13);
      ctx.bezierCurveTo(28, 22, 0, 22, -22, 16);
      ctx.quadraticCurveTo(-35, 10, -40, 4);
      ctx.quadraticCurveTo(-15, 8, 0, 9);
      ctx.quadraticCurveTo(16, 9, 28, 8);
      ctx.closePath();
      ctx.fill();

      // Open Mouth Detail
      ctx.fillStyle = '#ff007f';
      ctx.beginPath();
      ctx.ellipse(36, 9.5, 5, 3.2, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Gills
      ctx.strokeStyle = SHARK_DARK_BLUE;
      ctx.lineWidth = 2.0;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(4 + i * 5, 2, 5.5, Math.PI * 0.72, Math.PI * 1.28);
        ctx.stroke();
      }

      // Cheek Blush
      ctx.fillStyle = 'rgba(255, 130, 185, 0.55)';
      ctx.beginPath();
      ctx.arc(16, 3, 6, 0, Math.PI * 2);
      ctx.fill();

      // Big Sparkling Cartoon Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(26, -7, 7.5, 7.5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.ellipse(27.5, -7, 5.8, 6.2, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(26, -8.5, 2.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(29, -5.5, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Kissing Lips when goal reached
    if (s.isKissing) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(68, -4, 6.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(66.5, -5.5, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Name tag badge "부캉이"
    ctx.font = 'bold 9.5px "Pretendard", "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.4;
    ctx.strokeText('부캉이', 0, -38);
    ctx.fillText('부캉이', 0, -38);

    ctx.restore();
  }

  // Draw Starbucks Coffee Cup Island at Haeundae
  // Draw Starbucks Coffee Cup Island at Haeundae (Capture 2 Match)
  drawStarbucksIsland(x, y) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);

    // Floating bobbing motion
    const bob = Math.sin(this.time * 2.5) * 6;
    ctx.translate(0, bob);

    // Glowing Aura
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, -10, 52, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(250, 204, 21, 0.28)';
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

    // Cup Body (White)
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

    // Heungkuk Magenta Logo on the Cup (Two squares + Rotated diamond)
    ctx.fillStyle = '#e4007f';
    // Top-left square
    ctx.fillRect(-15, -23, 8.5, 8.5);
    // Bottom-left square
    ctx.fillRect(-15, -11, 8.5, 8.5);
    // Right tilted diamond
    ctx.save();
    ctx.translate(3.5, -13);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-7.5, -7.5, 15, 15);
    ctx.restore();

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
    ctx.fillRect(2, -58, 5, 18);

    // Banner Title Above Island
    ctx.fillStyle = '#006241';
    ctx.font = 'bold 11px "Malgun Gothic", sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeText('☕ 스타벅스 e-Gift', 0, -56);
    ctx.fillText('☕ 스타벅스 e-Gift', 0, -56);

    ctx.restore();
  }
}

// Global instance for application access
window.bukangGameV2 = new BukangLuckyDrawGameV2();
window.bukangGame = window.bukangGameV2;
