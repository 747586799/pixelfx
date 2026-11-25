// The crescent smear, cooling ramp, dotted trace and glint follow Sprite Fusion's open-source slash
// (https://www.spritefusion.com/pixel-art-vfx/slash), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Lights, P, Rng, fit, sparkle, clamp, ease, rand, WHITE, READY } from "../../core/index.js";
import { swing, onSwing, travel, smear, trace, glowAlong } from "./_lib.js";

const SW = 0.16, FLARE = 0.34, D = 0.9, SPAN = Math.PI;
const turn = (t) => 1 - Math.pow(1 - clamp(t / SW), 1.7); // fraction of the half turn the light has made
const passedAt = (f) => SW * (1 - Math.pow(1 - clamp(f), 1 / 1.7)); // when the head passed fraction f

export const meta = {
  name: "Spin punch",
  desc: "A spinning backfist of golden qi: a thick white-hot half ring sweeps down the front of the body, cools to gold, flares and breaks into a dotted trace and sparks.",
  tags: ["melee", "punch", "fist", "qi", "spin", "gold", "arc", "aoe", "combat", "one-shot"],
  size: [208, 132],
  origin: [104, 112],
  duration: D,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#1d1305", "#4a2f08", "#7d5110", "#b37a1d", "#e0a638", "#ffd06a", "#fff0b4", "#ffffff"],
    radius: 38,
    seed: 9,
    sparks: ["#fff6d0", "#ffe49a", "#ffb84a", "#e08a2a"],
  },
};

const STANCE = { ...READY, fx: 12, fy: -24, bx: 8, by: -23 };
// he starts wound away from the target, then the whole body spins forward into the punch
const WOUND = { ...STANCE, crouch: 6, lean: -3, yaw: 2.55, fx: 2, fy: -22, bx: 4, by: -26, ffx: 7, fbx: -8 };
const WIDE = { ...STANCE, crouch: 5, lean: 3, fx: 20, fy: -25, bx: -8, by: -23, ffx: 11, fbx: -10 };
export const act = {
  target: { x: 56 },
  poses: [
    [-0.5, WOUND],
    [-0.24, { ...WOUND, crouch: 7, yaw: 2.65 }],
    [-0.03, { ...WOUND, crouch: 8, yaw: 2.75 }],
    [0, { ...WIDE, yaw: 2.55, ghost: 1 }, "snap"],
    [0.05, { ...WIDE, yaw: 1.85, ghost: 1 }, "snap"],
    [0.1, { ...WIDE, yaw: 1.1, ghost: 1 }, "snap"],
    [0.13, { ...WIDE, yaw: 0.5, ghost: 1 }, "snap"],
    [SW, { ...WIDE, yaw: 0, ghost: 1 }, "snap"],
    [0.4, { ...WIDE, crouch: 4, lean: 2 }],
    [0.68, STANCE],
    [D, STANCE],
  ],
  hits: [{ t: SW, stop: 0.13, shake: 0.18, amp: 2, push: 2.6, straw: 18 }],
  dust: [{ t: 0, x: 0, n: 6 }, { t: SW, x: 10, n: 5, dir: 1 }],
};

