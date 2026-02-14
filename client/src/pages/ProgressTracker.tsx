import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/use-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, subWeeks, startOfMonth, subMonths } from "date-fns";
import { Loader2, TrendingUp, TrendingDown, Info, Plus, Scale, Flame, Target, Trophy, CheckCircle2, Zap, Activity, Cpu, ShieldCheck, ChevronRight, Share2, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { CountUp } from "@/components/CountUp";

type ViewType = "7 days" | "30 days" | "all time";

export default function ProgressTracker() {
  const [view, setView] = useState<ViewType>("7 days");
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const queryClient = useQueryClient();

  const { data: weightHistory, isLoading: weightLoading } = useQuery({
    queryKey: [api.weight.getHistory.path],
    queryFn: async () => {
      const res = await fetch(api.weight.getHistory.path, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch weight history");
      }
      return res.json();
    }
  });

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: [api.user.getStats.path],
    queryFn: async () => {
      const res = await fetch(api.user.getStats.path, { credentials: "include" });
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || "Failed to fetch stats");
      }
      if (!data) {
        throw new Error("Could not parse stats data");
      }
      return data;
    }
  });

  const logWeightMutation = useMutation({
    mutationFn: async (weight: number) => {
      const res = await fetch(api.weight.log.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ weight, date: format(new Date(), "yyyy-MM-dd") })
      });
      if (!res.ok) throw new Error("Failed to log weight");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.weight.getHistory.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.getStats.path] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
      setShowLogDialog(false);
      setNewWeight("");
    }
  });

  const handleLogWeight = () => {
    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 20 || weight > 300) return;
    logWeightMutation.mutate(weight);
  };

  if (profileLoading || weightLoading || statsLoading || !profile || !stats) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              borderColor: ["hsl(var(--primary))", "hsl(var(--primary)/0.3)", "hsl(var(--primary))"]
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="w-24 h-24 rounded-full border-4 border-primary border-t-transparent shadow-[0_0_50px_rgba(142,214,63,0.3)] flex items-center justify-center"
          >
            <Activity className="w-10 h-10 text-primary animate-pulse" />
          </motion.div>
          <div className="text-center space-y-4">
            <h3 className="font-display font-bold text-2xl text-white uppercase tracking-[0.2em] animate-pulse">
              Synchronizing_Biometrics
            </h3>
            <div className="flex justify-center gap-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                  className="w-2 h-2 bg-primary rounded-full"
                />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  const chartData = weightHistory?.map((log: any) => ({
    date: format(new Date(log.date), "MMM d"),
    weight: parseFloat(log.weight),
    rawDate: new Date(log.date)
  })).sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime()) || [];

  const filteredChartData = view === "7 days"
    ? chartData.slice(-7)
    : view === "30 days"
      ? chartData.slice(-30)
      : chartData;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      <main className="flex-1 pb-48 md:pb-12 overflow-y-auto px-4 md:px-8">
        <header className="pt-10 pb-10 md:pt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10 rounded-full" />
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight uppercase">Biometric <span className="text-primary">Log</span></h1>
            <div className="flex items-center gap-2 mt-2">
              <Activity className="w-3 h-3 text-primary opacity-60" />
              <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">Sequence: Morphological Tracking // Active</p>
            </div>
          </motion.div>

          <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
            <DialogTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 30px rgba(142,214,63,0.3)" }}
                whileTap={{ scale: 0.95 }}
                className="h-14 px-8 rounded-2xl bg-primary text-black font-display font-bold uppercase text-[10px] tracking-widest shadow-xl transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New_Calibration
              </motion.button>
            </DialogTrigger>
            <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
              <DialogHeader className="mb-6 text-center">
                <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Biometric_Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-8 py-4">
                <div className="relative group">
                  <div className="absolute inset-x-0 bottom-0 h-[1px] bg-primary/20" />
                  <div className="flex flex-col items-center">
                    <p className="text-[10px] font-mono text-primary uppercase tracking-[0.3em] mb-4">Total_Mass (KG)</p>
                    <Input
                      type="number"
                      placeholder="00.0"
                      value={newWeight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewWeight(e.target.value)}
                      className="text-6xl font-display font-bold bg-transparent border-none focus-visible:ring-0 text-center w-full text-white placeholder:text-white/5"
                      autoFocus
                    />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleLogWeight}
                  disabled={logWeightMutation.isPending || !newWeight}
                  className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center gap-3 border-none outline-none"
                >
                  {logWeightMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  COMMIT_TO_ARCHIVE
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Global Stats Overview */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {[
            { label: "Calibration_Point", value: stats.currentWeight, unit: "KG", sub: `${Math.abs(stats.weightChange).toFixed(1)} KG SHIFT`, trend: stats.weightChange < 0 ? "neg" : "pos", icon: Scale, color: "text-primary" },
            { label: "Temporal_Synergy", value: stats.currentStreak, unit: "CYCLES", sub: `BEST: ${stats.bestStreak} SESSIONS`, trend: "neutral", icon: Flame, color: "text-orange-500" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <stat.icon className={cn("w-20 h-20", stat.color)} />
              </div>
              <div className="flex items-center gap-3 mb-6">
                <stat.icon className={cn("w-4 h-4", stat.color)} />
                <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
              </div>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-5xl font-display font-bold text-white tracking-tighter">
                  <CountUp value={stat.value} decimals={stat.unit === "KG" ? 1 : 0} />
                </span>
                <span className="text-xs font-mono text-white/20 uppercase">{stat.unit}</span>
              </div>
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest",
                stat.trend === "neg" ? "bg-primary/10 text-primary" : stat.trend === "pos" ? "bg-red-500/10 text-red-400" : "bg-white/5 text-white/40"
              )}>
                {stat.trend === "neg" ? <TrendingDown className="w-3 h-3" /> : stat.trend === "pos" ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
                {stat.sub}
              </div>
            </motion.div>
          ))}

          {/* Insight Module */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 rounded-[2.5rem] border-primary/20 bg-primary/[0.03] relative overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Cpu className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-mono text-primary font-bold uppercase tracking-widest">Neural Link Active</p>
            </div>
            <p className="text-lg font-display font-medium text-white leading-tight italic">
              "{stats.caloriesConsistency > 80
                ? "Your energy profiles show high stability. Metabolic efficiency is peaking."
                : stats.workoutConsistency > 50
                  ? "Kinetic load balanced. Priority: Increase protein synthesis for optimized recovery."
                  : "Sequence interrupted. Re-establish logging routine to recalibrate the neural core."}"
            </p>
            <div className="absolute bottom-0 right-0 p-4 opacity-10">
              <Fingerprint className="w-12 h-12 text-primary" />
            </div>
          </motion.div>
        </section>

        {/* Immersive Chart Section */}
        <section className="mb-12 relative">
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
              <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">Kinetic <span className="text-primary">Drift</span></h2>
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3 text-primary opacity-60" />
                <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.3em] opacity-60">Visualizing Structural DNA Evolution</p>
              </div>
            </div>

            <div className="flex p-1.5 glass-card rounded-2xl border-white/5 bg-white/5 gap-2 relative z-10">
              {(["7 days", "30 days", "all time"] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "text-[9px] font-mono font-bold uppercase tracking-widest px-6 py-3 rounded-xl transition-all",
                    view === v ? "bg-primary text-black shadow-[0_0_20px_rgba(142,214,63,0.3)]" : "text-white/40 hover:text-white"
                  )}
                >
                  {v.replace(" ", "_")}
                </button>
              ))}
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-[3rem] p-10 h-[500px] border-white/5 relative overflow-hidden group"
          >
            {/* Cybergrid Background for Chart */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
              <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="relative z-10 w-full h-full">
              {filteredChartData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <filter id="neonBlur" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="1 1" vertical={false} stroke="rgba(255,255,255,0.03)" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.3)', fontWeight: 700, fontFamily: 'JetBrains Mono', letterSpacing: '0.1em' }}
                      dy={20}
                    />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="glass-card p-4 border-primary/20 backdrop-blur-xl rounded-2xl shadow-2xl">
                              <p className="text-[10px] font-mono text-primary uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                              <p className="text-xl font-display font-bold text-white uppercase">{payload[0].value} <span className="text-[10px] opacity-40">KG</span></p>
                            </div>
                          );
                        }
                        return null;
                      }}
                      cursor={{ stroke: 'hsl(var(--primary))', strokeWidth: 1, strokeDasharray: '8 8' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#colorWeight)"
                      animationDuration={2500}
                      filter="url(#neonBlur)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center space-y-6 opacity-20">
                  <div className="w-20 h-20 rounded-full border-2 border-primary/20 flex items-center justify-center animate-pulse">
                    <Activity className="w-10 h-10 text-primary" />
                  </div>
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.5em]">Awaiting_Input_Data</p>
                </div>
              )}
            </div>
          </motion.div>
        </section>

        {/* Neural Node Performance Metrics */}
        <section className="mb-12">
          <div className="flex items-center gap-4 px-2 mb-10">
            <Target className="w-4 h-4 text-primary opacity-60" />
            <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">Neural_Node_Efficiency</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { label: "Net Caloric Adherence", val: stats.caloriesConsistency, icon: Flame, color: "text-primary", bg: "bg-primary/5" },
              { label: "Protein Synthesis Ratio", val: stats.proteinConsistency, icon: Zap, color: "text-blue-400", bg: "bg-blue-400/5" },
              { label: "Kinetic Activity Frequency", val: stats.workoutConsistency, icon: Activity, color: "text-orange-500", bg: "bg-orange-500/5" }
            ].map((metric, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="glass-card p-10 rounded-[2.5rem] border-white/5 relative overflow-hidden group"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center border border-white/5", metric.bg)}>
                    <metric.icon className={cn("w-6 h-6", metric.color)} />
                  </div>
                  <div className="text-right">
                    <span className={cn("text-3xl font-display font-bold", metric.color)}>
                      <CountUp value={metric.val} />%
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em] mb-6">{metric.label}</p>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.val}%` }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={cn("h-full bg-current", metric.color)}
                  />
                </div>
                <div className="mt-8 flex justify-between items-center text-[8px] font-mono text-white/10 uppercase tracking-widest">
                  <span>Efficiency_Rating</span>
                  <span>{metric.val > 80 ? "EXCEPTIONAL" : "NOMINAL"}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
