"use client";
import { useRef } from "react";

export default function Check({ label, checked, onChange, id }) {
  const ref = useRef("chk-" + Math.random().toString(36).slice(2, 9));
  const cid = id || ref.current;
  return (
    <div className="flex items-start gap-3 text-sm text-muted">
      <input
        type="checkbox"
        id={cid}
        checked={!!checked}
        onChange={onChange}
        className="mt-px h-[18px] w-[18px] flex-shrink-0 cursor-pointer accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-line-brand"
      />
      <label htmlFor={cid} className="cursor-pointer leading-relaxed">
        {label}
      </label>
    </div>
  );
}
