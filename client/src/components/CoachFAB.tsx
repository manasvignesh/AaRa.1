import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

export function CoachFAB() {
  const [location] = useLocation();
  const { theme } = useTheme();

  if (location === "/coach") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0, opacity: 0, y: 20 }}
        className="fixed bottom-24 right-6 z-50 md:hidden"
      >
        <Link href="/coach">
          <button
            className="flex items-center justify-center transition-all active:scale-90"
            style={{
              width: 56,
              height: 56,
              borderRadius: "1rem",
              background:
                theme === "dark"
                  ? "#E8A93A"
                  : "linear-gradient(135deg, #2F80ED, #28B5A0)",
              boxShadow:
                theme === "dark"
                  ? "0 12px 30px rgba(232,169,58,0.4)"
                  : "0 12px 30px rgba(47,128,237,0.28)",
            }}
            aria-label="Ask Coach"
          >
            <Sparkles
              className="w-6 h-6 fill-current"
              style={{ color: theme === "dark" ? "#111318" : "#FFFFFF" }}
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute inset-0 rounded-2xl border-2"
              style={{
                borderColor:
                  theme === "dark" ? "rgba(17,19,24,0.18)" : "rgba(255,255,255,0.3)",
              }}
            />
          </button>
        </Link>
      </motion.div>
    </AnimatePresence>
  );
}
