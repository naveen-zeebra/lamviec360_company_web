export default function Avatar({ src, name = "", size = 40, shape = "circle" }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  const radius = shape === "circle" ? "50%" : "var(--radius-md)";
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="border border-line object-cover"
        style={{ width: size, height: size, borderRadius: radius }}
      />
    );
  }
  return (
    <div
      className="flex items-center justify-center bg-blue-100 font-body font-bold text-blue-700"
      style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.38 }}
    >
      {initials || "?"}
    </div>
  );
}
