import { useLocation, useRoute } from "wouter";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, RefreshCw, Loader2, X, Flame, Target, Utensils, Info, CheckCircle, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";

export default function MealDetail() {
  const [, params] = useRoute("/meal/:date/:id");
  const [location, setLocation] = useLocation();
  const planDate = params?.date ? new Date(params.date) : new Date();
  const dateStr = params?.date || format(new Date(), 'yyyy-MM-dd');

  const { data: meals = [], isLoading: mealsLoading } = useMeals(planDate);
  const { mutate: toggleConsumed, isPending: isToggling } = useToggleMealConsumed();
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateMeal();
  const { mutate: logAlternative, isPending: isLoggingAlt } = useLogAlternativeMeal();

  const [regenReason, setRegenReason] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [isRegenOpen, setIsRegenOpen] = useState(false);

  const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [altDescription, setAltDescription] = useState("");
  const [altPortionSize, setAltPortionSize] = useState<"small" | "medium" | "large">("medium");
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<{ calories: number; protein: number } | null>(null);

  const meal = meals.find(m => m.id === Number(params?.id));

  if (mealsLoading) {
    return (
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-secondary/30 rounded-full animate-pulse" />
            <div className="h-10 w-48 bg-secondary/30 rounded-lg animate-pulse" />
          </div>
        }
      >
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!meal) {
    return (
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => window.history.back()} className="rounded-full">
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-2xl font-bold">Meal Detail</h1>
          </div>
        }
      >
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-2">
            <Info className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-bold">Selection Unavailable</h2>
          <p className="text-muted-foreground text-sm max-w-[280px]">I couldn't find the data for this meal. It may have been updated or removed.</p>
          <Button onClick={() => setLocation("/dashboard")} className="rounded-full h-12 px-8 brand-gradient text-white">Return to Dashboard</Button>
        </div>
      </PageLayout>
    );
  }

  const handleRegenerate = () => {
    if (!meal.id) return;
    regenerate(
      {
        id: meal.id,
        reason: regenReason,
        availableIngredients: availableIngredients.split(',').map(i => i.trim()).filter(i => i !== ""),
        date: dateStr
      },
      {
        onSuccess: () => {
          setIsRegenOpen(false);
          setRegenReason("");
          setAvailableIngredients("");
        }
      }
    );
  };

  const handleYesConsumed = () => {
    toggleConsumed({ id: meal.id, isConsumed: true, date: dateStr });
    setShowConsumptionPrompt(false);
  };

  const handleConsumedSomethingElse = () => {
    setShowConsumptionPrompt(false);
    setShowAlternativeForm(true);
  };

  const estimateCalories = (description: string, portion: string) => {
    const portionMultiplier: Record<string, number> = { small: 0.7, medium: 1.0, large: 1.4 };
    const baseCalories = 350; // generic fallback
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
    logAlternative(
      { id: meal.id, description: altDescription, portionSize: altPortionSize, date: dateStr },
      {
        onSuccess: () => {
          setShowAlternativeForm(false);
          setShowPreview(false);
          setAltDescription("");
          setAltPortionSize("medium");
          setPreviewData(null);
        }
      }
    );
  };

  const isLogged = meal.isConsumed || meal.consumedAlternative;

  return (
    <PageLayout
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setLocation(params?.date && params.date === format(new Date(), 'yyyy-MM-dd') ? "/dashboard" : "/meals")}
              className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">{meal.type}</p>
              <p className="text-[13px] font-bold text-muted-foreground">{format(planDate, "MMMM do, yyyy")}</p>
            </div>
          </div>
          {isLogged && (
            <div className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" /> Logged
            </div>
          )}
        </div>
      }
    >
      <div className="max-w-3xl mx-auto space-y-8 pb-32">
        {/* Hero Section */}
        <section className="space-y-6">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-[1.1]">{meal.name}</h1>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="wellness-card p-5 bg-primary shadow-lg shadow-primary/20 text-white border-none flex flex-col items-center text-center">
              <Flame className="w-5 h-5 mb-2 opacity-80" />
              <span className="text-2xl font-black">{meal.calories}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">Calories</span>
            </div>
            <div className="wellness-card p-5 bg-card shadow-sm flex flex-col items-center text-center">
              <Target className="w-5 h-5 mb-2 text-indigo-500" />
              <span className="text-2xl font-black text-foreground">{meal.protein}g</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Protein</span>
            </div>
            <div className="wellness-card p-5 bg-card shadow-sm flex flex-col items-center text-center">
              <div className="w-5 h-5 mb-2 text-orange-500 font-black text-xs flex items-center justify-center">C</div>
              <span className="text-2xl font-black text-foreground">{meal.carbs || 0}g</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Carbs</span>
            </div>
            <div className="wellness-card p-5 bg-card shadow-sm flex flex-col items-center text-center">
              <div className="w-5 h-5 mb-2 text-yellow-500 font-black text-xs flex items-center justify-center">F</div>
              <span className="text-2xl font-black text-foreground">{meal.fats || 0}g</span>
              <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Fats</span>
            </div>
          </div>
        </section>

        {meal.consumedAlternative && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="wellness-card p-6 bg-amber-50 border-amber-200/50 flex gap-4 items-start"
          >
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1">Self Logged Alternative</p>
              <p className="text-[17px] font-bold text-amber-900 leading-tight mb-2">"{meal.alternativeDescription}"</p>
              <div className="flex gap-4">
                <span className="text-xs font-bold text-amber-700/70">~{meal.alternativeCalories} kcal</span>
                <span className="text-xs font-bold text-amber-700/70">~{meal.alternativeProtein}g protein</span>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-4">
            <SectionHeader title="Ingredients" />
            <div className="wellness-card p-6 space-y-3 bg-card/50">
              {meal.ingredients?.map((ing: any, i: number) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
                  <span className="text-[15px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {typeof ing === 'object' && ing !== null && 'item' in ing ? (
                      <>{String((ing as any).item)} <span className="text-xs font-black text-muted-foreground/40 ml-1">· {String((ing as any).amount)}</span></>
                    ) : (
                      String(ing)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Auntie's Method" />
            <div className="wellness-card p-8 bg-primary/5 border-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                <Utensils className="w-32 h-32" />
              </div>
              <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap relative z-10 font-medium italic">
                "{meal.instructions || "No custom instructions. Focus on whole ingredients and minimal oil."}"
              </p>
            </div>
          </section>
        </div>

        {/* Floating Action Area */}
        <div className="fixed bottom-10 left-0 right-0 z-50 px-6 max-w-2xl mx-auto flex flex-col gap-3">
          {!isLogged ? (
            <>
              <Button
                size="lg"
                className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-2xl shadow-brand-blue/30 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                disabled={isToggling}
                onClick={handleYesConsumed}
              >
                {isToggling ? <Loader2 className="animate-spin w-6 h-6 mr-3" /> : <Check className="w-6 h-6 mr-3" />}
                Log Entry
              </Button>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-14 rounded-[20px] bg-white/80 backdrop-blur-md border-primary/10 text-primary font-bold shadow-sm"
                  onClick={() => setShowConsumptionPrompt(true)}
                >
                  Log Custom
                </Button>
                <Button
                  variant="outline"
                  className="h-14 rounded-[20px] bg-white/80 backdrop-blur-md border-amber-500/10 text-amber-600 font-bold shadow-sm"
                  onClick={() => setIsRegenOpen(true)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Replace
                </Button>
              </div>
            </>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-16 rounded-[24px] text-lg font-bold bg-white/80 backdrop-blur-md border-red-100 text-red-500 hover:bg-red-50"
              disabled={isToggling}
              onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
            >
              {isToggling ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : <X className="w-5 h-5 mr-3" />}
              Undo Log Entry
            </Button>
          )}
        </div>
      </div>

      {/* Regeneration Dialog */}
      <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
        <DialogContent className="rounded-[40px] p-10 border-none shadow-2xl max-w-sm">
          <DialogHeader className="mb-8 text-center">
            <DialogTitle className="text-3xl font-black tracking-tighter">New Selection</DialogTitle>
            <p className="text-muted-foreground font-medium mt-1">AARA will regenerate this option.</p>
          </DialogHeader>
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Preference (Optional)</Label>
              <Textarea
                placeholder="I want something lighter, or no paneer..."
                className="min-h-[120px] rounded-[32px] border-border/10 bg-secondary/20 p-6 focus-visible:ring-primary/20 text-[16px] font-bold resize-none shadow-inner"
                value={regenReason}
                onChange={(e) => setRegenReason(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Ingredients on hand</Label>
              <Input
                placeholder="Eggs, spinach, milk..."
                className="h-16 rounded-[24px] border-border/10 bg-secondary/20 px-6 focus-visible:ring-primary/20 text-[16px] font-bold shadow-inner"
                value={availableIngredients}
                onChange={(e) => setAvailableIngredients(e.target.value)}
              />
            </div>

            <Button
              onClick={handleRegenerate}
              className="h-16 rounded-[24px] brand-gradient text-white text-[18px] font-black shadow-xl shadow-brand-blue/20"
              disabled={isRegenerating || !regenReason}
            >
              {isRegenerating ? (
                <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Re-optimizing...</>
              ) : (
                "Generate New Option"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consumption Dialogs */}
      <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
        <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-sm">
          <div className="p-10 pb-6 text-center">
            <div className="w-24 h-24 rounded-[32px] bg-emerald-50 flex items-center justify-center mx-auto mb-8 shadow-sm">
              <Utensils className="w-12 h-12 text-emerald-500" />
            </div>
            <DialogTitle className="text-3xl font-black tracking-tighter mb-3">Time to eat?</DialogTitle>
            <p className="text-[16px] text-muted-foreground font-medium leading-relaxed px-4">
              Log your intake to keep Auntie AARA's coaching accurate.
            </p>
          </div>
          <div className="p-10 pt-4 grid grid-cols-1 gap-3">
            <Button
              onClick={handleYesConsumed}
              className="h-16 rounded-[24px] brand-gradient text-white text-[18px] font-black shadow-xl shadow-brand-blue/20 active:scale-[0.98] transition-all"
            >
              Yes, I ate this
            </Button>
            <Button
              variant="outline"
              onClick={handleConsumedSomethingElse}
              className="h-16 rounded-[24px] border-2 border-primary/10 hover:bg-secondary text-primary text-[18px] font-black active:scale-[0.98] transition-all"
            >
              Something else
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowConsumptionPrompt(false)}
              className="mt-2 h-10 rounded-full text-muted-foreground font-bold hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternative Form */}
      <Dialog open={showAlternativeForm} onOpenChange={setShowAlternativeForm}>
        <DialogContent className="rounded-[40px] p-10 border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black tracking-tighter text-center">Custom Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-10">
            <div className="space-y-4">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Meal Description</Label>
              <Textarea
                placeholder="Describe your meal (e.g. 2 eggs, 1 toast)..."
                className="min-h-[140px] rounded-[32px] border-border/10 bg-secondary/20 p-6 focus-visible:ring-primary/20 text-[16px] font-bold resize-none shadow-inner"
                value={altDescription}
                onChange={(e) => setAltDescription(e.target.value)}
              />
            </div>

            <div className="space-y-5">
              <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] text-center block" >Quantity</Label>
              <RadioGroup
                value={altPortionSize}
                onValueChange={(val: any) => setAltPortionSize(val)}
                className="flex justify-between gap-3"
              >
                {['small', 'medium', 'large'].map((size) => (
                  <div key={size} className="flex-1">
                    <RadioGroupItem value={size} id={`alt-${size}`} className="sr-only" />
                    <Label
                      htmlFor={`alt-${size}`}
                      className={cn(
                        "flex flex-col items-center justify-center py-5 rounded-[24px] border-2 transition-all cursor-pointer font-black capitalize text-[14px] tracking-tight",
                        altPortionSize === size
                          ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/5"
                          : "border-secondary/10 bg-card text-muted-foreground/60 hover:border-primary/30"
                      )}
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleShowPreview}
                className="h-16 rounded-[24px] brand-gradient text-white text-[18px] font-black shadow-xl shadow-brand-blue/20"
                disabled={!altDescription}
              >
                Calculate Nutrition
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Nutrition */}
      <Dialog open={showPreview} onOpenChange={() => setShowPreview(false)}>
        <DialogContent className="rounded-[40px] p-10 border-none shadow-2xl text-center">
          <div className="w-20 h-20 rounded-[28px] bg-blue-50 flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Target className="w-10 h-10 text-blue-500" />
          </div>
          <DialogTitle className="text-3xl font-black tracking-tighter mb-3">AI Estimation</DialogTitle>
          <p className="text-muted-foreground font-medium mb-10">Based on your input, here's the estimated nutrition.</p>

          <div className="grid grid-cols-2 gap-5 mb-10">
            <div className="bg-secondary/20 p-8 rounded-[32px] border border-border/5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-2">Calories</p>
              <p className="text-4xl font-black tracking-tighter text-foreground">{previewData?.calories}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2">kcal</p>
            </div>
            <div className="bg-secondary/20 p-8 rounded-[32px] border border-border/5">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.15em] mb-2">Protein</p>
              <p className="text-4xl font-black tracking-tighter text-foreground">{previewData?.protein}</p>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2">grams</p>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={handleConfirmAlternative}
              className="h-16 rounded-[24px] brand-gradient text-white text-[18px] font-black shadow-xl"
              disabled={isLoggingAlt}
            >
              {isLoggingAlt && <Loader2 className="w-6 h-6 animate-spin mr-3" />}
              Confirm & Log
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowPreview(false)}
              className="h-12 rounded-full font-black text-muted-foreground hover:text-foreground"
            >
              Go back & edit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
