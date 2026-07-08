/* =====================================================
   Flash Diag 360 — BearingPoint
   Site interactions + EXPLANATORY DEMO VIDEO (app mockups)
   ===================================================== */

/* ---------- 1. Reveal on scroll ---------- */
const revealEls = document.querySelectorAll('.section__head, .ctx-card, .accel-card, .result, .ref-card, .quote-card, .themes__grid, .partners');
revealEls.forEach(el => el.classList.add('reveal'));

const io = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => io.observe(el));

/* ---------- 2. Counters in page ---------- */
const countEls = document.querySelectorAll('[data-count]');
const countIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animatePageCount(entry.target);
      countIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.4 });
countEls.forEach(el => countIO.observe(el));

function animatePageCount(el) {
  const target = parseInt(el.dataset.count, 10);
  const prefix = el.dataset.prefix || '';
  const suffix = el.dataset.suffix || '';
  const originalText = el.textContent;
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = prefix + Math.round(target * eased) + suffix;
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = originalText;
  }
  requestAnimationFrame(step);
}

/* ---------- 3. Hero live KPI flicker ---------- */
const trsEl = document.getElementById('kpiTRS');
const bpcEl = document.getElementById('kpiBPC');
const ncrEl = document.getElementById('kpiNCR');
let trs = 72, bpc = 91, ncr = 38;
setInterval(() => {
  trs = Math.max(65, Math.min(90, trs + (Math.random() < 0.6 ? 1 : -1) * (Math.random() < 0.7 ? 1 : 0)));
  bpc = Math.max(85, Math.min(98, bpc + (Math.random() < 0.6 ? 1 : -1) * (Math.random() < 0.5 ? 1 : 0)));
  ncr = Math.max(20, Math.min(50, ncr + (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.6 ? 1 : 0)));
  if (trsEl) trsEl.textContent = trs + '%';
  if (bpcEl) bpcEl.textContent = bpc + '%';
  if (ncrEl) ncrEl.textContent = ncr;
}, 2400);

/* ---------- 4. Phase tabs (page section) ---------- */
const phaseTabs = document.querySelectorAll('.phase-tab');
const phasePanels = document.querySelectorAll('.phase-panel');
phaseTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const phase = tab.dataset.phase;
    phaseTabs.forEach(t => t.classList.toggle('is-active', t === tab));
    phasePanels.forEach(p => p.classList.toggle('is-active', p.dataset.phase === phase));
    if (phase === '1') setTimeout(runPhase1ScanAnim, 120);
  });
});
// Phase 1 stays selected by default; the user controls switches via clicks.

/* Phase 1 démarche viz: scan finite + livrable révélé une fois l'analyse terminée */
const phase1ScanCard = document.querySelector('.phase-panel[data-phase="1"] .viz-card--scan');
function runPhase1ScanAnim() {
  if (!phase1ScanCard) return;
  phase1ScanCard.classList.remove('is-running', 'is-done');
  // Force reflow pour relancer proprement l'animation CSS
  void phase1ScanCard.offsetWidth;
  phase1ScanCard.classList.add('is-running');
  // 3 passages × 1.1s = 3.3s, on révèle le livrable juste après
  setTimeout(() => phase1ScanCard.classList.add('is-done'), 3400);
}
// Premier déclenchement quand la section démarche entre dans le viewport
const demarcheSection = document.getElementById('demarche');
if (demarcheSection && phase1ScanCard) {
  const demarcheIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runPhase1ScanAnim();
        demarcheIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });
  demarcheIO.observe(demarcheSection);
}

/* ---------- 5. Smooth scroll ---------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const targetId = a.getAttribute('href').slice(1);
    if (!targetId) return;
    const el = document.getElementById(targetId);
    if (!el) return;
    e.preventDefault();
    const navH = document.querySelector('.nav').offsetHeight;
    window.scrollTo({
      top: el.getBoundingClientRect().top + window.pageYOffset - navH - 10,
      behavior: 'smooth'
    });
  });
});

/* =====================================================
   UPBEAT MUSIC SYNTH · Web Audio
   60 s driving track — 128 BPM, four-on-the-floor kick,
   uplifting i-VI-III-VII progression, plucky bass,
   bright pluck arpeggio + lead melody.
   ===================================================== */
