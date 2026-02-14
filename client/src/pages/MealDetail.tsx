import { useLocation, useRoute } from "wouter";
import { usePlanMeta } from "@/hooks/use-plans";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, RefreshCw, Loader2, X, Flame, Zap, Utensils, Clock, ShieldCheck, Heart, Info, ArrowRight, Activity, Cpu } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="p-6 md:p-8 flex items-center justify-between sticky top-0 z-50 glass-card border-none border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setLocation(params?.date && params.date === format(new Date(), 'yyyy-MM-dd') ? "/dashboard" : "/meals")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight leading-none mb-1">NODE_NUTRITION_{meal.type?.toUpperCase()}</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold">{format(planDate, "EEEE // MMM do")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Molecular_Registry</p>
            <p className="text-[10px] font-mono text-white/60">#ID_{meal.id?.toString().padStart(6, '0')}</p>
          </div>
          <div className="h-8 w-[1px] bg-white/10 mx-2 hidden md:block" />
          {isLogged ? (
            <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span className="text-[10px] font-mono font-bold text-primary uppercase tracking-widest">SYNTHESIZED</span>
            </div>
          ) : (
            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest">PENDING</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-4xl mx-auto w-full z-10 space-y-12">
        {/* Hero Section */}
        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-display font-bold text-white uppercase tracking-tighter leading-none">{meal.name}</h2>
            <div className="h-[2px] w-24 bg-primary rounded-full shadow-[0_0_15px_rgba(142,214,63,0.5)]" />
          </motion.div>

          {meal.consumedAlternative && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card p-6 bg-amber-500/[0.05] border-amber-500/20 rounded-[2rem] flex items-center gap-6"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                <Info className="w-7 h-7" />
              </div>
              <div>
                <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-1">Alternative_Fuel_Override_Detected</p>
                <p className="text-lg font-display font-bold text-white uppercase tracking-tight">{meal.alternativeDescription}</p>
                <p className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mt-2">
                  {meal.alternativeCalories} KCAL // {meal.alternativeProtein}G PROTEIN
                </p>
              </div>
            </motion.div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "Energy_Value", value: meal.calories, unit: "KCAL", color: "text-primary", icon: Flame },
              { label: "Molecular_Mass", value: meal.protein, unit: "G PROTEIN", color: "text-blue-400", icon: Zap },
              { label: "Glycogen_Load", value: meal.carbs || 45, unit: "G CARBS", color: "text-orange-400", icon: Activity },
              { label: "Lipid_Density", value: meal.fats || 12, unit: "G FATS", color: "text-amber-400", icon: Cpu }
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-6 rounded-3xl border-white/5 bg-white/[0.02] space-y-4 hover:border-white/10 transition-all group"
              >
                <div className={cn("w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-40 group-hover:opacity-100 transition-opacity", stat.color)}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold text-white tracking-tighter">{stat.value}</p>
                  <p className={cn("text-[9px] font-mono font-bold uppercase tracking-widest", stat.color)}>{stat.unit}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Breakdown Sections */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-white/[0.02] flex flex-col"
          >
            <div className="flex items-center gap-3 mb-8">
              <Utensils className="w-5 h-5 text-primary opacity-60" />
              <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em]">Structural_Components</h3>
            </div>
            <ul className="space-y-6 flex-1">
              {meal.ingredients?.map((ing: any, i: number) => (
                <li key={i} className="flex items-center gap-4 group">
                  <div className="w-2 h-2 rounded-full border border-primary/40 group-hover:bg-primary transition-all shrink-0" />
                  <span className="text-sm font-display font-medium text-white/70 group-hover:text-white transition-colors">
                    {typeof ing === 'object' && ing !== null && 'item' in ing ? (
                      <>
                        <span className="uppercase">{String((ing as any).item)}</span>
                        <span className="text-[10px] font-mono text-white/20 ml-3 uppercase tracking-widest">[{String((ing as any).amount)}]</span>
                      </>
                    ) : (
                      <span className="uppercase">{String(ing)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-white/[0.02]"
          >
            <div className="flex items-center gap-3 mb-8">
              <Clock className="w-5 h-5 text-primary opacity-60" />
              <h3 className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.4em]">Synthesis_Protocol</h3>
            </div>
            <div className="space-y-6">
              <p className="text-sm font-display font-medium text-white/60 leading-relaxed whitespace-pre-wrap uppercase tracking-tight italic">
                {meal.instructions || "SYSTEM_PROTOCOL_PENDING..."}
              </p>
              <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                <ShieldCheck className="w-5 h-5 text-primary/60" />
                <p className="text-[9px] font-mono text-primary/40 uppercase tracking-widest leading-relaxed">
                  Calibration complete. Recipe optimized for bio-available synthesis.
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Action Unit */}
        <section className="pt-8 pb-20">
          <div className="max-w-md mx-auto space-y-4">
            {!isLogged ? (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full h-18 py-6 rounded-[2rem] bg-primary text-black font-display font-bold text-lg uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(142,214,63,0.3)] hover:neon-glow transition-all flex items-center justify-center gap-4 border-none outline-none"
                  disabled={isToggling}
                  onClick={handleYesConsumed}
                >
                  {isToggling ? <Loader2 className="animate-spin w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                  CONFIRM_SYNTHESIS
                </motion.button>

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-16 rounded-[1.5rem] border-white/10 hover:border-white/20 text-white/60 hover:text-white uppercase font-mono text-[10px] tracking-widest"
                    onClick={() => setShowConsumptionPrompt(true)}
                  >
                    OTHER_LOG_OPTIONS
                  </Button>

                  <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="h-16 rounded-[1.5rem] border-white/10 hover:border-white/20 text-white/60 hover:text-white uppercase font-mono text-[10px] tracking-widest">
                        REGENERATE_NODE
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-white/10 bg-black/90 p-10 rounded-[2.5rem] outline-none">
                      <DialogHeader className="mb-10">
                        <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Regeneration_Request</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-8">
                        <div className="space-y-3">
                          <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Reason_For_Conflict</Label>
                          <Textarea
                            placeholder="E.G. RESOURCE_UNAVAILABLE / PALATE_DISCORD..."
                            value={regenReason}
                            onChange={(e) => setRegenReason(e.target.value)}
                            className="h-24 bg-white/[0.03] border-white/10 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase"
                          />
                        </div>
                        <div className="space-y-3">
                          <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Available_Resources (Optional)</Label>
                          <Textarea
                            placeholder="LIST_PROVISIONS..."
                            value={availableIngredients}
                            onChange={(e) => setAvailableIngredients(e.target.value)}
                            className="h-24 bg-white/[0.03] border-white/10 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase"
                          />
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={handleRegenerate}
                          disabled={isRegenerating || !regenReason}
                          className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] flex items-center justify-center gap-3 border-none outline-none"
                        >
                          {isRegenerating ? <Loader2 className="animate-spin w-5 h-5 text-black" /> : <RefreshCw className="w-5 h-5 text-black" />}
                          INITIATE_RE-SYNTHESIS
                        </motion.button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full h-18 py-6 rounded-[2rem] bg-white/5 border border-white/10 text-white/40 hover:text-white font-display font-bold text-lg uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4 outline-none"
                disabled={isToggling}
                onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
              >
                {isToggling ? <Loader2 className="animate-spin w-6 h-6" /> : <X className="w-6 h-6" />}
                DE-ACTIVATE_NODE_LOG
              </motion.button>
            )}
          </div>
        </section>
      </main>

      {/* Consumption Dialogs */}
      <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
        <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Manual_Log_Interference</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5">
              <p className="text-lg font-display font-bold text-white uppercase mb-2">{meal.name}</p>
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
                {isLoggingAlt ? <Loader2 className="animate-spin w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                AUTHORIZE_LOG
              </motion.button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
