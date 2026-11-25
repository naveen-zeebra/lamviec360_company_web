"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "./Icon";

function normalizeSearchText(str) {
  return String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

export default function SearchableSelect({
  id,
  label,
  options = [],
  value,
  onChange,
  onBlur,
  placeholder = "Select an option",
  searchPlaceholder = "Search...",
  emptyText = "No matching options",
  clearLabel = "Clear selection",
  leftIcon,
  allowCustom = false,
  customActionLabel,
  error,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  const normalizedOptions = useMemo(
    () =>
      options.map((o) =>
        typeof o === "object" && o !== null
          ? { value: String(o.value ?? ""), label: String(o.label ?? o.value ?? "") }
          : { value: String(o), label: String(o) }
      ),
    [options]
  );

  const selectedOption = useMemo(
    () => normalizedOptions.find((o) => o.value === value),
    [normalizedOptions, value]
  );
  const displayLabel = selectedOption ? selectedOption.label : value || "";

  const filteredOptions = useMemo(() => {
    const nq = normalizeSearchText(query);
    if (!nq) return normalizedOptions;
    return normalizedOptions.filter(
      (o) =>
        normalizeSearchText(o.label).includes(nq) ||
        normalizeSearchText(o.value).includes(nq)
    );
  }, [normalizedOptions, query]);

  const trimmedQuery = query.trim();
  const hasExactMatch = useMemo(() => {
    const nq = normalizeSearchText(trimmedQuery);
    if (!nq) return true;
    return normalizedOptions.some(
      (o) => normalizeSearchText(o.label) === nq || normalizeSearchText(o.value) === nq
    );
  }, [normalizedOptions, trimmedQuery]);

  const showCustomOption = allowCustom && Boolean(trimmedQuery) && !hasExactMatch;
  const selectableItems = useMemo(() => {
    const items = filteredOptions.map((o) => ({ ...o, isCustom: false }));
    if (showCustomOption) {
      items.push({ value: trimmedQuery, label: trimmedQuery, isCustom: true });
    }
    return items;
  }, [filteredOptions, showCustomOption, trimmedQuery]);

  const closeMenu = (markTouched = true) => {
    setOpen(false);
    setQuery("");
    if (markTouched) onBlur?.();
  };

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const tId = setTimeout(() => searchInputRef.current?.focus(), 0);
    const handleOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        closeMenu(true);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => {
      clearTimeout(tId);
      document.removeEventListener("mousedown", handleOutside);
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-option-index="${activeIndex}"]`);
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const handleSelect = (val) => {
    onChange?.(val);
    closeMenu(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.("");
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu(true);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (selectableItems.length > 0) {
        setActiveIndex((prev) => (prev + 1) % selectableItems.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (selectableItems.length > 0) {
        setActiveIndex((prev) => (prev - 1 + selectableItems.length) % selectableItems.length);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = selectableItems[activeIndex];
      if (target) {
        handleSelect(target.value);
      } else if (allowCustom && trimmedQuery) {
        handleSelect(trimmedQuery);
      }
    }
  };

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1.5 font-body">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-ink">
          {label}
        </label>
      )}
      <div
        className={[
          "flex items-center gap-2 rounded-md border-[1.5px] bg-card transition-shadow",
          error
            ? "border-danger"
            : open
            ? "border-line-brand ring-[3px] ring-blue-100"
            : "border-line",
          disabled ? "cursor-not-allowed opacity-60" : "",
        ].join(" ")}
      >
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((v) => !v)}
          className="flex flex-1 items-center gap-2 bg-transparent px-3.5 py-[11px] text-left font-body text-base outline-none cursor-pointer min-w-0"
        >
          {leftIcon && <Icon name={leftIcon} size={16} className="text-muted shrink-0" />}
          <span className={`truncate flex-1 ${displayLabel ? "text-ink" : "text-faint"}`}>
            {displayLabel || placeholder}
          </span>
        </button>

        {value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={clearLabel}
            className="mr-0.5 inline-flex items-center justify-center rounded p-1 text-muted hover:bg-sunken hover:text-ink cursor-pointer"
          >
            <Icon name="x" size={14} />
          </button>
        )}

        <button
          type="button"
          disabled={disabled}
          tabIndex={-1}
          aria-label="Toggle options"
          onClick={() => !disabled && setOpen((v) => !v)}
          className="pr-3 py-2 text-muted hover:text-ink cursor-pointer flex items-center"
        >
          <Icon
            name="chevron-down"
            size={16}
            className={`transition-transform duration-150 ${open ? "rotate-180 text-brand" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div
          data-searchable-popover="true"
          className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-line bg-card shadow-lg"
        >
          <div className="border-b border-line bg-sunken/40 p-2">
            <div className="flex items-center gap-2 rounded-md border border-line bg-card px-2.5 py-1.5 focus-within:border-line-brand focus-within:ring-2 focus-within:ring-blue-100">
              <Icon name="search" size={14} className="text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={searchPlaceholder}
                className="w-full border-none bg-transparent font-body text-sm text-ink placeholder:text-faint outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="text-muted hover:text-ink p-0.5 cursor-pointer"
                >
                  <Icon name="x" size={13} />
                </button>
              )}
            </div>
          </div>

          <div
            ref={listRef}
            role="listbox"
            className="max-h-60 overflow-y-auto py-1"
          >
            {selectableItems.length === 0 ? (
              <div className="px-3.5 py-3 text-center text-xs text-muted">{emptyText}</div>
            ) : (
              selectableItems.map((item, idx) => {
                const isSelected = value === item.value;
                const isActive = idx === activeIndex;
                return (
                  <button
                    key={item.isCustom ? `__custom__${item.value}` : item.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    data-option-index={idx}
                    data-custom-option={item.isCustom ? "true" : undefined}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelect(item.value)}
                    className={[
                      "flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-sm transition-colors cursor-pointer",
                      item.isCustom
                        ? "border-t border-line/60 font-medium text-brand hover:bg-brand-subtle"
                        : isSelected
                        ? "bg-brand-subtle font-semibold text-brand"
                        : isActive
                        ? "bg-sunken text-ink"
                        : "text-ink hover:bg-sunken",
                    ].join(" ")}
                  >
                    <span className="flex items-center gap-2 truncate">
                      {item.isCustom && <Icon name="plus" size={14} className="shrink-0" />}
                      <span className="truncate">
                        {item.isCustom
                          ? customActionLabel
                            ? customActionLabel(item.value)
                            : `Use "${item.value}"`
                          : item.label}
                      </span>
                    </span>
                    {isSelected && !item.isCustom && (
                      <Icon name="check" size={14} className="text-brand shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}
