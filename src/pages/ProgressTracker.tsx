import { useState } from "react";
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
import { Loader2, TrendingUp, Info, Plus, Scale, Flame, Target, Trophy, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    const error = statsError as Error;
    const hasError = !profileLoading && !weightLoading && !statsLoading && (!profile || !stats || statsError);

    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-[#F2F2F7] dark:bg-black">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          {hasError ? (
            <div className="text-center p-8 ios-inset-grouped bg-white dark:bg-[#1C1C1E] max-w-sm">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-6">
                <Info className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="font-bold text-xl mb-2 text-foreground">Data Unavailable</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                {error?.message || (!profile ? "Profile not found. Please complete onboarding." : "We're having trouble loading your consistency stats.")}
              </p>
              <Button onClick={() => queryClient.invalidateQueries()} className="w-full h-12 rounded-2xl font-bold bg-primary shadow-lg border-none">
                Retry Connection
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground animate-pulse">Syncing progress...</p>
            </div>
          )}
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
    <div className="flex flex-col md:flex-row min-h-screen bg-[#F2F2F7] dark:bg-black">
      <Navigation />

      <main className="flex-1 pb-32 md:pb-8 overflow-y-auto">
        <header className="px-6 pt-10 pb-6 md:pt-16 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Progress</h1>
            <p className="text-sm text-muted-foreground mt-1">Consistency over perfection.</p>
          </div>
          <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-full px-4 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none">
                <Plus className="w-4 h-4 mr-2" /> Log Weight
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[24px]">
              <DialogHeader>
                <DialogTitle>Log Weight</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="flex items-center gap-4 bg-secondary/30 p-4 rounded-2xl">
                  <Input
                    type="number"
                    placeholder="00.0"
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="flex-1 text-2xl font-bold bg-transparent border-none focus-visible:ring-0 text-center"
                    autoFocus
                  />
                  <span className="text-lg font-semibold text-muted-foreground pr-4">kg</span>
                </div>
                <Button
                  className="w-full h-12 rounded-xl text-lg font-semibold"
                  onClick={handleLogWeight}
                  disabled={logWeightMutation.isPending || !newWeight}
                >
                  {logWeightMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        {/* Top Highlight Card */}
        <section className="px-4 mb-8">
          <div className="ios-inset-grouped p-6 flex flex-col items-center text-center">
            <p className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Weight</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-bold tracking-tighter">{stats.currentWeight}</span>
              <span className="text-xl font-medium text-muted-foreground">kg</span>
            </div>
            <div className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              stats.weightChange < 0 ? "bg-emerald-500/10 text-emerald-600" : stats.weightChange > 0 ? "bg-amber-500/10 text-amber-600" : "bg-secondary text-muted-foreground"
            )}>
              {stats.weightChange < 0 ? "-" : stats.weightChange > 0 ? "+" : ""}
              {Math.abs(stats.weightChange)} kg since start
            </div>
            <p className="text-xs text-muted-foreground/60 mt-4 italic">"Progress is a marathon, not a sprint."</p>
          </div>
        </section>

        {/* Visual Trend Section */}
        <section className="px-4 mb-8">
          <div className="px-2 mb-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Weight Trend</h2>
            <div className="flex bg-white dark:bg-[#1C1C1E] rounded-full p-1 shadow-sm border border-black/5 dark:border-white/5">
              {(["7 days", "30 days", "all time"] as ViewType[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={cn(
                    "text-[11px] font-bold px-3 py-1 rounded-full transition-all capitalize",
                    view === v ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div className="ios-inset-grouped p-6 h-[260px] relative">
            {filteredChartData.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={filteredChartData}>
                  <defs>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" opacity={0.5} />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: '#8E8E93', fontWeight: 500 }}
                    minTickGap={30}
                  />
                  <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}
                    cursor={{ stroke: '#007AFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    stroke="#007AFF"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2">
                <TrendingUp className="w-8 h-8 opacity-20" />
                <p className="text-sm font-medium opacity-50">Continue logging to see trends</p>
              </div>
            )}
          </div>
        </section>

        {/* Consistency Metrics */}
        <section className="px-4 mb-8">
          <h2 className="px-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Goal Consistency</h2>
          <div className="grid grid-cols-1 gap-4">
            <Card className="ios-inset-grouped p-4 flex items-center justify-between border-none shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Calories Adherence</h4>
                  <p className="text-xs text-muted-foreground">Past 7 days average</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-blue-500">{stats.caloriesConsistency}%</span>
                <div className="w-20 h-1.5 bg-blue-500/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${stats.caloriesConsistency}%` }} />
                </div>
              </div>
            </Card>

            <Card className="ios-inset-grouped p-4 flex items-center justify-between border-none shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#5856D6]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-[#5856D6]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Protein Consistency</h4>
                  <p className="text-xs text-muted-foreground">Hitting daily targets</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-[#5856D6]">{stats.proteinConsistency}%</span>
                <div className="w-20 h-1.5 bg-[#5856D6]/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-[#5856D6]" style={{ width: `${stats.proteinConsistency}%` }} />
                </div>
              </div>
            </Card>

            <Card className="ios-inset-grouped p-4 flex items-center justify-between border-none shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Scale className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <h4 className="text-sm font-bold">Workout Frequency</h4>
                  <p className="text-xs text-muted-foreground">Weekly active days</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-orange-500">{stats.workoutConsistency}%</span>
                <div className="w-20 h-1.5 bg-orange-500/10 rounded-full mt-1 overflow-hidden">
                  <div className="h-full bg-orange-500" style={{ width: `${stats.workoutConsistency}%` }} />
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* Streaks & Insights */}
        <section className="px-4 mb-8">
          <h2 className="px-2 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Streaks & Insights</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="ios-inset-grouped p-4 flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center mb-1">
                <Flame className="w-6 h-6 text-orange-500 fill-orange-500" />
              </div>
              <span className="text-2xl font-bold">{stats.currentStreak}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Current Streak</span>
            </div>
            <div className="ios-inset-grouped p-4 flex flex-col items-center justify-center gap-1">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center mb-1">
                <Trophy className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-2xl font-bold">{stats.bestStreak}</span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Best Streak</span>
            </div>
          </div>

          <Card className="mt-4 ios-inset-grouped p-5 bg-[#007AFF]/5 border-none flex gap-4">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-black flex items-center justify-center shrink-0 shadow-sm">
              <span className="text-xl">✨</span>
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#007AFF] mb-1">Coach Insight</h4>
              <p className="text-[13px] text-[#007AFF]/80 leading-snug">
                {stats.caloriesConsistency > 80
                  ? "Your energy levels are looking stable due to great calorie matching. Keep this pace."
                  : stats.workoutConsistency > 50
                    ? "Great job on the workouts! Focus slightly more on your protein intake for better recovery."
                    : "Consistency is key. Focus on logging one primary meal today to build the habit."}
              </p>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