class AmbientMusic {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.scheduled = false;
    this.muted = false;
    this.buffer = null;     // piste entière pré-calculée (rendu hors-ligne)
    this.rendering = null;  // promesse de rendu en cours
    this.source = null;     // noeud de lecture du buffer courant
  }
  // Calcule toute la piste une seule fois via OfflineAudioContext — évite de
  // synthétiser ~1500 notes en temps réel pendant la lecture (source du son
  // haché/coupé). La lecture réelle ne fait ensuite que streamer ce buffer.
  renderBuffer() {
    if (this.buffer) return Promise.resolve(this.buffer);
    if (this.rendering) return this.rendering;
    const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!OAC) return Promise.resolve(null);
    const offlineCtx = new OAC(2, Math.ceil(44100 * (TOTAL + 1)), 44100);
    const offlineMaster = offlineCtx.createGain();
    offlineMaster.gain.value = 0.22;
    const comp = offlineCtx.createDynamicsCompressor();
    comp.threshold.value = -14;
    comp.knee.value = 8;
    comp.ratio.value = 5;
    comp.attack.value = 0.003;
    comp.release.value = 0.18;
    offlineMaster.connect(comp).connect(offlineCtx.destination);

    // Bascule temporairement le graphe des voix vers le contexte hors-ligne
    const prevCtx = this.ctx, prevMaster = this.master;
    this.ctx = offlineCtx;
    this.master = offlineMaster;
    this.scheduleTrack(0.05);
    this.ctx = prevCtx;
    this.master = prevMaster;

    this.rendering = offlineCtx.startRendering().then((buf) => {
      this.buffer = buf;
      this.rendering = null;
      return buf;
    }).catch(() => { this.rendering = null; return null; });
    return this.rendering;
  }
  ensureLiveContext() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.22;
    this.master.connect(this.ctx.destination);
  }
  async start() {
    this.ensureLiveContext();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();
    if (this.scheduled) return;
    this.scheduled = true;
    const buf = await this.renderBuffer();
    if (!buf || !this.ctx) return;
    this.source = this.ctx.createBufferSource();
    this.source.buffer = buf;
    this.source.connect(this.master);
    this.source.start(this.ctx.currentTime + 0.02);
  }
  pause() { if (this.ctx) this.ctx.suspend(); }
  resume() { if (this.ctx) this.ctx.resume(); }
  reset() {
    if (this.source) { try { this.source.stop(); } catch(e) {} this.source = null; }
    if (this.ctx) {
      try { this.ctx.close(); } catch(e) {}
      this.ctx = null;
      this.scheduled = false;
    }
  }
  setMuted(m) {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.22;
  }
  scheduleTrack(t0) {
    // 128 BPM → beat = 0.469s, 4 beats = 1.875s, 32 measures ≈ 60s
    const beat = 60 / 128;
    // Am – F – C – G (i – VI – III – VII)
    const chords = [
      [220.00, 261.63, 329.63],  // Am: A3, C4, E4
      [174.61, 220.00, 261.63],  // F:  F3, A3, C4
      [196.00, 246.94, 293.66],  // C:  G3, B3, D4 (Cmaj7 voicing)
      [196.00, 246.94, 293.66]   // G:  G3, B3, D4
    ];
    const bassNotes = [55, 43.65, 65.41, 49];   // A1, F1, C2, G1
    const arpPatterns = [
      [0, 2, 1, 2],
      [0, 2, 1, 2],
      [0, 2, 1, 2],
      [0, 2, 1, 2]
    ];
    const measures = 32;          // 32 × 4 × 0.469 ≈ 60s — covers the full video
    const dropStart = 2;          // beat kicks in
    const finalSwell = 30;        // last 2 measures = big swell + bell

    for (let m = 0; m < measures; m++) {
      const ms = t0 + m * 4 * beat;
      const c = chords[m % 4];
      const bass = bassNotes[m % 4];
      const intro = m < dropStart;
      const drop  = m >= dropStart && m < measures;

      // Pad — sustained whole measure (always present)
      this.padChord(ms, 4 * beat, c, intro ? 0.04 : 0.05);

      // Kick four-on-the-floor — runs the entire drop right to the end
      if (drop) {
        for (let b = 0; b < 4; b++) this.kick(ms + b * beat);
      }
      // Lead-in tom roll into the drop
      if (m === dropStart - 1) {
        for (let n = 0; n < 8; n++) this.kick(ms + 3 * beat + n * (beat / 8), 0.45);
      }

      // Clap on 2 and 4 — runs the entire drop
      if (drop) {
        this.clap(ms + 1 * beat);
        this.clap(ms + 3 * beat);
      }

      // Hi-hat 8ths — runs the entire drop
      if (drop) {
        for (let n = 0; n < 8; n++) {
          this.hihat(ms + n * (beat / 2), n % 2 === 0 ? 0.014 : 0.020);
        }
      }

      // Plucky bass on every beat — runs the entire drop
      if (drop) {
        for (let b = 0; b < 4; b++) {
          const f = (b === 2) ? bass * 2 : bass;
          this.bassPluck(ms + b * beat, f, beat * 0.55);
        }
      }

      // Pluck arpeggio (16ths) — runs the entire drop, gives the moving texture
      if (m >= 4) {
        const pat = arpPatterns[m % 4];
        for (let s = 0; s < 16; s++) {
          const noteIdx = pat[s % pat.length];
          const freq = c[noteIdx] * 2;
          this.pluck(ms + s * (beat / 4), freq, beat * 0.22, 0.045);
        }
      }

      // Lead melody from measure 10 to the end
      if (m >= 10) {
        const melodyByChord = [
          [c[2] * 2, c[1] * 2, c[2] * 2, c[0] * 2],
          [c[1] * 2, c[2] * 2, c[1] * 2, c[0] * 2],
          [c[2] * 2, c[1] * 2, c[0] * 2, c[1] * 2],
          [c[2] * 2, c[0] * 2, c[1] * 2, c[2] * 2]
        ];
        const melody = melodyByChord[m % 4];
        melody.forEach((freq, i) => {
          this.leadNote(ms + i * beat, freq, beat * 0.85, 0.055);
        });
      }

      // Bell sparkle on bar 1 of each 4-bar phrase
      if (m >= 4 && m % 4 === 0) this.bellPing(ms, c[0] * 4);

      // Riser / sweep into the drop at the lead-in measure
      if (m === dropStart - 1) this.riser(ms, 4 * beat);

      // Final swell: extra pad + bell on the last 2 measures
      if (m === finalSwell) {
        this.padChord(ms, 8 * beat, c, 0.07);
        this.bellPing(ms, c[0] * 4);
      }
    }
  }

  // === voices ===
  kick(time, vel = 1) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.10);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.85 * vel, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.22);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + 0.25);
    // tiny click for punch
    const click = this.ctx.createOscillator();
    const cg = this.ctx.createGain();
    click.type = 'square';
    click.frequency.value = 1500;
    cg.gain.setValueAtTime(0.12 * vel, time);
    cg.gain.exponentialRampToValueAtTime(0.001, time + 0.012);
    click.connect(cg).connect(this.master);
    click.start(time); click.stop(time + 0.02);
  }
  clap(time) {
    if (!this.ctx) return;
    // 3 quick noise bursts for a clap-ish sound
    [0, 0.012, 0.024].forEach((d, i) => {
      const n = this.ctx.createBufferSource();
      const f = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      const buf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.06), this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let j = 0; j < data.length; j++) data[j] = Math.random() * 2 - 1;
      n.buffer = buf;
      f.type = 'bandpass';
      f.frequency.value = 1800;
      f.Q.value = 0.9;
      g.gain.setValueAtTime(0, time + d);
      g.gain.linearRampToValueAtTime(i === 2 ? 0.08 : 0.05, time + d + 0.001);
      g.gain.exponentialRampToValueAtTime(0.001, time + d + 0.08);
      n.connect(f).connect(g).connect(this.master);
      n.start(time + d); n.stop(time + d + 0.08);
    });
  }
  hihat(time, vel = 0.018) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const bufSize = Math.floor(this.ctx.sampleRate * 0.04);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = buf;
    filter.type = 'highpass';
    filter.frequency.value = 7500;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.001);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.045);
    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(time);
    noise.stop(time + 0.05);
  }
  bassPluck(time, freq, duration) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const sub = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'sawtooth'; osc.frequency.value = freq * 2;
    sub.type = 'sine';     sub.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(900, time);
    filter.frequency.exponentialRampToValueAtTime(220, time + duration);
    filter.Q.value = 4;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.18, time + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(filter); sub.connect(filter); filter.connect(gain).connect(this.master);
    osc.start(time); sub.start(time);
    osc.stop(time + duration + 0.05); sub.stop(time + duration + 0.05);
  }
  pluck(time, freq, duration, vel = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3200, time);
    filter.frequency.exponentialRampToValueAtTime(900, time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  }
  padChord(time, duration, freqs, peakGain = 0.05) {
    if (!this.ctx) return;
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(peakGain, time + 0.6);
      gain.gain.setValueAtTime(peakGain, time + Math.max(0.6, duration - 0.4));
      gain.gain.linearRampToValueAtTime(0, time + duration);
      osc.connect(filter).connect(gain).connect(this.master);
      osc.start(time);
      osc.stop(time + duration + 0.05);
    });
  }
  bellPing(time, freq) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.09, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);
    osc.connect(gain).connect(this.master);
    osc.start(time);
    osc.stop(time + 1.45);
  }
  leadNote(time, freq, duration, vel = 0.05) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const detune = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = freq;
    detune.type = 'sawtooth'; detune.frequency.value = freq * 1.005;
    filter.type = 'lowpass';
    filter.frequency.value = 2800;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vel, time + 0.05);
    gain.gain.setValueAtTime(vel, time + duration - 0.12);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    osc.connect(filter); detune.connect(filter);
    filter.connect(gain).connect(this.master);
    osc.start(time); detune.start(time);
    osc.stop(time + duration + 0.05); detune.stop(time + duration + 0.05);
  }
  riser(time, duration) {
    if (!this.ctx) return;
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();
    const bufSize = Math.floor(this.ctx.sampleRate * duration);
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = (Math.random() * 2 - 1) * 0.6;
    noise.buffer = buf;
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(400, time);
    filter.frequency.exponentialRampToValueAtTime(6000, time + duration);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.10, time + duration * 0.7);
    gain.gain.linearRampToValueAtTime(0, time + duration);
    noise.connect(filter).connect(gain).connect(this.master);
    noise.start(time);
    noise.stop(time + duration + 0.05);
  }
}
const music = new AmbientMusic();
// Pré-calcule la piste pendant que le navigateur est inactif (pas au chargement
// direct) pour ne pas bloquer le thread principal juste après l'arrivée de la page.
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => music.renderBuffer(), { timeout: 4000 });
} else {
  setTimeout(() => music.renderBuffer(), 1500);
}

