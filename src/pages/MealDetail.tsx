import { useLocation, useRoute } from "wouter";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, RefreshCw, Loader2, X, Flame, Target, Utensils, Info, CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
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

  const meal = meals.find(m => m.id === Number(params?.id));

  if (mealsLoading) {
    return (
      <PageLayout header={<div><h1 className="text-4xl font-black tracking-tighter text-foreground">Loading...</h1></div>}>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (!meal) {
    return (
      <PageLayout header={<div><h1 className="text-4xl font-black tracking-tighter text-foreground">Not Found</h1></div>}>
        <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-2">
            <Info className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <h2 className="text-xl font-black uppercase tracking-tighter">Selection Missing</h2>
          <Button onClick={() => setLocation("/dashboard")} className="rounded-full h-14 px-8 brand-gradient text-white font-black uppercase tracking-widest text-[11px]">Return to Console</Button>
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

  const handleConfirmAlternative = () => {
    logAlternative(
      { id: meal.id, description: altDescription, portionSize: altPortionSize, date: dateStr },
      {
        onSuccess: () => {
          setShowAlternativeForm(false);
          setAltDescription("");
          setAltPortionSize("medium");
        }
      }
    );
  };

  const isLogged = meal.isConsumed || meal.consumedAlternative;

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="w-10 h-10 rounded-full flex items-center justify-center bg-card/60 backdrop-blur-xl border border-white/5 text-primary active:scale-90 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-0.5">{meal.type}</p>
              <p className="text-[12px] font-bold text-muted-foreground uppercase opacity-40">{format(planDate, "MMM do, yyyy")}</p>
            </div>
          </div>
          {isLogged && (
            <div className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
              Logged
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-10 pb-40">
        {/* Hero Section */}
        <section className="space-y-8">
          <h1 className="text-4xl font-black tracking-tight text-foreground leading-none uppercase">{meal.name}</h1>

          <div className="grid grid-cols-2 gap-4">
            <div className="wellness-card p-5 brand-gradient text-white flex flex-col gap-3 shadow-xl shadow-brand-blue/20">
              <Flame className="w-6 h-6 opacity-60" />
              <div>
                <p className="text-3xl font-black tracking-tighter leading-none">{meal.calories}</p>
                <p className="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Daily kcal</p>
              </div>
            </div>
            <div className="wellness-card p-5 bg-card flex flex-col gap-3">
              <Target className="w-6 h-6 text-primary opacity-60" />
              <div>
                <p className="text-3xl font-black tracking-tighter leading-none text-foreground">{meal.protein}g</p>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest opacity-40 mt-1">Protein</p>
              </div>
            </div>
          </div>
        </section>

        {meal.consumedAlternative && (
          <div className="wellness-card p-5 bg-amber-500/5 border-amber-500/20 flex gap-4 items-start">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-1 opacity-60">Manual Override</p>
              <p className="text-[15px] font-bold text-foreground leading-tight mb-2">"{meal.alternativeDescription}"</p>
              <div className="flex gap-4">
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{meal.alternativeCalories} kcal</span>
                <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">{meal.alternativeProtein}g protein</span>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-10">
          <section className="space-y-4">
            <SectionHeader title="Ingredients" />
            <div className="wellness-card p-6 bg-white/40 divide-y divide-slate-100">
              {meal.ingredients?.map((ing: any, i: number) => (
                <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <span className="text-[14px] font-black tracking-tight text-foreground/80 lowercase first-letter:uppercase">
                    {typeof ing === 'object' ? String((ing as any).item) : String(ing)}
                  </span>
                  {typeof ing === 'object' && (
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest opacity-40">{String((ing as any).amount)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <SectionHeader title="Methodology" />
            <div className="wellness-card p-8 bg-slate-50 border-slate-100 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-[0.02] -z-10 group-hover:scale-110 transition-transform">
                <Utensils className="w-32 h-32" />
              </div>
              <p className="text-[15px] text-muted-foreground leading-relaxed whitespace-pre-wrap font-medium">
                {meal.instructions || "Focus on bio-available nutrients and thermal processing optimization."}
              </p>
            </div>
          </section>
        </div>

        {/* Action Dock */}
        <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-10 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="max-w-md mx-auto flex flex-col gap-3">
            {!isLogged ? (
              <>
                <button
                  className="w-full h-16 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-brand-blue/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                  disabled={isToggling}
                  onClick={() => toggleConsumed({ id: meal.id, isConsumed: true, date: dateStr })}
                >
                  {isToggling ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  Synchronize Consumption
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    className="h-14 rounded-full bg-slate-100 text-foreground font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    onClick={() => setShowAlternativeForm(true)}
                  >
                    Custom Log
                  </button>
                  <button
                    className="h-14 rounded-full bg-slate-100 text-amber-500 font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    onClick={() => setIsRegenOpen(true)}
                  >
                    Optimize
                  </button>
                </div>
              </>
            ) : (
              <button
                className="w-full h-16 rounded-full bg-slate-100 text-red-500 font-black text-sm uppercase tracking-widest hover:bg-slate-200 border border-slate-200 transition-all flex items-center justify-center gap-2"
                disabled={isToggling}
                onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
              >
                {isToggling ? <Loader2 className="animate-spin w-5 h-5" /> : <X className="w-5 h-5" />}
                Revert Entry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Regeneration Modal */}
      <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
        <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-none bg-white/90 backdrop-blur-3xl shadow-2xl">
          <div className="brand-gradient p-10 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black tracking-tighter uppercase">Optimizer</h3>
          </div>
          <div className="p-8 space-y-6">
            <Textarea
              placeholder="Preference (e.g. no nuts)..."
              className="min-h-[80px] rounded-24 px-4 py-3 bg-slate-100 border-slate-200 font-bold text-sm"
              value={regenReason}
              onChange={(e) => setRegenReason(e.target.value)}
            />
            <button
              className="w-full h-14 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl"
              onClick={handleRegenerate}
              disabled={isRegenerating}
            >
              {isRegenerating ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Re-generate"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Alternative Form Modal */}
      <Dialog open={showAlternativeForm} onOpenChange={() => setShowAlternativeForm(false)}>
        <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden border-none bg-white/90 backdrop-blur-3xl shadow-2xl">
          <div className="brand-gradient p-10 text-center text-white space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black tracking-tighter uppercase">Manual Log</h3>
          </div>
          <div className="p-8 space-y-6">
            <Textarea
              placeholder="Describe what you ate..."
              className="min-h-[100px] rounded-24 px-4 py-3 bg-slate-100 border-slate-200 font-bold text-sm"
              value={altDescription}
              onChange={(e) => setAltDescription(e.target.value)}
            />
            <RadioGroup value={altPortionSize} onValueChange={(v: any) => setAltPortionSize(v)} className="flex gap-2">
              {['small', 'medium', 'large'].map(s => (
                <div key={s} className="flex-1">
                  <RadioGroupItem value={s} id={s} className="sr-only" />
                  <Label htmlFor={s} className={cn("block text-center py-2 rounded-xl text-[10px] font-black uppercase border transition-all cursor-pointer", altPortionSize === s ? "brand-gradient text-white border-none" : "bg-white/5 border-white/5 opacity-40")}>
                    {s}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            <button
              className="w-full h-14 rounded-full brand-gradient text-white font-black text-sm uppercase tracking-widest shadow-xl"
              onClick={handleConfirmAlternative}
              disabled={isLoggingAlt || !altDescription}
            >
              {isLoggingAlt ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify & Log"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
