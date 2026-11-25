import { Rng, fit, clamp, TAU, WHITE } from "../../core/index.js";
import { drawStorm, D, R, PALETTE } from "./_blizzard.js";

const T = 1.5, HOLD = 0.1, GONE = 1.34;

export const meta = {
  name: "Blizzard breaks",
  desc: "The storm comes apart: the ring slows and thins, snow and ice fly off outward and the eye closes. Its first frame is the blizzard's last, and it fades to nothing.",
  tags: ["ice", "blizzard", "snow", "storm", "wind", "vortex", "top-down", "transition"],
  size: [176, 176],
  origin: [88, 88],
  duration: T,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PALETTE, seed: 7 },
};

// the blizzard's last frame is the 71st of its 72 at 30 fps. Its time is accumulated the way the runtime
// steps it, so the first frame here comes out identical to that frame, not just close to it
let lastTime = 0;
for (let i = 0; i < 71; i++) lastTime += 1 / 30;
const LAST = lastTime / D;

export function draw(p, t, o) {
  const C = fit(o.palette, 8), f = clamp((t - HOLD) / (GONE - HOLD)), m = 1 - f;
  // the ring keeps turning but winds down as it lets go
  drawStorm(p, o, LAST + (t / D) * (1 - 0.35 * (t / T)), m);

  // snow and grit flung outward as the wall lets go
  const rng = new Rng(o.seed + 43);
  for (let i = 0; i < 80; i++) {
    const delay = rng.range(0.04, 0.85), life = Math.min(rng.range(0.35, 0.8), 1.38 - delay), rho0 = rng.range(0.4, 0.95),
      rho1 = rng.range(1.02, 1.12), a0 = rng.range(0, TAU), big = rng.chance(0.18);
    const age = t - delay;
    if (age < 0 || age > life) continue;
    const k = clamp(age / life), at = (q) => {
      const rho = rho0 + (rho1 - rho0) * q ** 1.4, th = a0 + 1.8 * (rho - rho0);
      return [Math.cos(th) * rho * R, Math.sin(th) * rho * R];
    };
    const [x, y] = at(k), [x2, y2] = at(Math.max(0, k - 0.16));
    p.line(x2, y2, x, y, k < 0.3 ? WHITE : C[5], (1 - k) * 0.8);
    if (big) {
      p.dot(x, y, WHITE, 1 - k);
      p.dot(x - 1, y, C[6], 1 - k);
      p.dot(x + 1, y, C[6], 1 - k);
      p.dot(x, y - 1, C[6], 1 - k);
      p.dot(x, y + 1, C[6], 1 - k);
    }
  }

  // loose snow torn off the top of the wall, swelling and thinning as it goes
  for (let i = 0; i < 16; i++) {
    const delay = rng.range(0.06, 0.7), life = Math.min(rng.range(0.45, 0.85), 1.35 - delay), rho0 = rng.range(0.5, 0.9),
      rho1 = rng.range(0.9, 1), a0 = rng.range(0, TAU), sz = rng.range(3, 6);
    const age = t - delay;
    if (age < 0 || age > life) continue;
    const k = clamp(age / life), rho = rho0 + (rho1 - rho0) * k, th = a0 + 1.4 * (rho - rho0);
    p.disc(Math.cos(th) * rho * R, Math.sin(th) * rho * R, sz * (1 + 0.6 * k), C[2], 0.2 * (1 - k));
  }
}
