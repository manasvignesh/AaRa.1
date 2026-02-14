import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals, useToggleMealConsumed, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Navigation } from "@/components/Navigation";
import { MacroRing } from "@/components/MacroRing";
import { CountUp } from "@/components/CountUp";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ChevronRight, CheckCircle, Utensils, Dumbbell, Calendar, ChevronLeft, Check, X, Footprints, Flame, Trophy, Zap, Activity, Cpu, Coffee, Apple, Croissant, ShieldCheck, Heart, Info, ArrowRight } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
  const { mutate: updateWater } = useUpdateWater();
  const { mutate: toggleConsumed, isPending: isToggling } = useToggleMealConsumed();
  const { mutate: logAlternative, isPending: isLoggingAlt } = useLogAlternativeMeal();

  const [activeMealId, setActiveMealId] = useState<number | null>(null);
  const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [altDescription, setAltDescription] = useState("");
  const [altPortionSize, setAltPortionSize] = useState<"small" | "medium" | "large">("medium");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ calories: number; protein: number } | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [expandedMealIds, setExpandedMealIds] = useState<number[]>([]);

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

  const handleMealCardClick = (mealId: number, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMealId(mealId);
    setShowConsumptionPrompt(true);
  };

  const activeMeal = meals.find(m => m.id === activeMealId);

  const handleYesConsumed = () => {
    if (!activeMealId) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    toggleConsumed({ id: activeMealId, isConsumed: true, date: dateStr });
    setShowConsumptionPrompt(false);
    setActiveMealId(null);
  };

  const handleConsumedSomethingElse = () => {
    setShowConsumptionPrompt(false);
    setShowAlternativeForm(true);
  };

  const estimateCalories = (description: string, portion: string) => {
    const portionMultiplier: Record<string, number> = { small: 0.7, medium: 1.0, large: 1.4 };
    const baseCalories = 350;
    const multiplier = portionMultiplier[portion] || 1.0;
    const calories = Math.round(baseCalories * multiplier);
    const protein = Math.round(calories * 0.15 / 4);
    return { calories, protein };
  };

  const handleShowPreview = () => {
    const estimate = estimateCalories(altDescription, altPortionSize);
    setPreviewData(estimate);
    setShowPreview(true);
  };

  const handleConfirmAlternative = () => {
    if (!activeMealId) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    logAlternative(
      { id: activeMealId, description: altDescription, portionSize: altPortionSize, date: dateStr },
      {
        onSuccess: () => {
          setShowAlternativeForm(false);
          setShowPreview(false);
          setAltDescription("");
          setPreviewData(null);
          setActiveMealId(null);
        }
      }
    );
  };

  const handleCloseDialogs = () => {
    setShowConsumptionPrompt(false);
    setShowAlternativeForm(false);
    setShowPreview(false);
    setAltDescription("");
    setPreviewData(null);
    setActiveMealId(null);
  };

  if (userLoading || (planLoading && !plan) || isGenerating) {
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
            <Zap className="w-10 h-10 text-primary animate-pulse" />
          </motion.div>
          <div className="text-center space-y-4">
            <h3 className="font-display font-bold text-2xl text-white uppercase tracking-[0.2em] animate-pulse">
              Synthesizing_Life_Cycle
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

  if (generationError || (!plan && !isGenerating)) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 max-w-md mx-auto text-center z-10">
          <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <X className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight">LINK_FAILURE</h3>
            <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest opacity-60 leading-relaxed">
              {generationError || "CRITICAL_MISSING_PLAN_EXCEPTION: UNABLE_TO_SYNCHRONIZE_BIO_ROUTINE"}
            </p>
          </div>
          <Button
            size="lg"
            className="w-full h-14 rounded-2xl bg-primary text-black font-display font-bold text-lg uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)]"
            onClick={handleRetryGeneration}
          >
            RE-ESTABLISH_LINK
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Navigation />

      <main className="flex-1 pb-48 md:pb-12 overflow-y-auto px-4 md:px-8">
        <header className="pt-10 pb-10 md:pt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 blur-[150px] -z-10 rounded-full" />

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.4em]">Node_Active // Logged_In</p>
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tighter text-white leading-none mb-4">
              WELCOME, <span className="text-primary">{user?.displayName?.split(' ')[0] || "OPERATOR"}</span>
            </h1>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
                <Flame className="w-3.5 h-3.5 text-orange-500" /> Thermogenic_Phase
              </span>
              <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-mono font-bold text-primary uppercase tracking-widest">
                <Trophy className="w-3.5 h-3.5" /> Rank: Alpha_Core
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-4 glass-card p-3 rounded-3xl border-white/5 bg-white/[0.02]"
          >
            <button
              onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
            >
              <ChevronLeft className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
            </button>
            <div className="px-6 text-center min-w-[140px]">
              <p className="font-display font-bold text-xl text-white">{isToday(selectedDate) ? "TODAY" : format(selectedDate, "MMM d")}</p>
              <p className="text-[9px] font-mono text-white/30 uppercase tracking-[0.2em]">{format(selectedDate, "EEEE")}</p>
            </div>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="w-12 h-12 rounded-2xl bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all group"
            >
              <ChevronRight className="w-6 h-6 text-white/40 group-hover:text-primary transition-colors" />
            </button>
          </motion.div>
        </header>

        {/* Tactical Overview */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 relative">
          <div className="lg:col-span-2 glass-card rounded-[3rem] p-10 md:p-14 relative overflow-hidden group border-white/5">
            <div className="absolute top-0 right-0 p-12 opacity-5">
              <Zap className="w-48 h-48 text-primary" />
            </div>

            <div className="flex flex-col md:flex-row items-center gap-16 relative z-10">
              <div className="relative">
                <MacroRing
                  current={caloriesProgress}
                  target={plan.caloriesTarget}
                  label=""
                  unit=""
                  color="hsl(var(--primary))"
                  size={window.innerWidth < 768 ? 180 : 260}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Total_Net</p>
                  <p className="text-4xl font-display font-bold text-white tracking-tighter"><CountUp value={caloriesProgress} /></p>
                </div>
              </div>

              <div className="flex-1 space-y-10">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-mono font-bold text-primary uppercase tracking-[0.4em]">Energy_Adherence</h3>
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-display font-bold text-white tracking-tighter">
                      <CountUp value={Math.max(0, plan.caloriesTarget - caloriesProgress)} />
                    </span>
                    <span className="text-xl font-display font-medium text-white/30 uppercase tracking-tighter italic font-light">Remaining</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Zap className="w-3 h-3 text-primary" />
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Molecular_Mass</p>
                    </div>
                    <p className="text-3xl font-display font-bold text-white">
                      <CountUp value={proteinProgress} /> <span className="text-xs text-white/20 uppercase ml-1">/ {plan.proteinTarget}g</span>
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (proteinProgress / plan.proteinTarget) * 100)}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-3 h-3 text-orange-500" />
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Consistency_Index</p>
                    </div>
                    <p className="text-3xl font-display font-bold text-white">
                      <CountUp value={88} /> <span className="text-xs text-white/20 uppercase ml-1">%</span>
                    </p>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "88%" }}
                        className="h-full bg-orange-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats Pods */}
          <div className="flex flex-col gap-8">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-blue-500/[0.02] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Zap className="w-6 h-6 opacity-60" />
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleSubtractWater} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all text-sm font-bold">-</button>
                  <button onClick={handleAddWater} className="w-8 h-8 rounded-lg bg-blue-500/20 hover:bg-blue-500/40 flex items-center justify-center text-blue-400 transition-all text-sm font-bold">+</button>
                </div>
              </div>
              <div>
                <p className="text-4xl font-display font-bold text-white tracking-tighter mb-1">
                  <CountUp value={plan.waterIntake || 0} />
                  <span className="text-sm font-medium text-white/20 uppercase ml-2 italic tracking-tighter">ml</span>
                </p>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Hydration_Flow</p>
              </div>
            </motion.div>

            <Link href="/weight/log">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-purple-500/[0.02] flex flex-col justify-between cursor-pointer group"
              >
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <Cpu className="w-6 h-6 opacity-60" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/10 group-hover:text-purple-400 transition-all group-hover:translate-x-1" />
                </div>
                <div>
                  <p className="text-4xl font-display font-bold text-white tracking-tighter mb-1">
                    {user?.currentWeight?.toFixed(1) || "--"}
                    <span className="text-sm font-medium text-white/20 uppercase ml-2 italic tracking-tighter">kg</span>
                  </p>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.2em]">Current_System_Mass</p>
                </div>
              </motion.div>
            </Link>
          </div>
        </section>

        {/* Nutritional Timeline */}
        <section className="mb-20">
          <div className="flex items-center gap-4 px-2 mb-10">
            <Utensils className="w-4 h-4 text-primary opacity-60" />
            <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">Thermodynamic_Sequence</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
            <Link href="/meals">
              <button className="text-[10px] font-mono text-primary font-bold uppercase hover:underline tracking-widest">Full_Registry</button>
            </Link>
          </div>

          <div className="space-y-8 relative">
            <div className="absolute left-[2.2rem] top-10 bottom-10 w-[1px] bg-gradient-to-b from-primary/40 via-white/5 to-transparent z-0" />

            <AnimatePresence>
              {meals.map((meal: any, idx: number) => {
                const isLogged = meal.isConsumed || meal.consumedAlternative;
                const isExpanded = expandedMealIds.includes(meal.id);

                const mealIcons: Record<string, any> = {
                  breakfast: Coffee,
                  lunch: Apple,
                  dinner: Croissant,
                  snack: Zap
                };
                const Icon = mealIcons[meal.type?.toLowerCase()] || Utensils;

                return (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="relative z-10 flex gap-8"
                  >
                    <div className="mt-6">
                      <div className={cn(
                        "w-7 h-7 rounded-full border-4 border-background flex items-center justify-center transition-all duration-700 relative",
                        isLogged ? "bg-primary shadow-[0_0_20px_rgba(142,214,63,0.4)]" : "bg-white/10"
                      )}>
                        {isLogged && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: [1, 1.8, 1] }}
                            transition={{ repeat: Infinity, duration: 2.5 }}
                            className="absolute inset-0 rounded-full bg-primary/20 -z-10"
                          />
                        )}
                        {isLogged && <Check className="w-3.5 h-3.5 text-black" />}
                      </div>
                    </div>

                    <div
                      onClick={(e) => handleMealCardClick(meal.id, e)}
                      className={cn(
                        "flex-1 glass-card rounded-[2.5rem] p-8 border-white/5 transition-all duration-300 relative group cursor-pointer",
                        isLogged ? "opacity-50 grayscale-[0.5]" : "hover:border-primary/20"
                      )}
                    >
                      <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-10 transition-opacity">
                        <Icon className="w-20 h-20 text-primary" />
                      </div>

                      <div className="flex items-start justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest group-hover:text-primary transition-colors">
                              PROTOCOL_{meal.type?.toUpperCase()}
                            </span>
                            {isLogged && <span className="text-[9px] font-mono font-bold text-primary uppercase tracking-widest">SYNTHESIZED</span>}
                          </div>
                          <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight group-hover:text-primary transition-colors">
                            {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                          </h3>
                          <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                              <Flame className="w-3 h-3 text-orange-500" />
                              <span className="text-xs font-mono font-bold text-white/60 uppercase">{meal.consumedAlternative ? meal.alternativeCalories : meal.calories} <span className="text-[9px] opacity-40">KCAL</span></span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Zap className="w-3 h-3 text-primary" />
                              <span className="text-xs font-mono font-bold text-white/60 uppercase">{meal.consumedAlternative ? meal.alternativeProtein : meal.protein} <span className="text-[9px] opacity-40">G PROTEIN</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center opacity-20 group-hover:opacity-100 group-hover:border-primary/30 transition-all">
                          <ChevronRight className="w-5 h-5 group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* Tactical Training Pod */}
        <section className="mb-20">
          <div className="flex items-center gap-4 px-2 mb-10">
            <Dumbbell className="w-4 h-4 text-primary opacity-60" />
            <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">Kinetic_Workloads</h2>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {workouts.map((workout: any, idx: number) => (
              <Link key={workout.id} href={`/workout/${workout.id}`}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="glass-card rounded-[2.5rem] p-10 border-white/5 relative overflow-hidden group cursor-pointer bg-indigo-500/[0.01]"
                >
                  <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Activity className="w-32 h-32 text-indigo-400" />
                  </div>

                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                      <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest">STAMINA_PROTOCOL_ACTIVE</span>
                    </div>
                    <h3 className="text-3xl font-display font-bold text-white uppercase tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                      {workout.name}
                    </h3>
                    <div className="flex items-center justify-between pt-6 border-t border-white/5">
                      <div className="flex gap-8">
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Duration</p>
                          <p className="text-xl font-display font-bold text-white uppercase">{workout.duration} Min</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Intensity</p>
                          <p className="text-xl font-display font-bold text-primary uppercase">Flow</p>
                        </div>
                      </div>
                      <div className="w-14 h-14 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.3)] group-hover:scale-110 transition-transform">
                        <ArrowRight className="w-6 h-6" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}

            {workouts.length === 0 && (
              <div className="col-span-full h-64 glass-card rounded-[3rem] border-dashed border-white/10 flex flex-col items-center justify-center opacity-40">
                <Heart className="w-10 h-10 mb-4 animate-pulse text-red-500" />
                <p className="text-xl font-display font-bold uppercase tracking-widest text-white">REGENERATIVE_PHASE_ACTIVE</p>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] mt-2">Homeostatic stabilization in progress...</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Consumption Dialogs */}
      <Dialog open={showConsumptionPrompt} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Fuel_Status_Report</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {activeMeal && (
              <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
                <p className="text-lg font-display font-bold text-white uppercase mb-2">{activeMeal.name}</p>
                <div className="flex gap-6">
                  <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{activeMeal.calories} KCAL</span>
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{activeMeal.protein} G</span>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleYesConsumed}
                disabled={isToggling}
                className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center gap-3 border-none outline-none"
              >
                {isToggling ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                CONFIRM_CONSUMPTION
              </motion.button>
              <Button
                variant="outline"
                onClick={handleConsumedSomethingElse}
                className="w-full h-16 rounded-2xl border-white/10 hover:border-white/20 text-white font-display font-bold uppercase tracking-widest"
              >
                UNPLANNED_FUEL_INPUT
              </Button>
              <Link href={activeMeal ? `/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMeal.id}` : "#"}>
                <Button variant="ghost" className="w-full h-12 text-white/30 hover:text-white uppercase font-mono text-[9px] tracking-widest">
                  VIEW_FULL_MOLECULAR_DATA
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlternativeForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Manual_Data_Override</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Input_Description</Label>
              <Textarea
                placeholder="DESCRIBE_SUBSTANCE..."
                value={altDescription}
                onChange={(e) => setAltDescription(e.target.value)}
                className="h-28 bg-white/[0.03] border-white/10 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Volumetric_Mass</Label>
              <RadioGroup
                value={altPortionSize}
                onValueChange={(v) => setAltPortionSize(v as "small" | "medium" | "large")}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "small", label: "LOW" },
                  { value: "medium", label: "MOD" },
                  { value: "large", label: "HIGH" }
                ].map((opt) => (
                  <div key={opt.value}>
                    <RadioGroupItem value={opt.value} id={`dash-${opt.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`dash-${opt.value}`}
                      className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary/50 peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                    >
                      <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{opt.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {showPreview && previewData && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 rounded-2xl bg-primary/10 border border-primary/20"
              >
                <p className="text-2xl font-display font-bold text-primary tracking-tighter">~{previewData.calories} KCAL</p>
                <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">ESTIMATED_THERMAL_LOAD</p>
              </motion.div>
            )}

            {!showPreview ? (
              <Button
                onClick={handleShowPreview}
                disabled={!altDescription.trim()}
                className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-bold uppercase tracking-widest"
              >
                SCAN_DATA_POINTS
              </Button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt}
                className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center gap-3 border-none outline-none"
              >
                {isLoggingAlt ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                CALIBRATE_AND_LOG
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
