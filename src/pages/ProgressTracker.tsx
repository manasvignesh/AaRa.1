import { useState } from "react";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
import { Loader2, TrendingUp, Info, Plus, Scale, Flame, Target, Trophy, CheckCircle2, Zap, ArrowRight, ChevronRight, Sparkles, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
      <PageLayout
        header={
          <div>
            <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-1">Consistency Tracker</p>
            <h1 className="text-4xl font-semibold tracking-tight text-foreground">Progress</h1>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-20 min-h-[40vh]">
          <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Synchronizing your wellness data...</p>
        </div>
      </PageLayout>
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

  const weightChangeColor = stats.weightChange < 0 ? "text-emerald-500" : stats.weightChange > 0 ? "text-amber-500" : "text-muted-foreground";

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-start">
          <div>
            <p className="text-[13px] font-black text-primary uppercase tracking-[0.2em] mb-1">Analytical Insights</p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Progress Lab</h1>
          </div>
          <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-[20px] w-14 h-14 brand-gradient text-white shadow-xl shadow-brand-blue/20 flex items-center justify-center border-none">
                <Plus className="w-7 h-7" />
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[40px] p-10 border-none shadow-2xl max-w-sm">
              <DialogHeader className="mb-8 text-center">
                <DialogTitle className="text-3xl font-black tracking-tighter">Scale Entry</DialogTitle>
                <p className="text-muted-foreground font-medium mt-1">Consistency over perfection, always.</p>
              </DialogHeader>
              <div className="space-y-10">
                <div className="flex items-center gap-4 bg-secondary/20 p-8 rounded-[32px] border border-border/5 shadow-inner">
                  <Input
                    type="number"
                    placeholder="00.0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 text-5xl font-black bg-transparent border-none focus-visible:ring-0 text-center tracking-tighter tabular-nums"
                    autoFocus
                  />
                  <span className="text-xl font-black text-muted-foreground/30 pr-4 uppercase">kg</span>
                </div>
                <Button
                  className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-xl shadow-brand-blue/20"
                  onClick={handleLogWeight}
                  disabled={logWeightMutation.isPending || !newWeight}
                >
                  {logWeightMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      }
    >
      <div className="space-y-10 pb-32">
        {/* Hero Section */}
        <section>
          <div className="wellness-card p-10 flex flex-col items-center text-center shadow-2xl bg-card relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
              <Scale className="w-48 h-48" />
            </div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">Latest Measurement</p>
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-7xl font-black tracking-tighter tabular-nums">{stats.currentWeight}</span>
              <span className="text-2xl font-black text-muted-foreground/30 uppercase">kg</span>
            </div>

            <div className={cn(
              "inline-flex items-center px-6 py-2 rounded-full text-[13px] font-black shadow-lg transition-all",
              stats.weightChange < 0 ? "bg-emerald-500 text-white shadow-emerald-500/20" : stats.weightChange > 0 ? "bg-amber-500 text-white shadow-amber-500/20" : "bg-card border border-border text-muted-foreground"
            )}>
              {stats.weightChange < 0 ? <TrendingUp className="w-4 h-4 mr-2 rotate-180" /> : stats.weightChange > 0 ? <TrendingUp className="w-4 h-4 mr-2" /> : <Activity className="w-4 h-4 mr-2" />}
              {stats.weightChange === 0 ? "Maintenance" : `${Math.abs(stats.weightChange).toFixed(1)} kg ${stats.weightChange < 0 ? 'Down' : 'Up'}`}
            </div>

            <p className="text-xs text-muted-foreground/40 mt-10 font-bold uppercase tracking-[0.2em] italic">
              "Your direction is more important than your speed."
            </p>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="wellness-card p-6 bg-card border-none shadow-sm flex flex-col items-center text-center group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
              <Trophy className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">{stats.streak || 0}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Day Streak</span>
          </div>
          <div className="wellness-card p-6 bg-card border-none shadow-sm flex flex-col items-center text-center group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">{stats.completedWorkouts || 0}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sessions</span>
          </div>
          <div className="wellness-card p-6 bg-card border-none shadow-sm flex flex-col items-center text-center group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
              <Flame className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">{stats.totalCalories || 0}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Total Kcal</span>
          </div>
          <div className="wellness-card p-6 bg-card border-none shadow-sm flex flex-col items-center text-center group transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tight">{profile.targetWeight}</span>
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Goal Weight</span>
          </div>
        </section>

        {/* Chart Section */}
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <SectionHeader title="Weight Progression" />
            <div className="flex bg-secondary/30 p-1 rounded-2xl">
              {(["7 days", "30 days", "all time"] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    view === v ? "bg-card text-primary shadow-sm" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  {v.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="wellness-card p-8 bg-card border-none shadow-xl">
            {filteredChartData.length >= 2 ? (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={filteredChartData}>
                    <defs>
                      <linearGradient id="progressionGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="hsl(var(--muted-foreground) / 0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground) / 0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                      fontStyle="bold"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground) / 0.3)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 1', 'dataMax + 1']}
                      fontStyle="bold"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '24px',
                        border: 'none',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        fontWeight: 'black',
                        fontSize: '14px',
                        padding: '12px 16px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--primary))"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#progressionGradient)"
                      animationDuration={1500}
                      dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4, stroke: 'white' }}
                      activeDot={{ r: 7, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center text-center p-10 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground font-bold text-sm max-w-[200px]">Log at least 2 measurements to visualize your trend.</p>
              </div>
            )}
          </div>
        </section>

        {/* History Area */}
        <section className="space-y-4">
          <SectionHeader title="Timeline History" />
          <div className="wellness-card bg-card border-none shadow-sm divide-y divide-border/5 overflow-hidden">
            {chartData.slice().reverse().map((log: any, idx: number) => (
              <div key={idx} className="p-5 flex justify-between items-center hover:bg-secondary/20 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/30 flex items-center justify-center text-muted-foreground group-hover:bg-primary/5 group-hover:text-primary transition-all">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-extrabold text-[15px] tracking-tight">{log.date}</p>
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{format(log.rawDate, "EEEE")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-black tracking-tighter">{log.weight} <span className="text-xs text-muted-foreground font-bold uppercase">kg</span></p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground/20 group-hover:text-primary transition-all group-hover:translate-x-1" />
                </div>
              </div>
            ))}
            {!chartData.length && (
              <div className="p-20 text-center">
                <p className="text-sm font-black text-muted-foreground uppercase opacity-20">No history available</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
