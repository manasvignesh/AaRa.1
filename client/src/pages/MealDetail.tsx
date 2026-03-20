import { useLocation, useRoute } from "wouter";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Check,
  RefreshCw,
  Loader2,
  X,
  ChevronLeft,
  Flame,
  Target,
  Zap,
  Droplets,
  MapPin,
  Clock,
  ChefHat,
  UtensilsCrossed,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { motion } from "framer-motion";

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
      <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
        <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-16 h-16 rounded-full border-2 border-primary border-t-transparent shadow-[0_0_20px_rgba(251,191,36,0.2)]"
          />
        </main>
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#050505] gap-8 text-center">
        <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <X className="w-10 h-10 text-red-500" />
        </div>
        <div>
          <h2 className="text-2xl font-display font-bold text-white uppercase tracking-tight">MOLECULAR_DATA_NULL</h2>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] mt-2">The requested nutritional node does not exist in the archive.</p>
        </div>
        <Button
          className="h-14 px-10 rounded-2xl bg-white/5 border border-white/10 text-white font-display font-bold uppercase tracking-widest hover:bg-white/10"
          onClick={() => setLocation("/dashboard")}
        >
          RETURN_TO_CONTROL
        </Button>
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
  const carbsValue = meal.carbs ?? 0;
  const fatValue = meal.fat ?? meal.fats ?? 0;
  const rawIngredients = meal.ingredients;
  const ingredientsArray = Array.isArray(rawIngredients) ? rawIngredients : [];
  const ingredientListLooksUseful = ingredientsArray.length > 0 && !(
    ingredientsArray.length === 1 &&
    typeof ingredientsArray[0] === "string" &&
    String(ingredientsArray[0]).trim().toLowerCase() === String(meal.name || "").trim().toLowerCase()
  );

  const formatRegion = (r: string) => ({
    north_indian: "North Indian",
    south_indian: "South Indian",
    east_indian: "East Indian",
    pan_india: "Pan India",
    pan_indian: "Pan India",
  }[r?.toLowerCase()] ?? r?.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));

  const formatGoal = (g: string) =>
    g?.split(",")
      .map(s => ({
        weight_loss: "Weight Loss",
        maintain: "Maintenance",
        muscle_gain: "Muscle Gain",
        weight_gain: "Weight Gain",
      }[s.trim().toLowerCase()] ?? s.trim().replace(/\b\w/g, c => c.toUpperCase())))
      .join(" · ");

  const goalValue = Array.isArray(meal.goal) ? formatGoal(meal.goal.join(",")) : formatGoal(meal.goal);
  const mealInfoItems = [
    {
      icon: <MapPin size={14} style={{ color: "var(--brand-primary)" }} />,
      iconBg: "rgba(232,169,58,0.12)",
      label: "Region",
      value: meal.region ? formatRegion(meal.region) : undefined,
    },
    {
      icon: <Target size={14} style={{ color: "#6DDBA8" }} />,
      iconBg: "rgba(61,171,122,0.12)",
      label: "Goal",
      value: goalValue,
    },
    {
      icon: <Clock size={14} style={{ color: "#6AAFF5" }} />,
      iconBg: "rgba(47,128,237,0.12)",
      label: "Meal Time",
      value: meal.mealTime ?? meal.meal_time ?? meal.type,
    },
    {
      icon: <ChefHat size={14} style={{ color: "#C084FC" }} />,
      iconBg: "rgba(192,132,252,0.12)",
      label: "Method",
      value: meal.cookingMethod ?? meal.cooking_method,
    },
  ].filter(item => item.value);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--surface-base)" }}>
      <main className="flex-1 max-w-md mx-auto w-full px-5 pt-6 pb-safe" style={{ color: "var(--text-primary)" }}>
        <div style={{ marginBottom: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <button onClick={() => history.back()} style={{
              width: 36, height: 36, borderRadius: 12,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", flexShrink: 0,
            }}>
              <ChevronLeft size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
            <div>
              <div style={{
                fontSize: "11px", fontWeight: 600,
                letterSpacing: "0.12em", textTransform: "uppercase",
                color: "var(--brand-primary)",
              }}>
                {meal.mealTime ?? meal.meal_time ?? meal.type} · {meal.date ?? format(planDate, "MMM do, yyyy")}
              </div>
            </div>
          </div>

          <h1 className="font-display" style={{
            fontSize: "26px",
            fontWeight: "700",
            color: "var(--text-primary)",
            lineHeight: 1.25,
            marginBottom: "20px",
            textTransform: "none",
          }}>
            {meal.name
              .split(" ")
              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
              .join(" ")}
          </h1>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginBottom: "24px",
        }}>
          {[
            {
              label: "Calories",
              value: meal.calories,
              unit: "kcal",
              icon: <Flame size={15} color="#fff" />,
              bg: "linear-gradient(135deg, #E8A93A, #C4841A)",
              iconBg: "rgba(255,255,255,0.2)",
            },
            {
              label: "Protein",
              value: `${meal.protein}g`,
              unit: "protein",
              icon: <Target size={15} style={{ color: "#E8A93A" }} />,
              bg: "var(--surface-2)",
              iconBg: "rgba(232,169,58,0.15)",
              border: "1px solid rgba(232,169,58,0.2)",
            },
            {
              label: "Carbs",
              value: `${carbsValue}g`,
              unit: "carbs",
              icon: <Zap size={15} style={{ color: "#6DDBA8" }} />,
              bg: "var(--surface-2)",
              iconBg: "rgba(61,171,122,0.15)",
              border: "1px solid rgba(61,171,122,0.2)",
            },
            {
              label: "Fat",
              value: `${fatValue}g`,
              unit: "fat",
              icon: <Droplets size={15} style={{ color: "#6AAFF5" }} />,
              bg: "var(--surface-2)",
              iconBg: "rgba(47,128,237,0.15)",
              border: "1px solid rgba(47,128,237,0.2)",
            },
          ].map((item, i) => (
            <div key={i} style={{
              background: item.bg,
              border: item.border || "none",
              borderRadius: "18px",
              padding: "16px",
              minHeight: "100px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: item.iconBg,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {item.icon}
              </div>
              <div>
                <div className="font-display" style={{
                  fontSize: "26px", fontWeight: "700",
                  color: i === 0 ? "#111318" : "var(--text-primary)",
                  lineHeight: 1,
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: "10px", fontWeight: 600,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: i === 0 ? "rgba(17,19,24,0.6)" : "var(--text-muted)",
                  marginTop: "3px",
                }}>
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 className="font-display" style={{
            fontSize: "17px", fontWeight: "700",
            color: "var(--text-primary)", marginBottom: "12px",
          }}>
            Ingredients
          </h3>

          {ingredientListLooksUseful ? (
            <div style={{
              background: "var(--surface-2)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}>
              {ingredientsArray.map((ing: any, i: number) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "13px 16px",
                  borderBottom: i < ingredientsArray.length - 1
                    ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%",
                      background: "var(--brand-primary)", flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: "14px", fontWeight: "500",
                      color: "var(--text-primary)",
                    }}>
                      {typeof ing === "string"
                        ? ing.split("_").join(" ").replace(/\b\w/g, c => c.toUpperCase())
                        : (ing.name ?? ing.item ?? "Ingredient")}
                    </span>
                  </div>
                  {(ing?.quantity || ing?.amount) && (
                    <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                      {ing.quantity ?? ing.amount}{ing.unit ? ` ${ing.unit}` : ""}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: "var(--surface-2)",
              borderRadius: "16px",
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10,
                background: "rgba(232,169,58,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <UtensilsCrossed size={15} style={{ color: "var(--brand-primary)" }} />
              </div>
              <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
                {typeof rawIngredients === "string"
                  ? rawIngredients
                  : "Ingredient details not available"}
              </span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: "24px" }}>
          <h3 className="font-display" style={{
            fontSize: "17px", fontWeight: "700",
            color: "var(--text-primary)", marginBottom: "12px",
          }}>
            Meal Info
          </h3>
          <div style={{
            background: "var(--surface-2)",
            borderRadius: "16px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}>
            {mealInfoItems.map((item, i, arr) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "13px 16px",
                borderBottom: i < arr.length - 1
                  ? "1px solid rgba(255,255,255,0.05)" : "none",
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 10,
                  background: item.iconBg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  {item.icon}
                </div>
                <div>
                  <div style={{
                    fontSize: "10px", fontWeight: 600,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                    color: "var(--text-muted)", marginBottom: "2px",
                  }}>
                    {item.label}
                  </div>
                  <div style={{
                    fontSize: "14px", fontWeight: "500",
                    color: "var(--text-primary)",
                  }}>
                    {item.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          paddingBottom: "32px",
        }}>
          {!isLogged ? (
            <>
              <button
                className="btn-primary"
                style={{
                  width: "100%", height: "52px",
                  fontSize: "13px", fontWeight: "700",
                  letterSpacing: "0.06em",
                  display: "flex", alignItems: "center",
                  justifyContent: "center", gap: "8px",
                  borderRadius: "16px",
                }}
                disabled={isToggling}
                onClick={handleYesConsumed}
              >
                {isToggling ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                Sync Consumption
              </button>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <button
                  className="btn-ghost"
                  style={{
                    height: "48px", fontSize: "13px",
                    fontWeight: "600", borderRadius: "14px",
                  }}
                  onClick={() => setShowConsumptionPrompt(true)}
                >
                  Custom Log
                </button>
                <button
                  style={{
                    height: "48px", fontSize: "13px",
                    fontWeight: "600", borderRadius: "14px",
                    background: "rgba(232,169,58,0.1)",
                    border: "1px solid rgba(232,169,58,0.25)",
                    color: "var(--brand-primary)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onClick={() => setIsRegenOpen(true)}
                >
                  Optimize
                </button>
              </div>
            </>
          ) : (
            <button
              className="btn-ghost"
              style={{
                height: "48px",
                fontSize: "13px",
                fontWeight: "600",
                borderRadius: "14px",
              }}
              disabled={isToggling}
              onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
            >
              {isToggling ? <Loader2 className="animate-spin" size={16} /> : <X size={16} />}
              Revert Entry
            </button>
          )}
        </div>
      </main>

      {/* Consumption Dialogs */}
      <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
        <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Manual_Log_Interference</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-lg font-display font-bold text-white mb-2">{meal.name}</p>
              <div className="flex gap-6">
                <span className="text-[10px] font-mono text-primary uppercase tracking-widest">{meal.calories} KCAL</span>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{meal.protein} G</span>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <Button
                onClick={handleYesConsumed}
                disabled={isToggling}
                className="h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest"
              >
                CONFIRM_EXPECTED_FUEL
              </Button>
              <Button
                variant="outline"
                onClick={handleConsumedSomethingElse}
                className="h-16 rounded-2xl border-white/10 text-white font-display font-bold uppercase tracking-widest"
              >
                UNPLANNED_FUEL_INPUT
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlternativeForm} onOpenChange={setShowAlternativeForm}>
        <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">External_Bio_Input</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Input_Log_Description</Label>
              <Textarea
                placeholder="IDENTIFY_CONSUMABLES..."
                value={altDescription}
                onChange={(e) => setAltDescription(e.target.value)}
                className="h-28 bg-white/[0.03] border-white/10 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Input_Intensity_Volume</Label>
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
                  <div key={opt.value} className="relative">
                    <RadioGroupItem value={opt.value} id={`alt-${opt.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`alt-${opt.value}`}
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
                <p className="text-[10px] font-mono text-primary/60 uppercase tracking-widest">ESTIMATED_CALORIC_NODE</p>
              </motion.div>
            )}

            {!showPreview ? (
              <Button
                onClick={handleShowPreview}
                disabled={!altDescription.trim()}
                className="w-full h-16 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-bold uppercase tracking-widest"
              >
                ANALYZE_INPUT
              </Button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 1 }}
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt}
                className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center gap-3 border-none outline-none"
              >
                {isLoggingAlt ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                AUTHORIZE_LOG
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
