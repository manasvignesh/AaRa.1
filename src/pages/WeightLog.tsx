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
    weight: Number(log.weight),
    rawDate: log.date
  })).reverse() || [];

  return (
    <div className="page-transition">
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")} className="rounded-full w-10 h-10 border-[var(--border)] bg-[var(--surface-1)] shadow-sm hover:bg-[var(--surface-2)] text-[var(--text-primary)]">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="section-label mb-0.5">Tracking</p>
              <h1 className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">Body Weight</h1>
            </div>
          </div>
        }
      >
        <div className="max-w-xl mx-auto space-y-10 pb-32">
          <section className="text-center space-y-8 py-4 stagger-1">
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-[#2F80ED]/10 blur-3xl rounded-full" />
              <div className="w-24 h-24 rounded-[32px] bg-[var(--surface-1)] flex items-center justify-center shadow-[0_4px_20px_rgba(47,128,237,0.07)] border border-[var(--border)] relative z-10">
                <Scale className="w-10 h-10 text-brand" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-3xl font-bold tracking-tighter text-[var(--text-primary)]">Scale Check-in</h2>
              <p className="text-[var(--text-muted)] font-medium text-[15px] max-w-[260px] mx-auto leading-relaxed">
                Track your trend, ignore the noise. Progress is built on averages.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex items-center justify-center gap-1">
                <div className="relative group">
                  <Input
                    type="number"
                    step="0.1"
                    min="20"
                    max="300"
                    inputMode="decimal"
                    pattern="[0-9]*\\.?[0-9]*"
                    className="text-center text-6xl h-24 w-48 font-display font-bold tracking-tighter rounded-[32px] border-none bg-[var(--surface-2)] text-[var(--text-primary)] focus-visible:ring-[#2F80ED]/20 shadow-inner group-focus-within:bg-[var(--surface-1)] group-focus-within:shadow-[0_4px_20px_rgba(47,128,237,0.07)] transition-all"
                    placeholder="e.g. 65.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    autoFocus
                  />
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
                    <span className="section-label opacity-50">KILOGRAMS</span>
                  </div>
                </div>
              </div>

              <div className="px-6">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-16 rounded-[24px] text-lg font-bold btn-primary text-white shadow-[0_4px_20px_rgba(47,128,237,0.07)] scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all border-none"
                  disabled={!weight || isPending}
                >
                  {isPending ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Sparkles className="w-6 h-6 mr-3" />}
                  Record Weight
                </Button>
              </div>
            </form>
          </section>

          {chartData.length > 0 && (
            <section className="space-y-4 stagger-2">
              <SectionHeader title="Trend Analysis" />
              <div className="wellness-card p-6 bg-[var(--surface-1)] border-none shadow-[0_4px_20px_rgba(47,128,237,0.07)] overflow-hidden">
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2F80ED" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#2F80ED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis
                        dataKey="date"
                        stroke="#8AA5BE"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        dy={10}
                        fontStyle="bold"
                        fontFamily="var(--font-heading)"
                      />
                      <YAxis
                        stroke="#8AA5BE"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        domain={['dataMin - 1', 'dataMax + 1']}
                        fontStyle="bold"
                        fontFamily="var(--font-heading)"
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '20px',
                          border: 'none',
                          boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                          fontWeight: 'bold',
                          color: '#1E2A3A'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#2F80ED"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#weightGradient)"
                        animationDuration={2000}
                        dot={{ fill: '#2F80ED', strokeWidth: 2, r: 4, stroke: 'white' }}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#2F80ED' }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="bg-[var(--surface-2)] p-4 rounded-[24px] border border-[var(--border)]">
                    <p className="section-label mb-1">Starting</p>
                    <p className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">{chartData[0]?.weight?.toFixed(1)} <span className="text-xs font-bold text-[var(--text-muted)]">kg</span></p>
                  </div>
                  <div className="bg-[var(--surface-2)] p-4 rounded-[24px] border border-[var(--border)]">
                    <p className="section-label mb-1">Latest</p>
                    <p className="font-display text-xl font-bold tracking-tight text-[var(--text-primary)]">{chartData[chartData.length - 1]?.weight?.toFixed(1)} <span className="text-xs font-bold text-[var(--text-muted)]">kg</span></p>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="space-y-4 stagger-3">
            <SectionHeader title="History Log" />
            <div className="wellness-card bg-[var(--surface-1)] border-none shadow-[0_4px_20px_rgba(47,128,237,0.07)] divide-y divide-slate-100 overflow-hidden">
              {chartData.slice().reverse().map((log, idx) => (
                <div key={idx} className="p-4 flex justify-between items-center hover:bg-[var(--surface-2)] transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#2F80ED]/5 flex items-center justify-center text-brand group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-sm text-[var(--text-primary)]">{log.date}</p>
                      <p className="section-label lowercase first-letter:uppercase italic opacity-60 mt-0.5">{format(new Date(log.rawDate), "eeee")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)]">{Number(log.weight).toFixed(1)} <span className="text-xs text-[var(--text-muted)]">kg</span></p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageLayout>
    </div>
  );
}
