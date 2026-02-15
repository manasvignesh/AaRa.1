import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Sparkles, Heart, Activity, Target, Zap, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import aaraLogo from "@/assets/aara-logo.png";
import { cn } from "@/lib/utils";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden selection:bg-primary/20">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-brand-blue/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] rounded-full bg-emerald-500/5 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 py-8 px-6 md:px-12 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <img src={aaraLogo} alt="AaRa" className="h-16 md:h-20 w-auto" />
          </motion.div>
        </div>
        <Link href="/auth?tab=login">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Button
              variant="link"
              className="rounded-full px-8 h-12 text-[13px] font-black uppercase tracking-[0.2em] text-foreground hover:text-primary transition-colors"
            >
              Member Login
            </Button>
          </motion.div>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative flex-1 flex flex-col items-center justify-center px-6 md:px-12 py-10 md:py-20 text-center">
        <div className="max-w-4xl mx-auto space-y-12">

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-card/40 backdrop-blur-md border border-border/5 text-primary text-[10px] font-black uppercase tracking-[0.3em] shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>Intelligent Health Evolution</span>
            </div>

            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground leading-[0.9] text-center">
              Your Body,<br />
              <span className="brand-gradient-text">Masterfully Optimized.</span>
            </h1>

            <p className="text-[17px] md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-medium">
              AaRa is the next generation of wellness. An adaptive, AI-driven experience that transforms your biology without extreme measures.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link href="/auth?tab=register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto rounded-[24px] text-lg px-12 h-20 brand-gradient hover:opacity-90 shadow-2xl shadow-brand-blue/30 hover:shadow-brand-blue/40 hover:-translate-y-1 transition-all border-0 text-white font-black"
              >
                Start Journey <ChevronRight className="ml-2 w-6 h-6" />
              </Button>
            </Link>
          </motion.div>

          {/* Features Strip */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="grid md:grid-cols-3 gap-8 mt-12 text-center"
          >
            {[
              {
                title: "Precision Fuel",
                desc: "Adaptive meal systems that align with your metabolic signature.",
                icon: Activity,
                color: "text-primary bg-primary/5"
              },
              {
                title: "Smart Training",
                desc: "Workouts that evolve with your performance intensity.",
                icon: Zap,
                color: "text-brand-blue bg-brand-blue/5"
              },
              {
                title: "Goal Precision",
                desc: "High-fidelity progress tracking for meaningful transformations.",
                icon: Target,
                color: "text-emerald-500 bg-emerald-500/5"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group p-8 rounded-[40px] bg-card/30 backdrop-blur-xl border border-white/40 shadow-xl shadow-black/[0.02] flex flex-col items-center gap-4 hover:bg-card/50 transition-all duration-500"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-inner group-hover:scale-110 transition-transform", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black tracking-tight text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground font-medium leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </main>

      {/* Large visual element placeholder/accent */}
      <div className="relative py-20 px-6 overflow-hidden">
        <div className="max-w-6xl mx-auto h-[1px] bg-gradient-to-r from-transparent via-border to-transparent opacity-20" />
        <div className="mt-20 flex justify-center opacity-[0.03] select-none pointer-events-none">
          <span className="text-[200px] font-black tracking-tighter leading-none grayscale blur-sm">AARA</span>
        </div>
      </div>

      {/* Small footer */}
      <footer className="py-10 px-6 border-t border-border/5 text-center">
        <p className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.5em]">The Architecture of Human Vitality</p>
      </footer>
    </div>
  );
}
