import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styles from "./TimeSelect.module.css";

// Helper: generate times 00:00..23:45 by interval
export function generateTimeSlots(intervalMinutes = 15): string[] {
  const out: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      out.push(`${hh}:${mm}`);
    }
  }
  return out;
}

export interface TimeSelectProps {
  value: string; // "HH:MM"
  onChange: (value: string) => void;
  id?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  intervalMinutes?: number; // defaults to 15
}

export const VISIBLE_COUNT = 5;

export default function TimeSelect({
  value,
  onChange,
  id,
  placeholder = "Select time",
  className,
  disabled = false,
  ariaLabel,
  intervalMinutes = 15,
}: TimeSelectProps) {
  const times = useMemo(() => generateTimeSlots(intervalMinutes), [intervalMinutes]);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const [openUp, setOpenUp] = useState(false);

  // Index of current value
  const valueIndex = useMemo(() => times.indexOf(value), [times, value]);

  // Compute whether should open upward based on viewport space
  const recomputeOpenDirection = useCallback(() => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const itemHeight = 40; // must match CSS --item-height
    const dropdownHeight = itemHeight * VISIBLE_COUNT + 8; // small padding

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // prefer below if enough space; otherwise open up if there's room above
    const shouldOpenUp = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight;
    setOpenUp(Boolean(shouldOpenUp));
  }, []);

  useEffect(() => {
    if (open) {
      recomputeOpenDirection();
    }
  }, [open, recomputeOpenDirection]);

  // Click outside to close
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (e.target instanceof Node && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Keyboard handling
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const start = prev === null ? (valueIndex >= 0 ? valueIndex : -1) : prev;
          const next = Math.min(times.length - 1, start + 1);
          return next;
        });
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          const start = prev === null ? (valueIndex >= 0 ? valueIndex : 0) : prev;
          const next = Math.max(0, start - 1);
          return next;
        });
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        if (highlightedIndex === null) {
          // if nothing highlighted, choose current value or first
          const pick = valueIndex >= 0 ? valueIndex : 0;
          onChange(times[pick]);
          setOpen(false);
          buttonRef.current?.focus();
        } else {
          onChange(times[highlightedIndex]);
          setOpen(false);
          buttonRef.current?.focus();
        }
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, times, highlightedIndex, onChange, valueIndex]);

  // Ensure highlighted item is visible
  useEffect(() => {
    if (highlightedIndex === null) return;
    const el = itemRefs.current[highlightedIndex];
    if (el && listRef.current) {
      // scroll into view inside the list container
      el.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // When opening, set highlighted to current value
  useEffect(() => {
    if (open) {
      setHighlightedIndex(valueIndex >= 0 ? valueIndex : 0);
    } else {
      setHighlightedIndex(null);
    }
  }, [open, valueIndex]);

  const toggleOpen = useCallback(() => {
    if (disabled) return;
    setOpen((v) => !v);
  }, [disabled]);

  const handleSelect = useCallback(
    (idx: number) => {
      onChange(times[idx]);
      setOpen(false);
      buttonRef.current?.focus();
    },
    [onChange, times]
  );

  const onButtonKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      // when opening via arrow, highlighted will be set by effect
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setOpen(true);
      // openUp recompute will occur
    }
  };

  return (
    <div ref={wrapperRef} className={`${styles.wrapper} ${className ?? ""}`}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className={`${styles.button} ${disabled ? styles.disabled : ""}`}
        onClick={toggleOpen}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel ?? "Time select"}
        onKeyDown={onButtonKeyDown}
        disabled={disabled}
      >
        <span className={styles.value}>{value || <span className={styles.placeholder}>{placeholder}</span>}</span>
        <svg className={styles.chev} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="#9aa6b2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={listRef}
          role="listbox"
          aria-labelledby={id}
          className={`${styles.listRoot} ${openUp ? styles.openUp : styles.openDown}`}
          style={{ [openUp ? "bottom" : "top"]: "calc(100% + 6px)" } as React.CSSProperties}
        >
          <div className={styles.listInner} style={{ maxHeight: `calc(var(--item-height) * ${VISIBLE_COUNT})` }}>
            {times.map((t, i) => {
              const highlighted = i === highlightedIndex;
              const selected = i === valueIndex;
              return (
                <div
                  key={t}
                  id={`time-item-${i}`}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  role="option"
                  aria-selected={selected}
                  className={`${styles.item} ${highlighted ? styles.highlighted : ""} ${selected ? styles.selected : ""}`}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  onMouseDown={(e) => {
                    // prevent blur before click
                    e.preventDefault();
                  }}
                  onClick={() => handleSelect(i)}
                >
                  {t}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
