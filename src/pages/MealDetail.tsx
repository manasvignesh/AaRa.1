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
      <div className="page-transition">
        <PageLayout header={<div><h1 className="font-display text-4xl font-bold tracking-tighter" style={{ color: "var(--text-primary)" }}>Loading...</h1></div>}>
          <div className="min-h-[60vh] flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-brand animate-spin" />
          </div>
        </PageLayout>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="page-transition">
        <PageLayout header={<div><h1 className="font-display text-4xl font-bold tracking-tighter" style={{ color: "var(--text-primary)" }}>Not Found</h1></div>}>
          <div className="min-h-[40vh] flex flex-col items-center justify-center p-10 text-center gap-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: "var(--surface-2)" }}>
              <Info className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
            </div>
            <h2 className="font-display text-xl font-bold uppercase tracking-tighter" style={{ color: "var(--text-primary)" }}>Selection Missing</h2>
            <Button onClick={() => setLocation("/dashboard")} className="rounded-full h-14 px-8 btn-primary text-white font-bold uppercase tracking-widest text-[11px] shadow-[0_4px_20px_rgba(47,128,237,0.07)] border-none">Return to Console</Button>
          </div>
        </PageLayout>
      </div>
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
    <div className="page-transition">
      <PageLayout
        maxWidth="md"
        header={
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-all"
                style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <p className="section-label mb-0.5">{meal.type}</p>
                <p className="text-[12px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>{format(planDate, "MMM do, yyyy")}</p>
              </div>
            </div>
            {isLogged && (
              <div className="pill-green px-4 py-1.5 text-[10px] font-bold border border-[#27AE60]/20">
                Logged
              </div>
            )}
          </div>
        }
      >
        <div className="space-y-10 pb-40">
          {/* Hero Section */}
          <section className="space-y-8 stagger-1">
            <h1 className="font-display text-4xl font-bold tracking-tight leading-none uppercase" style={{ color: "var(--text-primary)" }}>{meal.name}</h1>

            <div className="grid grid-cols-2 gap-4">
              <div className="wellness-card p-5 brand-gradient text-white flex flex-col gap-3 shadow-[0_4px_20px_rgba(47,128,237,0.07)]">
                <Flame className="w-6 h-6 opacity-80" />
                <div>
                  <p className="font-display text-3xl font-bold tracking-tighter leading-none">{meal.calories}</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mt-1">Daily kcal</p>
                </div>
              </div>
              <div className="wellness-card p-5 flex flex-col gap-3" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <Target className="w-6 h-6 opacity-80 text-brand" />
                <div>
                  <p className="font-display text-3xl font-bold tracking-tighter leading-none" style={{ color: "var(--text-primary)" }}>{meal.protein}g</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest mt-1" style={{ color: "var(--text-muted)" }}>Protein</p>
                </div>
              </div>
            </div>
          </section>

          {meal.consumedAlternative && (
            <div className="wellness-card p-5 flex gap-4 items-start stagger-2" style={{ backgroundColor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.22)" }}>
              <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-500 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <p className="section-label text-amber-500 mb-1 opacity-80">Manual Override</p>
                <p className="text-[15px] font-bold leading-tight mb-2" style={{ color: "var(--text-primary)" }}>"{meal.alternativeDescription}"</p>
                <div className="flex gap-4">
                  <span className="section-label">{meal.alternativeCalories} kcal</span>
                  <span className="section-label">{meal.alternativeProtein}g protein</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-10">
            <section className="space-y-4 stagger-2">
              <SectionHeader title="Ingredients" />
              <div className="wellness-card p-6 divide-y shadow-[0_4px_20px_rgba(47,128,237,0.07)]" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)", borderColor: "var(--border)" }}>
                {meal.ingredients?.map((ing: any, i: number) => (
                  <div key={i} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <span className="text-[14px] font-bold tracking-tight lowercase first-letter:uppercase" style={{ color: "var(--text-primary)" }}>
                      {typeof ing === 'object' ? String((ing as any).item) : String(ing)}
                    </span>
                    {typeof ing === 'object' && (
                      <span className="section-label text-brand">{String((ing as any).amount)}</span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4 stagger-3">
              <SectionHeader title="Methodology" />
              <div className="wellness-card p-8 relative overflow-hidden group shadow-[0_4px_20px_rgba(47,128,237,0.07)]" style={{ backgroundColor: "var(--surface-1)", border: "1px solid var(--border)" }}>
                <div className="absolute top-0 right-0 p-6 opacity-[0.03] -z-10 group-hover:scale-110 transition-transform">
                  <Utensils className="w-32 h-32 text-brand" />
                </div>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap font-medium" style={{ color: "var(--text-secondary)" }}>
                  {meal.instructions || "Focus on bio-available nutrients and thermal processing optimization."}
                </p>
              </div>
            </section>
          </div>

          {/* Action Dock */}
          <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pt-10" style={{ background: "linear-gradient(to top, var(--surface-base) 35%, color-mix(in srgb, var(--surface-base) 85%, transparent) 70%, transparent 100%)" }}>
            <div className="max-w-md mx-auto flex flex-col gap-3">
              {!isLogged ? (
                <>
                  <button
                    className="w-full h-16 rounded-full btn-primary text-white font-bold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] active:scale-95 transition-all flex items-center justify-center gap-2 border-none"
                    disabled={isToggling}
                    onClick={() => toggleConsumed({ id: meal.id, isConsumed: true, date: dateStr })}
                  >
                    {isToggling ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                    Synchronize Consumption
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      className="h-14 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all border shadow-sm"
                      style={{ backgroundColor: "var(--surface-1)", color: "var(--text-primary)", borderColor: "var(--border)" }}
                      onClick={() => setShowAlternativeForm(true)}
                    >
                      Custom Log
                    </button>
                    <button
                      className="h-14 rounded-full font-bold text-[10px] uppercase tracking-widest transition-all border shadow-sm"
                      style={{ backgroundColor: "var(--surface-1)", color: "#F59E0B", borderColor: "rgba(245, 158, 11, 0.25)" }}
                      onClick={() => setIsRegenOpen(true)}
                    >
                      Optimize
                    </button>
                  </div>
                </>
              ) : (
                <button
                  className="w-full h-16 rounded-full font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: "var(--surface-1)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.24)" }}
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
          <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden backdrop-blur-3xl shadow-[0_4px_20px_rgba(47,128,237,0.07)] page-transition" style={{ backgroundColor: "color-mix(in srgb, var(--surface-1) 94%, transparent)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <div className="brand-gradient p-10 text-center text-white space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)]/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tighter uppercase">Optimizer</h3>
            </div>
            <div className="p-8 space-y-6">
              <Textarea
                placeholder="Preference (e.g. no nuts)..."
                className="min-h-[80px] rounded-[24px] px-4 py-3 font-medium text-sm"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                value={regenReason}
                onChange={(e) => setRegenReason(e.target.value)}
              />
              <button
                className="w-full h-14 rounded-full btn-primary text-white font-bold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] border-none"
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
          <DialogContent className="max-w-[320px] rounded-[32px] p-0 overflow-hidden backdrop-blur-3xl shadow-[0_4px_20px_rgba(47,128,237,0.07)] page-transition" style={{ backgroundColor: "color-mix(in srgb, var(--surface-1) 94%, transparent)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            <div className="brand-gradient p-10 text-center text-white space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-[var(--surface-1)]/20 backdrop-blur-xl mx-auto flex items-center justify-center border border-white/20">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="font-display text-xl font-bold tracking-tighter uppercase">Manual Log</h3>
            </div>
            <div className="p-8 space-y-6">
              <Textarea
                placeholder="Describe what you ate..."
                className="min-h-[100px] rounded-[24px] px-4 py-3 font-medium text-sm"
                style={{ backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-primary)" }}
                value={altDescription}
                onChange={(e) => setAltDescription(e.target.value)}
              />
              <RadioGroup value={altPortionSize} onValueChange={(v: any) => setAltPortionSize(v)} className="flex gap-2">
                {['small', 'medium', 'large'].map(s => (
                  <div key={s} className="flex-1">
                    <RadioGroupItem value={s} id={s} className="sr-only" />
                    <Label htmlFor={s} className={cn("block text-center py-2 rounded-xl text-[10px] font-bold uppercase border transition-all cursor-pointer", altPortionSize === s ? "btn-primary text-white border-none shadow-[0_4px_20px_rgba(47,128,237,0.07)]" : "")} style={altPortionSize === s ? undefined : { backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--text-muted)" }}>
                      {s}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <button
                className="w-full h-14 rounded-full btn-primary text-white font-bold text-sm uppercase tracking-widest shadow-[0_4px_20px_rgba(47,128,237,0.07)] border-none"
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt || !altDescription}
              >
                {isLoggingAlt ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : "Verify & Log"}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </PageLayout>
    </div>
  );
}
