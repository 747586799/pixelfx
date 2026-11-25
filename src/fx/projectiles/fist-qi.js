import { clamp, fit, rng, sparkle, TAU, WHITE } from "../../core/index.js";
import { beat, spark, wake } from "./_lib.js";

const D = 0.5, V = 420;

export const meta = {
  name: "Fist qi",
  desc: "A straight punch's qi flying out: a white-hot fist of compressed air, knuckles leading, afterimages off its back while the arm breaks into streaking wind and flecks of light.",
  tags: ["projectile", "punch", "fist", "qi", "energy", "wind", "directional", "loop"],
  size: [136, 48],
  origin: [112, 24],
  duration: D,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    palette: ["#1d1305", "#4a2f08", "#7d5110", "#b37a1d", "#e0a638", "#ffd06a", "#fff0b4", "#ffffff"],
    seed: 5,
  },
};

// a rounded box, as how far a point is inside it in px (<= 0 outside)
function box(x, y, cx, cy, hx, hy, r) {
  const qx = Math.abs(x - cx) - hx + r, qy = Math.abs(y - cy) - hy + r;
  return r - (Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0));
}

// a capsule, as how far a point is inside it in px (<= 0 outside)
function capsule(x, y, x0, y0, x1, y1, r) {
  const dx = x1 - x0, dy = y1 - y0, t = clamp(((x - x0) * dx + (y - y0) * dy) / (dx * dx + dy * dy), 0, 1);
  return r - Math.hypot(x - (x0 + dx * t), y - (y0 + dy * t));
}

const KNUCKLES = [-4.6, -1.55, 1.5, 4.55];

// the fist, side on and pointing right: a knuckle block, the back of the hand tapering into the wrist, four
// knuckles bulging past the front, and the thumb folded across the lower front
function fist(x, y) {
  let d = box(x, y, 3.5, 0, 4.2, 6, 2.6);
  d = Math.max(d, box(x, y, -3.4, 0.3, 3.7, 4.8, 2.4));
  d = Math.max(d, box(x, y, -9.9, 0.5, 4.6, 2.7, 2.2));
  for (const ky of KNUCKLES) d = Math.max(d, box(x, y, 8, ky, 1.7, 1.7, 1.7));
  return Math.max(d, capsule(x, y, 0.8, 3, 6.6, 4.2, 2));
}
const step = (ramp, k) => ramp[clamp(Math.round(k * (ramp.length - 1)), 0, ramp.length - 1)];

export function draw(p, t, o) {
  const C = fit(o.palette, 8), S = o.seed, ph = t / D, fr = Math.floor(ph * 30 + 1e-6);
  const oy = Math.sin(ph * TAU * 2) * 0.5, hum = 0.8 + 0.2 * Math.sin(ph * TAU * 3);
  const left = -meta.origin[0] + 2;

  // the fist of qi, lit from up-left: a shader over its own distance field, so the knuckles and the wrist catch
  // the light as separate forms, with the light breathing instead of turning
  p.shade(-17, -11, 13, 11, (x, y, out) => {
    y -= oy;
    const d = fist(x, y);
    if (d <= 0) return;
    const gx = fist(x + 1, y) - fist(x - 1, y), gy = fist(x, y + 1) - fist(x, y - 1);
    const g = Math.hypot(gx, gy) || 1, nx = -gx / g, ny = -gy / g;
    const lit = Math.max(0, nx * -0.45 + ny * -0.82);
    // the fist front runs hot: the knuckles are where the punch lands
    const heat = clamp((x - 4) / 6, 0, 1) * clamp(1 - Math.abs(y) / 7, 0, 1);
    // the wrist end cools away into the arm, so the fist has no cut-off edge
    const fade = 0.5 + 0.5 * clamp((x + 15) / 4, 0, 1);
    const k = (0.16 + 0.66 * lit ** 1.15 + heat * 0.2 + 0.035 * Math.sin(1.7 * x + 1.1 * y - ph * TAU * 2)) * fade;
    let c = step(C, k);
    // the creases between the knuckles, and the ridge of the thumb folded across the lower front
    if (x > 6.4 && Math.min(Math.abs(y + 3.05), Math.abs(y), Math.abs(y - 3.02)) < 0.55) c = C[2];
    if (x > 1.2 && x < 6.8 && Math.abs(y - (1.4 + 0.19 * (x - 1.2))) < 0.55) c = C[2];
    // a rim: white where the form catches the light, dark underneath and along the back
    if (d < 0.9 && x > -13.5) c = ny < -0.25 ? C[7] : ny > 0.45 ? C[1] : nx > 0.6 ? C[6] : C[4];
    out.c = c;
  });
  sparkle(p, 7.4, -2.6 + oy, 2, C[6], C[4], 0.3);

  // its own faint echoes, left hanging behind the fist: just the rim, dimming and thinning with distance
  p.shade(-20, -11, 9, 11, (x, y, out) => {
    y -= oy;
    if (fist(x, y) > 0) return;
    for (const [dx, a] of [[3, 0.55], [6.2, 0.28]]) {
      const d = fist(x + dx, y);
      if (d <= 0 || d > 2.2) continue;
      out.c = C[4];
      out.a = a * (1 - d / 2.2) * hum;
      return;
    }
  });

  // the arm breaking up behind the wrist: bands of qi that thin out, drift apart and fade into the wind
  for (let i = 0; i < 6; i++) {
    const y = -2.4 + i * 0.96 + Math.sin(ph * TAU * 2 + i * 1.7) * 0.3;
    const x0 = -13.2 - (i % 2) * 2, len = 8 + ((i * 11) % 7) * 3;
    p.line(x0, y + oy, x0 - len, y + (i - 2.5) * 0.13 * len + oy, i === 2 ? C[5] : C[4], (u) => (1 - u) * 0.7 * hum);
  }

  // wind torn off and left behind: long dashes that stream back and fade in and out
  for (let i = 0; i < 4; i++) {
    const q = (ph * 2 + i * 0.27) % 1, y = -7 + i * 4.3 + Math.sin(ph * TAU + i) * 0.9;
    const x = -24 - q * 56, len = 8 + ((i * 3) % 4) * 5;
    if (x - len < left) continue;
    p.line(x, y + oy * 0.4, x - len, y + oy * 0.4, i % 2 ? C[4] : C[5], Math.sin(q * Math.PI) * 0.45);
  }

  // flecks of qi peeling off the tail and falling behind, each a speed-stretched spark
  const SP = [WHITE, C[6], C[5], C[4]];
  beat(t, D, 12, S, (r) => r.range(0.1, 0.24), (age, life, r, i) => {
    const k = age / life;
    const [x, y, vx, vy] = wake(-13.5, r.range(-5.5, 5.5) + oy, r.range(-30, 20), r.range(-40, 40), age, V, 2.4, 25);
    if (x < left + 6 || Math.abs(y) > 21 || rng(fr, i, S).range(0, 1) < k * 0.35) return;
    spark(p, x, y, vx, vy, 1 - k, SP, 0.35, 0.02, 6);
  });

  // light: a soft pool round the fist, a hot core, the knuckles where the punch lands, and the arm's afterglow
  p.glowLine(-13, oy, -68, oy, 8, C[3], 0.26 * hum);
  p.glow(1, oy, 21, C[4], 0.34 * hum);
  p.glow(7.5, oy, 9, C[6], 0.3 * hum);
  for (const ky of KNUCKLES) p.glow(8, ky + oy, 3.5, ky < 0 ? WHITE : C[6], 0.22 * hum);
}
