import { fit, clamp, TAU } from "../../core/index.js";
import { drawShield, cellHash, R, D, PALETTE } from "./_hexshield.js";

const T = 0.8, HOLD = 0.12, GONE = 0.62;
// the loop's last frame is the 71st of its 72 at 30 fps; its time is accumulated the way the runtime steps it
let lastTime = 0;
for (let i = 0; i < 71; i++) lastTime += 1 / 30;
const LAST = lastTime / D;

export const meta = {
  name: "Hex shield collapses",
  desc: "The barrier fails: the cells blink out one by one from the rim inward, the rim breaks into arcs, the field folds inward and the light dies, starting on the loop's last frame.",
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
  const C = fit(o.palette, 8), f = clamp((t - HOLD) / (GONE - HOLD)), m = 1 - f;
  // the field keeps turning but winds down as it dies, and its cells fail one after another from the rim in
  drawShield(p, o, LAST + (t / D) * (1 - 0.35 * (t / T)), m,
    (col, row, cx, cy, dist) => cellHash(col, row) > f * 1.25 - 0.25 * (1 - dist / R) - 0.05);

  if (f > 0) {
    // the rim breaking into arcs as it lets go
    for (let i = 0; i < 4; i++) {
      const a0 = i * (TAU / 4) + f * 3, span = 0.35 + 0.2 * ((i * 3) % 3);
      if (Math.sin(f * 40 + i * 2.1) < 0) continue;
      const pts = [];
      for (let e = 0; e <= 5; e++) pts.push([Math.cos(a0 + (span * e) / 5) * R, Math.sin(a0 + (span * e) / 5) * R]);
      p.polyline(pts, C[5], Math.min(1, f * 1.6) * (1 - f));
    }
    p.glowRing(0, 0, R, 9, C[4], 0.45 * (1 - f));
  }
  // and the field folding inward at the end
  if (f > 0.35) {
    const q = (f - 0.35) / 0.65, rr = R * (1 - 0.75 * q), a = Math.min(1, (1 - q) * 3);
    if (a > 0) {
      p.ring(0, 0, rr, Math.max(1, 2 * (1 - q)), (v, ang) => (0.5 + 0.5 * Math.sin(ang * 7 + q * 9) > 0.3 ? C[5] : 0), a);
      p.glowRing(0, 0, rr, 6, C[4], 0.35 * (1 - q));
    }
  }
}