/* =====================================================
   DEMO VIDEO PLAYER · EXPLANATORY VERSION
   ===================================================== */

// 7 scenes — 60 s total
const SCENES = [
  { id: 1, start: 0,  end: 4  },   // Intro (4s)
  { id: 2, start: 4,  end: 9  },   // Context (5s)
  { id: 3, start: 9,  end: 23 },   // Phase 1 — Ingestion + Conformity (14s)
  { id: 4, start: 23, end: 37 },   // Phase 2 — Classification (non-sequential) + Pattern (14s)
  { id: 5, start: 37, end: 51 },   // Phase 3 — Plan d'actions + Roadmap 6-12-18 (14s)
  { id: 6, start: 51, end: 56 },   // Résultats chez nos clients (5s)
  { id: 7, start: 56, end: 60 }    // Outro (4s)
];
const TOTAL = 60;

const scenes = document.querySelectorAll('.scene');
const overlay = document.getElementById('playerOverlay');
const playBtn = document.getElementById('playBtn');
const ctrlPlay = document.getElementById('ctrlPlay');
const ctrlReplay = document.getElementById('ctrlReplay');
const ctrlMute = document.getElementById('ctrlMute');
const progressBar = document.getElementById('progressBar');
const progress = document.getElementById('progress');
const curTimeEl = document.getElementById('curTime');
const totTimeEl = document.getElementById('totTime');
const chapterLabels = document.querySelectorAll('.player__chapter-labels span');
const chapterJumps = document.querySelectorAll('.player__chapters span');
const fadeEl = document.getElementById('sceneWipe');
const stepperEl = document.getElementById('stepper');
const stepEls = stepperEl ? stepperEl.querySelectorAll('.step') : [];
const appMock = document.getElementById('appMock');
const appViewport = document.getElementById('appViewport');
const appViews = document.querySelectorAll('.app-view');
const appNavItems = document.querySelectorAll('.app-nav__item');

