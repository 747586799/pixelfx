// The comic impact star is adapted from Sprite Fusion's open-source impact
// (https://www.spritefusion.com/pixel-art-vfx/impact), MIT License, Copyright (c) 2026 Hugo Duprez.
import { Particles, Lights, P, Rng, fit, hex, clamp, smooth, ease, sparkle, TAU, WHITE, READY } from "../../core/index.js";
import { star } from "./_lib.js";

const OUT = 0.07, D = 0.85;
// the near hand at full extension, in the act's and the effect's shared space, and where the qi lands
const HX = 24, HY = -24, TX = 36, TY = -25;

export const meta = {
  name: "Straight punch",
  desc: "A straight golden punch: the fist drives out, a white-hot crescent of air tears off the knuckles, a comic burst and ring pop at the reach, golden sparks fly and dust kicks up.",
  tags: ["melee", "punch", "fist", "gold", "impact", "comic", "combat", "directional", "one-shot"],
  size: [184, 108],
  origin: [40, 100],
  duration: D,
  loop: false,
  fps: 30,
  bg: "ground",
  actor: 2,
  options: {
    palette: ["#1d1305", "#4a2f08", "#7d5110", "#b37a1d", "#e0a638", "#ffd06a", "#fff0b4", "#ffffff"],
    outline: "#2a1006",
    sparks: ["#fff6d0", "#ffe49a", "#ffb84a", "#e08a2a"],
    seed: 7,
  },
};

// the body is at x; the near hand's screen x is x + fx (arms reach about 15 px from the shoulder)
const STANCE = { ...READY, x: -4, crouch: 3, lean: 1, fx: 11, fy: -25, bx: 7, by: -24 };
const COCK = { ...STANCE, x: -5, crouch: 7, lean: -4, fx: -6, fy: -22, bx: 12, by: -27, ffx: 5, fbx: -9, turn: 0.95 };
const HIT = { ...STANCE, x: 4, crouch: 5, lean: 6, fx: HX - 4, fy: HY, bx: -6, by: -26, ffx: 12, fbx: -3, toeB: true, ghost: 1 };
const THROUGH = { ...HIT, crouch: 4, lean: 7, fx: HX - 3, fy: HY + 1, bx: -7, by: -27, ghost: undefined };
export const act = {
  target: { x: 46 },
  poses: [
    [-0.52, STANCE],
    [-0.26, COCK],
    [-0.06, { ...COCK, crouch: 8, lean: -5, fx: -8 }],
    [0, HIT, "snap"],
    [OUT, THROUGH],
    [0.34, { ...THROUGH, crouch: 5, lean: 5 }],
    [0.62, { ...STANCE, x: 2, crouch: 4, lean: 3, fx: 14, fy: -24, bx: 4, by: -23 }],
    [D, STANCE],
  ],
  hits: [{ t: OUT, stop: 0.12, shake: 0.2, amp: 2, push: 3.2, straw: 20, y: -26 }],
  dust: [{ t: 0, x: 8, n: 6, dir: 1 }, { t: OUT, x: 5, n: 4, dir: 1 }],
};

const STREAKS = [
  { off: 0, len: 1, t0: 0, w: 2, hot: true },
  { off: -3, len: 0.85, t0: 0.004, w: 1 },
  { off: 3, len: 0.85, t0: 0.004, w: 1 },
  { off: -6, len: 0.62, t0: 0.012, w: 1 },
  { off: 6, len: 0.62, t0: 0.012, w: 1 },
  { off: -9, len: 0.4, t0: 0.02, w: 1 },
  { off: 9, len: 0.4, t0: 0.02, w: 1 },
];

