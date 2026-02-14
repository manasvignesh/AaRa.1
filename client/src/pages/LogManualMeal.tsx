import { useState } from "react";
import { useLocation } from "wouter";
import { usePlanMeta } from "@/hooks/use-plans";
import { useLogManualMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Check, UtensilsCrossed, Zap, ShieldCheck, Activity, Target, Flame, Cpu } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
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
      toast({ title: "Please describe what you ate", variant: "destructive" });
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

  if (planLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
          <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full glass-card p-12 rounded-[3rem] border-white/10 bg-black/40 text-center space-y-10 z-10"
        >
          <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse" />
            <ShieldCheck className="w-12 h-12 text-primary relative" />
          </div>
          <div>
            <h2 className="text-4xl font-display font-bold text-white uppercase tracking-tighter mb-2">INPUT_CALIBRATED</h2>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.4em] leading-relaxed">
              Unplanned fuel intake has been integrated into the daily metabolic trajectory. Homeostasis preserved.
            </p>
          </div>
          <Button
            className="w-full h-16 rounded-2xl bg-primary text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(142,214,63,0.3)] transition-all border-none"
            onClick={() => setLocation("/dashboard")}
          >
            RETURN_TO_COMMAND
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col relative overflow-hidden selection:bg-primary/30">
      {/* Cybergrid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]">
        <div className="h-full w-full" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      </div>

      <header className="p-6 md:p-8 flex items-center justify-between sticky top-0 z-50 glass-card border-none border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setLocation("/dashboard")}
            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-white uppercase tracking-tight leading-none mb-1">EXTERNAL_FUEL_SYNC</h1>
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em] font-bold">Unplanned_Input_Override</p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-12 max-w-2xl mx-auto w-full z-10 space-y-12 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 rounded-[2.5rem] border-white/5 bg-blue-500/[0.02] flex items-start gap-6 relative overflow-hidden"
        >
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <p className="text-sm font-display font-medium text-blue-400/80 leading-relaxed uppercase tracking-tight italic">
            "Spontaneous consumption detected. Describe the intake for the Ai Core to re-generate subsequent metabolic windows. Accuracy aids adaptation."
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-3 group">
            <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-primary transition-colors">Fuel_Description</Label>
            <Input
              placeholder="E.G. PIZZA_SLICE, ENERGY_CORE, PROTEIN_BAR..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-16 bg-white/[0.03] border-white/5 rounded-2xl focus:border-primary/50 text-white font-mono text-xs uppercase tracking-[0.2em]"
            />

            <AnimatePresence>
              {description.trim().length > 2 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pt-4"
                >
                  <div className="p-6 rounded-[1.5rem] bg-indigo-500/[0.05] border border-indigo-500/10 space-y-4">
                    <div className="flex items-center gap-3">
                      <Activity className="w-3.5 h-3.5 text-indigo-400 opacity-40" />
                      <span className="text-[9px] font-mono font-bold text-indigo-400 uppercase tracking-widest">REAL_TIME_PREDICTION</span>
                    </div>
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-3xl font-display font-bold text-white tracking-tighter">
                          {(() => {
                            const d = description.toLowerCase();
                            let cal = 300;
                            if (d.includes('pizza')) cal = 280;
                            else if (d.includes('burger')) cal = 550;
                            else if (d.includes('salad')) cal = 150;

                            const multiplier = portionSize === 'small' ? 0.7 : portionSize === 'large' ? 1.4 : 1;
                            const mealMultiplier = mealType === 'meal' ? 1.5 : 1;
                            return Math.round(cal * multiplier * mealMultiplier);
                          })()}
                        </p>
                        <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Est_Caloric_Load</p>
                      </div>
                      <div className="h-8 w-[1px] bg-white/10" />
                      <div>
                        <p className="text-3xl font-display font-bold text-indigo-400 tracking-tighter">
                          {(() => {
                            const d = description.toLowerCase();
                            let protein = 10;
                            if (d.includes('pizza')) protein = 12;
                            else if (d.includes('burger')) protein = 25;
                            else if (d.includes('salad')) protein = 5;

                            const multiplier = portionSize === 'small' ? 0.7 : portionSize === 'large' ? 1.4 : 1;
                            const mealMultiplier = mealType === 'meal' ? 1.5 : 1;
                            return Math.round(protein * multiplier * mealMultiplier);
                          })()}g
                        </p>
                        <p className="text-[8px] font-mono text-white/30 uppercase tracking-widest">Est_Protein_Mass</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Consumption_Volume_Tier</Label>
            <RadioGroup
              value={portionSize}
              onValueChange={(v) => setPortionSize(v as "small" | "medium" | "large")}
              className="grid grid-cols-3 gap-4"
            >
              {[
                { value: "small", label: "LOW" },
                { value: "medium", label: "MOD" },
                { value: "large", label: "HIGH" }
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                  <Label
                    htmlFor={opt.value}
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/5 peer-data-[state=checked]:border-primary/40 peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4">
            <Label className="text-[10px] font-mono text-white/40 uppercase tracking-widest ml-1">Classification_Node</Label>
            <RadioGroup
              value={mealType}
              onValueChange={(v) => setMealType(v as "snack" | "meal")}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { value: "snack", label: "SNACK_INTERVAL" },
                { value: "meal", label: "FULL_INPUT_NODE" }
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={`type-${opt.value}`} className="peer sr-only" />
                  <Label
                    htmlFor={`type-${opt.value}`}
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/5 bg-white/[0.02] p-8 hover:bg-white/5 peer-data-[state=checked]:border-primary/40 peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                  >
                    <span className="text-[10px] font-mono font-bold text-white uppercase tracking-widest">{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full h-20 rounded-2xl bg-primary text-black font-display font-bold text-lg uppercase tracking-[0.2em] shadow-[0_0_40px_rgba(142,214,63,0.3)] transition-all flex items-center justify-center gap-4 border-none outline-none disabled:opacity-20 disabled:grayscale"
            disabled={isPending || !description.trim()}
          >
            {isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Zap className="w-6 h-6" />}
            SYNCHRONIZE_INTAKE
          </motion.button>
        </form>
      </main>

      {/* Futuristic Bottom Status Strip */}
      <div className="absolute bottom-10 left-10 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center gap-3">
          <Flame className="w-3 h-3 text-primary opacity-40" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Adaptive_Engine: READY</span>
        </div>
        <div className="flex items-center gap-3">
          <Cpu className="w-3 h-3 text-primary opacity-40" />
          <span className="text-[8px] font-mono text-white/20 uppercase tracking-[0.3em]">Neural_Archive: ONLINE</span>
        </div>
      </div>
    </div>
  );
}