export function create(o) {
  const C = fit(o.palette, 8), n = C.length, Rg = new Rng(o.seed), R0 = o.radius;
  const ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks }), lights = new Lights();
  // the fist's light on a tilted circle round the chest; the half swept is the one in front of him, so the
  // punch leaves a half ring facing the target
  const A = swing({ cx: -2, cy: -27, R: R0, sy: 0.7, rot: -0.15, a0: -Math.PI / 2, dir: 1 });
  // a thinner echo inside it, a beat behind
  const E = { ...A, R: R0 * 0.82 };
  const W = 22, WE = 7;
  let t = 0, closed = false, lastU = 0;

  // the smear: thick behind the head, thinning to a hair at the tail and cooling as the head runs away
  const body = (p, s, w0, lag, rim) => {
    const U = SPAN * turn(t - lag);
    if (U < 0.02 || t - lag > SW + 0.02) return;
    smear(p, s, 0, U, w0, (u, r, out) => {
      const age = t - lag - passedAt(u / SPAN), lead = U - u;
      const w = w0 * Math.pow(clamp(lead / 1.2), 0.4) * (0.5 + 0.5 * Math.exp(-age / 0.12)) * Math.pow(clamp(u / 1), 0.5);
      if (w < 0.45) return;
      const q = (s.R - r) / w;
      if (q < 0 || q > 1) return;
      // a white-hot rim while it is fresh, then darker steps inward, with age and towards the tail
      const ci = rim && q < 0.26 && age < 0.07 ? 0 : Math.round(q * (n - 1) * 0.7 + age * 11 + (rim ? 0.4 : 1.4));
      out.c = C[n - 1 - clamp(ci, 0, n - 1)];
      out.a = Math.min(1, u / 1 + 0.25);
    });
  };

  const arc = (p) => {
    body(p, E, WE, 0.02, false);
    body(p, A, W, 0, true);
    if (t < SW + 0.04) glowAlong(p, A, A.R - 6, 0, SPAN * turn(t), 15, C[3], (u) => 0.34 * Math.exp(-(t - passedAt(u / SPAN)) / 0.08));
    if (t < SW) return;
    // the half ring flares white, swells a little, thins, cools and breaks into dots
    const f = (t - SW) / FLARE;
    if (f < 1) {
      const R = A.R + 5 * ease.outCubic(f), th = f < 0.1 ? 11 : Math.max(1, 7 * Math.pow(1 - f, 1.5) + 0.5), S = { ...A, R };
      const step = f < 0.1 ? 6 : f < 0.28 ? 5 : f < 0.52 ? 4 : 3;
      smear(p, S, 0, SPAN, th, (u, r, out) => {
        const q = (R - r) / th;
        if (q < 0 || q > 1) return;
        out.c = f < 0.1 ? (q < 0.6 ? WHITE : C[7]) : q < 0.45 ? C[step] : C[step - 1];
        out.a = f < 0.4 ? 1 : 1.3 - f;
      });
      glowAlong(p, S, R - 2, 0, SPAN, 14, C[4], 0.3 * (1 - f) * (1 - f));
    }
    // a dotted trace of the fist's path lingers where the arc was, fading
    const k = 1 - clamp((t - SW - 0.05) / 0.42);
    if (k > 0) trace(p, A, A.R - 0.5, 0, SPAN, C[4], (u) => clamp(k * 1.5 - rand(Math.floor(u * 30), 5) * 0.8) * 0.95);
  };

  return {
    update(dt) {
      t += dt;
      const U = SPAN * turn(t);
      // qi shavings peel off the leading edge as it sweeps forward, flung along its path
      if (t < SW) {
        for (let u = lastU; u < U; u += 0.3) {
          const tr = travel(A, u), ox = tr.x - A.cx, oy = tr.y - A.cy, l = Math.hypot(ox, oy) || 1, sp = Rg.range(50, 130);
          ps.spawn(P.MOTE, tr.x, tr.y, tr.dx * sp + (ox / l) * sp * 0.3, tr.dy * sp * 0.6 - Rg.range(6, 30), Rg.range(0.22, 0.45), C[4 + Rg.int(0, 1)], 0.6);
        }
        lastU = U;
      }
      if (!closed && t >= SW) {
        closed = true;
        lights.add(A.cx, A.cy + 4, 84, C[4], 0.42, 0.36);
        // the fist lands dead in front: a hot pop there, sparks off it and along the half ring
        const front = travel(A, SPAN / 2);
        for (let i = 0; i < 10; i++) {
          const a = Math.atan2(front.dy, front.dx) + Rg.range(-0.5, 0.35), sp = Rg.range(150, 340);
          ps.spawn(P.SPARK, front.x, front.y, Math.cos(a) * sp, Math.sin(a) * sp - Rg.range(20, 70), Rg.range(0.14, 0.36));
        }
        for (let i = 0; i < 14; i++) {
          const u = Rg.range(0, SPAN), tr = travel(A, u), sp = Rg.range(100, 240);
          ps.spawn(P.SPARK, tr.x, tr.y, tr.dx * sp, tr.dy * sp - Rg.range(20, 70), Rg.range(0.12, 0.3));
        }
        // and twinkles left hanging on the arc
        for (let i = 0; i < 6; i++) {
          const u = Rg.range(0, SPAN), [x, y] = onSwing(A, A.R + Rg.range(-1, 3), u);
          ps.spawn(P.STAR, x, y, 0, -Rg.range(2, 8), Rg.range(0.25, 0.5), Rg.chance(0.5) ? C[5] : WHITE, Rg.range(1.2, 2.6), Rg.range(0.04, 0.16));
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    drawBack(p) {
      ps.draw(p, "back");
    },
    draw(p) {
      arc(p);
      // light rides the leading edge, and the tip glints as it flies
      if (t < SW + 0.05) {
        const head = SPAN * turn(t), [x, y] = onSwing(A, A.R - 3, head);
        if (t < SW) sparkle(p, x, y, 5, C[6], C[4], 0.4);
        p.glow(x, y, 38, C[3], 0.45 * (1 - clamp((t - SW + 0.04) / 0.1)));
      }
      // the fist lands dead in front: a hot glint and light there
      const g = t - SW, tip = onSwing(A, A.R - 4, SPAN / 2);
      if (g > 0 && g < 0.24) {
        sparkle(p, tip[0], tip[1], 10 * ease.outBack(Math.min(1, g / 0.05)) * (1 - g / 0.24), C[5], C[4], 0.6);
        p.glow(tip[0], tip[1], 22, C[5], 0.5 * (1 - g / 0.24));
      }
      ps.draw(p, "front");
      lights.draw(p);
    },
  };
}
