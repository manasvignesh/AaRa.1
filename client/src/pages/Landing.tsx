import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Heart, Activity, Zap, Shield, Target, Globe, Layers, Cpu, Fingerprint, RefreshCcw, Wifi, BatteryCharging, Power } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";
import React, { useState, useEffect } from "react";

export default function Landing() {
  const [scanned, setScanned] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 50);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] relative overflow-hidden flex flex-col font-sans selection:bg-primary/30">
      {/* Dynamic Cybergrid & Scanning Line */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="h-full w-full opacity-10"
          style={{
            backgroundImage: 'linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)',
            backgroundSize: '60px 60px'
          }}
        />
        <motion.div
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary/50 to-transparent shadow-[0_0_20px_rgba(142,214,63,0.5)] z-20"
        />
      </div>

      {/* Volumetric Light Aura */}
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/20 blur-[180px] rounded-full mix-blend-screen opacity-20 animate-pulse" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-primary/10 blur-[180px] rounded-full mix-blend-screen opacity-10" />

      {/* Top Navigation Hub */}
      <header className="relative z-50 flex items-center justify-between px-8 md:px-16 py-10 max-w-[1600px] mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-4 group"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-2 border border-primary/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
            />
            <img src={aaraLogo} alt="AaRa" className="h-14 w-auto brightness-125 drop-shadow-[0_0_10px_rgba(142,214,63,0.3)] group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex flex-col">
            <span className="text-3xl font-display font-bold tracking-tighter text-white leading-none">AARA<span className="text-primary">.AI</span></span>
            <span className="text-[8px] font-mono text-white/40 tracking-[0.4em] mt-1 uppercase">Advanced Autonomous Recovery Assistant</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden md:flex items-center gap-10"
        >
          <div className="flex items-center gap-8">
            {['Architecture', 'Neural Core', 'Biometrics'].map((item) => (
              <button key={item} className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/40 hover:text-primary transition-all relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-primary transition-all group-hover:w-full" />
              </button>
            ))}
          </div>
          <div className="h-4 w-[1px] bg-white/10" />
          <Link href="/auth?tab=login">
            <button className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-white/80 hover:text-primary transition-colors">
              Access_Node
            </button>
          </Link>
          <Link href="/auth?tab=register">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(142,214,63,0.3)" }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-black px-10 py-4 rounded-xl font-display font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all"
            >
              Initialize_System
            </motion.button>
          </Link>
        </motion.div>
      </header>

      {/* Main Tactical Interface */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="max-w-[1200px] mx-auto space-y-16 relative">
          {/* Floating UI Bits */}
          <div className="absolute -top-32 -left-32 w-48 h-48 opacity-20 pointer-events-none hidden xl:block">
            <div className="absolute inset-0 border border-white/20 rounded-full animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-4 border border-primary/40 rounded-full animate-[spin_6s_linear_infinite_reverse]" />
            <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-primary opacity-50" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full glass-card border-white/5 text-[10px] font-mono font-bold text-white/60 uppercase tracking-[0.4em] mb-12 group hover:border-primary/20 transition-all cursor-default">
              <span className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                NEURAL_LINK: ONLINE
              </span>
              <div className="w-[1px] h-3 bg-white/10" />
              <span>V_4.2.0_ENGINE</span>
            </div>

            <h1 className="text-7xl md:text-9xl lg:text-[11rem] font-display font-bold text-white tracking-tighter leading-[0.8] mb-12 relative">
              ULTRA<br />
              <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-white bg-[length:200%_auto] animate-gradient-x underline decoration-primary/5 decoration-4">
                HUMAN
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, delay: 1 }}
                  className="absolute -bottom-4 left-0 h-2 bg-primary/20 rounded-full blur-sm"
                />
              </span>
            </h1>

            <p className="text-xl md:text-3xl text-white/40 max-w-3xl mx-auto font-display font-medium leading-tight tracking-tight mt-8">
              The blueprint for the high-performance biological machine.
              <span className="text-white"> Precision metabolic tracking</span> meets next-gen kinetic engineering.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12"
          >
            <Link href="/auth?tab=register" className="w-full sm:w-auto">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full sm:w-auto relative group overflow-hidden"
              >
                <div className="absolute inset-0 bg-primary opacity-0 group-hover:opacity-20 transition-opacity blur-xl rounded-2xl" />
                <div className="relative px-14 py-8 bg-primary rounded-2xl flex items-center gap-4 text-black font-display font-bold text-2xl uppercase tracking-tighter shadow-[0_20px_40px_rgba(142,214,63,0.3)]">
                  Engage_System <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </div>
              </motion.button>
            </Link>

            <button className="relative px-10 py-8 rounded-2xl border border-white/5 glass-card group hover:border-primary/20 transition-all flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:text-primary transition-colors">
                <Layers className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="text-[8px] font-mono text-white/30 uppercase tracking-[0.2em]">Technical_Protocol</div>
                <div className="text-sm font-display font-bold text-white uppercase tracking-widest tracking-tighter">View_Whitepaper</div>
              </div>
            </button>
          </motion.div>

          {/* Biometric Status Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-32 relative">
            <div className="absolute inset-0 bg-primary/2 blur-[100px] -z-10" />
            {[
              { label: "Neural_Capacity", val: "98.4%", icon: Activity, color: "text-primary" },
              { label: "Metabolic_Sync", val: "ACTIVE", icon: Zap, color: "text-orange-500" },
              { label: "Kinetic_Output", val: "OPTIMAL", icon: Target, color: "text-blue-500" },
              { label: "Hardware_Link", val: "STABLE", icon: ShieldCheck, color: "text-green-500" }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="p-8 glass-card rounded-[2rem] border-white/5 text-left group hover:border-white/10 transition-all relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                  <stat.icon className={cn("w-12 h-12", stat.color)} />
                </div>
                <stat.icon className={cn("w-6 h-6 mb-6", stat.color)} />
                <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.4em] mb-2">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-white uppercase tracking-tighter">{stat.val}</p>
                <div className="mt-4 h-[1px] w-full bg-white/5 overflow-hidden">
                  <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: i * 0.5 }}
                    className={cn("h-full w-1/3 bg-gradient-to-r from-transparent via-current to-transparent", stat.color)}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Futuristic Bottom Status Strip */}
      <footer className="relative z-50 px-8 py-8 md:px-16 border-t border-white/5 glass-card">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8 font-mono text-[9px] font-bold uppercase tracking-[0.4em] text-white/30">
          <div className="flex items-center gap-10">
            <span className="flex items-center gap-2"><Wifi className="w-3 h-3 text-primary" /> Signal_Strong</span>
            <span className="flex items-center gap-2"><BatteryCharging className="w-3 h-3 text-primary" /> Bio_Cell: 89%</span>
            <span className="hidden md:inline">Region: AP_SOUTH_1</span>
          </div>

          <div className="flex items-center gap-8">
            <span className="text-white/60">© 2026 AARA_LABS // ALL SYSTEMS OPERATIONAL</span>
            <div className="flex gap-4">
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
