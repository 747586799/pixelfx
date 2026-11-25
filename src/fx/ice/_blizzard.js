// The body of the blizzard, shared by the loop and by the build-up and break-up that begin and end on its frames.
import { Rng, fit, cycle, smooth, hex, TAU, WHITE } from "../../core/index.js";

export const D = 2.4, R = 76, EYE = 0.27, LIGHT = -2.3;
export const PALETTE = ["#0a111f", "#16243a", "#27405e", "#4a6b8f", "#7fa6c6", "#b8d9ee", "#e8f6ff", "#ffffff"];
const BLACK = hex("#060b16");

/**
 * Draw the storm at loop phase ph (turns). m fades the whole thing in or out and grow pushes the ring out;
 * at m = 1, grow = 1, this is exactly the loop's frame at ph.
 */
export function drawStorm(p, o, ph, m = 1, grow = 1) {
  if (m <= 0.001) return;
  const C = fit(o.palette, 8), rng = new Rng(o.seed + 21), eyeR = EYE * R * m;

  // the air under the wall: a cold haze so the puffs sit in one body of snow
  p.disc(0, 0, R * 0.95 * grow, C[1], 0.18 * m);

  // the wall: soft puffs of snow on five arms, each turning a whole number of times so the loop closes. The
  // inner puffs turn more times than the outer ones: that shear is what makes it read as a funnel
  const puffs = [];
  for (let i = 0; i < 120; i++) {
    const rho = 0.36 + Math.sqrt(rng.range(0, 1)) * 0.56, arm = Math.floor(rng.range(0, 5));
    puffs.push({
      rho, a0: arm * (TAU / 5) + 1.3 * Math.log(rho / 0.36) + rng.range(-0.45, 0.45),
      turns: Math.round(1 + 2.4 * (1 - rho)), wob: rng.range(0, TAU),
      sz: 2.8 + rho * 7 + rng.range(-0.8, 1.8), v: rng.range(0, 1),
    });
  }
  puffs.sort((a, b) => b.rho - a.rho);
  const cx = Math.cos(LIGHT), cy = Math.sin(LIGHT);
  for (const q of puffs) {
    const th = q.a0 + ph * TAU * q.turns, rn = q.rho * R * grow + Math.sin(ph * TAU * 2 + q.wob) * 2.2 * m;
    const lit = 0.5 + 0.5 * Math.cos(th - LIGHT), x = Math.cos(th) * rn, y = Math.sin(th) * rn;
    const k = 1 - smooth(0.84, 1, q.rho), ci = q.v < 0.16 ? 1 : Math.min(6, 1 + Math.floor(lit * 2.4 + q.v * 1.3));
    const a = (0.22 + 0.32 * lit) * k * 0.9 * m, sz = q.sz * (1 - 0.35 * (1 - m));
    p.disc(x, y, sz, C[ci], (d) => a * (1 - d * 0.75));
    // a lit cap on the up-left face: the puffs read as snow, not as flat bubbles
    if (lit > 0.42 && q.v > 0.25) p.disc(x + cx * sz * 0.3, y + cy * sz * 0.3, sz * 0.62, C[Math.min(7, ci + 2)], (d) => a * 0.8 * (1 - d));
    if (q.v > 0.82 && lit > 0.6) p.dot(x + cx * sz * 0.75, y + cy * sz * 0.75, WHITE, m);
  }

  // wind streaks: short white tangents speeding round the wall, fastest near the eye
  for (let i = 0; i < 42; i++) {
    const rho0 = rng.range(0.3, 1), a0 = rng.range(0, TAU), len = rng.range(0.04, 0.13),
      turns = Math.max(1, Math.round(rng.range(1, 2.6) * (0.6 + 1.2 / rho0)));
    const th = a0 + ph * TAU * turns, rr = rho0 * R * grow, lit = 0.5 + 0.5 * Math.cos(th - LIGHT);
    p.line(Math.cos(th - len) * rr, Math.sin(th - len) * rr, Math.cos(th) * rr, Math.sin(th) * rr,
      lit > 0.58 ? C[6] : C[3], (lit > 0.58 ? 1 : 0.5) * m);
  }

  // the eye: a hole down into the dark, its far wall catching the light, a broken lip of snow round it
  if (eyeR > 0.5) {
    p.circle(0, 0, eyeR, BLACK);
    for (let s = 0; s < 3; s++) {
      const a0 = LIGHT + Math.PI - 0.5 + s * 0.42;
      p.arc(0, 0, eyeR * (0.9 - s * 0.16), 2, a0, a0 + 0.3, s ? C[1] : C[2], m);
    }
    for (let s = 0; s < 8; s++) {
      const a0 = (s / 8) * TAU + ph * TAU, span = 0.14 + 0.1 * ((s * 3) % 4);
      const lit = 0.5 + 0.5 * Math.cos(a0 + span / 2 - LIGHT);
      p.arc(0, 0, eyeR + 0.5, 1.5, a0, a0 + span, lit > 0.55 ? C[6] : C[3], m);
    }
    p.glowRing(0, 0, eyeR, 10, C[5], 0.3 * m);
  }

  // ice grit and frozen chunks riding the wind, one fixed set of orbits so the loop is seamless
  for (let i = 0; i < 30; i++) {
    const rho0 = rng.range(0.32, 1), a0 = rng.range(0, TAU), wb = rng.range(0, TAU),
      turns = Math.max(1, Math.round(rng.range(0.9, 2.4) * (0.7 + 1 / rho0))), big = rng.chance(0.35);
    const th = a0 + ph * TAU * turns, rr = rho0 * R * grow + Math.sin(ph * TAU * 2 + wb) * 2;
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr, ca = Math.cos(th), sa = Math.sin(th), ta = th - 0.07 * turns;
    p.line(Math.cos(ta) * (rr - 2.5), Math.sin(ta) * (rr - 2.5), x, y, C[3], 0.55 * m);
    if (big) {
      // a shard of ice tumbling on the wind
      p.line(x - ca * 1.5, y - sa * 1.5, x + ca * 1.5, y + sa * 1.5, C[2], m);
      p.line(x - ca, y - sa, x + ca, y + sa, C[5], m);
      p.dot(x + ca * 1.5, y + sa * 1.5, WHITE, m);
    } else p.dot(x, y, C[6], m);
  }

  // flakes: bright specks and little crosses, drifting out through the wall as it turns
  for (let i = 0; i < 90; i++) {
    const rho0 = rng.range(0.24, 1.03), a0 = rng.range(0, TAU), big = rng.chance(0.16),
      turns = Math.max(1, Math.round(rng.range(1, 3) * (0.7 + 1.2 / rho0)));
    const th = a0 + ph * TAU * turns, rr = rho0 * R * grow + Math.sin(ph * TAU * 2 + a0) * 1.5;
    const x = Math.cos(th) * rr, y = Math.sin(th) * rr, lit = 0.5 + 0.5 * Math.cos(th - LIGHT);
    if (big) {
      p.dot(x, y, WHITE, m);
      p.dot(x - 1, y, C[6], m);
      p.dot(x + 1, y, C[6], m);
      p.dot(x, y - 1, C[6], m);
      p.dot(x, y + 1, C[6], m);
    } else p.dot(x, y, lit > 0.5 ? C[6] : C[5], m);
  }

  // snow boiling off the rim, in loose puffs that drift out and die
  cycle(ph * D, D, 16, o.seed + 3, (g) => g.range(0.55, 0.95), (age, life, r) => {
    const u = age / life, a = r.range(0, TAU) - ph * TAU * Math.round(1 + 1 / Math.max(0.3, u)),
      rho = (0.8 + 0.2 * u) * grow;
    p.disc(Math.cos(a) * rho * R, Math.sin(a) * rho * R, (3 + 5 * u) * (1 - 0.35 * (1 - m)), C[3], 0.13 * (1 - u) * m);
  });

  // a cold flicker down the funnel twice a loop, lighting the eye and the wall round it
  const strike = (c) => {
    const q = (((ph - c) % 1) + 1) % 1;
    return q < 0.03 || q > 0.985 ? 1 - Math.min(q, 1 - q) / 0.03 : 0;
  };
  const bolt = Math.max(strike(0.34), strike(0.78)) * m;
  if (bolt > 0) {
    const g = new Rng(o.seed + (ph > 0.5 ? 2 : 1)), a = g.range(0, TAU), L = eyeR * 0.95;
    let px = 0, py = 0;
    for (let i = 1; i <= 4; i++) {
      const q = i / 4, nx = Math.cos(a + g.range(-0.5, 0.5)) * L * q, ny = Math.sin(a + g.range(-0.5, 0.5)) * L * q;
      p.line(px, py, nx, ny, i < 3 ? WHITE : C[6], bolt);
      px = nx;
      py = ny;
    }
    p.glow(0, 0, eyeR + 10, WHITE, 0.5 * bolt);
  }

  // the funnel lights the snow round it, and the ground under it
  p.glow(0, 0, R * grow, C[4], 0.14 * m);
}
