import { fit, clamp, ease, TAU, WHITE } from "../../core/index.js";
import { drawShield, R, PALETTE } from "./_hexshield.js";

const T = 0.62, SWEEP = 0.5, FADE = 0.34;

export const meta = {
  name: "Hex shield opens",
  desc: "The barrier deploys: a flare at the centre, then a ring sweeps outward and the hex cells switch on behind it until the whole shield is up, ending on the loop's first frame.",
  tags: ["scifi", "shield", "barrier", "hex", "energy", "defense", "transition"],
  size: [160, 160],
  origin: [80, 80],
  duration: T,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PALETTE, seed: 5 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), u = clamp(t / SWEEP), rr = 6 + (R + 8) * ease.outCubic(u), m = clamp(t / FADE);
  // cells come on as the front passes them, so the last frame is the loop's first
  drawShield(p, o, 0, m, (col, row, cx, cy, dist) => dist <= rr - 3);

  // the front itself, and the flare where the field starts
  if (u < 1) {
    const k = 1 - u;
    p.ring(0, 0, rr, 2, (v, ang) => (0.5 + 0.5 * Math.sin(ang * 7 + u * 10) > 0.3 ? C[6] : 0), k);
    p.glowRing(0, 0, rr, 8, C[4], 0.45 * k);
  }
  if (t < 0.18) {
    const f = 1 - t / 0.18;
    p.circle(0, 0, 10 * f + 2, C[5]);
    p.circle(0, 0, 6 * f, WHITE);
    p.glow(0, 0, 22 * f + 8, C[5], 0.45 * f);
  }
}
