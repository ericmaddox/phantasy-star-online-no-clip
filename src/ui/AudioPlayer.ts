/**
 * Procedural PSO Ambient Soundtrack Synthesizer using Web Audio API
 */
export class AudioPlayer {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private gainNode: GainNode | null = null;
  private oscs: OscillatorNode[] = [];
  private intervalId: number | null = null;

  public isMuted = true;

  public toggle(): boolean {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 0.15;
      this.gainNode.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      this.isMuted = true;
    } else {
      this.start();
      this.isMuted = false;
    }

    return !this.isMuted;
  }

  private start(): void {
    if (!this.ctx || !this.gainNode) return;
    this.isPlaying = true;

    // PSO Pioneer II Nostalgic Chord Progression (Dmaj9, Bm7, Gmaj7, Asus4)
    const chordFrequencies = [
      [146.83, 220.00, 277.18, 329.63], // Dmaj9
      [123.47, 185.00, 220.00, 293.66], // Bm7
      [98.00, 146.83, 196.00, 293.66],  // Gmaj7
      [110.00, 164.81, 220.00, 329.63]  // Asus4
    ];

    let chordIdx = 0;

    const playChord = () => {
      // Clear previous oscillators
      this.oscs.forEach(o => {
        try { o.stop(); o.disconnect(); } catch {}
      });
      this.oscs = [];

      const freqs = chordFrequencies[chordIdx % chordFrequencies.length];
      chordIdx++;

      freqs.forEach(freq => {
        if (!this.ctx || !this.gainNode) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        // Soft pad envelope
        oscGain.gain.setValueAtTime(0, this.ctx.currentTime);
        oscGain.gain.linearRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
        oscGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 5.0);

        osc.connect(oscGain);
        oscGain.connect(this.gainNode);

        osc.start();
        osc.stop(this.ctx.currentTime + 5.2);
        this.oscs.push(osc);
      });
    };

    playChord();
    this.intervalId = window.setInterval(playChord, 5000);
  }

  private stop(): void {
    this.isPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.oscs.forEach(o => {
      try { o.stop(); o.disconnect(); } catch {}
    });
    this.oscs = [];
  }
}
