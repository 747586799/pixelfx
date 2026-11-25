// The shield body, shared by the loop and by the deploy and collapse that start and end on its frames.
import { fit, smooth, TAU, WHITE } from "../../core/index.js";

export const R = 62, S = 8, D = 2.4, HEXH = Math.sqrt(3) * S;
export const PALETTE = ["#0b1030", "#152a63", "#1d4f9e", "#2582d2", "#36b9ee", "#8ae8ff", "#d4fbff", "#ffffff"];

// a stable per-cell hash, so the cells that flicker (and fail) are the same every time
export const cellHash = (a, b) => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

/**
 * Draw the shield at loop phase ph (turns). m fades the whole thing in or out, and onCell can hold single
 * cells back (col, row, x, y, distance from the centre). At m = 1 with every cell on, this is exactly the
 * loop's frame at ph.
 */
export function drawShield(p, o, ph, m = 1, onCell = null) {
  if (m <= 0.002) return;
  const C = fit(o.palette, 8), scanY = Math.sin(ph * TAU) * R * 0.72;

  // the film: a translucent dome, brighter at the top and piling up at the rim
  p.disc(0, 0, R, C[2], (d, ang) => (0.12 + 0.14 * (0.5 - 0.5 * Math.sin(ang)) + 0.1 * d ** 6) * m);
  p.glow(0, 0, R * 1.15, C[3], 0.22 * m);

  // the lattice: hexes lit by a wave running out from the centre, by a scan line crossing them, and by the rim
  for (let col = -5; col <= 5; col++) {
    for (let row = -5; row <= 5; row++) {
      const cx = col * S * 1.5, cy = row * HEXH + (col & 1 ? HEXH / 2 : 0), dist = Math.hypot(cx, cy);
      if (dist > R - S * 1.05) continue;
      if (onCell && !onCell(col, row, cx, cy, dist)) continue;
      const wave = 0.5 + 0.5 * Math.cos(dist * 0.2 - ph * TAU * 2);
      const scan = Math.max(0, 1 - Math.abs(cy - scanY) / 15);
      const rim = 1 - smooth(R - 24, R - 6, dist);
      const h = cellHash(col, row), fl = h < 0.16 ? Math.max(0, Math.sin(ph * TAU * 3 + h * 70)) * 0.9 : 0;
      const k = (0.18 + 0.5 * wave ** 3 + 0.9 * scan + 0.45 * rim + fl) * m;
      const c = k > 1.25 ? WHITE : k > 0.95 ? C[7] : k > 0.72 ? C[6] : k > 0.5 ? C[5] : k > 0.33 ? C[4] : C[2];
      const pts = [];
      for (let e = 0; e < 6; e++) pts.push([cx + Math.cos((e / 6) * TAU) * S, cy + Math.sin((e / 6) * TAU) * S]);
      if (k > 1.25) p.poly(pts, C[3]);
      else if (k > 0.95) p.poly(pts, C[2]);
      p.polyline([...pts, pts[0]], c);
      if (k > 1.25) p.glow(cx, cy, S * 1.6, c, 0.3);
    }
  }

  // the rim: a bright shell with dashes racing round it, and three hot arcs turning on top. It holds solid
  // until the field is nearly gone, so a fading shield doesn't turn into a dotted circle
  const rimA = m > 0.25 ? Math.min(1, m * 1.8) : 0;
  if (rimA > 0) {
    p.ring(0, 0, R, 2.2, (v, ang) => (0.5 + 0.5 * Math.sin(ang * 9 + ph * TAU * 4) > 0.25 ? C[6] : C[4]), rimA);
    for (let i = 0; i < 3; i++) {
      const a0 = (i / 3) * TAU + ph * TAU;
      p.arc(0, 0, R + 0.6, 2.4, a0, a0 + 0.55, C[7], rimA);
    }
  }
  p.glowRing(0, 0, R, 9, C[4], 0.45 * m);
  p.glow(0, 0, R * 0.9, C[2], 0.18 * m);
}
