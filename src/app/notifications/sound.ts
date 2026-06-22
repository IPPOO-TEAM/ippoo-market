/* ═══════════════════════════════════════════
   IPPOO - Effets sonores de notification (WebAudio)
   Bips ludiques générés à la volée : arpèges, glissandos,
   accords joyeux + vibration native synchronisée. Aucun
   fichier audio à charger.
   ═══════════════════════════════════════════ */

import { safeGetItem, safeSetItem } from "../lib/safe-storage";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let unlocked = false;
let muted = false;

const MASTER_VOLUME = 0.75; // bien plus audible qu'avant

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) {
    ctx = new Ctor();
    masterGain = ctx.createGain();
    masterGain.gain.value = MASTER_VOLUME;
    masterGain.connect(ctx.destination);
  }
  return ctx;
}

/** Doit être appelée depuis un geste utilisateur (clic) au moins une fois. */
export function unlockNotificationSound() {
  if (unlocked) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  // "Ping" muet d'amorçage iOS Safari
  try {
    const o = c.createOscillator();
    const g = c.createGain();
    g.gain.value = 0;
    o.connect(g).connect(c.destination);
    o.start();
    o.stop(c.currentTime + 0.01);
  } catch {}
  unlocked = true;
}

export function setNotificationMuted(value: boolean) {
  muted = value;
  safeSetItem("ippoo:notif-muted", value ? "1" : "0");
}

export function isNotificationMuted(): boolean {
  const v = safeGetItem("ippoo:notif-muted");
  return v == null ? muted : v === "1";
}

/* ──────────────── Vibration ──────────────── */

function vibrate(pattern: number | number[]) {
  try {
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate === "function") nav.vibrate(pattern);
  } catch {}
}

const VIBRATE_NORMAL = [60, 40, 120];
const VIBRATE_HIGH = [80, 40, 80, 40, 200, 60, 250];
const VIBRATE_WIN = [40, 30, 40, 30, 40, 30, 250, 80, 350];
const VIBRATE_PROMO = [30, 20, 30, 20, 30, 20, 30, 20, 200];

/* ──────────────── Bell / Blip ──────────────── */

/** Cloche FM moderne (synthèse additive inharmonique).
 *  Empile plusieurs partiels en ratios non-entiers pour un timbre "cristal".
 *  Decay long et exponentiel, attaque très courte. */
function playBell(opts: {
  freq: number;
  delay?: number;
  duration?: number; // décroissance totale
  gain?: number;
  shimmer?: boolean; // ajoute un partiel très haut qui scintille
}) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const { freq, delay = 0, duration = 1.6, gain = 0.55, shimmer = true } = opts;
  const t0 = c.currentTime + delay;
  // Ratios inharmoniques typiques de cloche tubulaire
  const partials: Array<{ ratio: number; level: number; decay: number }> = [
    { ratio: 1.0,   level: 1.0,  decay: duration },
    { ratio: 2.01,  level: 0.55, decay: duration * 0.85 },
    { ratio: 3.02,  level: 0.30, decay: duration * 0.55 },
    { ratio: 4.18,  level: 0.22, decay: duration * 0.45 },
    { ratio: 5.43,  level: 0.16, decay: duration * 0.32 },
  ];
  if (shimmer) partials.push({ ratio: 8.21, level: 0.10, decay: duration * 0.25 });

  partials.forEach((p) => {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * p.ratio, t0);
    const g = c.createGain();
    const peak = gain * p.level;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + p.decay);
    osc.connect(g).connect(masterGain!);
    osc.start(t0);
    osc.stop(t0 + p.decay + 0.05);
  });

  // Mallet (attaque percussive) : burst de bruit filtré très court
  const dur = 0.04;
  const frames = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const arr = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) arr[i] = (Math.random() * 2 - 1) * (1 - i / frames);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * 4;
  bp.Q.value = 2;
  const ng = c.createGain();
  ng.gain.setValueAtTime(gain * 0.6, t0);
  ng.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(ng).connect(masterGain);
  src.start(t0);
  src.stop(t0 + dur + 0.01);
}

/** "Blip" rapide : sinus court avec pitch envelope montant. Très "UI moderne". */
function playBlip(opts: {
  freq?: number;
  delay?: number;
  gain?: number;
  duration?: number;
}) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const { freq = 1200, delay = 0, gain = 0.4, duration = 0.08 } = opts;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 0.55, t0);
  osc.frequency.exponentialRampToValueAtTime(freq, t0 + 0.025);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/** "Blop" : descente liquide low-pass, plus profond. */
function playBlop(opts: {
  freq?: number;
  delay?: number;
  gain?: number;
}) {
  const c = getCtx();
  if (!c || !masterGain) return;
  const { freq = 700, delay = 0, gain = 0.45 } = opts;
  const t0 = c.currentTime + delay;
  const duration = 0.18;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq * 1.8, t0);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t0 + 0.09);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(2400, t0);
  lp.frequency.exponentialRampToValueAtTime(500, t0 + duration);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(lp).connect(g).connect(masterGain);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

