import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  height?: "half" | "tall" | "full";
}

const HEIGHT_CLASS = {
  half: "max-h-[55vh]",
  tall: "max-h-[78vh]",
  full: "max-h-[92vh]",
};

export function BottomSheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  icon,
  height = "tall",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // Don't close BottomSheet if a modal/dialog is currently open on top
        const openDialog = document.querySelector('[role="dialog"][data-state="open"]');
        if (!openDialog) onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 40 }}
            className={`fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-background rounded-t-3xl shadow-2xl border-t border-border/60 ${HEIGHT_CLASS[height]}`}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-border/60" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-3">
                {icon && (
                  <div className="p-2 rounded-xl bg-primary/10 shrink-0">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="font-semibold text-base leading-tight">{title}</h2>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-xl h-8 w-8 shrink-0"
                data-testid="button-close-bottom-sheet"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
