import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [location] = useLocation();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col md:flex-row">
            {/* Animated Background Particles */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <BackgroundParticles />
            </div>

            {/* Main Content with Page Transitions */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={location}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="relative z-10 flex-1 flex flex-col md:flex-row"
                >
                    {children}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const BackgroundParticles = () => {
    return (
        <div className="absolute inset-0">
            {[...Array(20)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute rounded-full bg-primary/20"
                    initial={{
                        x: Math.random() * 100 + "%",
                        y: Math.random() * 100 + "%",
                        width: Math.random() * 4 + 2,
                        height: Math.random() * 4 + 2,
                        opacity: Math.random() * 0.5
                    }}
                    animate={{
                        y: [null, "-100%"],
                        opacity: [null, 0]
                    }}
                    transition={{
                        duration: Math.random() * 20 + 10,
                        repeat: Infinity,
                        ease: "linear",
                        delay: Math.random() * 20
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
        </div>
    );
};