let playerTime = 0;
let playerPlaying = false;
let playerRAF = null;
let lastTick = 0;
let currentSceneId = 1;

function fmt(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2,'0')}`;
}
function sceneForTime(t) {
  let active = SCENES[0];
  for (const s of SCENES) {
    if (t >= s.start && t < s.end) { active = s; break; }
  }
  if (t >= TOTAL) active = SCENES[SCENES.length - 1];
  return active;
}

/* === MAP scene id to phase step (0 = no step) === */
function stepForScene(id) {
  if (id === 3) return 1;
  if (id === 4) return 2;
  if (id === 5) return 3;
  return 0;
}

function activateScene(id) {
  scenes.forEach(el => el.classList.toggle('is-active', parseInt(el.dataset.scene, 10) === id));
  chapterLabels.forEach((el, i) => el.classList.toggle('is-active', i === id - 1));

  // Stepper visibility on phase scenes only
  const stepIdx = stepForScene(id);
  if (stepperEl) stepperEl.classList.toggle('is-visible', stepIdx > 0);
  stepEls.forEach(el => {
    const n = parseInt(el.dataset.step, 10);
    el.classList.toggle('is-active', n === stepIdx);
    el.classList.toggle('is-done', n < stepIdx);
  });

  // App mock visibility & viewport slide
  if (appMock) {
    appMock.classList.toggle('is-visible', stepIdx > 0);
    appViews.forEach(v => v.classList.toggle('is-active', parseInt(v.dataset.view, 10) === stepIdx));
    if (appViewport) {
      appViewport.classList.remove('to-1', 'to-2', 'to-3');
      if (stepIdx >= 1) appViewport.classList.add('to-' + stepIdx);
    }
    appNavItems.forEach(n => {
      const m = parseInt(n.dataset.appStep, 10);
      n.classList.toggle('is-active', m === stepIdx);
      n.classList.toggle('is-done', m < stepIdx);
    });
  }

  onSceneEnter(id);
}

function transitionTo(id) {
  if (id === currentSceneId) return;
  const fromPhase = stepForScene(currentSceneId) > 0;
  const toPhase = stepForScene(id) > 0;
  // For phase-to-phase transitions, no fade overlay — let the viewport slide do the work
  if (fromPhase && toPhase) {
    activateScene(id);
    currentSceneId = id;
    return;
  }
  // Otherwise use the soft fade overlay (intro↔context↔phase1, phase3↔benefits↔outro)
  fadeEl.classList.add('is-playing');
  setTimeout(() => {
    activateScene(id);
    setTimeout(() => fadeEl.classList.remove('is-playing'), 280);
  }, 240);
  currentSceneId = id;
}

function tick(now) {
  if (!playerPlaying) return;
  if (!lastTick) lastTick = now;
  const dt = (now - lastTick) / 1000;
  lastTick = now;
  playerTime += dt;
  if (playerTime >= TOTAL) {
    playerTime = TOTAL;
    pauseVideo();
  }
  updateUI();
  if (playerPlaying) playerRAF = requestAnimationFrame(tick);
}
function updateUI() {
  progressBar.style.width = (playerTime / TOTAL * 100) + '%';
  curTimeEl.textContent = fmt(playerTime);
  const s = sceneForTime(playerTime);
  if (s.id !== currentSceneId) transitionTo(s.id);
}
function playVideo() {
  if (playerTime >= TOTAL) {
    playerTime = 0;
    currentSceneId = 0;
  }
  playerPlaying = true;
  lastTick = 0;
  ctrlPlay.textContent = '❚❚';
  overlay.classList.add('is-hidden');
  if (currentSceneId === 0) {
    currentSceneId = 1;
    activateScene(1);
  }
  // Music: start if first time, otherwise resume
  if (music.scheduled) music.resume(); else music.start();
  playerRAF = requestAnimationFrame(tick);
}
function pauseVideo() {
  playerPlaying = false;
  ctrlPlay.textContent = '▶';
  if (playerRAF) cancelAnimationFrame(playerRAF);
  music.pause();
}

playBtn.addEventListener('click', playVideo);
ctrlPlay.addEventListener('click', () => playerPlaying ? pauseVideo() : playVideo());
ctrlReplay.addEventListener('click', () => {
  playerTime = 0;
  currentSceneId = 0;
  music.reset(); // restart music from beginning
  updateUI();
  activateScene(1);
  currentSceneId = 1;
  playVideo();
});
ctrlMute.addEventListener('click', () => {
  const newMuted = !music.muted;
  music.setMuted(newMuted);
  ctrlMute.textContent = newMuted ? '🔇' : '🔊';
});

progress.addEventListener('click', (e) => {
  const rect = progress.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  playerTime = ratio * TOTAL;
  updateUI();
});
chapterJumps.forEach(seg => {
  seg.style.pointerEvents = 'auto';
  seg.addEventListener('click', (e) => {
    e.stopPropagation();
    const idx = parseInt(seg.dataset.jump, 10) - 1;
    const s = SCENES[idx];
    if (s) {
      playerTime = s.start;
      updateUI();
      if (!playerPlaying) playVideo();
    }
  });
});
totTimeEl.textContent = fmt(TOTAL);
curTimeEl.textContent = fmt(0);
updateUI();

/* =====================================================
   PER-SCENE EFFECTS — animated phases
   ===================================================== */
let p1Timers = [];
let p2Timers = [];
let p3Timers = [];

function clearTimers(arr) {
  arr.forEach(t => clearTimeout(t));
  arr.length = 0;
}

function onSceneEnter(id) {
  // cancel any prior scene's timers
  clearTimers(p1Timers);
  clearTimers(p2Timers);
  clearTimers(p3Timers);

  if (id === 3) runPhase1Ingestion();
  if (id === 4) runPhase2Classification();
  if (id === 5) runPhase3Plan();
}

/* numeric helper */
function animNum(el, target, duration = 1200, pfx = '', suf = '') {
  const start = performance.now();
  const isNeg = target < 0;
  const abs = Math.abs(target);
  function step(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(abs * eased);
    el.textContent = (isNeg ? '−' : pfx) + val + suf;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* =====================================================
   PHASE 1 · INGESTION
   Documents fly from "sources" to AI engine, then extracted
   data chips appear in the output panel. Counters animate.
   ===================================================== */
const ING_DOCS = [
  { label: 'PPAP',             dy: -80 },
  { label: 'FMEA',             dy: -25 },
  { label: '8D · Audits',      dy:  25 },
  { label: 'Données process',  dy:  80, isDb: true }
];
// First 3 are the "detailed" examples shown clearly; rest cascade fast to suggest depth
const ING_OUT_CHIPS = [
  '14 modes critiques',
  'TRS moyen 68%',
  '23 questions générées',
  '32 entretiens planifiés',
  '6 lignes critiques',
  '4 fournisseurs à risque',
  '12 PPAP incomplets',
  '8 NCR récurrents',
  '5 dérives MTBF'
];

function runPhase1Ingestion() {
  const flow = document.getElementById('ingFlow');
  const out = document.getElementById('ingOutput');
  const docsEl = document.getElementById('ingDocs');
  const stage = document.querySelector('.app-view--p1 .ing-stage');
  if (!flow || !out || !stage) return;

  flow.innerHTML = '';
  out.innerHTML = '';
  if (docsEl) docsEl.textContent = '0';

  // Reset AI levers
  const gaugeFill = document.getElementById('confGaugeFill');
  const gaugeVal = document.getElementById('confGaugeVal');
  if (gaugeFill) {
    gaugeFill.style.transition = 'none';
    gaugeFill.style.width = '0%';
  }
  if (gaugeVal) gaugeVal.textContent = '0%';

  // Phase 1 window: 15s.
  // - 0–9.5s: 4 docs fly to engine (1.9s pace - more breathing), each emits 1 chip, counter ticks up
  // - 0–11s: Conformity IATF gauge progressively fills from 0% → 84%
  // - 11–14s: AI levers panel highlights (CSS-driven)
  const stageRect = stage.getBoundingClientRect();
  const targetX = stageRect.width * 0.42;
  const docs = ING_DOCS;

  docs.forEach((doc, i) => {
    const t = setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'fly-doc is-flying';
      el.textContent = doc.label;
      el.style.left = '13%';
      el.style.top = '50%';
      el.style.transform = 'translateY(-50%)';
      el.style.setProperty('--mx', targetX + 'px');
      el.style.setProperty('--my', (doc.dy * 0.35) + 'px');
      flow.appendChild(el);
      setTimeout(() => el.remove(), 1500);

      // After doc reaches engine (mid-flight), output chip pops (first 3 detailed)
      const chipDelay = setTimeout(() => {
        const chipText = ING_OUT_CHIPS[i];
        if (chipText) {
          const c1 = document.createElement('span');
          c1.className = 'out-chip';
          c1.textContent = chipText;
          out.appendChild(c1);
        }
      }, 950);
      p1Timers.push(chipDelay);
    }, 500 + i * 1900);
    p1Timers.push(t);
  });

  // After the first 3-4 detailed chips, cascade more chips quickly to suggest depth
  const cascadeStart = 500 + ING_DOCS.length * 1900 + 700;
  ING_OUT_CHIPS.slice(ING_DOCS.length).forEach((chipText, i) => {
    p1Timers.push(setTimeout(() => {
      const c = document.createElement('span');
      c.className = 'out-chip out-chip--cascade';
      c.textContent = chipText;
      out.appendChild(c);
    }, cascadeStart + i * 360));
  });

  // Counter
  p1Timers.push(setTimeout(() => animNum(docsEl, 248, 9500), 600));

  // Conformity gauge — fills from 0 → 84% over 10.5s
  if (gaugeFill && gaugeVal) {
    p1Timers.push(setTimeout(() => {
      gaugeFill.style.transition = 'width 10.5s cubic-bezier(.2,.7,.2,1)';
      gaugeFill.style.width = '84%';
      animNum(gaugeVal, 84, 10500, '', '%');
    }, 600));
  }

}

/* =====================================================
   PHASE 2 · VERBATIM CLASSIFICATION + PATTERN
   Verbatim chips appear in left pool then fly along curved
   path into the matching bucket on the right. Counter pops.
   ===================================================== */
// AI sentiment analysis: each verbatim has an emotional tone detected by IA
// 'crit' = critical (red dot), 'warn' = warning (orange dot), 'neutral' = info (grey dot)
const CLS_VERBATIMS = [
  { t: 'On apprend la presse 4 sur le tas',         cat: 'Formation',   sent: 'crit' },
  { t: 'SOP poste 3 pas affiché',                   cat: 'Standards',   sent: 'warn' },
  { t: 'Maintenance préventive non faite',          cat: 'Maintenance', sent: 'crit' },
  { t: 'Pas de visibilité sur la perf live',        cat: 'Pilotage',    sent: 'warn' },
  { t: 'Pas de polyvalence sur ligne 2',            cat: 'Formation',   sent: 'warn' },
  { t: 'Procédure démarrage obsolète',              cat: 'Standards',   sent: 'crit' },
  { t: 'Casse roulement presse 2 récurrente',       cat: 'Maintenance', sent: 'crit' },
  { t: 'Indicateurs revus une fois / semaine',      cat: 'Pilotage',    sent: 'warn' },
  { t: 'Onboarding 3 jours seulement',              cat: 'Formation',   sent: 'warn' },
  { t: 'Pas de One-Point-Lesson en ligne',          cat: 'Standards',   sent: 'warn' },
  { t: 'Pièces de rechange en rupture',             cat: 'Maintenance', sent: 'crit' },
  { t: 'AIC matin non tenu',                        cat: 'Pilotage',    sent: 'warn' }
];

function runPhase2Classification() {
  const pool = document.getElementById('clsPool');
  const fly = document.getElementById('clsFly');
  const buckets = document.querySelectorAll('#clsBuckets .bucket');
  if (!pool || !fly) return;
  pool.innerHTML = '';
  fly.innerHTML = '';
  buckets.forEach(b => {
    b.querySelector('.bucket__count').textContent = '0';
    b.querySelector('.bucket__count').dataset.count = '0';
    b.querySelector('.bucket__bar i').style.width = '0%';
  });

  // Phase 2 window: 16s.
  // - 0-1.8s: pre-populate pool with first 5 verbatims (staggered)
  // - 2-6.5s: 3 detailed flights to buckets in non-sequential order
  // - 6.5-13s: continuous cascade — new verbatims appear in pool & fly fast,
  //          counters tick up to suggest hundreds processed
  const subset = CLS_VERBATIMS;

  // Pre-fill first 5 verbatims at staggered intervals
  subset.slice(0, 5).forEach((v, i) => {
    p2Timers.push(setTimeout(() => addPoolChip(v), 250 + i * 320));
  });

  // 3 DETAILED flights to buckets — non-sequential to show AI sorts intelligently
  const detailedFlights = [
    { idx: 2, at: 2200 }, // Maintenance first
    { idx: 0, at: 3600 }, // Formation second
    { idx: 3, at: 5000 }  // Pilotage third
  ];

  detailedFlights.forEach(f => {
    p2Timers.push(setTimeout(() => {
      const chip = pool.querySelector(`.pool-chip[data-vid="${f.idx}"]`);
      if (chip) flyChipToBucket(chip, subset[f.idx]);
    }, f.at));
  });

  // CASCADE phase — from ~6.4s onward, fire many verbatims fast (no detailed flight)
  const cascadeStart = 6400;
  const cascadeIndexes = [1, 4, 5, 6, 7, 8, 9, 10, 11];
  cascadeIndexes.forEach((vid, i) => {
    p2Timers.push(setTimeout(() => {
      // make sure the chip is in the pool first
      if (!pool.querySelector(`.pool-chip[data-vid="${vid}"]`)) addPoolChip(subset[vid]);
      const chip = pool.querySelector(`.pool-chip[data-vid="${vid}"]`);
      if (chip) flyChipToBucket(chip, subset[vid], { fast: true });
    }, cascadeStart + i * 460));
  });

  // Counter overshoot: after the visible chips, tick buckets up further to suggest
  // ~80 verbatims sorted across 4 categories (out of 312 total)
  const overshootStart = cascadeStart + cascadeIndexes.length * 460 + 200;
  const targets = { Formation: 23, Standards: 21, Maintenance: 17, Pilotage: 14 };
  Object.entries(targets).forEach(([cat, finalN]) => {
    p2Timers.push(setTimeout(() => {
      const bucket = document.querySelector(`#clsBuckets .bucket[data-cat="${cat}"]`);
      if (!bucket) return;
      const cEl = bucket.querySelector('.bucket__count');
      const cur = parseInt(cEl.dataset.count, 10);
      animNum(cEl, finalN, 1200);
      cEl.dataset.count = finalN;
      bucket.querySelector('.bucket__bar i').style.width = '100%';
    }, overshootStart));
  });

}

