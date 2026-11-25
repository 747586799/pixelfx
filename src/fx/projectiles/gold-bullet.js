import { fit, clamp, TAU, WHITE } from "../../core/index.js";

const D = 0.5;

export const meta = {
  name: "Gold bullet",
  desc: "A golden bullet in flight, spinning on its axis: a gilded ogive, a bronze driving band, a specular sweeping round it, rifling twisting along the body and air streaking behind.",
  tags: ["projectile", "bullet", "gold", "metal", "gun", "spin", "directional", "loop"],
  size: [88, 32],
  origin: [64, 16],
  duration: D,
  loop: true,
  fps: 30,
  bg: "dark",
  options: {
    gold: ["#2a1a06", "#4d2f0a", "#7a4c10", "#a86c18", "#d1952b", "#edba4c", "#ffdf76", "#fff2bd", "#ffffff"],
    band: ["#1e0f06", "#3d2010", "#633317", "#8d4a1e", "#b56b2a", "#d99850"],
    seed: 3,
  },
};

// half-height of the bullet at x: an ogive nose, a straight body, a slight boat-tail at the base
function radius(x) {
  if (x > 3) {
    const u = (x - 3) / 12;
    return u >= 1 ? 0 : 3.6 * Math.pow(1 - u * u, 0.6);
  }
  if (x < -9.5) return 3.6 * (1 - 0.18 * Math.min(1, (-9.5 - x) / 2.5));
  return 3.6;
}
const step = (ramp, t) => ramp[clamp(Math.floor(t * (ramp.length - 1)), 0, ramp.length - 1)];

export function draw(p, t, o) {
  const M = fit(o.gold, 9), B = fit(o.band, 6), ph = t / D, spin = ph * TAU;
  const oy = Math.sin(ph * TAU * 2) * 0.5;

  // the bullet, drawn as a cylinder lit from up-left: the light itself stays put, the metal turns under it
  p.shade(-12, -5 + oy, 16, 5 + oy, (x, y, out) => {
    y -= oy;
    const r = radius(x);
    if (r <= 0 || Math.abs(y) > r) return;
    const d = y / r, nz = Math.sqrt(Math.max(0, 1 - d * d));
    const dot = clamp(-d * 0.6 + nz * 0.8, 0, 1);
    let k = 0.22 + 0.66 * dot ** 1.15;

    // the reflection sweeping round the jacket as it turns: a bright band and its dark counterpart
    if (Math.abs(d - Math.sin(spin)) < 0.14 && x < 12.5) k += 0.34;
    else if (Math.abs(d + Math.sin(spin)) < 0.14) k -= 0.22;
    // rifling: bright helical grooves twisting along the body as it turns
    const g = Math.sin(1.5 * x + spin + (x > 3 ? 0.7 : 0));
    if (g > 0.9 && d < 0.3) k += 0.3;
    else if (g < -0.9) k -= 0.26;

    let c;
    if (x < -11.2) c = M[2]; // the dark base face
    else if (x < -6.5 && x > -8.7) {
      // the bronze driving band, with a glint racing round it as it spins
      c = step(B, k * 0.9);
      if (Math.abs(d - Math.sin(spin * 2 + 0.7)) < 0.18) c = B[5];
    } else c = step(M, k);

    // a clean dark rim along the silhouette, a lit edge on top, and a white glint on the tip
    if (r - Math.abs(y) < 0.65) c = d < 0 ? M[5] : M[2];
    if (x > 14.2) c = WHITE;
    out.c = c;
  });

  // air torn off the base, in a few long dashes that stream back and fade
  for (let i = 0; i < 4; i++) {
    const q = (ph * 3 + i * 0.41) % 1, len = 8 + (i % 2) * 5;
    const x = -12 - q * 46, y = -2.6 + i * 1.7 + Math.sin(ph * TAU * 2 + i) * 0.6;
    p.line(x - len, y, x, y, M[4], 0.6 * (1 - q));
  }

  // a small shine where the ogive catches the light
  p.glow(6, -1.6 + oy, 6, M[7], 0.3);
}
