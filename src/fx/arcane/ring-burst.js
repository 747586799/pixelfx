import { PAL, Rng, fit, at, clamp, flare, TAU, WHITE } from "../../core/index.js";

const SPREAD = 0.1, TAIL = 1.12, R0 = 6, RMAX = 96, GHOSTS = 3, GHOST_GAP = 0.08;

export const meta = {
  name: "Ring burst",
  desc: "A shockwave of violet-white light snaps out from a point in a blink, dragging three torn ghost copies behind it, sparks peeling off its edge and a white flash at the core.",
  tags: ["arcane", "ring", "nova", "shockwave", "light", "afterimage", "burst", "one-shot"],
  size: [224, 224],
  origin: [112, 112],
  duration: 0.37,
  loop: false,
  fps: 60,
  bg: "dark",
  options: { palette: PAL.arcane, seed: 5 },
};

// the ring's radius over the expansion: no wind-up, a hard snap out that keeps moving to the end
const radius = (q) => R0 + (RMAX - R0) * (1 - (1 - clamp(q)) ** 1.7);

// an afterimage: one ring divided into arcs with uneven spans, drawn in a single pass
function tornRing(p, r, w, c, a, seg, phase, spans) {
  const step = TAU / seg, r0 = Math.max(0, r - w);
  p.shade(-r, -r, r, r, (x, y, o) => {
    const d2 = x * x + y * y;
    if (d2 > r * r || d2 < r0 * r0) return;
    let t = (Math.atan2(y, x) - phase) % TAU;
    if (t < 0) t += TAU;
    const i = Math.floor(t / step);
    if ((t - i * step) / step > spans[i]) return;
    o.c = c;
    o.a = a;
  });
}

export function draw(p, t, o) {
  const C = fit(o.palette, 8);
  const R = new Rng(o.seed);

  const u = t / SPREAD;
  if (u >= TAIL) return;
  const r = radius(u), w = Math.max(1, 5 * (1 - clamp(u)) ** 1.1);
  // the ring cools down the ramp as it travels, and is only dithered away over the last frames
  const fade = u < 1 ? 1 : clamp((TAIL - u) / (TAIL - 1)) ** 1.5;
  const dim = clamp(1 - u * 0.9);

  // the release: the first frames are white, then a cross of light
  if (u < 0.16) {
    const f = 1 - u / 0.16;
    p.circle(0, 0, 16 * f + 1.5, C[5]);
    p.circle(0, 0, 12 * f, WHITE);
    flare(p, 0, 0, 36 * f + 6, f, C);
  }

  // the afterimages: earlier copies of the ring, torn into arcs so they read as a smear
  for (let i = GHOSTS; i >= 1; i--) {
    const q = u - i * GHOST_GAP;
    if (q <= 0) continue;
    const gq = clamp(q), gr = radius(gq), gw = Math.max(1, w * (0.85 - i * 0.12));
    const c = at(C, 0.66 - 0.5 * gq - i * 0.07), seg = 6, spans = [];
    for (let s = 0; s < seg; s++) spans.push(0.45 + 0.2 * ((s * 7 + i * 3) % 5));
    tornRing(p, gr, gw, c, 0.9 * fade * dim, seg, i * 0.6 + u * 2, spans);
  }

  // the leading edge: white-hot, cooling down the ramp so it fades by color, not by noise
  p.ring(0, 0, r, w, (v) => (u < 0.22 && v > 0.5 ? WHITE : v > 0.55 ? at(C, 0.95 - 0.8 * clamp(u)) : at(C, 0.7 - 0.65 * clamp(u))), 1.35 * fade);

  // sparks peeling off the front, flickering in short radial streaks
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * TAU + R.range(-0.1, 0.1), sp = R.range(0.99, 1.14), life = R.range(0.45, 0.85);
    const k = clamp(u / life), tw = 0.55 + 0.45 * Math.sin(u * 42 + i * 2.1);
    if (u > life) continue;
    const rr = r * sp, len = 2 + 5 * k, ca = Math.cos(a), sa = Math.sin(a);
    p.line(ca * (rr - len), sa * (rr - len), ca * rr, sa * rr, k < 0.3 ? WHITE : C[6], (0.5 + 0.5 * k) * tw * fade * dim);
    p.dot(ca * rr, sa * rr, k < 0.3 ? WHITE : C[7], tw * fade * dim);
    if (i % 4 === 0) p.glow(ca * rr, sa * rr, 3, C[5], 0.25 * tw * fade * dim);
  }

  p.glowRing(0, 0, r, w + 7, C[5], 0.6 * fade * dim);
  p.glow(0, 0, 20 + 30 * (1 - clamp(u)), C[4], 0.4 * fade * dim);
}