// Helper: render a chip into the pool with sentiment dot
function addPoolChip(v) {
  const pool = document.getElementById('clsPool');
  if (!pool) return;
  const idx = CLS_VERBATIMS.indexOf(v);
  const chip = document.createElement('div');
  chip.className = 'pool-chip pool-chip--enter';
  chip.dataset.cat = v.cat;
  chip.dataset.sent = v.sent;
  chip.dataset.vid = idx;
  chip.innerHTML = `<span class="pool-chip__sent sent-${v.sent}"></span>« ${v.t} »`;
  pool.appendChild(chip);
  // Cap pool height visually
  while (pool.children.length > 5) pool.firstElementChild.remove();
  requestAnimationFrame(() => chip.classList.remove('pool-chip--enter'));
}

function flyChipToBucket(srcChip, verbatim, opts = {}) {
  const fly = document.getElementById('clsFly');
  const stage = document.querySelector('.cls-stage');
  if (!fly || !stage || !srcChip || !srcChip.parentElement) return;
  const fast = !!opts.fast;
  const moveDur = fast ? 380 : 800;

  // Get source rect relative to fly layer
  const stageRect = stage.getBoundingClientRect();
  const srcRect = srcChip.getBoundingClientRect();
  const bucket = document.querySelector(`#clsBuckets .bucket[data-cat="${verbatim.cat}"]`);
  if (!bucket) return;
  const bRect = bucket.getBoundingClientRect();

  const startX = srcRect.left - stageRect.left + 8;
  const startY = srcRect.top - stageRect.top + 4;
  const endX = bRect.left - stageRect.left + bRect.width / 2 - 30;
  const endY = bRect.top - stageRect.top + bRect.height / 2 - 8;

  // Mark source leaving
  srcChip.classList.add('is-leaving');
  setTimeout(() => { if (srcChip.parentElement) srcChip.remove(); }, fast ? 180 : 350);

  // Create flying chip
  const el = document.createElement('div');
  el.className = 'fly-chip fly-chip--sent-' + (verbatim.sent || 'neutral') + (fast ? ' fly-chip--fast' : '');
  el.innerHTML = `<span class="pool-chip__sent sent-${verbatim.sent || 'neutral'}"></span>${verbatim.t.slice(0, 40)}`;
  el.style.left = startX + 'px';
  el.style.top = startY + 'px';
  const ease = fast ? '.4,0,.2,1' : '.5,0,.2,1';
  el.style.transition = `left ${moveDur}ms cubic-bezier(${ease}), top ${moveDur}ms cubic-bezier(${ease}), opacity .25s ease, transform .25s ease`;
  fly.appendChild(el);

  // Force layout, then move
  requestAnimationFrame(() => {
    el.style.left = endX + 'px';
    el.style.top = endY + 'px';
  });

  // When chip lands: increment bucket counter + flash + remove flying chip
  setTimeout(() => {
    const c = bucket.querySelector('.bucket__count');
    const cur = parseInt(c.dataset.count, 10) + 1;
    c.dataset.count = cur;
    c.textContent = cur;
    if (!fast) {
      bucket.classList.add('is-flash');
      setTimeout(() => bucket.classList.remove('is-flash'), 320);
    }
    const pct = Math.min(100, cur * 18);
    bucket.querySelector('.bucket__bar i').style.width = pct + '%';

    // Remove flying chip with fade
    el.style.opacity = '0';
    el.style.transform = 'scale(.6)';
    setTimeout(() => el.remove(), fast ? 200 : 280);
  }, moveDur);
}

