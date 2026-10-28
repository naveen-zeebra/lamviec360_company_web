"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

export default function Toast({ msg, toast, message }) {
  const display = msg || toast || message;
  return display ? (
    <div
      className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2.5 rounded-md bg-gray-900 px-5 py-3 text-sm text-white shadow-lg"
      role="status"
    >
      <Icon name="check-circle" size={16} />
      {display}
    </div>
  ) : null;
}

export function useToast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(""), 2400);
    return () => clearTimeout(t);
  }, [msg]);
  return [msg, setMsg];
}