export function create(o) {
  const C = fit(o.palette, 8), INK = hex(o.outline), Rg = new Rng(o.seed);
  const ps = new Particles({ rng: Rg, ground: () => 0, sparks: o.sparks }), lights = new Lights();
  // the burst: long forward and back, short up and down, so it reads as a punch driving through
  const spikes = [[0, 20, 3.4], [0.42, 9, 2.1], [-0.45, 10, 2.2], [1.1, 8, 2], [-1.15, 8.5, 2], [1.8, 5.5, 1.8], [-1.85, 6, 1.9], [2.55, 12, 2.7], [-2.5, 11, 2.6], [3.0, 8, 2.2]].map(([a, len, w]) => ({ a: a + Rg.range(-0.08, 0.08), len: len + Rg.range(-1.5, 2), w }));
  const bursts = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * TAU + 0.18 + Rg.range(-0.1, 0.1);
    return { a, r0: Rg.range(14, 18) + 5 * Math.abs(Math.cos(a)), L: Rg.range(4, 8) + 4 * Math.abs(Math.cos(a)) };
  });
  const lines = [];
  let t = 0, struck = false, stepped = false;
  return {
    update(dt) {
      t += dt;
      if (!stepped) {
        stepped = true;
        // the step in kicks dust off the floor
        for (let i = 0; i < 6; i++) ps.spawn(P.DUST, 10 + Rg.range(-3, 3), -1, Rg.range(20, 60), -Rg.range(4, 16), Rg.range(0.3, 0.55), "#6a6080", Rg.range(1.4, 2.6));
      }
      // speed lines racing forward with the fist
      if (t < OUT + 0.08 && Rg.chance(0.55)) lines.push({ x: HX + Rg.range(-4, 8), y: HY + Rg.sign() * Rg.range(6, 16), l: Rg.range(12, 34), v: Rg.range(150, 280), t });
      for (let i = lines.length - 1; i >= 0; i--) if (t - lines[i].t > 0.2) lines.splice(i, 1);
      for (const l of lines) l.x += l.v * dt;
      if (!struck && t >= OUT) {
        struck = true;
        lights.add(TX, TY, 52, C[4], 0.55, 0.3);
        lights.add(TX, TY, 14, WHITE, 0.65, 0.07);
        for (let i = 0; i < 16; i++) {
          const a = Rg.range(-0.75, 0.65) + (Rg.chance(0.2) ? Math.PI : 0), sp = Rg.range(120, 300);
          ps.spawn(P.SPARK, TX + Rg.range(-3, 2), TY + Rg.range(-4, 4), Math.cos(a) * sp, Math.sin(a) * sp - 40, Rg.range(0.16, 0.45));
        }
        for (let i = 0; i < 8; i++) {
          const a = Rg.range(0, TAU), d = Rg.range(8, 20);
          ps.spawn(P.STAR, TX + Math.cos(a) * d, TY + Math.sin(a) * d, Math.cos(a) * 24, Math.sin(a) * 24 - 14, Rg.range(0.2, 0.42), Rg.chance(0.5) ? C[6] : WHITE, Rg.range(1.3, 2.3), Rg.range(0.05, 0.2));
        }
        for (let i = 0; i < 10; i++) {
          const a = Rg.range(-0.7, 0.7), sp = Rg.range(40, 130);
          ps.spawn(P.MOTE, TX + Rg.range(-8, 2), TY + Rg.range(-6, 6), Math.cos(a) * sp, Math.sin(a) * sp - 30, Rg.range(0.25, 0.55), Rg.chance(0.5) ? C[5] : C[4], 0.6);
        }
      }
      ps.update(dt);
      lights.update(dt);
    },
    draw(p) {
      const fade = 1 - smooth(OUT + 0.02, OUT + 0.18, t);
      // speed lines: dotted, white at the head, dimming back along their length
      for (const l of lines) {
        const k = (t - l.t) / 0.2;
        for (let d = 0; d < l.l * (1 - k * 0.5); d++) p.dot(l.x - d, l.y, d < 3 ? WHITE : d < l.l * 0.4 ? C[5] : C[3], (1 - d / l.l) * (1 - k));
      }
      // the punch's air: streaks blown out from the knuckles, fanning forward, gone once the blow lands
      if (fade > 0)
        for (const s of STREAKS) {
          const u = clamp((t - s.t0) / (OUT - s.t0 + 1e-3));
          if (u <= 0) continue;
          const x0 = HX - 1, x1 = x0 + ease.outExpo(u) * (TX - HX + 3) * s.len;
          if (x1 <= x0) continue;
          const y0 = HY + s.off * 0.25, y1 = HY + s.off;
          for (let x = x0; x <= x1; x += 0.5) {
            const v = (x - x0) / (x1 - x0), y = y0 + (y1 - y0) * v;
            const c = v > 0.9 ? WHITE : s.hot ? (v > 0.3 ? C[6] : C[5]) : v > 0.55 ? C[5] : v > 0.25 ? C[4] : C[3];
            p.dot(x, y, c, (v < 0.1 ? v / 0.1 : 1) * fade);
            if (s.w > 1 && v > 0.15) p.dot(x, y + 1, v > 0.6 ? C[5] : C[3], (v < 0.2 ? v / 0.2 : 1) * fade);
          }
        }
      // the crescent of compressed air riding ahead of the knuckles
      if (t < OUT + 0.16) {
        const head = HX + 2 + (TX - HX + 1) * ease.outExpo(clamp(t / OUT)), R = 18;
        p.arc(head - R, TY, R, (u) => 1.5 * Math.sin(u * Math.PI) + 0.35, -0.75, 0.75, (u) => (Math.abs(u - 0.5) < 0.15 ? WHITE : Math.abs(u - 0.5) < 0.34 ? C[6] : C[5]), t < OUT ? 1 : 0.7 * fade);
        p.arc(head - R, TY, R + 2.5, 0.7, -0.66, 0.66, C[4], 0.35 * (t < OUT ? 1 : fade));
      }
      if (t < OUT) {
        sparkle(p, HX + 2, HY, 5 * (1 - t / OUT) + 1, C[6], C[4], 0.45);
        p.glow(HX, HY, 12, C[5], 0.4 * (1 - t / OUT));
      }
      // the burst: pops past full size, holds, then shrinks away
      const q = t - OUT;
      if (q >= 0 && q < 0.4) {
        const pop = ease.outBack(clamp(q / 0.05), 2.6), out = 1 - smooth(0.14, 0.4, q), sc = pop * (0.4 + 0.6 * out), turn = q * 0.35;
        const sp = spikes.map((s) => ({ ...s, a: s.a + turn }));
        if (sc > 0.08) {
          star(p, TX, TY, sp, sc * 1.12, 1, INK, INK, INK, INK);
          star(p, TX, TY, sp, sc, 1, q < 0.05 ? WHITE : C[7], C[5], C[4], C[3]);
        }
        p.glow(TX, TY, 28, C[4], 0.45 * out);
      }
      if (q >= 0.01 && q < 0.24) {
        // a ring bursts out round the burst, white to gold, breaking into dots
        const k = (q - 0.01) / 0.23, r = 5 + 18 * ease.outCubic(k), th = Math.max(1, 2.4 * (1 - k)), col = k < 0.25 ? WHITE : k < 0.5 ? C[7] : k < 0.75 ? C[5] : C[4];
        for (let a = 0; a < TAU; a += 0.55 / r) for (let o = 0; o < th; o += 0.5) p.dot(TX + Math.cos(a) * (r - o), TY + Math.sin(a) * (r - o), col, 1.15 - k);
      }
      if (q >= 0.01 && q < 0.2) {
        const k = (q - 0.01) / 0.19;
        for (const b of bursts) {
          const r0 = b.r0 + 12 * ease.outCubic(k), ca = Math.cos(b.a), sa = Math.sin(b.a);
          p.line(TX + ca * r0, TY + sa * r0, TX + ca * (r0 + b.L * (1 - k)), TY + sa * (r0 + b.L * (1 - k)), k < 0.4 ? WHITE : C[5], 1.1 - k);
        }
      }
      ps.draw(p);
      lights.draw(p);
    },
  };
}