/* =====================================================
   PHASE 3 · PLAN D'ACTIONS PRIORISÉ
   - 7 cards pulled one-by-one from pool → land in ICE matrix
   - As they land, business case numbers animate
   - Roadmap timeline fills in based on priority order
   ===================================================== */
// Each action carries an AI-simulated gain (pts TRS) and risk score.
// First 3 are placed in detail; the rest cascade fast to suggest a deep plan.
const PLAN_ACTIONS = [
  { name: 'Std. formation',     ice: { x: 78, y: 20 }, rm: { pos: 8,  lvl: 1 }, quick: true,  priority: 1, gain: '+3.2', risk: 'low'  },
  { name: '5S pilotes',         ice: { x: 65, y: 32 }, rm: { pos: 22, lvl: 2 }, quick: true,  priority: 2, gain: '+2.1', risk: 'low'  },
  { name: 'SMED presse 4',      ice: { x: 48, y: 50 }, rm: { pos: 40, lvl: 1 }, quick: false, priority: 3, gain: '+2.4', risk: 'med'  },
  { name: 'TPM préventive',     ice: { x: 28, y: 72 }, rm: { pos: 70, lvl: 2 }, quick: false, priority: 4, gain: '+2.0', risk: 'med'  },
  { name: 'AIC matin',          ice: { x: 72, y: 28 }, rm: { pos: 14, lvl: 1 }, quick: true,  priority: 5, gain: '+1.4', risk: 'low'  },
  { name: 'OPL polyvalence',    ice: { x: 58, y: 42 }, rm: { pos: 38, lvl: 2 }, quick: false, priority: 6, gain: '+1.8', risk: 'low'  },
  { name: 'MES temps réel',     ice: { x: 22, y: 80 }, rm: { pos: 72, lvl: 1 }, quick: false, priority: 7, gain: '+2.6', risk: 'high' },
  { name: 'S&OP cadence',       ice: { x: 38, y: 60 }, rm: { pos: 50, lvl: 2 }, quick: false, priority: 8, gain: '+1.5', risk: 'med'  },
  { name: 'Mgt visuel ligne',   ice: { x: 68, y: 36 }, rm: { pos: 18, lvl: 1 }, quick: true,  priority: 9, gain: '+0.9', risk: 'low'  },
  { name: 'TRS auto-relevé',    ice: { x: 30, y: 65 }, rm: { pos: 80, lvl: 2 }, quick: false, priority: 10,gain: '+1.2', risk: 'med'  }
];

