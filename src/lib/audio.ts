'use client';

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let started = false;
let targetVolume = 0.18; // the "full" volume level

function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

export function startAmbient() {
  if (started) return;
  started = true;

  const ac = getCtx();
  const mg = masterGain!;

  // Fade master in over 2s
  targetVolume = 0.18;
  mg.gain.linearRampToValueAtTime(0.18, ac.currentTime + 2);

  // Sub-bass drone — deep, dark foundation
  const droneDefs = [
    { freq: 55,  type: 'sine'     as OscillatorType, gain: 0.7  },
    { freq: 82.5,type: 'sine'     as OscillatorType, gain: 0.35 },
    { freq: 110, type: 'sine'     as OscillatorType, gain: 0.15 },
    { freq: 164, type: 'triangle' as OscillatorType, gain: 0.08 },
  ];

  for (const def of droneDefs) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = def.type;
    osc.frequency.setValueAtTime(def.freq, ac.currentTime);
    osc.frequency.linearRampToValueAtTime(def.freq * 1.004, ac.currentTime + 8);
    osc.frequency.linearRampToValueAtTime(def.freq, ac.currentTime + 16);
    g.gain.setValueAtTime(def.gain, ac.currentTime);
    osc.connect(g);
    g.connect(mg);
    osc.start();
    droneNodes.push({ osc, gain: g });
  }

  // High shimmer — cold airy texture
  const shimOsc = ac.createOscillator();
  const shimGain = ac.createGain();
  shimOsc.type = 'sine';
  shimOsc.frequency.setValueAtTime(3520, ac.currentTime);
  shimGain.gain.setValueAtTime(0.04, ac.currentTime);
  shimOsc.connect(shimGain);
  shimGain.connect(mg);
  shimOsc.start();
  droneNodes.push({ osc: shimOsc, gain: shimGain });
}

export function setAmbientVolume(normalizedScroll: number) {
  // normalizedScroll: 0 = hero fully visible, 1 = fully scrolled past
  // Fade volume based on scroll position
  const newTarget = Math.max(0, 0.18 * (1 - normalizedScroll));
  targetVolume = newTarget;

  if (!ctx || !masterGain) return;
  masterGain.gain.linearRampToValueAtTime(newTarget, ctx.currentTime + 0.3);
}

export function playTransitionHit() {
  // Only play if volume is not muted
  if (targetVolume < 0.01) return;

  const ac = getCtx();
  if (ac.state === 'suspended') ac.resume();

  const now = ac.currentTime;
  const volumeMultiplier = targetVolume / 0.18; // scale with current volume

  // Low thud
  const thud = ac.createOscillator();
  const thudGain = ac.createGain();
  thud.type = 'sine';
  thud.frequency.setValueAtTime(80, now);
  thud.frequency.exponentialRampToValueAtTime(30, now + 0.18);
  thudGain.gain.setValueAtTime(0.38 * volumeMultiplier, now);
  thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
  thud.connect(thudGain);
  thudGain.connect(ac.destination);
  thud.start(now);
  thud.stop(now + 0.25);

  // High accent
  const click = ac.createOscillator();
  const clickGain = ac.createGain();
  click.type = 'triangle';
  click.frequency.setValueAtTime(2200, now);
  click.frequency.exponentialRampToValueAtTime(800, now + 0.06);
  clickGain.gain.setValueAtTime(0.07 * volumeMultiplier, now);
  clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
  click.connect(clickGain);
  clickGain.connect(ac.destination);
  click.start(now);
  click.stop(now + 0.1);
}

export function stopAmbient() {
  if (!ctx || !masterGain) return;
  const mg = masterGain;
  const ac = ctx;
  targetVolume = 0;
  mg.gain.linearRampToValueAtTime(0, ac.currentTime + 1.5);
  setTimeout(() => {
    for (const n of droneNodes) { try { n.osc.stop(); } catch {} }
    droneNodes = [];
    started = false;
  }, 1600);
}
