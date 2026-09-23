"use client";
import * as Icons from "lucide-react";

function pascal(name) {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

export default function Icon({ name, size = 20, style }) {
  const Cmp = Icons[pascal(name)];
  const { fill, ...wrapperStyle } = style || {};
  return (
    <span
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        ...wrapperStyle,
      }}
    >
      {Cmp && <Cmp size={size} strokeWidth={2} fill={fill || "none"} />}
    </span>
  );
}