function runPhase3Plan() {
  const stack = document.getElementById('planStack');
  const ice = document.getElementById('planIce');
  const rmCards = document.getElementById('planRmCards');
  if (!stack || !ice || !rmCards) return;

  // Clean state
  stack.innerHTML = '';
  // Clean previously placed
  ice.querySelectorAll('.ice-placed').forEach(n => n.remove());
  rmCards.querySelectorAll('.road-seg__dots').forEach(d => { d.innerHTML = ''; });
  rmCards.querySelectorAll('.road-seg').forEach(s => s.classList.remove('is-flash'));

  // Populate pool with all actions
  PLAN_ACTIONS.forEach(a => {
    const card = document.createElement('div');
    card.className = 'plan-card';
    card.textContent = a.name;
    card.dataset.pri = a.priority;
    stack.appendChild(card);
  });

  // Phase 3 window: 15s.
  // 0-5.5s: 3 actions placed in detail (1.6s pace) — user sees the AI's reasoning
  // 5.5-10s: remaining actions cascade fast (every ~560ms) — depth of plan
  // 10-15s: business case fills, roadmap 6-12-18 mois complète.
  const DETAILED = 3;
  const detailedActions = PLAN_ACTIONS.slice(0, DETAILED);
  const cascadeActions = PLAN_ACTIONS.slice(DETAILED);

  detailedActions.forEach((a, i) => {
    const t = setTimeout(() => placeAction(a, stack, ice, rmCards, false), 500 + i * 1600);
    p3Timers.push(t);
  });

  const cascadeStart = 500 + DETAILED * 1600 + 500;
  cascadeActions.forEach((a, i) => {
    const t = setTimeout(() => placeAction(a, stack, ice, rmCards, true), cascadeStart + i * 560);
    p3Timers.push(t);
  });

  // Business case numbers — start once cascade is done
  const bcStart = cascadeStart + cascadeActions.length * 560 + 200;
  document.querySelectorAll('.app-view--p3 .bc-num').forEach((el, i) => {
    const tgt = parseInt(el.dataset.tgt, 10);
    const pfx = el.dataset.pfx || '';
    const suf = el.dataset.suf || '';
    p3Timers.push(setTimeout(() => animNum(el, tgt, 1400, pfx, suf), bcStart + i * 100));
  });

}

