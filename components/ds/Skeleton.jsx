export default function Skeleton({ width = "100%", height = 16, radius = "var(--radius-sm)", style }) {
  return (
    <span
      className="lv-skeleton block"
      style={{ width, height, borderRadius: radius, ...style }}
      aria-hidden="true"
    />
  );
}
