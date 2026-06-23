// Elegant Procedural Web Audio Synthesizer for Wild West frontier atmosphere
// Generates fully live, zero-asset looping music synthesized straight from oscillator blocks.
// Avoids 404/CORS network issues and is extremely responsive.

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private mainGain: GainNode | null = null;
  private isMuted: boolean = true;
  private currentMode: "world" | "town" | "duel" | "combat" | null = null;
  private timerId: any = null;
  private noiseNode: AudioWorkletNode | ScriptProcessorNode | null = null;

  constructor() {
    // Lazy initialize upon first user gesture
  }

  private initCtx() {
    if (this.ctx) return;
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.mainGain = this.ctx.createGain();
      this.mainGain.gain.setValueAtTime(
        this.isMuted ? 0 : 0.15,
        this.ctx.currentTime,
      );
      this.mainGain.connect(this.ctx.destination);
    } catch (e) {
      console.error(
        "Frontier Audio Engine failed to initialize Web Audio API",
        e,
      );
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
    // resume context if suspended
    if (!muted && this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public playMusic(mode: "world" | "town" | "duel" | "combat") {
    this.initCtx();
    if (this.currentMode === mode) return; // Already playing this mood!
    this.stop();
    this.currentMode = mode;

    if (this.ctx && this.ctx.state === "suspended") {
      // browser protection bypass
      this.ctx.resume();
    }

    if (mode === "world") {
      this.startWorldLoop();
    } else if (mode === "town") {
      this.startTownLoop();
    } else if (mode === "duel") {
      this.startDuelLoop();
    } else if (mode === "combat") {
      this.startCombatLoop();
    }
  }

  public stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.currentMode = null;
  }

  // Play a simple revolver click sound
  public playClick() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      120,
      this.ctx.currentTime + 0.05,
    );

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    if (this.mainGain) gain.connect(this.mainGain);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  // Play a quickdraw whip crack & draw sound
  public playWhipDraw() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Low frequency whoosh
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.frequency.setValueAtTime(80, now);
    osc1.frequency.exponentialRampToValueAtTime(450, now + 0.12);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc1.connect(gain1);
    if (this.mainGain) gain1.connect(this.mainGain);
    osc1.start();
    osc1.stop(now + 0.15);

    // High frequency metal ring
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(2400, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(1100, now + 0.25);
    gain2.gain.setValueAtTime(0.18, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc2.connect(gain2);
    if (this.mainGain) gain2.connect(this.mainGain);
    osc2.start();
    osc2.stop(now + 0.3);
  }

  // Play a gunshot sound
  public playGunshot() {
    this.initCtx();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Deep boom
    const boom = this.ctx.createOscillator();
    const boomGain = this.ctx.createGain();
    boom.type = "sawtooth";
    boom.frequency.setValueAtTime(150, now);
    boom.frequency.exponentialRampToValueAtTime(30, now + 0.25);
    boomGain.gain.setValueAtTime(0.6, now);
    boomGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    boom.connect(boomGain);
    if (this.mainGain) boomGain.connect(this.mainGain);
    boom.start();
    boom.stop(now + 0.35);

    // High snap noise simulation
    const snap = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();
    snap.type = "triangle";
    snap.frequency.setValueAtTime(800, now);
    snap.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
    snapGain.gain.setValueAtTime(0.4, now);
    snapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
    snap.connect(snapGain);
    if (this.mainGain) snapGain.connect(this.mainGain);
    snap.start();
    snap.stop(now + 0.1);
  }

  // --- LOOPS IMPLEMENTATION ---

  // 1. WORLD Map: Dusty frontier whistling melody + periodic sparse steel guitar acoustic pluck
  private startWorldLoop() {
    if (!this.ctx) return;
    let step = 0;
    const pluckScale = [110, 165, 196, 220, 330, 440]; // A-minor pentatonic vibes

    const tick = () => {
      if (!this.ctx || this.currentMode !== "world" || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Sparse plucked guitar note (every second tick)
      if (step % 2 === 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "triangle";
        const freq = pluckScale[Math.floor(Math.random() * pluckScale.length)];
        osc.frequency.setValueAtTime(freq, now);
        // decay
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        if (this.mainGain) gain.connect(this.mainGain);
        osc.start();
        osc.stop(now + 1.3);
      }

      // High Whistling wind/melody (every 4 ticks)
      if (step % 4 === 1) {
        const whistle = this.ctx.createOscillator();
        const whistleGain = this.ctx.createGain();
        whistle.type = "sine";
        const baseFreq = 880 + Math.sin(step) * 110; // whistle pitch
        whistle.frequency.setValueAtTime(baseFreq, now);
        whistle.frequency.linearRampToValueAtTime(
          baseFreq + (Math.random() > 0.5 ? 40 : -40),
          now + 1.6,
        );

        whistleGain.gain.setValueAtTime(0.0, now);
        whistleGain.gain.linearRampToValueAtTime(0.04, now + 0.4);
        whistleGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        whistle.connect(whistleGain);
        if (this.mainGain) whistleGain.connect(this.mainGain);
        whistle.start();
        whistle.stop(now + 1.9);
      }

      step++;
    };

    tick();
    this.timerId = setInterval(tick, 1000);
  }

  // 2. TOWN Map: Bouncy saloon ragtime-style piano chords
  private startTownLoop() {
    if (!this.ctx) return;
    let step = 0;
    // Bouncy basic western ragtime chords in C and G
    // C Major (261, 329, 392), F Major (349, 440, 523), G Major (392, 493, 587)
    const chords = [
      [261, 329, 392], // C
      [261, 329, 392], // C
      [392, 493, 587], // G
      [392, 493, 587], // G
      [349, 440, 523], // F
      [349, 440, 523], // F
      [261, 329, 392], // C
      [392, 493, 587], // G combo turn
    ];

    const tick = () => {
      if (!this.ctx || this.currentMode !== "town" || this.isMuted) return;
      const now = this.ctx.currentTime;
      const chordIdx = Math.floor(step / 2) % chords.length;
      const notes = chords[chordIdx];

      // Bass note on odd, chord cluster on even
      if (step % 2 === 0) {
        // Bass Note
        const bassOsc = this.ctx.createOscillator();
        const bassGain = this.ctx.createGain();
        bassOsc.type = "sine";
        bassOsc.frequency.setValueAtTime(notes[0] / 2, now);
        bassGain.gain.setValueAtTime(0.2, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        bassOsc.connect(bassGain);
        if (this.mainGain) bassGain.connect(this.mainGain);
        bassOsc.start();
        bassOsc.stop(now + 0.4);
      } else {
        // Chord notes
        notes.forEach((freq) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = "triangle";
          // Detune slightly for saloon piano honky-tonk effect!
          osc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), now);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
          osc.connect(gain);
          if (this.mainGain) gain.connect(this.mainGain);
          osc.start();
          osc.stop(now + 0.3);
        });
      }

      step++;
    };

    tick();
    this.timerId = setInterval(tick, 350); // fast bouncy beat!
  }

  // 3. DUEL MAP: Heavy tension heartbeat & ticking, high-pitched metallic ringing drone
  private startDuelLoop() {
    if (!this.ctx) return;
    let step = 0;

    const tick = () => {
      if (!this.ctx || this.currentMode !== "duel" || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Heartbeat double thud (every tick)
      const heart1 = this.ctx.createOscillator();
      const hGain1 = this.ctx.createGain();
      heart1.type = "sine";
      heart1.frequency.setValueAtTime(55, now);
      heart1.frequency.linearRampToValueAtTime(20, now + 0.15);
      hGain1.gain.setValueAtTime(0.4, now);
      hGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      heart1.connect(hGain1);
      if (this.mainGain) hGain1.connect(this.mainGain);
      heart1.start();
      heart1.stop(now + 0.25);

      const heart2 = this.ctx.createOscillator();
      const hGain2 = this.ctx.createGain();
      heart2.type = "sine";
      heart2.frequency.setValueAtTime(50, now + 0.2);
      heart2.frequency.linearRampToValueAtTime(15, now + 0.35);
      hGain2.gain.setValueAtTime(0.35, now + 0.2);
      hGain2.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      heart2.connect(hGain2);
      if (this.mainGain) hGain2.connect(this.mainGain);
      heart2.start();
      heart2.stop(now + 0.45);

      // Periodic high-tension metal clock tick/ring (every 2 ticks)
      if (step % 2 === 0) {
        const tickOsc = this.ctx.createOscillator();
        const tGain = this.ctx.createGain();
        tickOsc.type = "sine";
        tickOsc.frequency.setValueAtTime(3200, now);
        tGain.gain.setValueAtTime(0.07, now);
        tGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        tickOsc.connect(tGain);
        if (this.mainGain) tGain.connect(this.mainGain);
        tickOsc.start();
        tickOsc.stop(now + 0.15);
      }

      // Eerie atmospheric hum block
      if (step % 4 === 0) {
        const hum = this.ctx.createOscillator();
        const humGain = this.ctx.createGain();
        hum.type = "sine";
        hum.frequency.setValueAtTime(220, now);
        humGain.gain.setValueAtTime(0.0, now);
        humGain.gain.linearRampToValueAtTime(0.03, now + 0.4);
        humGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        hum.connect(humGain);
        if (this.mainGain) humGain.connect(this.mainGain);
        hum.start();
        hum.stop(now + 0.82);
      }

      step++;
    };

    tick();
    this.timerId = setInterval(tick, 800);
  }

  // 4. COMBAT TACTICAL Mode: Driving tribal war drum, high-frequency clinking metals, and sudden bass slides
  private startCombatLoop() {
    if (!this.ctx) return;
    let step = 0;

    const tick = () => {
      if (!this.ctx || this.currentMode !== "combat" || this.isMuted) return;
      const now = this.ctx.currentTime;

      // Heavy tribal kick drum beat
      if (step % 4 === 0 || step % 4 === 2 || step % 8 === 7) {
        const drum = this.ctx.createOscillator();
        const dGain = this.ctx.createGain();
        drum.type = "sine";
        drum.frequency.setValueAtTime(65, now);
        drum.frequency.exponentialRampToValueAtTime(32, now + 0.18);
        dGain.gain.setValueAtTime(0.35, now);
        dGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        drum.connect(dGain);
        if (this.mainGain) dGain.connect(this.mainGain);
        drum.start();
        drum.stop(now + 0.25);
      }

      // Snare-like noise snap (step 2 and 6)
      if (step % 4 === 2) {
        const snare = this.ctx.createOscillator();
        const sGain = this.ctx.createGain();
        snare.type = "triangle";
        snare.frequency.setValueAtTime(280, now);
        snare.frequency.linearRampToValueAtTime(450, now + 0.08);
        sGain.gain.setValueAtTime(0.12, now);
        sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
        snare.connect(sGain);
        if (this.mainGain) sGain.connect(this.mainGain);
        snare.start();
        snare.stop(now + 0.12);
      }

      // Intense Tension slide bass hum
      if (step % 8 === 0) {
        const bass = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bass.type = "sawtooth";
        bass.frequency.setValueAtTime(90, now);
        bass.frequency.linearRampToValueAtTime(70, now + 0.85);
        bGain.gain.setValueAtTime(0.0, now);
        bGain.gain.linearRampToValueAtTime(0.07, now + 0.15);
        bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        bass.connect(bGain);
        if (this.mainGain) bGain.connect(this.mainGain);
        bass.start();
        bass.stop(now + 0.95);
      }

      step++;
    };

    tick();
    this.timerId = setInterval(tick, 250); // dense fast tactical loop
  }
}

export const FrontierAudio = new ProceduralAudioEngine();