/* ──────────────── Mélodies ──────────────── */

/** Notification standard - un "blop" suivi d'une cloche douce. */
function meloNormal() {
  playBlop({ freq: 720, delay: 0, gain: 0.45 });
  playBell({ freq: 880, delay: 0.09, duration: 1.4, gain: 0.45 });
  vibrate(VIBRATE_NORMAL);
}

/** Urgent - triple blip métallique + cloche claire. */
function meloHigh() {
  playBlip({ freq: 1400, delay: 0,    gain: 0.4 });
  playBlip({ freq: 1700, delay: 0.07, gain: 0.42 });
  playBlip({ freq: 2000, delay: 0.14, gain: 0.44 });
  playBell({ freq: 1318, delay: 0.22, duration: 1.6, gain: 0.55 });
  playBell({ freq: 1760, delay: 0.32, duration: 1.4, gain: 0.4 });
  vibrate(VIBRATE_HIGH);
}

/** Récompense - carillon ascendant Do-Mi-Sol-Do. */
function meloWin() {
  const notes: Array<[number, number]> = [
    [523.25, 0],
    [659.25, 0.11],
    [783.99, 0.22],
    [1046.5, 0.34],
  ];
  notes.forEach(([f, d]) => playBell({ freq: f, delay: d, duration: 1.8, gain: 0.5 }));
  // Shimmer final
  playBell({ freq: 2093, delay: 0.5, duration: 2.2, gain: 0.32, shimmer: true });
  playBlip({ freq: 1800, delay: 0.05, gain: 0.25 });
  vibrate(VIBRATE_WIN);
}

/** Promo - séquence rapide de blips style notif UI moderne. */
function meloPromo() {
  playBlip({ freq: 900,  delay: 0,    gain: 0.42 });
  playBlip({ freq: 1100, delay: 0.07, gain: 0.42 });
  playBlip({ freq: 1350, delay: 0.14, gain: 0.42 });
  playBell({ freq: 1175, delay: 0.22, duration: 1.2, gain: 0.45 });
  vibrate(VIBRATE_PROMO);
}

/** Cadeau / bienvenue - double cloche cristalline en accord majeur. */
function meloGift() {
  playBlop({ freq: 600, delay: 0, gain: 0.35 });
  playBell({ freq: 783.99, delay: 0.08, duration: 2.0, gain: 0.5 });
  playBell({ freq: 987.77, delay: 0.22, duration: 1.8, gain: 0.45 });
  playBell({ freq: 1318.5, delay: 0.36, duration: 2.2, gain: 0.42, shimmer: true });
  vibrate(VIBRATE_WIN);
}

/* ──────────────── API publique ──────────────── */

export type SoundFlavor = "normal" | "high" | "win" | "promo" | "gift";

export function playNotificationSound(flavor: SoundFlavor | "normal" | "high" = "normal") {
  if (isNotificationMuted()) return;
  const c = getCtx();
  if (!c) {
    // Pas d'AudioContext disponible : au moins la vibration
    const v = flavor === "high" ? VIBRATE_HIGH
            : flavor === "win"  ? VIBRATE_WIN
            : flavor === "promo" ? VIBRATE_PROMO
            : VIBRATE_NORMAL;
    vibrate(v);
    return;
  }
  if (c.state === "suspended") c.resume().catch(() => {});
  switch (flavor) {
    case "high":   meloHigh();   break;
    case "win":    meloWin();    break;
    case "promo":  meloPromo();  break;
    case "gift":   meloGift();   break;
    default:       meloNormal(); break;
  }
}

/** Map type de notif → flavor sonore. */
export function flavorForNotif(type: string, priority?: string): SoundFlavor {
  if (priority === "high") return "high";
  if (type === "win" || type === "bonus") return "win";
  if (type === "promo") return "promo";
  if (type === "gift" || type === "welcome" || type === "vip") return "gift";
  return "normal";
}

/** Écoute les messages du Service Worker pour jouer le son. */
export function installNotificationSoundBridge() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  navigator.serviceWorker.addEventListener("message", (ev) => {
    if (ev.data?.type === "ippoo:push-sound") {
      const flavor = (ev.data.flavor as SoundFlavor | undefined)
        ?? (ev.data.priority === "high" ? "high" : "normal");
      playNotificationSound(flavor);
    }
  });
  const unlock = () => { unlockNotificationSound(); window.removeEventListener("pointerdown", unlock); window.removeEventListener("keydown", unlock); };
  window.addEventListener("pointerdown", unlock, { once: true });
  window.addEventListener("keydown", unlock, { once: true });
}
