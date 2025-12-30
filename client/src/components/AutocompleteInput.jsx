import React, { useEffect, useMemo, useRef, useState } from "react";
import "./AutocompleteInput.css";

/**
 * AutocompleteInput
 * - value: current text value shown in input
 * - onChange: (nextText) => void
 * - items: array of options
 * - getKey: (item) => string
 * - getLabel: (item) => string  // main text to show
 * - getMeta: (item) => string   // secondary text (email, prices, etc.)
 * - onPick: (item) => void      // when user selects an option
 * - placeholder
 */
export default function AutocompleteInput({
  value,
  onChange,
  items,
  getKey,
  getLabel,
  getMeta,
  onPick,
  placeholder,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState(-1);
  const wrapRef = useRef(null);

  const filtered = useMemo(() => {
    const q = (value || "").trim().toLowerCase();
    if (!q) return [];
    // show first 8 matches
    return items
      .filter((it) => getLabel(it).toLowerCase().includes(q))
      .slice(0, 8);
  }, [value, items, getLabel]);

  useEffect(() => {
    function onDocClick(e) {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  function pick(item) {
    onPick(item);
    setOpen(false);
    setHoverIndex(-1);
  }

  function onKeyDown(e) {
    if (!open && e.key === "ArrowDown" && filtered.length) {
      setOpen(true);
      setHoverIndex(0);
      return;
    }
    if (!open) return;

    if (e.key === "Escape") {
      setOpen(false);
      setHoverIndex(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHoverIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHoverIndex((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      if (hoverIndex >= 0 && hoverIndex < filtered.length) {
        e.preventDefault();
        pick(filtered[hoverIndex]);
      }
    }
  }

  return (
    <div className="ac-wrap" ref={wrapRef}>
      <input
        className="entity-input"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHoverIndex(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />

      {open && filtered.length > 0 && !disabled && (
        <div className="ac-menu">
          {filtered.map((it, idx) => (
            <div
              key={getKey(it)}
              className={`ac-item ${idx === hoverIndex ? "active" : ""}`}
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseDown={(e) => e.preventDefault()} // keep focus
              onClick={() => pick(it)}
            >
              <div className="ac-main">{getLabel(it)}</div>
              <div className="ac-meta">{getMeta ? getMeta(it) : ""}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
