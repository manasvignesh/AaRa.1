import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { MacroRing } from "@/components/MacroRing";
import { Button } from "@/components/ui/button";

import { Loader2, Plus, ChevronRight, CheckCircle, Utensils, ChevronLeft, Droplets, Minus, Zap, Activity, Footprints, Trophy, Search, Clock, ArrowRight, PlayCircle } from "lucide-react";
import { format, addDays, subDays, isToday, startOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
  const { mutate: updateWater } = useUpdateWater();


  const [generationError, setGenerationError] = useState<string | null>(null);

  // Derive totals from meals state
  const caloriesProgress = meals.reduce((sum: number, m: any) => {
    if (m.consumedAlternative) return sum + (m.alternativeCalories || 0);
    if (m.isConsumed) return sum + (m.calories || 0);
    return sum;
  }, 0);

  const proteinProgress = meals.reduce((sum: number, m: any) => {
    if (m.consumedAlternative) return sum + (m.alternativeProtein || 0);
    if (m.isConsumed) return sum + (m.protein || 0);
    return sum;
  }, 0);

  useEffect(() => {
    if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
      generatePlan(selectedDate, {
        onError: (err: any) => {
          setGenerationError(err.message || "Failed to generate your plan. Please try again.");
        }
      });
    }
  }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

  useEffect(() => {
    setGenerationError(null);
  }, [selectedDate]);

  const handleAddWater = () => {
    if (!plan) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: 250 });
  };

  const handleSubtractWater = () => {
    if (!plan || (plan.waterIntake || 0) <= 0) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: -250 });
  };

  const isHydrated = plan ? (plan.waterIntake || 0) >= 2000 : false;

  if (userLoading || (planLoading && !plan) || isGenerating) {
    return (
      <PageLayout
        header={
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{format(selectedDate, 'EEEE, MMM do')}</p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Analyzing</h1>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-8 text-center text-foreground">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <div className="space-y-2">
            <h3 className="font-black text-2xl tracking-tighter uppercase opacity-80">Synchronizing</h3>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">AARA AI is coordinating your biome...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(selectedDate, { weekStartsOn: 1 }),
    end: addDays(startOfWeek(selectedDate, { weekStartsOn: 1 }), 6)
  });

  const caloriesTarget = plan?.caloriesTarget || 2000;
  const proteinTarget = plan?.proteinTarget || 150;
  const remainingCalories = Math.max(0, caloriesTarget - caloriesProgress);

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">
              {isToday(selectedDate) ? "Current Matrix" : format(selectedDate, 'EEEE, MMM do')}
            </p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Status</h1>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary hover:bg-white/80 transition-all"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              className="w-10 h-10 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-xl border border-slate-100 text-primary hover:bg-white/80 transition-all"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-8 pb-10">
        {/* Weekly Timeline */}
        <section>
          <div className="wellness-card p-3 flex justify-between items-center bg-white/40 backdrop-blur-xl border-white/20 shadow-xl">
            {weekDays.map((baseDay: Date, idx: number) => {
              const active = isSameDay(baseDay, selectedDate);
              const today = isToday(baseDay);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(baseDay)}
                  className={cn(
                    "flex flex-col items-center py-3 px-3 rounded-2xl transition-all w-12",
                    active ? "brand-gradient text-white shadow-xl scale-105" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                >
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "text-white/80" : "text-muted-foreground/40")}>
                    {format(baseDay, "eee")}
                  </span>
                  <span className="text-lg font-black tracking-tighter mt-1">{format(baseDay, "d")}</span>
                  {today && !active && <div className="w-1 h-1 bg-primary rounded-full mt-1" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* Metabolic Core */}
        <section className="space-y-5">
          <SectionHeader title="Biosphere Insights" />
          <div className="wellness-card p-5 flex flex-col items-center group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] -z-10 group-hover:scale-110 transition-transform">
              <Activity className="w-48 h-48" />
            </div>

            <MacroRing
              caloriesTarget={caloriesTarget}
              caloriesCurrent={caloriesProgress}
              proteinTarget={proteinTarget}
              proteinCurrent={proteinProgress}
              size={260}
              strokeWidth={24}
            />

            <div className="grid grid-cols-2 w-full gap-4 mt-8">
              <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Delta</p>
                <p className="text-2xl font-black tracking-tighter text-foreground">{remainingCalories}</p>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-1">kcal left</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 text-center">
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1 opacity-60">Synthesis</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-2xl font-black tracking-tighter">{Math.round(proteinProgress)}</span>
                  <span className="text-[10px] font-bold text-muted-foreground/40">/{proteinTarget}g</span>
                </div>
                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase mt-1">protein</p>
              </div>
            </div>
          </div>
        </section>

        {/* Hydration */}
        <section className="space-y-4">
          <SectionHeader title="Hydration Flow" />
          <div className="wellness-card p-5 flex items-center justify-between group">
            <div className="flex items-center gap-5">
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700",
                isHydrated ? "brand-gradient text-white shadow-lg" : "bg-slate-100/50 text-primary"
              )}>
                <Droplets className={cn("w-7 h-7", isHydrated && "animate-pulse")} />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black tracking-tighter">{plan?.waterIntake || 0}</span>
                  <span className="text-xs font-bold text-muted-foreground/40">ml</span>
                </div>
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">Target: 2.5 L</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSubtractWater}
                className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-muted-foreground flex items-center justify-center transition-all active:scale-95"
              >
                <Minus className="w-5 h-5" />
              </button>
              <button
                onClick={handleAddWater}
                className="w-10 h-10 rounded-xl brand-gradient text-white flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-brand-blue/20"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </section>

        {/* Next Training */}
        <section className="space-y-4">
          <SectionHeader title="Training Engine" />
          {workouts.length > 0 ? (
            <Link href={`/workout/${workouts[0].id}`}>
              <div className="wellness-card p-1 bg-card border-none overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all duration-500">
                <div className="brand-gradient p-5 text-white relative">
                  <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-[40px] opacity-40" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-70 mb-2">Primary Protocol</p>
                      <h3 className="text-2xl font-black tracking-tighter leading-none mb-4">{workouts[0].name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          <Clock className="w-3 h-3" /> {workouts[0].duration}m
                        </div>
                        <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                          <Zap className="w-3 h-3" /> {workouts[0].difficulty}
                        </div>
                      </div>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <PlayCircle className="w-6 h-6 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ) : (
            <div className="wellness-card p-10 flex flex-col items-center justify-center text-center opacity-40">
              <Clock className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">Regeneration Active</p>
            </div>
          )}
        </section>

        {/* Nutrition Summary */}
        <section className="space-y-4">
          <SectionHeader title="Fuel Management" />
          <div className="wellness-card p-5 bg-white/60 backdrop-blur-xl border border-white/40 shadow-xl flex items-center justify-between group">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-primary shadow-sm">
                <Utensils className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1 opacity-70">Daily Fuel</p>
                <h4 className="text-lg font-black tracking-tight leading-none mb-1 text-foreground">
                  {meals.length > 0 ? `${meals.length} Meals Planned` : "No Meals Planned"}
                </h4>
                {meals.length > 0 && (
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest leading-none">
                    Next: {meals[0].name}
                  </p>
                )}
              </div>
            </div>

            <Link href="/meals">
              <button className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-foreground flex items-center justify-center transition-all active:scale-95 group-hover:bg-primary group-hover:text-white border border-slate-200 group-hover:border-primary">
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="grid grid-cols-2 gap-4">
          {[
            { label: "Steps", val: "8,2K", icon: Footprints, color: "text-orange-500 bg-orange-500/10" },
            { label: "Streak", val: "12 D", icon: Trophy, color: "text-amber-500 bg-amber-500/10" }
          ].map((stat, i) => (
            <div key={i} className="wellness-card p-4 flex items-center gap-4 bg-white/2 border-white/5">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-black tracking-tighter leading-none">{stat.val}</p>
                <p className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>
      </div >


    </PageLayout >
  );
}
