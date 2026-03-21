import { useState } from "react";
import { format } from "date-fns";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft,
  ChefHat,
  Flame,
  Info,
  Loader2,
  RefreshCw,
  Sparkles,
  Target,
  UtensilsCrossed,
  Zap,
  X,
} from "lucide-react";

import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";

function toTitleCase(value?: string | null) {
  return String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function formatIngredient(item: any) {
  if (typeof item === "string") return item;
  if (!item) return "";
  const label = String(item.name || item.item || item.ingredient || "").trim();
  const amount = String(item.quantity || item.amount || "").trim();
  const unit = String(item.unit || "").trim();
  return [label, [amount, unit].filter(Boolean).join(" ")].filter(Boolean).join(" - ");
}

export default function MealDetail() {
  const [, params] = useRoute("/meal/:date/:id");
  const [, setLocation] = useLocation();
  const planDate = params?.date ? new Date(params.date) : new Date();
  const dateStr = params?.date || format(new Date(), "yyyy-MM-dd");

  const { data: meals = [], isLoading: mealsLoading } = useMeals(planDate);
  const { mutate: toggleConsumed, isPending: isToggling } = useToggleMealConsumed();
  const { mutate: regenerate, isPending: isRegenerating } = useRegenerateMeal();
  const { mutate: logAlternative, isPending: isLoggingAlt } = useLogAlternativeMeal();

  const [regenReason, setRegenReason] = useState("");
  const [availableIngredients, setAvailableIngredients] = useState("");
  const [isRegenOpen, setIsRegenOpen] = useState(false);
  const [showAlternativeForm, setShowAlternativeForm] = useState(false);
  const [altDescription, setAltDescription] = useState("");
  const [altPortionSize, setAltPortionSize] = useState<"small" | "medium" | "large">("medium");

  const meal = meals.find((item) => item.id === Number(params?.id));
  const ingredientList = Array.isArray(meal?.ingredients) ? meal.ingredients : [];
  const parsedIngredients = ingredientList.map((ingredient) => formatIngredient(ingredient)).filter(Boolean);

  const macroCards = [
    {
      label: "Calories",
      value: meal?.calories ?? 0,
      suffix: "kcal",
      icon: <Flame className="h-5 w-5 text-white" />,
      accent: "linear-gradient(135deg, #2F80ED 0%, #28B5A0 100%)",
      textColor: "#FFFFFF",
      surface: true,
    },
    {
      label: "Protein",
      value: meal?.protein ?? 0,
      suffix: "g",
      icon: <Target className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />,
      accent: "var(--surface-1)",
      textColor: "var(--text-primary)",
    },
    {
      label: "Carbs",
      value: meal?.carbs ?? 0,
      suffix: "g",
      icon: <Zap className="h-5 w-5 text-[#3DAB7A]" />,
      accent: "var(--surface-1)",
      textColor: "var(--text-primary)",
    },
    {
      label: "Fat",
      value: meal?.fats ?? 0,
      suffix: "g",
      icon: <ChefHat className="h-5 w-5 text-[#6AAFF5]" />,
      accent: "var(--surface-1)",
      textColor: "var(--text-primary)",
    },
  ];

  if (mealsLoading) {
    return (
      <PageLayout header={<h1 className="font-display text-4xl font-bold tracking-tight">Loading meal...</h1>}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
        </div>
      </PageLayout>
    );
  }

  if (!meal) {
    return (
      <PageLayout header={<h1 className="font-display text-4xl font-bold tracking-tight">Meal Missing</h1>}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full" style={{ background: "var(--surface-2)" }}>
            <Info className="h-9 w-9" style={{ color: "var(--text-muted)" }} />
          </div>
          <p style={{ color: "var(--text-secondary)" }}>This meal is no longer available for the selected day.</p>
          <Button onClick={() => setLocation("/meals")} className="btn-primary rounded-full px-8">
            Back to Meals
          </Button>
        </div>
      </PageLayout>
    );
  }

  const handleRegenerate = () => {
    const pantry = availableIngredients
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    regenerate(
      {
        id: meal.id,
        reason: regenReason.trim(),
        availableIngredients: pantry,
        date: dateStr,
      },
      {
        onSuccess: () => {
          setIsRegenOpen(false);
          setRegenReason("");
          setAvailableIngredients("");
        },
      },
    );
  };

  const handleConfirmAlternative = () => {
    logAlternative(
      {
        id: meal.id,
        description: altDescription,
        portionSize: altPortionSize,
        date: dateStr,
      },
      {
        onSuccess: () => {
          setShowAlternativeForm(false);
          setAltDescription("");
          setAltPortionSize("medium");
        },
      },
    );
  };

  const isLogged = meal.isConsumed || meal.consumedAlternative;

  return (
    <PageLayout
      maxWidth="md"
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => window.history.back()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl transition-all active:scale-95"
              style={{
                background: "var(--surface-1)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="section-label mb-1">{meal.type}</div>
              <div className="text-[12px] font-bold uppercase" style={{ color: "var(--text-muted)" }}>
                {format(planDate, "MMM do, yyyy")}
              </div>
            </div>
          </div>
          {isLogged ? <div className="pill-green px-3 py-1.5 text-[10px] font-bold">Logged</div> : null}
        </div>
      }
    >
      <div className="space-y-7 pb-40">
        <section className="space-y-5">
          <div className="space-y-3">
            <h1 className="font-display text-[34px] font-bold leading-[1.05] tracking-tight sm:text-[40px]" style={{ color: "var(--text-primary)" }}>
              {toTitleCase(meal.name)}
            </h1>
            <div
              className="rounded-[24px] p-4"
              style={{
                background: "linear-gradient(145deg, rgba(47,128,237,0.08), rgba(40,181,160,0.08))",
                border: "1px solid rgba(47,128,237,0.12)",
              }}
            >
              <div className="section-label mb-2">Meal Target</div>
              <p className="text-[14px] leading-6" style={{ color: "var(--text-secondary)" }}>
                AARA can make a new {meal.type} using the ingredients you already have while aiming for about{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{meal.calories} kcal</span> and{" "}
                <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{meal.protein}g protein</span>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {macroCards.map((item) => (
              <div
                key={item.label}
                className="rounded-[24px] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
                style={{
                  background: item.accent,
                  border: item.surface ? "none" : "1px solid var(--border)",
                }}
              >
                <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/15">{item.icon}</div>
                <div className="font-display text-[30px] font-bold leading-none" style={{ color: item.textColor }}>
                  {item.value}
                  <span className="ml-1 text-[16px] font-semibold">{item.suffix}</span>
                </div>
                <div
                  className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em]"
                  style={{ color: item.surface ? "rgba(255,255,255,0.84)" : "var(--text-muted)" }}
                >
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {meal.consumedAlternative ? (
          <div className="wellness-card flex gap-4 p-5" style={{ background: "rgba(245,158,11,0.08)", borderColor: "rgba(245,158,11,0.22)" }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-500">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="section-label text-amber-500">You Logged Something Else</div>
              <div className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                {meal.alternativeDescription}
              </div>
              <div className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                {meal.alternativeCalories} kcal - {meal.alternativeProtein}g protein
              </div>
            </div>
          </div>
        ) : null}

        <section className="space-y-4">
          <SectionHeader title="Ingredients" />
          <div className="wellness-card overflow-hidden">
            {parsedIngredients.length > 0 ? (
              parsedIngredients.map((ingredient, index) => (
                <div
                  key={`${ingredient}-${index}`}
                  className="flex items-start gap-3 px-5 py-4"
                  style={{ borderBottom: index < parsedIngredients.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}
                >
                  <div className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: "var(--brand-primary)" }} />
                  <div className="text-[14px] leading-6" style={{ color: "var(--text-primary)" }}>
                    {ingredient}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-3 px-5 py-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: "rgba(232,169,58,0.12)" }}>
                  <UtensilsCrossed className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                </div>
                <div style={{ color: "var(--text-secondary)" }}>Ingredient details are not available for this meal yet.</div>
              </div>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader title="How To Make It" />
          <div className="wellness-card p-5">
            <p className="whitespace-pre-wrap text-[14px] leading-7" style={{ color: "var(--text-secondary)" }}>
              {meal.instructions || "Cooking steps will appear here once the meal has been generated."}
            </p>
          </div>
        </section>

        <section className="space-y-4">
          <SectionHeader title="Meal Options" />
          <div className="grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
            <button
              type="button"
              onClick={() => setIsRegenOpen(true)}
              className="wellness-card flex items-center justify-between gap-4 p-5 text-left transition-all active:scale-[0.99]"
            >
              <div>
                <div className="section-label mb-2">Make A New Meal</div>
                <div className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Make a new meal from the ingredients you have
                </div>
                <div className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  It will try to stay close to this meal's calories and protein.
                </div>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: "rgba(47,128,237,0.1)" }}>
                <Sparkles className="h-5 w-5 text-brand" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setShowAlternativeForm(true)}
              className="wellness-card flex items-center justify-between gap-4 p-5 text-left transition-all active:scale-[0.99]"
            >
              <div>
                <div className="section-label mb-2">Log Something Else</div>
                <div className="text-[15px] font-semibold" style={{ color: "var(--text-primary)" }}>
                  Ate something different?
                </div>
                <div className="mt-2 text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  Save what you really ate and keep your day accurate.
                </div>
              </div>
            </button>
          </div>
        </section>

        <div
          className="fixed bottom-0 left-0 right-0 z-50 px-5 pb-[calc(20px+env(safe-area-inset-bottom))] pt-8"
          style={{
            background:
              "linear-gradient(to top, var(--surface-base) 44%, color-mix(in srgb, var(--surface-base) 82%, transparent) 76%, transparent 100%)",
          }}
        >
          <div className="mx-auto max-w-md">
            {!isLogged ? (
              <button
                className="btn-primary flex h-[60px] w-full items-center justify-center gap-2 rounded-[20px] border-none text-sm font-bold uppercase tracking-[0.08em]"
                disabled={isToggling}
                onClick={() => toggleConsumed({ id: meal.id, isConsumed: true, date: dateStr })}
              >
                {isToggling ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Mark As Eaten
              </button>
            ) : (
              <button
                className="flex h-[60px] w-full items-center justify-center gap-2 rounded-[20px] text-sm font-bold uppercase tracking-[0.08em]"
                style={{
                  background: "var(--surface-1)",
                  border: "1px solid rgba(239,68,68,0.22)",
                  color: "#EF4444",
                }}
                disabled={isToggling}
                onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
              >
                {isToggling ? <Loader2 className="h-5 w-5 animate-spin" /> : <X className="h-5 w-5" />}
                Undo
              </button>
            )}
          </div>
        </div>

        <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
          <DialogContent
            className="max-w-[360px] overflow-hidden rounded-[28px] p-0"
            style={{
              background: "color-mix(in srgb, var(--surface-1) 96%, transparent)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <div className="brand-gradient px-6 py-7 text-white">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <Sparkles className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold">Make A Meal With What You Have</h3>
              <p className="mt-2 text-[13px] leading-6 text-white/85">
                Gemini will make a new {meal.type} using your ingredients while aiming for about {meal.calories} kcal and {meal.protein}g protein.
              </p>
            </div>
            <div className="space-y-5 p-6">
              <div className="space-y-2">
                <Label className="section-label">What Do You Have?</Label>
                <Input
                  placeholder="oats, curd, onions, peanuts"
                  className="input-field"
                  value={availableIngredients}
                  onChange={(event) => setAvailableIngredients(event.target.value)}
                />
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  Write each ingredient separated by a comma.
                </p>
              </div>
              <div className="space-y-2">
                <Label className="section-label">Anything To Avoid Or Focus On?</Label>
                <Textarea
                  placeholder="high protein, no peanuts, quick to make..."
                  className="min-h-[96px] rounded-[20px] px-4 py-3 text-sm"
                  style={{
                    background: "var(--surface-2)",
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                  }}
                  value={regenReason}
                  onChange={(event) => setRegenReason(event.target.value)}
                />
              </div>
              <button
                className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-none text-sm font-bold uppercase tracking-[0.08em]"
                onClick={handleRegenerate}
                disabled={isRegenerating || !availableIngredients.trim()}
              >
                {isRegenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Create Meal
              </button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showAlternativeForm} onOpenChange={setShowAlternativeForm}>
          <DialogContent
            className="max-w-[360px] overflow-hidden rounded-[28px] p-0"
            style={{
              background: "color-mix(in srgb, var(--surface-1) 96%, transparent)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <div className="brand-gradient px-6 py-7 text-white">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15">
                <RefreshCw className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold">Log What You Actually Ate</h3>
            </div>
            <div className="space-y-5 p-6">
              <Textarea
                placeholder="Describe what you actually ate..."
                className="min-h-[110px] rounded-[20px] px-4 py-3 text-sm"
                style={{
                  background: "var(--surface-2)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
                value={altDescription}
                onChange={(event) => setAltDescription(event.target.value)}
              />
              <RadioGroup value={altPortionSize} onValueChange={(value: any) => setAltPortionSize(value)} className="grid grid-cols-3 gap-2">
                {["small", "medium", "large"].map((size) => (
                  <div key={size}>
                    <RadioGroupItem value={size} id={size} className="sr-only" />
                    <Label
                      htmlFor={size}
                      className={cn(
                        "block cursor-pointer rounded-2xl border py-3 text-center text-[11px] font-bold uppercase tracking-[0.08em] transition-all",
                        altPortionSize === size ? "btn-primary border-none text-white" : "",
                      )}
                      style={
                        altPortionSize === size
                          ? undefined
                          : {
                              background: "var(--surface-2)",
                              borderColor: "var(--border)",
                              color: "var(--text-secondary)",
                            }
                      }
                    >
                      {size}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <button
                className="btn-primary flex h-14 w-full items-center justify-center gap-2 rounded-[18px] border-none text-sm font-bold uppercase tracking-[0.08em]"
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt || !altDescription.trim()}
              >
                {isLoggingAlt ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                Save Meal
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
}
