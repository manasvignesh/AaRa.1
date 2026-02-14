import React, { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals, useToggleMealConsumed, useLogAlternativeMeal, useRegenerateMeal } from "@/hooks/use-meals";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ChevronRight, CheckCircle, Calendar, ChevronLeft, Check, X, Utensils, RefreshCw, Zap, Flame, Cpu, Shield, Beaker, Apple, Croissant, Pizza, Coffee, Info, ArrowRight } from "lucide-react";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MealsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
    const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
    const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
    const { mutate: toggleConsumed, isPending: isToggling } = useToggleMealConsumed();
    const { mutate: logAlternative, isPending: isLoggingAlt } = useLogAlternativeMeal();
    const { mutate: regenerate, isPending: isRegeneratingMeal } = useRegenerateMeal();
    const [generationError, setGenerationError] = useState<string | null>(null);

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

    const [activeMealId, setActiveMealId] = useState<number | null>(null);
    const [showConsumptionPrompt, setShowConsumptionPrompt] = useState(false);
    const [showAlternativeForm, setShowAlternativeForm] = useState(false);
    const [showRegenForm, setShowRegenForm] = useState(false);
    const [regenReason, setRegenReason] = useState("");
    const [availableIngredients, setAvailableIngredients] = useState("");

    const [altDescription, setAltDescription] = useState("");
    const [altPortionSize, setAltPortionSize] = useState<"small" | "medium" | "large">("medium");
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<{ calories: number; protein: number } | null>(null);

    const activeMeal = meals.find(m => m.id === activeMealId);

    const handleMealCardClick = (mealId: number) => {
        setActiveMealId(mealId);
        setShowConsumptionPrompt(true);
    };

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
        setShowRegenForm(false);
        setShowPreview(false);
        setAltDescription("");
        setRegenReason("");
        setAvailableIngredients("");
        setPreviewData(null);
        setActiveMealId(null);
    };

    const handleRegenerate = () => {
        if (!activeMealId) return;
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        regenerate(
            {
                id: activeMealId,
                reason: regenReason || "I want a different option",
                availableIngredients: availableIngredients.split(',').map(i => i.trim()).filter(i => i !== ""),
                date: dateStr
            },
            {
                onSuccess: () => {
                    handleCloseDialogs();
                }
            }
        );
    };

    const totalCalories = meals.reduce((sum: number, meal: any) => {
        if (meal.consumedAlternative) return sum + (meal.alternativeCalories || 0);
        if (meal.isConsumed) return sum + meal.calories;
        return sum;
    }, 0);

    const totalProtein = meals.reduce((sum: number, meal: any) => {
        if (meal.consumedAlternative) return sum + (meal.alternativeProtein || 0);
        if (meal.isConsumed) return sum + meal.protein;
        return sum;
    }, 0);

    if (userLoading || (planLoading && !plan) || isGenerating || mealsLoading) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-background relative overflow-hidden">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-8 z-10">
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            rotate: [0, 180, 360],
                            borderColor: ["#f97316", "rgba(249, 115, 22, 0.3)", "#f97316"]
                        }}
                        transition={{ repeat: Infinity, duration: 3 }}
                        className="w-24 h-24 rounded-full border-4 border-orange-500 border-t-transparent shadow-[0_0_50px_rgba(249,115,22,0.3)] flex items-center justify-center"
                    >
                        <Beaker className="w-10 h-10 text-orange-500 animate-pulse" />
                    </motion.div>
                    <div className="text-center space-y-4">
                        <h3 className="font-display font-bold text-2xl text-white uppercase tracking-[0.2em] animate-pulse">
                            Synthesizing_Molecular_Fuel
                        </h3>
                        <div className="flex justify-center gap-1">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0, 1, 0] }}
                                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                                    className="w-2 h-2 bg-orange-500 rounded-full"
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
            <div className="flex flex-col md:flex-row min-h-screen bg-background">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-8 p-6 max-w-md mx-auto text-center z-10">
                    <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <X className="w-10 h-10 text-red-500" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="font-display font-bold text-2xl text-white uppercase tracking-tight">SYNTHESIS_ABORTED</h3>
                        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest opacity-60 leading-relaxed">
                            {generationError || "NEURAL_LINK_FAILURE: UNABLE_TO_CONSTRUCT_NUTRITIONAL_PLAN"}
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full rounded-2xl border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all font-display font-bold uppercase tracking-widest text-orange-500"
                        onClick={handleRetryGeneration}
                    >
                        RE-INITIALIZE
                    </Button>
                </main>
            </div>
        );
    }

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(subDays(new Date(), 3), i));

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-background text-foreground selection:bg-orange-500/30">
            <Navigation />

            <main className="flex-1 pb-48 md:pb-12 overflow-y-auto px-4 md:px-8">
                <header className="pt-10 pb-10 md:pt-16 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 relative">
                    <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 blur-[100px] -z-10 rounded-full" />
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                    >
                        <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight uppercase">Molecular <span className="text-orange-500">Nutri</span></h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Beaker className="w-3 h-3 text-orange-500 opacity-60" />
                            <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.3em] opacity-60">System: Nutrient Synthesis // Calibrated</p>
                        </div>
                    </motion.div>

                    <Link href="/log-meal">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="h-14 px-8 rounded-2xl bg-white/5 border border-white/10 text-white font-display font-bold uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4 text-orange-500" />
                            Log_External_Fuel
                        </motion.button>
                    </Link>
                </header>

                {/* Tactical Timeline Strip */}
                <section className="mb-12 relative">
                    <div className="glass-card p-4 flex justify-between items-center rounded-3xl border-white/5 shadow-2xl overflow-hidden relative">
                        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
                        {weekDays.map((day, idx) => {
                            const active = isSameDay(day, selectedDate);
                            const today = isToday(day);
                            return (
                                <motion.button
                                    key={idx}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedDate(day)}
                                    className={cn(
                                        "relative flex flex-col items-center py-3 px-4 rounded-2xl transition-all duration-300 min-w-[50px] md:min-w-[64px]",
                                        active ? "bg-orange-500 text-black shadow-[0_0_30px_rgba(249,115,22,0.3)] scale-110 z-10" : "hover:bg-white/5 text-white/40"
                                    )}
                                >
                                    <span className={cn("text-[9px] font-mono font-bold uppercase tracking-widest mb-1", active ? "text-black/60" : "text-white/20")}>
                                        {format(day, "eee")}
                                    </span>
                                    <span className="text-xl font-display font-bold">{format(day, "d")}</span>
                                    {today && !active && <div className="absolute -bottom-1 w-1 h-1 bg-orange-500 rounded-full shadow-[0_0_5px_#f97316]" />}
                                    {active && (
                                        <motion.div
                                            layoutId="active-timeline"
                                            className="absolute inset-0 border-2 border-white/20 rounded-2xl pointer-events-none"
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>
                </section>

                {plan && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
                    >
                        {[
                            { label: "Thermal_Energy", value: totalCalories, target: plan.caloriesTarget, unit: "KCAL", icon: Flame, color: "text-orange-500" },
                            { label: "Molecular_Synthesis", value: totalProtein, target: 120, unit: "G", icon: Zap, color: "text-blue-400" },
                            { label: "Stability_Index", value: Math.round((totalCalories / plan.caloriesTarget) * 100), target: 100, unit: "%", icon: Cpu, color: "text-green-400" }
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-6 rounded-[2rem] border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <stat.icon className={cn("w-16 h-16", stat.color)} />
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                    <span className="text-[10px] font-mono font-bold text-white/40 uppercase tracking-[0.2em]">{stat.label}</span>
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-display font-bold text-white">{stat.value}</span>
                                    <span className="text-xs font-mono text-white/20 uppercase">/ {stat.target}{stat.unit}</span>
                                </div>
                                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min((stat.value / stat.target) * 100, 100)}%` }}
                                        className={cn("h-full bg-gradient-to-r", stat.color.replace('text-', 'from-').replace('-500', '-500 to-transparent'))}
                                    />
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    <div className="space-y-12">
                        {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                            const typeMeals = meals.filter((m: any) => m.type?.toLowerCase() === mealType);
                            if (typeMeals.length === 0) return null;

                            const mealTypeConfig: Record<string, { label: string; icon: any; color: string; desc: string }> = {
                                breakfast: { label: 'Initial_Load', icon: Coffee, color: 'text-orange-400', desc: "Fuel calibration for daily cycle initiation." },
                                lunch: { label: 'Mid_Cycle_Refeed', icon: Apple, color: 'text-green-400', desc: "Nutrient density optimization for maintenance." },
                                dinner: { label: 'Recovery_Phase', icon: Croissant, color: 'text-blue-400', desc: "Final molecular synthesis before rest." },
                                snack: { label: 'Utility_Supplement', icon: Zap, color: 'text-purple-400', desc: "Rapid ATP restoration protocol." },
                            };

                            const config = mealTypeConfig[mealType] || { label: mealType, icon: Utensils, color: 'text-white', desc: "Generic nutritional input." };

                            return (
                                <section key={mealType} className="space-y-6">
                                    <div className="flex items-center gap-4 px-2">
                                        <config.icon className={cn("w-4 h-4", config.color, "opacity-60")} />
                                        <h2 className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-[0.4em]">{config.label}</h2>
                                        <div className="h-[1px] flex-1 bg-gradient-to-r from-white/5 to-transparent" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {typeMeals.map((meal: any, idx: number) => {
                                            const isLogged = meal.isConsumed || meal.consumedAlternative;
                                            return (
                                                <React.Fragment key={meal.id}>
                                                    <motion.div
                                                        initial={{ opacity: 0, scale: 0.95 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        onClick={() => handleMealCardClick(meal.id)}
                                                        className={cn(
                                                            "glass-card p-8 rounded-[2.5rem] border-white/5 relative overflow-hidden group cursor-pointer transition-all hover:border-orange-500/20",
                                                            isLogged && "border-orange-500/30 bg-orange-500/[0.02]"
                                                        )}
                                                    >
                                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                                            <config.icon className={cn("w-24 h-24", config.color)} />
                                                        </div>

                                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-3">
                                                                    {isLogged && (
                                                                        <div className="flex items-center gap-1.5 py-1 px-3 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400">
                                                                            <CheckCircle className="w-3 h-3" />
                                                                            <span className="text-[9px] font-mono font-bold uppercase tracking-widest">CONSUMED</span>
                                                                        </div>
                                                                    )}
                                                                    <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-widest">Protocol_{String(meal.id).padStart(3, '0')}</span>
                                                                </div>
                                                                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight group-hover:text-orange-500 transition-colors">
                                                                    {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                                                </h3>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                                            {[
                                                                { label: "Energy", value: meal.consumedAlternative ? meal.alternativeCalories : meal.calories, unit: "KCAL", icon: Flame },
                                                                { label: "Synthesis", value: meal.consumedAlternative ? meal.alternativeProtein : meal.protein, unit: "G", icon: Zap }
                                                            ].map((stat, i) => (
                                                                <div key={i} className="flex flex-col gap-1 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                                                    <stat.icon className="w-3 h-3 text-orange-500 opacity-60" />
                                                                    <p className="text-[9px] font-mono font-bold uppercase text-white/30 tracking-widest">{stat.label}</p>
                                                                    <p className="text-sm font-display font-bold text-white uppercase">{stat.value}<span className="text-[10px] ml-1 opacity-40">{stat.unit}</span></p>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center justify-between pt-6 border-t border-white/5 relative z-10">
                                                            <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{config.desc}</p>
                                                            <div className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 group-hover:border-orange-500/30 transition-all">
                                                                <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-orange-500" />
                                                            </div>
                                                        </div>
                                                    </motion.div>

                                                    {idx === 0 && (
                                                        <div className="glass-card p-8 rounded-[2.5rem] border-white/5 flex flex-col justify-between">
                                                            <div className="space-y-6">
                                                                <div className="flex items-center gap-3">
                                                                    <Info className="w-5 h-5 text-orange-500" />
                                                                    <h4 className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-[0.3em]">Digestive_Intel</h4>
                                                                </div>
                                                                <p className="text-sm font-display text-white/80 italic leading-relaxed">
                                                                    "Optimal nutrient absorption attained by 20-minute mastication cycle. Hydration levels must remain at 85%."
                                                                </p>
                                                            </div>

                                                            <div className="pt-8 border-t border-white/5 space-y-4">
                                                                <button
                                                                    onClick={() => { setActiveMealId(meal.id); setShowRegenForm(true); }}
                                                                    className="w-full text-left flex items-center justify-between group outline-none border-none bg-transparent cursor-pointer"
                                                                >
                                                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest group-hover:text-orange-500 transition-colors">SWAP_MOLECULE</span>
                                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-orange-500 transition-all" />
                                                                </button>
                                                                <button className="w-full text-left flex items-center justify-between group outline-none border-none bg-transparent cursor-pointer">
                                                                    <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest group-hover:text-orange-500 transition-colors">ALLERGY_OVERRIDE</span>
                                                                    <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-orange-500 transition-all" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </React.Fragment>
                                            );
                                        })}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </AnimatePresence>
            </main>

            <Dialog open={showConsumptionPrompt} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Fuel_Status_Report</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        {activeMeal && (
                            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                                <p className="text-sm font-display font-bold text-white uppercase mb-2">{activeMeal.name}</p>
                                <div className="flex gap-4">
                                    <span className="text-[10px] font-mono text-orange-500 uppercase">{activeMeal.calories} KCAL</span>
                                    <span className="text-[10px] font-mono text-blue-400 uppercase">{activeMeal.protein}G PROTEIN</span>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-col gap-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleYesConsumed}
                                disabled={isToggling}
                                className="w-full h-14 rounded-2xl bg-orange-500 text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 border-none outline-none"
                            >
                                {isToggling ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                                CONFIRM_CONSUMPTION
                            </motion.button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowConsumptionPrompt(false); setShowRegenForm(true); }}
                                className="w-full h-14 rounded-2xl border-white/10 hover:border-orange-500/50 hover:bg-orange-500/5 text-white font-display font-bold uppercase tracking-widest"
                            >
                                <RefreshCw className="mr-2 w-4 h-4" />
                                REGENERATE_PROTOCOL
                            </Button>
                            <Link href={activeMeal ? `/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMeal.id}` : "#"}>
                                <Button variant="ghost" className="w-full h-12 text-white/30 hover:text-white uppercase font-mono text-[10px] tracking-widest">
                                    VIEW_MOLECULAR_DATA
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRegenForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Sequence_Regeneration</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed">
                            NUTRITIONAL_OVERRIDE_ENABLED: SYSTEM_WILL_CALIBRATE_ALTERNATIVE_FUEL_SOURCES.
                        </p>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-white/60 uppercase tracking-widest">REASON_FOR_OVERRIDE</Label>
                            <Textarea
                                placeholder="INPUT_DATA..."
                                value={regenReason}
                                onChange={(e) => setRegenReason(e.target.value)}
                                className="h-24 bg-white/[0.03] border-white/10 rounded-xl focus:border-orange-500/50 transition-all font-mono text-xs text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-mono text-white/60 uppercase tracking-widest">ON_SITE_INGREDIENTS</Label>
                            <Textarea
                                placeholder="SCANNING_RESOURCES..."
                                value={availableIngredients}
                                onChange={(e) => setAvailableIngredients(e.target.value)}
                                className="h-24 bg-white/[0.03] border-white/10 rounded-xl focus:border-orange-500/50 transition-all font-mono text-xs text-white"
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleRegenerate}
                            disabled={isRegeneratingMeal}
                            className="w-full h-14 rounded-2xl bg-orange-500 text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 border-none outline-none"
                        >
                            {isRegeneratingMeal ? <Loader2 className="animate-spin w-5 h-5" /> : <RefreshCw className="w-5 h-5" />}
                            START_RE_SYNTHESIS
                        </motion.button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAlternativeForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent className="glass-card border-white/10 bg-black/90 p-8 rounded-[2.5rem] outline-none">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-display font-bold text-white uppercase tracking-tight">Manual_Fuel_Log</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <Textarea
                            placeholder="DESCRIBE_SUBSTANCE..."
                            value={altDescription}
                            onChange={(e) => setAltDescription(e.target.value)}
                            className="h-24 bg-white/[0.03] border-white/10 rounded-xl focus:border-orange-500/50 transition-all font-mono text-xs text-white"
                        />

                        <div className="space-y-4">
                            <Label className="text-[10px] font-mono text-white/60 uppercase tracking-widest">VOLUMETRIC_MASS</Label>
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
                                        <RadioGroupItem value={opt.value} id={`meals-${opt.value}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`meals-${opt.value}`}
                                            className="flex flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] p-4 hover:bg-white/10 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:bg-orange-500/10 cursor-pointer transition-all"
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
                                className="p-6 rounded-2xl bg-orange-500/10 border border-orange-500/20"
                            >
                                <p className="text-xl font-display font-bold text-orange-500">~{previewData.calories} KCAL</p>
                                <p className="text-[10px] font-mono text-orange-500/60 uppercase tracking-widest">ESTIMATED_THERMAL_LOAD</p>
                            </motion.div>
                        )}

                        {!showPreview ? (
                            <Button
                                onClick={handleShowPreview}
                                disabled={!altDescription.trim()}
                                className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-display font-bold uppercase tracking-widest"
                            >
                                SCAN_INPUT_DATA
                            </Button>
                        ) : (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleConfirmAlternative}
                                disabled={isLoggingAlt}
                                className="w-full h-14 rounded-2xl bg-orange-500 text-black font-display font-bold uppercase tracking-widest shadow-[0_0_30px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 border-none outline-none"
                            >
                                {isLoggingAlt ? <Loader2 className="animate-spin w-5 h-5" /> : <Check className="w-5 h-5" />}
                                CALIBRATE_AND_LOG
                            </motion.button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
