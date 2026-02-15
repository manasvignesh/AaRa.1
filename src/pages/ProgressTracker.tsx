import { useState } from "react";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUserProfile } from "@/hooks/use-user";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";
import { Loader2, TrendingUp, Plus, Scale, Flame, Target, Trophy, CheckCircle2, Zap, ChevronRight, Activity, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      if (!res.ok) throw new Error("Failed to fetch weight history");
      return res.json();
    }
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: [api.user.getStats.path],
    queryFn: async () => {
      const res = await fetch(api.user.getStats.path, { credentials: "include" });
      return res.json();
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
      <PageLayout
        header={
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Analytical Insights</p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Progress</h1>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-8 text-center text-foreground">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse uppercase tracking-widest">Compiling Progress Matrix...</p>
        </div>
      </PageLayout>
    );
  }

  const chartData = weightHistory?.map((log: any) => ({
    date: format(new Date(log.date), "MMM d"),
    weight: parseFloat(log.weight),
    rawDate: new Date(log.date)
  })).sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime()) || [];

  const filteredChartData = view === "7 days" ? chartData.slice(-7) : view === "30 days" ? chartData.slice(-30) : chartData;

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Analytics Lab</p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Tracking</h1>
          </div>
          <button
            onClick={() => setShowLogDialog(true)}
            className="w-14 h-14 rounded-2xl brand-gradient text-white shadow-xl shadow-brand-blue/20 flex items-center justify-center transition-transform active:scale-95"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>
      }
    >
      <div className="space-y-8 pb-10">
        {/* Metric Hero */}
        <section>
          <div className="wellness-card p-8 flex flex-col items-center text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] -z-10 group-hover:scale-110 transition-transform">
              <Scale className="w-40 h-40" />
            </div>
            <p className="text-[9px] font-black text-primary uppercase tracking-[0.3em] mb-4">Latest Scan</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-6xl font-black tracking-tighter tabular-nums">{stats.currentWeight}</span>
              <span className="text-xl font-black text-muted-foreground/30 uppercase">kg</span>
            </div>

            <div className={cn(
              "inline-flex items-center px-4 py-1.5 rounded-full text-[11px] font-black transition-all",
              stats.weightChange < 0 ? "bg-emerald-500/10 text-emerald-500" : stats.weightChange > 0 ? "bg-amber-500/10 text-amber-500" : "bg-slate-100 text-muted-foreground"
            )}>
              {stats.weightChange < 0 ? <TrendingUp className="w-3.5 h-3.5 mr-2 rotate-180" /> : <TrendingUp className="w-3.5 h-3.5 mr-2" />}
              {Math.abs(stats.weightChange).toFixed(1)} kg delta
            </div>
          </div>
        </section>

        {/* Global Statistics */}
        <section className="grid grid-cols-2 gap-4">
          {[
            { label: "Streak", val: stats.streak || 0, icon: Trophy, color: "text-amber-500 bg-amber-500/10" },
            { label: "Session", val: stats.completedWorkouts || 0, icon: CheckCircle2, color: "text-primary bg-primary/10" },
            { label: "Energy", val: stats.totalCalories || 0, icon: Flame, color: "text-emerald-500 bg-emerald-500/10" },
            { label: "Target", val: profile.targetWeight, icon: Target, color: "text-indigo-500 bg-indigo-500/10" }
          ].map((item, i) => (
            <div key={i} className="wellness-card p-5 flex flex-col gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.color)}>
                <item.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tighter leading-none">{item.val}</p>
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{item.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Visualization */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <SectionHeader title="Progress Curve" />
            <div className="flex bg-slate-50 p-1 rounded-xl mb-6">
              {(["7 days", "30 days", "all time"] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                    view === v ? "bg-primary text-white shadow-lg" : "text-muted-foreground/40 hover:text-foreground"
                  )}
                >
                  {v.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="wellness-card p-5 h-64">
            {filteredChartData.length >= 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredChartData}>
                  <defs>
                    <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2F80ED" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', color: '#334155', fontSize: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                    itemStyle={{ color: '#2F80ED', fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="weight" stroke="#2F80ED" strokeWidth={3} fill="url(#curveGrad)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                <Activity className="w-8 h-8" />
                <p className="text-[10px] font-black uppercase tracking-widest">Incomplete Data Range</p>
              </div>
            )}
          </div>
        </section>

        {/* Entry History */}
        <section className="space-y-4">
          <SectionHeader title="Temporal Ledger" />
          <div className="wellness-card divide-y divide-slate-100 overflow-hidden">
            {chartData.slice().reverse().map((log: any, idx: number) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-muted-foreground/60 group-hover:text-primary transition-colors">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black tracking-tight">{log.date}</p>
                    <p className="text-[8px] font-black text-muted-foreground/30 uppercase tracking-widest leading-none">{format(log.rawDate, "EEEE")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-lg font-black tracking-tighter">{log.weight} <span className="text-[10px] opacity-20">kg</span></p>
                  <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-primary transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-none bg-white/90 backdrop-blur-3xl shadow-2xl">
          <div className="brand-gradient p-10 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
              <Scale className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black tracking-tighter uppercase">Scale Log</h3>
          </div>
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-center gap-2 bg-slate-50 p-6 rounded-[24px] border border-slate-100 mx-auto">
              <input
                type="number"
                placeholder="00.0"
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-24 text-4xl font-black bg-transparent border-none text-center focus:outline-none tracking-tighter placeholder:text-slate-300"
                autoFocus
              />
              <span className="text-xl font-black opacity-20 uppercase">kg</span>
            </div>
            <button
              className="w-full h-14 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
              onClick={handleLogWeight}
              disabled={logWeightMutation.isPending || !newWeight}
            >
              {logWeightMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Save Entry
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
