import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals, useToggleMealConsumed, useLogAlternativeMeal } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { MacroRing } from "@/components/MacroRing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ChevronRight, CheckCircle, Utensils, Dumbbell, Calendar, ChevronLeft, Check, X, Droplets, Minus, Target, Sparkles, Zap, Flame, Trophy, Info, Search, Activity, Footprints, Clock, ArrowRight, User } from "lucide-react";
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
  const { mutate: toggleConsumed } = useToggleMealConsumed();

  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);
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

  const handleRetryGeneration = () => {
    setGenerationError(null);
    generatePlan(selectedDate, {
      onError: (err: any) => {
        setGenerationError(err.message || "Failed to generate your plan. Please try again.");
      }
    });
  };

  const handleAddWater = () => {
    if (!plan) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: 250 });
  };

  const handleSubtractWater = () => {
    if (!plan || (plan.waterIntake || 0) <= 0) return;
    updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: -250 });
  };

  const waterLimit = 4000;
  const isHydrated = plan ? (plan.waterIntake || 0) >= 2000 : false;
  const isExcessive = plan ? (plan.waterIntake || 0) >= waterLimit : false;

  if (userLoading || (planLoading && !plan) || isGenerating) {
    return (
      <PageLayout
        header={
          <div className="flex flex-col gap-2">
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">{format(selectedDate, 'EEEE, MMM do')}</p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Analyzing Vitality</h1>
          </div>
        }
      >
        <div className="flex flex-col items-center justify-center py-20 min-h-[50vh] gap-8 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <Loader2 className="w-14 h-14 text-primary animate-spin relative z-10" />
          </div>
          <div className="space-y-2">
            <h3 className="font-black text-2xl tracking-tighter text-foreground uppercase opacity-80">
              {isGenerating ? "Synthesizing Plan" : "Synchronizing"}
            </h3>
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              {isGenerating ? "AARA AI is calculating your optimal biometrics..." : "Retrieving your health ledger..."}
            </p>
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
      header={
        <div className="flex justify-between items-end">
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">
              {isToday(selectedDate) ? "Current Status" : format(selectedDate, 'EEEE, MMM do')}
            </p>
            <h1 className="text-4xl font-black tracking-tighter text-foreground">Console</h1>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-none bg-card shadow-sm hover:bg-secondary/40 text-primary"
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="w-10 h-10 rounded-full border-none bg-card shadow-sm hover:bg-secondary/40 text-primary"
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-10 pb-32">
        {/* Weekly Strip */}
        <section>
          <div className="wellness-card p-4 flex justify-between items-center shadow-sm bg-card border-none">
            {weekDays.map((day: Date, idx: number) => {
              const active = isSameDay(day, selectedDate);
              const today = isToday(day);
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "flex flex-col items-center py-3 px-3 rounded-[20px] transition-all w-12 group",
                    active ? "brand-gradient text-white shadow-xl scale-105" : "hover:bg-secondary/30"
                  )}
                >
                  <span className={cn("text-[8px] font-black uppercase tracking-widest", active ? "text-white/80" : "text-muted-foreground/40")}>
                    {format(day, "eee")}
                  </span>
                  <span className="text-lg font-black tracking-tighter mt-1">{format(day, "d")}</span>
                  {today && !active && <div className="w-1 h-1 bg-primary rounded-full mt-1.5" />}
                </button>
              );
            })}
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Nutrition Visualization */}
          <section className="space-y-6">
            <SectionHeader title="Metabolic Insight" />
            <div className="wellness-card p-10 bg-card border-none shadow-2xl relative overflow-hidden flex flex-col items-center group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                <Activity className="w-48 h-48" />
              </div>

              <div className="relative z-10 w-full flex flex-col items-center">
                <MacroRing
                  caloriesTarget={caloriesTarget}
                  caloriesCurrent={caloriesProgress}
                  proteinTarget={proteinTarget}
                  proteinCurrent={proteinProgress}
                  size={300}
                  strokeWidth={28}
                />

                <div className="grid grid-cols-2 w-full gap-4 mt-12">
                  <div className="bg-secondary/20 p-6 rounded-[32px] border border-border/5 text-center transition-all hover:bg-secondary/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Remaining</p>
                    <p className="text-3xl font-black tracking-tighter text-foreground leading-none">{remainingCalories}</p>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-1">kcal</p>
                  </div>
                  <div className="bg-secondary/20 p-6 rounded-[32px] border border-border/5 text-center transition-all hover:bg-secondary/30">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2 leading-none">Protein Flux</p>
                    <div className="flex items-baseline justify-center gap-1 leading-none">
                      <span className="text-3xl font-black tracking-tighter">{Math.round(proteinProgress)}</span>
                      <span className="text-xs font-bold text-muted-foreground/40 leading-none">/ {proteinTarget}g</span>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase mt-1">Consolidated</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Water Tracking Card */}
            <div className="wellness-card p-8 flex items-center justify-between shadow-xl bg-card border-none group">
              <div className="flex items-center gap-6">
                <div className={cn(
                  "w-16 h-16 rounded-[24px] flex items-center justify-center transition-all duration-700 shadow-inner",
                  isHydrated
                    ? "bg-blue-500 text-white shadow-blue-500/20 scale-105"
                    : "bg-blue-50 text-blue-400 group-hover:bg-blue-100 group-hover:text-blue-500"
                )}>
                  <Droplets className={cn("w-8 h-8", isHydrated && "animate-pulse")} />
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-4xl font-black tracking-tighter">{plan?.waterIntake || 0}</span>
                    <span className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">ml</span>
                  </div>
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.25em] mt-2 italic">Minimum: 2.5 L</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={handleSubtractWater}
                  disabled={(plan?.waterIntake || 0) <= 0}
                  className="w-12 h-12 rounded-[20px] bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground active:scale-95 transition-all border-none"
                >
                  <Minus className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleAddWater}
                  disabled={isExcessive}
                  className="w-12 h-12 rounded-[20px] brand-gradient text-white shadow-lg shadow-brand-blue/20 hover:scale-105 active:scale-95 transition-all border-none"
                >
                  <Plus className="w-6 h-6" />
                </Button>
              </div>
            </div>
          </section>

          {/* Training & Meals Feed */}
          <section className="space-y-10">
            {/* Training Card */}
            <div className="space-y-6">
              <SectionHeader title="Next Session" />
              {workouts.length > 0 ? (
                <Link href={`/workout/${workouts[0].id}`}>
                  <div className="wellness-card p-1 bg-card border-none shadow-2xl overflow-hidden cursor-pointer group hover:-translate-y-1 transition-all duration-500">
                    <div className="brand-gradient p-8 text-white relative">
                      <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-[60px]" />
                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Active Protocol</span>
                          </div>
                          <div>
                            <h3 className="text-3xl font-black tracking-tighter leading-none">{workouts[0].name}</h3>
                            <div className="flex items-center gap-4 mt-4">
                              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                <Clock className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{workouts[0].duration} Min</span>
                              </div>
                              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                                <Zap className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-black uppercase tracking-widest">{workouts[0].difficulty}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-16 h-16 rounded-[24px] bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center group-hover:bg-white group-hover:text-primary transition-all duration-500 group-hover:scale-110 shadow-2xl">
                          <PlayCircle className="w-8 h-8 fill-current" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="wellness-card p-10 flex flex-col items-center justify-center text-center space-y-4 bg-card border-none shadow-sm">
                  <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                  <p className="text-sm font-black text-muted-foreground/40 uppercase tracking-widest">Regeneration Phase</p>
                </div>
              )}
            </div>

            {/* Meals Feed */}
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <SectionHeader title="Nutrition Feed" />
                <Link href="/meals">
                  <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 rounded-full px-4 h-8">
                    Detailed View <ArrowRight className="ml-2 w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>

              <div className="space-y-4">
                {meals.slice(0, 3).map((meal: any) => (
                  <div
                    key={meal.id}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveMealId(meal.id);
                      setShowConsumptionPrompt(true);
                    }}
                    className={cn(
                      "wellness-card p-5 flex items-center justify-between transition-all duration-300 cursor-pointer shadow-sm group border-none",
                      meal.isConsumed || meal.consumedAlternative
                        ? "bg-emerald-50/20 ring-1 ring-emerald-500/10"
                        : "bg-card hover:bg-secondary/20 hover:translate-x-1"
                    )}
                  >
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-12 h-12 rounded-[18px] flex items-center justify-center transition-all duration-500",
                        meal.isConsumed || meal.consumedAlternative
                          ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                          : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                      )}>
                        {meal.isConsumed || meal.consumedAlternative ? <CheckCircle2 className="w-6 h-6" /> : <Utensils className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="text-[15px] font-black tracking-tight leading-none mb-1 shadow-primary/10">
                          {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                        </h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-[0.15em]">{meal.type}</span>
                          <div className="w-1 h-1 rounded-full bg-border" />
                          <span className="text-[10px] font-black text-primary/60 uppercase">{meal.consumedAlternative ? meal.alternativeCalories : meal.calories} kcal</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-5 h-5 transition-all",
                      meal.isConsumed || meal.consumedAlternative ? "text-emerald-500" : "text-muted-foreground/20 group-hover:translate-x-1 group-hover:text-primary"
                    )} />
                  </div>
                ))}

                {!meals.length && (
                  <div className="wellness-card p-12 flex flex-col items-center justify-center text-center space-y-4 bg-card border-none shadow-sm italic opacity-30">
                    <Search className="w-10 h-10" />
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synthesizing Meal Grid...</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Action Widgets Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Steps", val: "8,420", unit: "PTS", icon: Footprints, color: "text-orange-500 bg-orange-50/50" },
            { label: "Active", val: "42", unit: "MIN", icon: Zap, color: "text-amber-500 bg-amber-50/50" },
            { label: "Intensity", val: "High", unit: "LV", icon: Activity, color: "text-rose-500 bg-rose-50/50" },
            { label: "Sustained", val: "Streak", unit: "9D", icon: Trophy, color: "text-primary bg-primary/5" }
          ].map((stat, i) => (
            <div key={i} className="wellness-card p-5 bg-card border-none shadow-sm flex flex-col items-center text-center space-y-2 group hover:shadow-md transition-all">
              <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", stat.color)}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[18px] font-black tracking-tighter leading-none">{stat.val}</p>
                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest mt-1">{stat.label} • {stat.unit}</p>
              </div>
            </div>
          ))}
        </section>
      </div>

      {/* Consumption Modal */}
      <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-sm">
          <div className="brand-gradient p-12 text-center text-white space-y-6">
            <div className="w-24 h-24 rounded-[32px] bg-white/20 backdrop-blur-xl border border-white/30 mx-auto flex items-center justify-center shadow-xl">
              <Utensils className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black tracking-tighter uppercase">Nutrition Log</h3>
              <p className="text-white/70 font-medium">Verify your consumption to synchronize metabolic data.</p>
            </div>
          </div>
          <div className="p-10 space-y-4 bg-card">
            <Button
              className="w-full h-16 rounded-[24px] brand-gradient text-white font-black text-lg shadow-xl shadow-brand-blue/20"
              onClick={() => {
                if (!activeMealId) return;
                toggleConsumed({ id: activeMealId, isConsumed: true, date: format(selectedDate, 'yyyy-MM-dd') });
                setShowConsumptionPrompt(false);
                setActiveMealId(null);
              }}
            >
              Consumed Plan <Sparkles className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              className="w-full h-16 rounded-[24px] border-none bg-secondary/50 text-foreground font-black text-lg hover:bg-secondary active:scale-[0.98] transition-all"
              onClick={() => {
                setShowConsumptionPrompt(false);
                const mealId = activeMealId;
                setActiveMealId(null);
                if (mealId) setLocation(`/meal/${mealId}`);
              }}
            >
              Log Alternative <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              className="w-full h-12 rounded-full text-muted-foreground font-bold hover:bg-transparent"
              onClick={() => setShowConsumptionPrompt(false)}
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

// PlayCircle icon missing from earlier import, added here
function PlayCircle(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
