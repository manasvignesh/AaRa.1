import { useState } from "react";
import { useLocation } from "wouter";
import { useLogWeight, useWeightHistory } from "@/hooks/use-weight";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, ChevronLeft, TrendingUp, Scale, Target, Sparkles, ChevronRight } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from "recharts";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
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
    weight: log.weight,
    rawDate: log.date
  })).reverse() || [];

  return (
    <PageLayout
      header={
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")} className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Tracking</p>
            <h1 className="text-xl font-bold tracking-tight">Body Weight</h1>
          </div>
        </div>
      }
    >
      <div className="max-w-xl mx-auto space-y-10 pb-32">
        <section className="text-center space-y-8 py-4">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full" />
            <div className="w-24 h-24 rounded-[32px] bg-card flex items-center justify-center shadow-xl border border-primary/5 relative z-10">
              <Scale className="w-10 h-10 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tighter">Scale Check-in</h2>
            <p className="text-muted-foreground font-medium text-[15px] max-w-[260px] mx-auto leading-relaxed">
              Track your trend, ignore the noise. Progress is built on averages.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="flex items-center justify-center gap-1">
              <div className="relative group">
                <Input
                  type="number"
                  step="0.1"
                  className="text-center text-6xl h-24 w-48 font-black tracking-tighter rounded-[32px] border-none bg-secondary/20 focus-visible:ring-primary/20 shadow-inner group-focus-within:bg-card group-focus-within:shadow-2xl transition-all"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  autoFocus
                />
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                  <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.2em]">KILOGRAMS</span>
                </div>
              </div>
            </div>

            <div className="px-6">
              <Button
                type="submit"
                size="lg"
                className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-2xl shadow-brand-blue/30 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={!weight || isPending}
              >
                {isPending ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                Record Weight
              </Button>
            </div>
          </form>
        </section>

        {chartData.length > 0 && (
          <section className="space-y-4">
            <SectionHeader title="Trend Analysis" />
            <div className="wellness-card p-6 bg-card border-none shadow-xl overflow-hidden">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--brand-blue))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--brand-blue))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.05)" />
                    <XAxis
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground) / 0.4)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      dy={10}
                      fontStyle="bold"
                    />
                    <YAxis
                      stroke="hsl(var(--muted-foreground) / 0.4)"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      domain={['dataMin - 1', 'dataMax + 1']}
                      fontStyle="bold"
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                        fontWeight: 'bold'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(var(--brand-blue))"
                      strokeWidth={4}
                      fillOpacity={1}
                      fill="url(#weightGradient)"
                      animationDuration={2000}
                      dot={{ fill: 'hsl(var(--brand-blue))', strokeWidth: 2, r: 4, stroke: 'white' }}
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--brand-blue))' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="bg-secondary/20 p-4 rounded-[24px] border border-border/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 leading-none">Starting</p>
                  <p className="text-xl font-black tracking-tight">{chartData[0]?.weight} <span className="text-xs font-bold text-muted-foreground">kg</span></p>
                </div>
                <div className="bg-secondary/20 p-4 rounded-[24px] border border-border/5">
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mb-1 leading-none">Latest</p>
                  <p className="text-xl font-black tracking-tight">{chartData[chartData.length - 1]?.weight} <span className="text-xs font-bold text-muted-foreground">kg</span></p>
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="space-y-4">
          <SectionHeader title="History Log" />
          <div className="wellness-card bg-card border-none shadow-sm divide-y divide-border/5 overflow-hidden">
            {chartData.slice().reverse().map((log, idx) => (
              <div key={idx} className="p-4 flex justify-between items-center hover:bg-secondary/20 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{log.date}</p>
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest italic">{format(new Date(log.rawDate), "eeee")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black tracking-tight">{log.weight} <span className="text-xs text-muted-foreground">kg</span></p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
