import { useState } from "react";
import { useLocation } from "wouter";
import { usePlanMeta } from "@/hooks/use-plans";
import { useLogManualMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Check, UtensilsCrossed, Info, ChevronLeft, Target, Flame, Heart, Sparkles, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function LogManualMeal() {
  const [, setLocation] = useLocation();
  const today = new Date();
  const { data: plan, isLoading: planLoading } = usePlanMeta(today);
  const { toast } = useToast();

  const [description, setDescription] = useState("");
  const [portionSize, setPortionSize] = useState<"small" | "medium" | "large">("medium");
  const [mealType, setMealType] = useState<"snack" | "meal">("snack");
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate: logMeal, isPending } = useLogManualMeal();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast({ title: "Please describe your meal", variant: "destructive" });
      return;
    }
    if (!plan) return;

    logMeal(
      {
        planId: plan.id,
        description,
        portionSize,
        mealType,
        date: format(today, "yyyy-MM-dd")
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        }
      }
    );
  };

  const getEstimation = () => {
    const d = description.toLowerCase();
    const estimates: Record<string, { cal: number; protein: number }> = {
      pizza: { cal: 280, protein: 12 },
      burger: { cal: 550, protein: 25 },
      fries: { cal: 365, protein: 4 },
      ice: { cal: 270, protein: 5 },
      cake: { cal: 350, protein: 4 },
      cookie: { cal: 150, protein: 2 },
      chips: { cal: 250, protein: 3 },
      soda: { cal: 140, protein: 0 },
      chocolate: { cal: 230, protein: 3 },
      biryani: { cal: 450, protein: 18 },
      samosa: { cal: 260, protein: 5 },
      naan: { cal: 260, protein: 8 },
      pasta: { cal: 400, protein: 12 },
      rice: { cal: 200, protein: 4 },
      sandwich: { cal: 350, protein: 15 },
      salad: { cal: 150, protein: 5 },
    };

    let cal = 300, protein = 10; // default
    for (const [key, vals] of Object.entries(estimates)) {
      if (d.includes(key)) {
        cal = vals.cal;
        protein = vals.protein;
        break;
      }
    }

    const multiplier = portionSize === 'small' ? 0.7 : portionSize === 'large' ? 1.4 : 1;
    const mealMultiplier = mealType === 'meal' ? 1.5 : 1;

    return {
      calories: Math.round(cal * multiplier * mealMultiplier),
      protein: Math.round(protein * multiplier * mealMultiplier)
    };
  };

  if (planLoading) {
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

  if (isSuccess) {
    return (
      <PageLayout
        header={
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")} className="rounded-full shadow-sm border-none bg-card">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight">Success</h1>
          </div>
        }
      >
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-8 max-w-sm"
          >
            <div className="relative mx-auto w-24 h-24">
              <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="w-24 h-24 rounded-[32px] bg-emerald-500 flex items-center justify-center shadow-xl relative z-10">
                <Check className="w-12 h-12 text-white" />
              </div>
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-black tracking-tighter">Plan Updated</h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Auntie AARA has noted your meal. Don't worry about perfection — we've adjusted the rest of your day to keep you on course.
              </p>
            </div>
            <Button
              size="lg"
              className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-xl shadow-brand-blue/20"
              onClick={() => setLocation("/dashboard")}
            >
              Back to Journey
            </Button>
          </motion.div>
        </div>
      </PageLayout>
    );
  }

  const estimate = getEstimation();

  return (
    <PageLayout
      header={
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => setLocation("/dashboard")} className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">Quick Log</p>
            <h1 className="text-xl font-bold tracking-tight">External Meal</h1>
          </div>
        </div>
      }
    >
      <div className="max-w-xl mx-auto space-y-8 pb-32">
        <section className="wellness-card p-6 bg-blue-50/50 border-blue-100 flex gap-4 items-start shadow-sm shadow-blue-500/5">
          <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
            <Heart className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-[14px] text-blue-800 font-semibold leading-relaxed">
            Eating out? No stress. Describe it simply and AARA will adapt. Progress happens over weeks, not hours.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2">Description</Label>
            <div className="relative group">
              <Input
                className="h-16 rounded-[24px] border-border/10 bg-secondary/20 px-6 focus-visible:ring-primary/20 text-[16px] font-bold shadow-inner transition-all group-focus-within:bg-card group-focus-within:shadow-lg"
                placeholder="e.g. Chicken biryani, 2 slices pizza..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
                <UtensilsCrossed className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>

            <AnimatePresence>
              {description.trim().length > 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="wellness-card p-6 bg-card border-primary/5 shadow-lg flex items-center gap-6"
                >
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">AI Estimation</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tighter text-foreground">{estimate.calories}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">kcal</span>
                    </div>
                  </div>
                  <div className="w-px h-10 bg-border/40" />
                  <div className="flex-1 space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Protein</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black tracking-tighter text-foreground">{estimate.protein}</span>
                      <span className="text-xs font-bold text-muted-foreground uppercase">g</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <Sparkles className="w-5 h-5 fill-current opacity-40" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-6">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 block text-center">Portion Scale</Label>
            <RadioGroup
              value={portionSize}
              onValueChange={(v) => setPortionSize(v as "small" | "medium" | "large")}
              className="flex justify-between gap-3"
            >
              {[
                { value: "small", label: "Light", icon: "•" },
                { value: "medium", label: "Regular", icon: "••" },
                { value: "large", label: "Full", icon: "•••" }
              ].map((opt) => (
                <div key={opt.value} className="flex-1">
                  <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                  <Label
                    htmlFor={opt.value}
                    className={cn(
                      "flex flex-col items-center justify-center py-6 rounded-[28px] border-2 transition-all cursor-pointer font-black text-[14px] leading-none tracking-tight gap-2",
                      portionSize === opt.value
                        ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/5"
                        : "border-secondary/10 bg-card text-muted-foreground/60 hover:border-primary/30"
                    )}
                  >
                    <span className="text-lg opacity-30">{opt.icon}</span>
                    <span className="font-black text-[13px] uppercase tracking-wider">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-6">
            <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-2 block text-center">Meal Type</Label>
            <RadioGroup
              value={mealType}
              onValueChange={(v) => setMealType(v as "snack" | "meal")}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { value: "snack", label: "Quick Snack", icon: "🍿" },
                { value: "meal", label: "Full Meal", icon: "🍛" }
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`type-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`type-${opt.value}`}
                    className={cn(
                      "flex flex-col items-center justify-center py-6 rounded-[28px] border-2 transition-all cursor-pointer font-black text-[14px] leading-none tracking-tight gap-3",
                      mealType === opt.value
                        ? "border-primary bg-primary/5 text-primary shadow-md shadow-primary/5"
                        : "border-secondary/10 bg-card text-muted-foreground/60 hover:border-primary/30"
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <span className="font-black text-[13px] uppercase tracking-wider">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="fixed bottom-10 left-0 right-0 z-50 px-6 max-w-xl mx-auto">
            <Button
              type="submit"
              size="lg"
              className="w-full h-16 rounded-[24px] text-lg font-black brand-gradient text-white shadow-2xl shadow-brand-blue/30 scale-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
              disabled={isPending || !description.trim()}
            >
              {isPending ? <Loader2 className="w-6 h-6 animate-spin mr-3" /> : <Check className="w-6 h-6 mr-3" />}
              Log Entry
            </Button>
          </div>
        </form>

        <p className="text-center text-[11px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] pt-4">
          AI ESTIMATION IS APPROXIMATE
        </p>
      </div>
    </PageLayout>
  );
}
