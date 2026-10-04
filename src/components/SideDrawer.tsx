import { useEffect } from "react";
import { X } from "lucide-react";

/**
 * A left-hand navigation column that is inline and sticky from `bp` upwards, and
 * an off-canvas drawer below that breakpoint.
 *
 * Below the breakpoint the panel is pulled out of the flow entirely (it does not
 * sit stacked above the page content) and slides in from the left edge over a
 * backdrop. Above it the same children render inline in the page grid.
 *
 * The children are rendered once per presentation, so keep them free of element
 * ids - duplicate ids would be invalid HTML.
 */
export function SideDrawer({
  open,
  onClose,
  label,
  bp,
  className = "",
  panelClassName = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  /** Breakpoint where the panel becomes an inline column: "md" or "lg". */
  bp: "md" | "lg";
  /** Extra classes for the inline column, e.g. to collapse it on wide screens. */
  className?: string;
  /** Extra classes for the drawer panel itself. */
  panelClassName?: string;
  children: React.ReactNode;
}) {
  // Escape closes it, and the page behind must not scroll while it is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  const inline = bp === "lg" ? "hidden lg:block" : "hidden md:block";

  return (
    <>
      <div className={inline + " " + className}>{children}</div>

      <div
        className={
          (bp === "lg" ? "lg:hidden " : "md:hidden ") + (open ? "" : "pointer-events-none ")
        }
      >
        <div
          onClick={onClose}
          className={
            "fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 " +
            (open ? "opacity-100" : "opacity-0")
          }
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={
            "fixed inset-y-0 left-0 z-50 w-[85%] max-w-[300px] overflow-y-auto bg-[#111] p-4 shadow-2xl transition-transform duration-200 " +
            (open ? "translate-x-0" : "-translate-x-full") +
            " " +
            panelClassName
          }
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={`Fermer ${label.toLowerCase()}`}
            className="mb-3 ml-auto grid h-8 w-8 place-items-center rounded bg-white/10 text-white/70 hover:bg-white/15 hover:text-white"
          >
            <X className="w-4" />
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
