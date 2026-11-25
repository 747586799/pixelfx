import { Rng, fit, clamp, ease, TAU, WHITE } from "../../core/index.js";
import { drawStorm, R, PALETTE } from "./_blizzard.js";

const T = 1.5, RAMP = 0.12, FULL = 1.34;

export const meta = {
  name: "Blizzard gathers",
  desc: "A storm spins up from nothing: flakes streak in along the wind, snow gathers into a churning ring and a dark eye opens. Its last frame is the blizzard's first.",
  tags: ["ice", "blizzard", "snow", "storm", "wind", "vortex", "top-down", "transition"],
  size: [176, 176],
  origin: [88, 88],
  duration: T,
  loop: false,
  fps: 30,
  bg: "dark",
  options: { palette: PALETTE, seed: 7 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 8), m = clamp((t - RAMP) / (FULL - RAMP));
  // the ring forms small and grows outward into the loop's shape, so the last frame matches it exactly
  drawStorm(p, o, 0, m, 1 - 0.5 * (1 - m));

  // a cold glint where it starts, gone long before the storm fills in
  if (t < 0.55) p.glow(0, 0, 20, C[5], 0.35 * (1 - t / 0.55));

  // flakes torn in ahead of the wall, spiralling down onto it
  const rng = new Rng(o.seed + 41);
  for (let i = 0; i < 70; i++) {
    const delay = rng.range(0, 0.98), life = Math.min(rng.range(0.3, 0.65), 1.3 - delay), rho0 = rng.range(1.02, 1.12), rho1 = rng.range(0.35, 0.8),
      a0 = rng.range(0, TAU), big = rng.chance(0.2);
    const age = t - delay;
    if (age < 0 || age > life) continue;
    const k = clamp(age / life), at = (q) => {
      const rho = rho0 - (rho0 - rho1) * ease.outCubic(q), th = a0 + 2.2 * (rho0 - rho);
      return [Math.cos(th) * rho * R, Math.sin(th) * rho * R];
    };
    const [x, y] = at(k), [x2, y2] = at(Math.max(0, k - 0.14));
    p.line(x2, y2, x, y, k < 0.3 ? WHITE : C[6], (1 - k) * 0.85);
    if (big) {
      p.dot(x, y, WHITE, 1 - k);
      p.dot(x - 1, y, C[6], 1 - k);
      p.dot(x + 1, y, C[6], 1 - k);
      p.dot(x, y - 1, C[6], 1 - k);
      p.dot(x, y + 1, C[6], 1 - k);
    }
  }
}
