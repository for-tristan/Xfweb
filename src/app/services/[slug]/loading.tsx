/**
 * Loading state — shown immediately by Next.js during route transition,
 * before the new page component even mounts. This eliminates the blank
 * screen gap between clicking a link and the 3-dot loader appearing.
 */
export default function Loading() {
  return (
    <div className="xf-loader" role="status" aria-label="Loading">
      <div className="xf-loader-dot" />
      <div className="xf-loader-dot" />
      <div className="xf-loader-dot" />
    </div>
  );
}
