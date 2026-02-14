import { useState } from "react";
import { useLocation } from "wouter";
import { useLogWeight, useWeightHistory } from "@/hooks/use-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Scale, Zap, Activity, ShieldCheck, Target, TrendingUp, Cpu } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function WeightLog() {
  const [weight, setWeight] = useState("");
  const [, setLocation] = useLocation();
  const { mutate: logWeight, isPending } = useLogWeight();
  const { data: history } = useWeightHistory();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    logWeight(
      { weight: parseFloat(weight), date: new Date() },
      { onSuccess: () => setLocation("/dashboard") }
    );
  };

  const chartData = history?.map(log => ({
    date: format(new Date(log.date), "MMM dd"),
    weight: log.weight
  })).reverse() || [];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="p-6 md:p-8 flex items-center justify-between sticky top-0 z-50 glass-card border-none border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight leading-none mb-1">ATOMIC_MASS_LOG</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold">Synchronize_Biological_Data</p>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end">
          <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest leading-none">Status_Node</p>
          <p className="text-[10px] font-mono text-primary font-bold mt-1 uppercase tracking-widest">ENCRYPTED_AUTH</p>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full z-10 space-y-12 pb-32">
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Scale className="w-5 h-5 text-primary opacity-40" />
                <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.4em]">SENSOR_INPUT_REQ</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-none mb-4">What's the score?</h2>
              <p className="text-sm font-display font-medium text-white/40 uppercase tracking-tight leading-relaxed italic">
                "Precision in measurement leads to optimization in performance. Input current mass for profile calibration."
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 max-w-sm">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-indigo-500/30 rounded-[2.5rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity" />
                <div className="relative flex items-center justify-center gap-6 p-8 glass-card rounded-[2.5rem] border-white/10 bg-black/40">
                  <Input
                    type="number"
                    step="0.1"
                    className="text-center text-6xl h-24 w-48 font-display font-bold bg-transparent border-none text-white focus:ring-0 placeholder:text-white/5"
                    placeholder="00.0"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    autoFocus
                  />
                  <div className="flex flex-col items-start">
                    <span className="text-xl font-display font-bold text-white/20 uppercase">KG</span>
                    <div className="w-4 h-[2px] bg-primary mt-1" />
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={!weight || isPending}
                className="w-full h-18 py-5 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-[0.2em] shadow-[0_0_30px_rgba(142,214,63,0.3)] transition-all border-none outline-none flex items-center justify-center gap-4"
              >
                {isPending ? <Loader2 className="animate-spin w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                AUTHORIZE_LOG
              </motion.button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            <div className="glass-card p-10 rounded-[3rem] border-white/5 bg-white/[0.02] flex flex-col gap-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-4 h-4 text-primary opacity-60" />
                  <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em]">Mass_Archive</h3>
                </div>
                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  <p className="text-[9px] font-mono text-white/40 uppercase tracking-widest">LIVE_SYNC</p>
                </div>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8ED63F" />
                          <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.2)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        fontFamily="JetBrains Mono"
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.2)"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        fontFamily="JetBrains Mono"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(5, 5, 5, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#8ED63F', fontFamily: 'JetBrains Mono', fontSize: '12px' }}
                        labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="url(#lineGradient)"
                        strokeWidth={3}
                        dot={{ fill: '#8ED63F', strokeWidth: 2, r: 4, stroke: 'rgba(5,5,5,1)' }}
                        activeDot={{ r: 6, stroke: '#8ED63F', strokeWidth: 4, fill: '#8ED63F' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center gap-4 opacity-20">
                    <Cpu className="w-10 h-10" />
                    <p className="text-[10px] font-mono uppercase tracking-[0.4em]">NO_RECORDS_AVAILABLE</p>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-2">
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Initial_Base</p>
                <p className="text-xl font-display font-bold text-white tracking-tight">{history?.[history.length - 1]?.weight || "---"} <span className="text-[10px] text-white/20 uppercase">kg</span></p>
              </div>
              <div className="p-6 rounded-[2rem] bg-indigo-500/[0.02] border border-indigo-500/10 space-y-2">
                <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Net_Deviation</p>
                <p className="text-xl font-display font-bold text-indigo-400 tracking-tight">
                  {history && history.length > 1 ? (history[0].weight - history[history.length - 1].weight).toFixed(1) : "0.0"} <span className="text-[10px] text-indigo-500/40 uppercase">kg</span>
                </p>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Decorative Bottom Logic */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2 opacity-40">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Mass_Stabilization: ACTIVE</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Bio_Archive: READ_WRITE</span>
        </div>
      </div>
    </div>
  );
}
