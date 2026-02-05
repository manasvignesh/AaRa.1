import { Link, useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function CoachFAB() {
    const [location] = useLocation();

    // Hide FAB if already on the Coach page
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
                        className={cn(
                            "w-14 h-14 rounded-full bg-[#2CC0D8] text-white shadow-lg shadow-[#2CC0D8]/30",
                            "flex items-center justify-center transition-all active:scale-90"
                        )}
                        aria-label="Ask Coach"
                    >
                        <Sparkles className="w-6 h-6 fill-current" />
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute inset-0 rounded-full border-2 border-white/30"
                        />
                    </button>
                </Link>
            </motion.div>
        </AnimatePresence>
    );
}
