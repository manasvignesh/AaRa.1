import { useEffect, useState } from "react";
import { Link } from "wouter";
import { usePlanMeta, useGeneratePlan } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals, useToggleMealConsumed, useLogAlternativeMeal, useRegenerateMeal } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, ChevronRight, CheckCircle, Calendar, ChevronLeft, Check, X, Utensils, RefreshCw, Target, ShoppingBag, Flame } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function MealsPage() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const { data: user, isLoading: userLoading } = useUserProfile();
    const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
    const { data: meals = [], isLoading: mealsLoading } = useMeals(selectedDate);
    const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
    const { mutate: toggleConsumed } = useToggleMealConsumed();
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

    // Calculate totals
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

    if (userLoading || planLoading || isGenerating || mealsLoading) {
        return (
            <PageLayout
                header={
                    <div className="flex flex-col gap-1">
                        <div className="h-8 w-48 bg-secondary/30 rounded-lg animate-pulse" />
                        <div className="h-12 w-64 bg-secondary/50 rounded-lg animate-pulse mt-2" />
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    <div className="text-center space-y-2">
                        <h3 className="font-bold text-xl text-foreground">
                            {isGenerating ? "Preparing your AARA meals..." : "Synchronizing..."}
                        </h3>
                        <p className="text-sm text-muted-foreground animate-pulse font-medium">
                            {isGenerating ? "Finding the perfect Indian recipes for you." : "Fetching your meal plan."}
                        </p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (generationError || (!plan && !isGenerating)) {
        return (
            <PageLayout
                header={
                    <div>
                        <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-1">{format(selectedDate, 'EEEE, MMM d')}</p>
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Meals</h1>
                    </div>
                }
            >
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="wellness-card p-8 bg-card border-none shadow-xl max-w-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                            <X className="w-8 h-8 text-red-600" />
                        </div>
                        <h3 className="font-bold text-xl mb-2">Meals Unavailable</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                            {generationError || "I encountered an issue preparing your meals for today."}
                        </p>
                        <Button onClick={handleRetryGeneration} className="w-full h-14 rounded-full font-bold brand-gradient text-white shadow-lg border-none">
                            Retry Generation
                        </Button>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const dateStrip = Array.from({ length: 7 }, (_, i) => addDays(subDays(new Date(), 3), i));

    return (
        <PageLayout
            header={
                <div className="flex justify-between items-end">
                    <div>
                        <p className="text-[13px] font-semibold text-primary uppercase tracking-wider mb-1">
                            {isToday(selectedDate) ? "Today" : format(selectedDate, 'EEEE, MMM d')}
                        </p>
                        <h1 className="text-4xl font-semibold tracking-tight text-foreground">Meals</h1>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50"
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full w-10 h-10 border-none bg-card shadow-sm hover:bg-secondary/50"
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                        >
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            }
        >
            {/* Date Strip */}
            <div className="flex justify-between items-center mb-10 bg-card/50 backdrop-blur-sm p-2 rounded-[24px] border border-border/10 shadow-sm overflow-x-auto no-scrollbar">
                {dateStrip.map((date: Date) => {
                    const isSelected = format(date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
                    const isTodayDate = isToday(date);

                    return (
                        <button
                            key={date.toString()}
                            onClick={() => setSelectedDate(date)}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[54px] h-20 rounded-2xl transition-all duration-300 relative",
                                isSelected
                                    ? "brand-gradient text-white shadow-lg shadow-brand-blue/20 scale-105 z-10"
                                    : "text-muted-foreground hover:bg-secondary/40"
                            )}
                        >
                            <span className={cn("text-[10px] font-bold uppercase tracking-widest mb-1", isSelected ? "text-white/80" : "text-muted-foreground/60")}>
                                {format(date, 'EEE')}
                            </span>
                            <span className="text-xl font-black tracking-tighter">
                                {format(date, 'd')}
                            </span>
                            {isTodayDate && !isSelected && (
                                <div className="absolute bottom-2 w-1.5 h-1.5 rounded-full bg-primary shadow-sm shadow-primary/50" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Nutrition Highlights */}
            <div className="grid grid-cols-2 gap-4 mb-10">
                <div className="wellness-card p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-primary/20 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <Flame className="w-16 h-16 text-primary" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Logged Calories</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tighter">{totalCalories}</span>
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase">kcal</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/50 rounded-full mt-4 overflow-hidden">
                        <div
                            className="h-full brand-gradient transition-all duration-1000"
                            style={{ width: `${Math.min(100, (totalCalories / (plan?.caloriesTarget || 2000)) * 100)}%` }}
                        />
                    </div>
                </div>
                <div className="wellness-card p-6 flex flex-col items-center text-center shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
                    <div className="absolute top-0 right-0 p-3 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                        <Target className="w-16 h-16 text-indigo-500" />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Logged Protein</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black tracking-tighter">{totalProtein}</span>
                        <span className="text-xs font-bold text-muted-foreground/60 uppercase">g</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary/50 rounded-full mt-4 overflow-hidden">
                        <div
                            className="h-full bg-indigo-500 transition-all duration-1000"
                            style={{ width: `${Math.min(100, (totalProtein / (plan?.proteinTarget || 150)) * 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Meals List */}
            <div className="space-y-4 pb-20">
                <SectionHeader title="Today's Selections" />
                <AnimatePresence mode="popLayout">
                    {meals.length > 0 ? (
                        meals.map((meal: any) => (
                            <motion.div
                                key={meal.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            >
                                <button
                                    onClick={() => handleMealCardClick(meal.id)}
                                    className={cn(
                                        "w-full wellness-card p-5 flex items-center justify-between text-left transition-all duration-300 group shadow-sm",
                                        meal.isConsumed || meal.consumedAlternative
                                            ? "bg-emerald-50/20 border-emerald-100 shadow-emerald-100/10"
                                            : "hover:border-primary/20 bg-card"
                                    )}
                                >
                                    <div className="flex items-center gap-5">
                                        <div className={cn(
                                            "w-14 h-14 rounded-[20px] flex items-center justify-center transition-all duration-300 border",
                                            meal.isConsumed || meal.consumedAlternative
                                                ? "bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20"
                                                : "bg-primary/5 text-primary border-primary/10 group-hover:scale-105"
                                        )}>
                                            {meal.isConsumed || meal.consumedAlternative ? (
                                                <CheckCircle className="w-7 h-7" />
                                            ) : (
                                                <Utensils className="w-6 h-6" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.15em]">{meal.type}</span>
                                                {meal.consumedAlternative && (
                                                    <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Alternative Logged</span>
                                                )}
                                            </div>
                                            <h4 className="text-[17px] font-black leading-tight tracking-tight text-foreground group-hover:text-primary transition-colors">
                                                {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                            </h4>
                                            <div className="flex items-center gap-3 mt-1.5">
                                                <div className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground/70">
                                                    <Flame className="w-3.5 h-3.5" />
                                                    {meal.consumedAlternative ? meal.alternativeCalories : meal.calories} kcal
                                                </div>
                                                <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                <div className="flex items-center gap-1 text-[12px] font-bold text-muted-foreground/70">
                                                    <Target className="w-3.5 h-3.5" />
                                                    {meal.consumedAlternative ? meal.alternativeProtein : meal.protein}g protein
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {!(meal.isConsumed || meal.consumedAlternative) && (
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-secondary/30 opacity-0 group-hover:opacity-100 transition-all">
                                                <RefreshCw className="w-4 h-4 text-primary" />
                                            </div>
                                        )}
                                        <ChevronRight className={cn("w-5 h-5 transition-all text-muted-foreground/30 group-hover:translate-x-1 group-hover:text-primary")} />
                                    </div>
                                </button>
                            </motion.div>
                        ))
                    ) : (
                        <div className="wellness-card p-12 border-dashed flex flex-col items-center justify-center text-center bg-card/30 opacity-60">
                            <ShoppingBag className="w-12 h-12 text-muted-foreground/20 mb-4" />
                            <p className="text-sm font-bold text-muted-foreground uppercase tracking-[0.2em]">No meals planned for today</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            {/* Dialogs */}
            <Dialog open={showConsumptionPrompt} onOpenChange={handleCloseDialogs}>
                <DialogContent className="rounded-[40px] p-0 overflow-hidden border-none shadow-2xl max-w-sm">
                    <div className="p-10 pb-6 text-center">
                        <div className="w-24 h-24 rounded-[32px] bg-emerald-50 flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <Utensils className="w-12 h-12 text-emerald-500" />
                        </div>
                        <DialogTitle className="text-3xl font-black tracking-tighter mb-3">Time for {activeMeal?.type}?</DialogTitle>
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
                            variant="outline"
                            onClick={() => { setShowConsumptionPrompt(false); setShowRegenForm(true); }}
                            className="h-16 rounded-[24px] border-2 border-amber-500/10 hover:bg-amber-500/5 text-amber-600 text-[18px] font-black active:scale-[0.98] transition-all"
                        >
                            <RefreshCw className="w-5 h-5 mr-2" /> Different option
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={handleCloseDialogs}
                            className="mt-2 h-10 rounded-full text-muted-foreground font-bold hover:text-foreground"
                        >
                            Dismiss
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Alternative Form */}
            <Dialog open={showAlternativeForm} onOpenChange={handleCloseDialogs}>
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

            {/* Regeneration Form */}
            <Dialog open={showRegenForm} onOpenChange={handleCloseDialogs}>
                <DialogContent className="rounded-[40px] p-10 border-none shadow-2xl">
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
                            disabled={isRegeneratingMeal}
                        >
                            {isRegeneratingMeal ? (
                                <><Loader2 className="w-6 h-6 animate-spin mr-3" /> Re-optimizing...</>
                            ) : (
                                "Generate New Option"
                            )}
                        </Button>
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