function placeAction(a, stack, ice, rmCards, fast) {
  const src = stack.children[0];
  if (src) {
    src.classList.add('is-leaving');
    setTimeout(() => { if (src.parentElement) src.remove(); }, fast ? 160 : 280);
  }

  const placed = document.createElement('span');
  placed.className = 'ice-placed' + (a.quick ? ' is-quickwin' : '') + ' risk-' + a.risk + (fast ? ' is-fast' : '');
  placed.innerHTML = `<span class="pn">${a.priority}</span>${a.name}<span class="gain">${a.gain}pts</span>`;
  placed.style.left = a.ice.x + '%';
  placed.style.top = a.ice.y + '%';
  ice.appendChild(placed);
  requestAnimationFrame(() => placed.classList.add('is-visible'));

  // Roadmap — l'action atterrit dans son segment 0-6 / 6-12 / 12-18 mois
  const segIdx = a.rm.pos < 33 ? 1 : (a.rm.pos < 66 ? 2 : 3);
  const seg = rmCards.querySelector(`.road-seg[data-seg="${segIdx}"]`);
  if (seg) {
    const rmDot = document.createElement('span');
    rmDot.className = 'road-seg__dot' + (a.quick ? ' is-quickwin' : '');
    rmDot.title = a.name + ' · ' + a.gain + 'pts';
    seg.querySelector('.road-seg__dots').appendChild(rmDot);
    requestAnimationFrame(() => rmDot.classList.add('is-visible'));
    if (!fast) {
      seg.classList.add('is-flash');
      setTimeout(() => seg.classList.remove('is-flash'), 380);
    }
  }
}

/* Init: scene 1 visible at load (no auto-play) */
const demoSection = document.getElementById('demo');
const demoIO = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && playerTime === 0 && !playerPlaying) {
      activateScene(1);
      currentSceneId = 1;
    }
  });
}, { threshold: 0.4 });
demoIO.observe(demoSection);
