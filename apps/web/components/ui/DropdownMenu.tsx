"use client";

/**
 * Portal-based dropdown menu.
 *
 * Renders children into document.body via createPortal so the menu is never
 * clipped by a parent's stacking context (no more z-index battles or sibling
 * elements bleeding through). Positions itself with `position: fixed` derived
 * from the trigger element's bounding rect, so it always floats above
 * everything at z-[9999].
 */

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

interface DropdownMenuProps {
  /** Ref to the button that opens the menu — used for positioning. */
  triggerRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Which edge of the trigger to align to (default: "right"). */
  align?: "left" | "right";
  /** Gap between trigger bottom and menu top in px (default: 4). */
  gap?: number;
  className?: string;
}

export function DropdownMenu({
  triggerRef,
  open,
  onClose,
  children,
  align = "right",
  gap = 4,
  className = "",
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  /** Reposition the menu relative to the trigger. */
  const reposition = useCallback(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;
    const r = trigger.getBoundingClientRect();
    menu.style.top = `${r.bottom + gap}px`;
    if (align === "right") {
      menu.style.right = `${window.innerWidth - r.right}px`;
      menu.style.left = "auto";
    } else {
      menu.style.left = `${r.left}px`;
      menu.style.right = "auto";
    }
  }, [triggerRef, align, gap]);

  /* Reposition whenever the menu opens or the viewport scrolls/resizes. */
  useEffect(() => {
    if (!open) return;
    // Wait one frame so the portal node is in the DOM before measuring.
    const raf = requestAnimationFrame(reposition);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  /* Close on outside click or Escape. */
  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, triggerRef]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{
        position: "fixed",
        zIndex: 9999,
        // Hidden until reposition() fires so it doesn't flash at 0,0.
        visibility: open ? "visible" : "hidden",
        pointerEvents: open ? "auto" : "none",
      }}
      className={`min-w-[8rem] rounded-xl bg-surface-raised border border-white/[0.1] shadow-2xl overflow-hidden
        transition-[opacity,transform] duration-100 origin-top-right
        ${open ? "opacity-100 scale-100" : "opacity-0 scale-95"}
        ${className}`}
    >
      {children}
    </div>,
    document.body,
  );
}
