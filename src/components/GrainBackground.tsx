/**
 * GrainBackground — pure CSS film grain overlay.
 *
 * Just a tiny inline SVG noise texture at low opacity, multiplied over
 * the white background. Kills the "flat plastic" feel without any
 * animation, JS, or mouse interaction. Server component — no client JS.
 *
 * If you ever want to dial the grain up/down, change --grain-opacity
 * in globals.css (0.04 is subtle, 0.08 is noticeable, 0.12 is heavy).
 */
export default function GrainBackground() {
  return <div className="grain-bg" aria-hidden="true" />;
}
