import { drawShield, D, PALETTE } from "./_hexshield.js";

export const meta = {
  name: "Hex shield",
  desc: "A round energy barrier facing us: hex cells glow over a glassy film, a wave and a scan line run across it, single cells flicker and a bright rim turns with dashes racing round.",
  tags: ["scifi", "shield", "barrier", "hex", "energy", "defense", "loop"],
  size: [160, 160],
  origin: [80, 80],
  duration: D,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PALETTE, seed: 5 },
};

export function draw(p, t, o) {
  drawShield(p, o, t / D);
}
