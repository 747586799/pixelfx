import { drawStorm, D, PALETTE } from "./_blizzard.js";

export const meta = {
  name: "Blizzard overhead",
  desc: "Seen from straight above: snow churns round a dark eye, flakes and ice grit whirling with the wind, snow boiling off the ragged rim and a cold flicker in the funnel.",
  tags: ["ice", "blizzard", "snow", "storm", "wind", "vortex", "swirl", "top-down", "loop"],
  size: [176, 176],
  origin: [88, 88],
  duration: D,
  loop: true,
  fps: 30,
  bg: "dark",
  options: { palette: PALETTE, seed: 7 },
};

export function draw(p, t, o) {
  drawStorm(p, o, t / D);
}
