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

const bmiDisplayNames: Record<string, { label: string; color: string }> = {
  underweight: { label: "Building Phase", color: "#6AAFF5" },
  healthy: { label: "In the Zone", color: "#27AE60" },
  overweight: { label: "Active Transformation", color: "#E8A93A" },
  obese: { label: "Power Journey", color: "#F5A623" },
  severely_obese: { label: "Strong Start", color: "#E8A93A" },
};

export default function ProgressTracker() {
  const [view, setView] = useState<ViewType>("7 days");
  const [showLogDialog, setShowLogDialog] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [categoryChange, setCategoryChange] = useState<null | { oldCategory: string; newCategory: string; earnedXp?: number }>(null);
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
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [api.weight.getHistory.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.getStats.path] });
      queryClient.invalidateQueries({ queryKey: [api.user.getProfile.path] });
      setShowLogDialog(false);
      setNewWeight("");

      if (data?.categoryChanged && data?.oldCategory && data?.newCategory) {
        setCategoryChange({
          oldCategory: String(data.oldCategory),
          newCategory: String(data.newCategory),
          earnedXp: Number(data.earnedXp || 0) || undefined,
        });
      }
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
            <p className="section-label mb-1">Analytical Insights</p>
            <h1 className="font-display text-4xl font-bold tracking-tighter text-[var(--text-primary)]">Progress</h1>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-8 text-center text-[var(--text-primary)] page-transition">
          <Loader2 className="w-12 h-12 text-brand animate-spin" />
          <p className="text-sm text-[var(--text-muted)] font-bold animate-pulse uppercase tracking-widest">Compiling Progress Matrix...</p>
        </div>
      </PageLayout>
    );
  }

  const heightM = Number(profile.height || 0) > 0 ? Number(profile.height) / 100 : 0;
  const chartData = weightHistory?.map((log: any) => {
    const weight = parseFloat(log.weight);
    const bmi = heightM > 0 ? weight / (heightM * heightM) : null;
    return {
    date: format(new Date(log.date), "MMM d"),
    weight,
    bmi: bmi != null ? Math.round(bmi * 10) / 10 : null,
    rawDate: new Date(log.date)
    };
  }).sort((a: any, b: any) => a.rawDate.getTime() - b.rawDate.getTime()) || [];

  const filteredChartData = view === "7 days" ? chartData.slice(-7) : view === "30 days" ? chartData.slice(-30) : chartData;

  return (
    <div className="page-transition">
      <PageLayout
        maxWidth="md"
        header={
          <div className="flex justify-between items-start mb-[16px]">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] font-semibold mb-[4px]">Performance</p>
              <h1 className="font-display text-[32px] font-bold tracking-tighter leading-none text-[var(--text-primary)]">Progress</h1>
            </div>
            <button
              onClick={() => setShowLogDialog(true)}
              className="h-[36px] px-[16px] bg-[#2F80ED] text-white rounded-full font-bold text-[13px] hover:bg-[#2F80ED]/90 transition-colors shadow-md shadow-[#2F80ED]/20 flex items-center justify-center gap-1.5 mt-[8px]"
            >
              <Plus className="w-[14px] h-[14px]" />
              Log Weight
            </button>
          </div>
        }
      >
        <div className="space-y-8 pb-10">
          {/* Metric Hero */}
          <section className="stagger-1">
            <div className="wellness-card h-[160px] p-[20px] relative overflow-hidden flex flex-col justify-between">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-[#2F80ED]/5 to-transparent rounded-bl-full" />
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <div className="flex items-center gap-2 mb-[8px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#2F80ED]" />
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--text-muted)]">Current Weight</h2>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="font-display text-[42px] font-bold tracking-tighter text-brand leading-[1.1]">
                      {Number(stats.currentWeight).toFixed(1)}
                    </span>
                    <span className="text-[16px] font-semibold text-[var(--text-muted)] mb-2">kg</span>
                  </div>
                </div>
                <div className="w-[40px] h-[40px] rounded-[14px] bg-[var(--surface-2)] flex items-center justify-center text-brand">
                  <Scale className="w-[20px] h-[20px]" />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-[12px] relative z-10">
                <div className="flex flex-col">
                  <span className="text-[12px] font-medium text-muted text-[var(--text-muted)]">Target Weight</span>
                  <span className="text-[20px] font-semibold text-[var(--text-primary)] mt-[-2px]">{Number(profile.targetWeight).toFixed(1)} kg</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full mt-[-2px]",
                    stats.weightChange < 0 ? "text-[#27AE60] bg-[#27AE60]/10" : stats.weightChange > 0 ? "text-amber-500 bg-amber-500/10" : "text-[var(--text-muted)] bg-[var(--surface-2)]"
                  )}>
                    {stats.weightChange < 0 ? <TrendingUp className="w-3 h-3 rotate-180" /> : <TrendingUp className="w-3 h-3" />}
                    <span className="text-[11px] font-bold">{Math.abs(stats.weightChange).toFixed(1)}kg delta</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Global Statistics */}
          <section className="grid grid-cols-3 gap-[10px] stagger-2">
            {[
              { label: "Streak", val: stats.currentStreak || stats.streak || 0, icon: Trophy, color: "text-amber-500 bg-amber-500/10", unit: "d" },
              { label: "Sessions", val: stats.completedWorkouts || 0, icon: CheckCircle2, color: "text-brand bg-[#2F80ED]/10", unit: "" },
              { label: "Energy", val: stats.totalCalories || 0, icon: Flame, color: "text-[#27AE60] bg-[#27AE60]/10", unit: "cal" }
            ].map((item, i) => (
              <div key={i} className="metric-card p-[14px] max-h-[120px] flex flex-col justify-between">
                <div className="mb-2">
                  <div className="text-[10px] uppercase font-bold tracking-[0.08em] text-[var(--text-muted)] mb-[2px]">{item.label}</div>
                </div>
                <div>
                  <p className="font-display text-[22px] font-bold tracking-tighter text-[var(--text-primary)] leading-none mb-1">
                    {item.val}<span className="text-[10px] uppercase text-[var(--text-muted)] ml-0.5">{item.unit}</span>
                  </p>
                  <div className={cn("w-[24px] h-[24px] rounded-[8px] flex items-center justify-center mt-1", item.color)}>
                    <item.icon className="w-[12px] h-[12px]" />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Visualization */}
          <section className="space-y-[12px] stagger-3 mb-[24px]">
            <SectionHeader
              title="Body Composition"
              action={
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-[var(--border)] shadow-inner">
                  {(["7 days", "30 days", "all time"] as ViewType[]).map((v) => (
                    <button
                      key={v}
                      onClick={() => setView(v)}
                      className={cn(
                        "px-3 py-1 rounded-[6px] text-[11px] font-bold transition-all flex items-center justify-center whitespace-nowrap",
                        view === v ? "bg-[var(--surface-1)] text-[var(--text-primary)] shadow-sm transform scale-100" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] scale-95"
                      )}
                    >
                      {v === "all time" ? "All" : v.split(" ")[0]}
                    </button>
                  ))}
                </div>
              }
            />

            <div className="wellness-card h-[220px] rounded-[24px] pt-[16px] px-[16px] pb-[12px] shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
              {filteredChartData.length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#2F80ED" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(47,128,237,0.05)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '16px', border: '1px solid rgba(47,128,237,0.1)', color: '#1E2A3A', fontSize: '12px', boxShadow: '0 4px 20px rgba(47,128,237,0.07)' }}
                      itemStyle={{ color: '#2F80ED', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="weight" stroke="#2F80ED" strokeWidth={3} fill="url(#curveGrad)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                  <Activity className="w-8 h-8 text-[var(--text-muted)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Incomplete Data Range</p>
                </div>
              )}
            </div>
          </section>

          {/* BMI Trend */}
          <section className="space-y-[12px] stagger-3 mb-[24px]">
            <SectionHeader title="BMI Trend" />
            <div className="wellness-card h-[220px] rounded-[24px] pt-[16px] px-[16px] pb-[12px] shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
              {filteredChartData.filter((d: any) => d.bmi != null).length >= 2 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="bmiGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#27AE60" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(39,174,96,0.06)" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide domain={['dataMin - 0.5', 'dataMax + 0.5']} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        borderRadius: '16px',
                        border: '1px solid rgba(39,174,96,0.12)',
                        color: '#1E2A3A',
                        fontSize: '12px',
                        boxShadow: '0 4px 20px rgba(39,174,96,0.08)'
                      }}
                      itemStyle={{ color: '#27AE60', fontWeight: 'bold' }}
                    />
                    <Area type="monotone" dataKey="bmi" stroke="#27AE60" strokeWidth={3} fill="url(#bmiGrad)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                  <Activity className="w-8 h-8 text-[var(--text-muted)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">Incomplete Data Range</p>
                </div>
              )}
            </div>
          </section>

          {/* Entry History */}
          <section className="space-y-4 stagger-4">
            <SectionHeader title="Temporal Ledger" />
            <div className="wellness-card divide-y divide-slate-100 overflow-hidden">
              {chartData.slice().reverse().map((log: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-[var(--surface-2)] transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--text-muted)] group-hover:text-brand transition-colors">
                      <Scale className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold tracking-tight text-[var(--text-primary)]">{log.date}</p>
                      <p className="text-[8px] font-bold text-[var(--text-muted)] uppercase tracking-widest leading-none mt-1">{format(log.rawDate, "EEEE")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--text-primary)]">
                    <p className="font-display text-lg font-bold tracking-tighter">{Number(log.weight).toFixed(1)} <span className="text-[10px] opacity-40 text-[var(--text-muted)]">kg</span></p>
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-brand transition-all" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
          <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-none bg-[var(--surface-1)] shadow-[0_4px_20px_rgba(47,128,237,0.15)]">
            <div className="brand-gradient p-10 text-center text-white space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)]/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20 shadow-lg">
                <Scale className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tighter uppercase text-white">Scale Log</h3>
            </div>
            <div className="p-8 space-y-8 bg-[var(--surface-1)]">
              <div className="flex items-center justify-center gap-2 bg-[var(--surface-2)] p-6 rounded-[24px] border border-[var(--border)] mx-auto">
                <input
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  inputMode="decimal"
                  pattern="[0-9]*\\.?[0-9]*"
                  placeholder="e.g. 65.5"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="w-24 font-display text-4xl font-bold bg-transparent border-none text-center focus:outline-none tracking-tighter placeholder:text-[var(--text-muted)] text-[var(--text-primary)]"
                  autoFocus
                />
                <span className="text-xl font-bold opacity-50 uppercase text-[var(--text-muted)]">kg</span>
              </div>
              <button
                className="w-full h-14 rounded-full btn-primary text-white font-bold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] flex items-center justify-center gap-2 border-0"
                onClick={handleLogWeight}
                disabled={logWeightMutation.isPending || !newWeight}
              >
                {logWeightMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                Save Entry
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!categoryChange} onOpenChange={(open) => !open && setCategoryChange(null)}>
          <DialogContent className="max-w-[360px] rounded-[32px] p-0 overflow-hidden border-none bg-[var(--surface-1)] shadow-[0_10px_40px_rgba(0,0,0,0.35)]">
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center border" style={{ borderColor: "rgba(255,255,255,0.08)", background: "var(--surface-2)" }}>
                <Trophy className="w-8 h-8 text-brand" />
              </div>
              <h3 className="font-display text-2xl font-bold tracking-tight text-[var(--text-primary)]">Phase Unlocked</h3>
              {categoryChange && (
                <div className="space-y-2">
                  <p className="text-[13px] font-medium" style={{ color: "var(--text-secondary)" }}>
                    You moved from{" "}
                    <span style={{ color: bmiDisplayNames[categoryChange.oldCategory]?.color || "var(--text-primary)", fontWeight: 700 }}>
                      {bmiDisplayNames[categoryChange.oldCategory]?.label || "your previous phase"}
                    </span>{" "}
                    to{" "}
                    <span style={{ color: bmiDisplayNames[categoryChange.newCategory]?.color || "var(--text-primary)", fontWeight: 700 }}>
                      {bmiDisplayNames[categoryChange.newCategory]?.label || "a new phase"}
                    </span>.
                  </p>
                  <p className="text-[12px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                    Bonus {categoryChange.earnedXp ? `+${categoryChange.earnedXp} XP` : "+200 XP"}
                  </p>
                </div>
              )}
              <button className="btn-primary w-full h-14 rounded-full font-bold uppercase tracking-widest text-[12px]" onClick={() => setCategoryChange(null)}>
                Let’s go
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </div>
  );
}
