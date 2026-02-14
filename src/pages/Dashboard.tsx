import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals, useToggleMealConsumed, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Navigation } from "@/components/Navigation";
import { MacroRing } from "@/components/MacroRing";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ChevronRight, CheckCircle, Utensils, Dumbbell, Calendar, ChevronLeft, Check, X, Footprints } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
  const { data: workouts = [], isLoading: workoutsLoading } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating, error: genMutationError } = useGeneratePlan();
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
    // Only auto-trigger if we have NO plan, NO local error, and NOT currently generating
    if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
      console.log("Dashboard: Triggering auto-plan generation for", user.userId);
      generatePlan(selectedDate, {
        onError: (err: any) => {
          setGenerationError(err.message || "Failed to generate your plan. Please try again.");
        }
      });
    }
  }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

  // Reset error when date changes
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
    const baseCalories = description.toLowerCase().includes('salad') ? 250 :
      description.toLowerCase().includes('pizza') ? 450 :
        description.toLowerCase().includes('burger') ? 550 :
          description.toLowerCase().includes('sandwich') ? 400 :
            description.toLowerCase().includes('rice') ? 350 :
              description.toLowerCase().includes('pasta') ? 450 :
                description.toLowerCase().includes('fruit') ? 150 :
                  description.toLowerCase().includes('snack') ? 200 :
                    description.toLowerCase().includes('dessert') ? 350 :
                      description.toLowerCase().includes('chicken') ? 350 :
                        description.toLowerCase().includes('fish') ? 300 :
                          description.toLowerCase().includes('soup') ? 200 :
                            350;
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
          setAltPortionSize("medium");
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

  if (userLoading || planLoading || isGenerating) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-secondary/30">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="font-semibold text-lg">
              {isGenerating ? "Assembling your Indian-inspired plan..." : "Loading your progress..."}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isGenerating ? "I'm optimizing your meals for best results." : "Just a moment."}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (generationError || (!plan && !isGenerating)) {
    return (
      <div className="flex flex-col md:flex-row min-h-screen bg-secondary/30">
        <Navigation />
        <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h3 className="font-bold text-xl">Something went wrong</h3>
            <p className="text-muted-foreground mt-2">
              {generationError || "I couldn't prepare your plan for today."}
            </p>
          </div>
          <Button size="lg" className="w-full" onClick={handleRetryGeneration}>
            Retry Generation
          </Button>
          <div className="text-xs text-muted-foreground">
            Error: {genMutationError instanceof Error ? genMutationError.message : "Network/Server Failure"}
          </div>
        </main>
      </div>
    );
  }

  // At this point plan is guaranteed to exist due to the checks above
  if (!plan) return null;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      <Navigation />

      <main className="flex-1 pb-32 md:pb-8 overflow-y-auto">
        <header className="px-6 pt-10 pb-6 md:pt-16">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-1">
                {format(selectedDate, "EEEE, MMMM do")}
              </p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">
                Hello, {user?.displayName || "Champion"}
              </h1>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm text-primary active:scale-95 transition-all border border-border"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="w-10 h-10 rounded-full bg-card flex items-center justify-center shadow-sm text-primary active:scale-95 transition-all border border-border"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        <div className="wellness-card p-6 shadow-sm mb-6">
          <div className="flex items-center justify-around">
            <MacroRing
              current={caloriesProgress}
              target={plan.caloriesTarget}
              label="Calories"
              unit="kcal"
              color="#2F80ED"
            />
            <MacroRing
              current={proteinProgress}
              target={plan.proteinTarget}
              label="Protein"
              unit="g"
              color="#27AE60"
            />
          </div>
        </div>

        {/* Walk & Run Feature Card */}
        <div className="px-6 mb-8">
          <Link href="/walk-run">
            <Card className="p-4 bg-gradient-to-r from-brand-blue/10 to-brand-green/10 hover:bg-accent/5 transition-all duration-300 border border-border shadow-sm active:scale-[0.98] cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full brand-gradient flex items-center justify-center shadow-md">
                    <Footprints className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-foreground">Walk & Run</h3>
                    <p className="text-sm text-muted-foreground">Track steps, routes & earn badges</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </Card>
          </Link>
        </div>

        <section className="mb-8">
          <h2 className="px-6 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Hydration & Weight</h2>
          <div className="grid grid-cols-2 gap-4 px-4">
            <div className="rounded-2xl bg-card p-4 shadow-sm flex flex-col items-center justify-center group active:scale-95 transition-all border border-border">
              <div className="flex items-center gap-4 mb-2">
                <button
                  onClick={handleSubtractWater}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold"
                  disabled={(plan.waterIntake || 0) <= 0}
                >
                  −
                </button>
                <span className="text-2xl font-bold text-primary">{plan.waterIntake || 0}</span>
                <button
                  onClick={handleAddWater}
                  className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-primary font-bold"
                >
                  +
                </button>
              </div>
              <span className="text-xs font-medium text-muted-foreground">Water (ml)</span>
            </div>

            <Link href="/weight/log">
              <div className="rounded-2xl bg-card p-4 shadow-sm flex flex-col items-center justify-center group active:scale-95 transition-all h-full border border-border">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Plus className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">Log Weight</span>
              </div>
            </Link>
          </div>
        </section>

        {/* Adaptive Plan Adjustment Message */}
        {plan && (plan.caloriesConsumed || 0) > plan.caloriesTarget && (
          <div className="mx-4 my-2 rounded-2xl overflow-hidden p-4 bg-orange-50 border border-orange-200 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">🌿</div>
              <div>
                <p className="font-semibold text-orange-900">Balanced Approach</p>
                <p className="text-sm text-orange-800">
                  You're over today's target. I'll smooth this out over your next few meals. Keep going!
                </p>
              </div>
            </div>
          </div>
        )}

        <section className="mb-8">
          <div className="px-6 flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wider">Today's Meals</h2>
            <p className="text-[11px] font-medium text-primary/60 bg-primary/5 px-2 py-0.5 rounded-full">
              {meals.filter((m: any) => m.isConsumed || m.consumedAlternative).length}/{meals.length} Completed
            </p>
          </div>

          <div className="space-y-4 px-4 relative">
            {/* Timeline Vertical Line */}
            <div className="absolute left-[2.25rem] top-4 bottom-4 w-[2px] bg-border z-0" />

            {meals.map((meal: any, index: number) => {
              const isLogged = meal.isConsumed || meal.consumedAlternative;
              const isExpanded = expandedMealIds.includes(meal.id);

              const toggleExpand = (e: React.MouseEvent) => {
                e.stopPropagation();
                setExpandedMealIds(prev =>
                  prev.includes(meal.id) ? prev.filter(id => id !== meal.id) : [...prev, meal.id]
                );
              };

              const getMealStyles = (type: string) => {
                switch (type.toLowerCase()) {
                  case 'breakfast': return { color: '#E6A817', bg: 'bg-amber-100', micro: 'Fuel your morning with high-quality protein.' };
                  case 'lunch': return { color: '#27AE60', bg: 'bg-green-50', micro: 'Stay energized for the rest of your day.' };
                  case 'dinner': return { color: '#2F80ED', bg: 'bg-blue-50', micro: 'Recovery starts here. End your day strong.' };
                  default: return { color: '#36B5A0', bg: 'bg-teal-50', micro: 'Keep your metabolism active.' };
                }
              };

              const styles = getMealStyles(meal.type);

              return (
                <div key={meal.id} className="relative z-10 flex gap-4">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center mt-4">
                    <div className={cn(
                      "w-4 h-4 rounded-full border-4 border-background flex items-center justify-center transition-all duration-300",
                      isLogged ? "bg-primary scale-110" : "bg-muted"
                    )}>
                      {isLogged && <div className="w-1 h-1 bg-card rounded-full" />}
                    </div>
                  </div>

                  {/* Meal Card */}
                  <Card className={cn(
                    "flex-1 overflow-hidden transition-all duration-300 border-none shadow-sm",
                    isExpanded ? "ring-1 ring-primary/20" : "hover:bg-accent/5"
                  )}>
                    <div
                      onClick={(e) => handleMealCardClick(meal.id, e)}
                      className="p-4 cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full", styles.bg)} style={{ color: styles.color }}>
                              {meal.type}
                            </span>
                            {isLogged && (
                              <span className="text-[10px] font-medium text-brand-green bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-2.5 h-2.5" /> Logged
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-[17px] text-foreground leading-tight">
                            {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                          </h3>
                          <p className="text-[12px] text-muted-foreground italic opacity-70">
                            {styles.micro}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="text-right">
                            <span className="text-lg font-bold text-primary">
                              {meal.consumedAlternative ? meal.alternativeProtein : meal.protein}g
                            </span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase border-l border-muted ml-2 pl-2">
                              Protein
                            </span>
                          </div>
                          <button
                            onClick={toggleExpand}
                            className="p-1 rounded-full hover:bg-secondary transition-colors"
                          >
                            <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", isExpanded && "rotate-90")} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-secondary/50 p-3 rounded-2xl border border-border">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Calories</p>
                              <p className="text-xl font-bold">{meal.consumedAlternative ? meal.alternativeCalories : meal.calories} <span className="text-xs font-normal opacity-60">kcal</span></p>
                            </div>
                            <div className="bg-secondary/50 p-3 rounded-2xl border border-border">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Status</p>
                              <p className={cn("text-sm font-semibold", isLogged ? "text-brand-green" : "text-amber-600")}>
                                {isLogged ? "Ready to Burn" : "Pending Energy"}
                              </p>
                            </div>
                          </div>

                          {!isLogged && (
                            <Button className="w-full h-10 rounded-2xl bg-primary shadow-sm hover:shadow-md transition-all">
                              Log This Meal
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="px-6 text-[13px] font-semibold text-muted-foreground uppercase tracking-wider mb-4">Workout Plan</h2>
          <div className="space-y-4 px-4 relative">
            {/* Timeline Vertical Line (Continuing from meals) */}
            <div className="absolute left-[2.25rem] top-0 bottom-4 w-[2px] bg-border z-0" />

            {workouts.map((workout: any) => (
              <div key={workout.id} className="relative z-10 flex gap-4">
                {/* Timeline Dot */}
                <div className="flex flex-col items-center mt-4">
                  <div className="w-4 h-4 rounded-full border-4 border-background bg-muted-foreground/40 flex items-center justify-center transition-all duration-300">
                  </div>
                </div>

                {/* Workout Card */}
                <Link href={`/workout/${workout.id}`} className="flex-1">
                  <Card className="p-4 hover:bg-accent/5 transition-all duration-300 border-none shadow-sm active:scale-[0.98]">
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                            Workout
                          </span>
                        </div>
                        <h3 className="font-semibold text-[17px] text-foreground leading-tight">
                          {workout.name}
                        </h3>
                        <p className="text-[12px] text-muted-foreground italic opacity-70">
                          Build strength and resilience. Every rep counts.
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <span className="text-lg font-bold text-foreground">
                            {workout.duration}
                          </span>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase border-l border-muted ml-2 pl-2">
                            Mins
                          </span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    </div>
                  </Card>
                </Link>
              </div>
            ))}

            {workouts.length === 0 && (
              <div className="relative z-10 flex gap-4 opacity-60">
                <div className="flex flex-col items-center mt-4">
                  <div className="w-4 h-4 rounded-full border-4 border-background bg-muted flex items-center justify-center"></div>
                </div>
                <div className="flex-1 p-8 text-center bg-card rounded-2xl border-2 border-dashed border-muted flex flex-col items-center">
                  <span className="text-2xl mb-2">🧘</span>
                  <p className="text-sm font-medium">Rest day — Enjoy your recovery!</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>

      <Dialog open={showConsumptionPrompt} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Did you eat this meal?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeMeal && (
              <p className="text-muted-foreground">
                <strong>{activeMeal.name}</strong> - {activeMeal.calories} cal, {activeMeal.protein}g protein
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleYesConsumed}
                disabled={isToggling}
                className="w-full h-12"
                data-testid="button-yes-consumed"
              >
                {isToggling ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                Yes, I ate this
              </Button>
              <Button
                variant="outline"
                onClick={handleConsumedSomethingElse}
                className="w-full h-12"
                data-testid="button-ate-something-else"
              >
                <X className="mr-2 w-4 h-4" />
                No, I ate something else
              </Button>
              <Link href={activeMeal ? `/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMeal.id}` : "#"}>
                <Button variant="ghost" className="w-full text-muted-foreground" data-testid="button-view-details">
                  View meal details & Regenerate
                </Button>
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlternativeForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What did you eat instead?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe what you ate (e.g., 'chicken salad with dressing', 'two slices of pizza')"
              value={altDescription}
              onChange={(e) => setAltDescription(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-alt-description"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Portion Size</Label>
              <RadioGroup
                value={altPortionSize}
                onValueChange={(v) => setAltPortionSize(v as "small" | "medium" | "large")}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "small", label: "Small", desc: "Light portion" },
                  { value: "medium", label: "Medium", desc: "Regular portion" },
                  { value: "large", label: "Large", desc: "Generous serving" }
                ].map((opt) => (
                  <div key={opt.value}>
                    <RadioGroupItem value={opt.value} id={`dash-${opt.value}`} className="peer sr-only" data-testid={`radio-portion-${opt.value}`} />
                    <Label
                      htmlFor={`dash-${opt.value}`}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      data-testid={`label-portion-${opt.value}`}
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {showPreview && previewData && (
              <Card className="p-4 bg-secondary/50">
                <p className="text-sm font-medium">Estimated Values</p>
                <p className="text-lg font-bold text-primary">~{previewData.calories} calories</p>
                <p className="text-sm text-muted-foreground">~{previewData.protein}g protein</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a rough estimate. We focus on the big picture, not exact numbers.
                </p>
              </Card>
            )}

            {!showPreview ? (
              <Button
                onClick={handleShowPreview}
                disabled={!altDescription.trim()}
                className="w-full"
                data-testid="button-preview"
              >
                Preview Estimate
              </Button>
            ) : (
              <Button
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt}
                className="w-full"
                data-testid="button-confirm-alt"
              >
                {isLoggingAlt ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                Confirm and Log
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
