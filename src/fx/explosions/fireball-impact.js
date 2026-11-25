import { Rng, fit, mix, hex, clamp, ease, TAU, WHITE } from "../../core/index.js";
import { hotFirst, firePuff, smokePuff } from "../fire/_lib.js";

const SMOKE1 = hex("#6b5b58");

export const meta = {
  name: "Fireball impact",
  desc: "A fireball bursts: a white flash, a ball of flame that throws puffs out and cools into smoke, sparks and embers flung wide, broken shock rings and light that dies with it.",
  tags: ["explosions", "fireball", "impact", "fire", "blast", "burst", "projectile", "one-shot"],
  size: [192, 160],
  origin: [96, 80],
  duration: 1.35,
  loop: false,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#4a1712", "#8a1f17", "#c9281f", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe26b", "#fff3a6", "#ffffff"],
    seed: 5,
  },
};

export function draw(p, t, o) {
  const F = fit(o.palette, 9), H = hotFirst(F), R = new Rng(o.seed), SMOKE = mix(SMOKE1, H[6], 0.45);

  // the white hero frame and its cross of light
  if (t < 0.1) {
    const f = 1 - t / 0.1;
    p.circle(0, 0, 15 * f + 2, H[3]);
    p.circle(0, 0, 11 * f, WHITE);
    for (const [dx, dy, l] of [[1, 0, 1], [-1, 0, 1], [0, 1, 0.7], [0, -1, 0.7]])
      p.line(0, 0, dx * (34 * f + 6) * l, dy * (34 * f + 6) * l, (u) => (u < 0.35 ? WHITE : H[5]), (u) => (1 - u) * f);
  }

  // the ball: a big cool puff with hotter ones churning on top of it, shrinking as it burns out
  const cu = clamp(t / 0.55);
  if (cu < 1) {
    firePuff(p, 0, 0, 1 - cu, 42, 0.3, H, 0.3);
    firePuff(p, 5, -4, 1 - Math.min(1, cu * 1.15), 31, 0.6, H, 0.26);
    firePuff(p, -5, 4, 1 - Math.min(1, cu * 1.3), 23, 0.85, H, 0.2);
    firePuff(p, 1, 6, 1 - Math.min(1, cu * 1.5), 16, 0.95, H, 0.16);
  }

  // flame thrown out of it: fast at first, braking hard, cooling as it swells
  for (let i = 0; i < 32; i++) {
    const a = R.range(0, TAU), sp = R.range(50, 190), life = R.range(0.35, 0.65), delay = R.range(0, 0.05),
      size = R.range(6, 13), frac = R.range(0.6, 1), wob = R.range(0, TAU);
    const age = t - delay;
    if (age < 0 || age > life) continue;
    const k = age / life, pull = (1 - Math.exp(-3.2 * age)) / 3.2;
    const x = Math.cos(a) * (4 + sp * pull), y = Math.sin(a) * (4 + sp * pull) - 20 * k * k + Math.sin(age * 9 + wob) * 1.4;
    firePuff(p, x, y, 1 - k, size * (1 + 0.45 * k), frac, H, 0.1);
  }

  // the smoke it cools into: slower, rising, thinning
  for (let i = 0; i < 12; i++) {
    const a = R.range(0, TAU), sp = R.range(10, 32), r0 = R.range(8, 24), delay = R.range(0.14, 0.38),
      life = R.range(0.6, 0.95), size = R.range(9, 15), wob = R.range(0, TAU);
    const age = t - delay;
    if (age < 0 || age > life) continue;
    const k = age / life, x = Math.cos(a) * (r0 + sp * age) + Math.sin(age * 5 + wob) * 2.5, y = Math.sin(a) * (r0 + sp * age) - 24 * age - 6 * age * age;
    smokePuff(p, x, y, 1 - k, size, SMOKE, false, 1.1);
  }

  // sparks on arcs of their own, stretching with speed and raining back down
  for (let i = 0; i < 44; i++) {
    const a = R.range(0, TAU), sp = R.range(60, 150), life = R.range(0.2, 0.4);
    if (t > life) continue;
    const k = t / life, at = (e) => [Math.cos(a) * sp * e, Math.sin(a) * sp * e + 220 * e * e - 30 * e];
    const [x, y] = at(t), [x2, y2] = at(Math.max(0, t - 0.035));
    p.line(x2, y2, x, y, k < 0.35 ? WHITE : H[3], 1 - k);
    if (i % 6 === 0) p.glow(x, y, 3, H[2], 0.3 * (1 - k));
  }

  // embers drifting up out of the blast
  for (let i = 0; i < 12; i++) {
    const a = R.range(0, TAU), sp = R.range(15, 55), life = R.range(0.5, 0.9), wob = R.range(0, TAU);
    if (t > life) continue;
    const k = t / life, x = Math.cos(a) * (4 + sp * t) + Math.sin(t * 7 + wob) * 2, y = Math.sin(a) * (4 + sp * t) - 26 * t;
    p.px(x, y, k < 0.4 ? H[4] : H[2]);
    p.glow(x, y, 4, H[2], 0.25 * (1 - k));
  }

  // shock rings: a few arcs tearing outward, so they never read as drawn circles
  if (t > 0.03) {
    for (const [r1, life, c, seg] of [[62, 0.28, H[2], 3], [40, 0.22, H[4], 2]]) {
      const u = (t - 0.03) / life;
      if (u >= 1) continue;
      const r = 10 + r1 * ease.outExpo(u), w = Math.max(1, 3 * (1 - u));
      for (let s = 0; s < seg; s++) {
        const a0 = (s / seg) * TAU + u * 2.2 + s * 0.7, span = 0.55 + 0.3 * ((s * 3) % 3);
        p.arc(0, 0, r, w, a0, a0 + span, c, 1 - u);
      }
      p.glowRing(0, 0, r, w + 6, c, 0.22 * (1 - u));
    }
  }

  // the blast's light: a hot heart that dies with the fire
  p.glow(0, 0, 26 + 26 * (1 - clamp(t / 0.6)), H[1], 0.4 * (1 - clamp(t / 0.75)));
}
