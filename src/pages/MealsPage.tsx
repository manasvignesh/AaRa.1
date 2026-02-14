import { useEffect, useState } from "react";
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
import { Loader2, Plus, ChevronRight, CheckCircle, Calendar, ChevronLeft, Check, X, Utensils, RefreshCw } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
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
        // Only auto-trigger if we have NO plan, NO local error, and NOT currently generating
        if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
            console.log("MealsPage: Triggering auto-plan generation for", user.userId);
            generatePlan(selectedDate, {
                onError: (err: any) => {
                    setGenerationError(err.message || "Failed to generate your plan. Please try again.");
                }
            });
        }
    }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

    // Reset error when date changes
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
            <div className="flex flex-col md:flex-row min-h-screen bg-secondary/30">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <div className="text-center">
                        <h3 className="font-semibold text-lg">
                            {isGenerating ? "Preparing your Indian-inspired meals..." : "Loading your meals..."}
                        </h3>
                    </div>
                </main>
            </div>
        );
    }

    if (generationError || (!plan && !isGenerating)) {
        return (
            <div className="flex flex-col md:flex-row min-h-screen bg-secondary/30">
                <Navigation />
                <main className="flex-1 flex flex-col items-center justify-center gap-6 p-6 max-w-md mx-auto text-center">
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                        <X className="w-8 h-8 text-red-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-xl">Something went wrong</h3>
                        <p className="text-muted-foreground mt-2">
                            {generationError || "I couldn't prepare your meals for today."}
                        </p>
                    </div>
                    <Button size="lg" className="w-full" onClick={handleRetryGeneration}>
                        Retry Generation
                    </Button>
                </main>
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row min-h-screen bg-secondary/30">
            <Navigation />

            <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 overflow-y-auto">
                <header className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
                            <Utensils className="w-6 h-6 text-primary" />
                            Meals
                        </h1>
                        <Link href="/log-meal">
                            <Button size="sm" variant="outline" className="gap-2">
                                <Plus className="w-4 h-4" /> Log Manual
                            </Button>
                        </Link>
                    </div>

                    <div className="flex items-center justify-center gap-4 bg-card p-3 rounded-2xl shadow-sm border border-border">
                        <button
                            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground" />
                        </button>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="font-semibold">
                                {isToday(selectedDate) ? "Today" : format(selectedDate, "EEE, MMM d")}
                            </span>
                        </div>
                        <button
                            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                            className="p-2 hover:bg-secondary rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>
                </header>

                {plan && (
                    <Card className="p-4 mb-6 bg-gradient-to-br from-primary/5 to-primary/10 border-none">
                        <div className="flex justify-around text-center">
                            <div>
                                <p className="text-2xl font-bold text-primary">{totalCalories}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Consumed</p>
                            </div>
                            <div className="w-px bg-border" />
                            <div>
                                <p className="text-2xl font-bold text-foreground">{plan.caloriesTarget}</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Target</p>
                            </div>
                            <div className="w-px bg-border" />
                            <div>
                                <p className="text-2xl font-bold text-blue-600">{totalProtein}g</p>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Protein</p>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Grouped Meals by Type */}
                {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                    const typeMeals = meals.filter((m: any) => m.type?.toLowerCase() === mealType);
                    if (typeMeals.length === 0) return null;

                    const mealTypeConfig: Record<string, { label: string; icon: string; color: string }> = {
                        breakfast: { label: '🌅 Breakfast', icon: '☀️', color: 'from-orange-50 to-amber-50 border-orange-200' },
                        lunch: { label: '🍽️ Lunch', icon: '🌤️', color: 'from-green-50 to-green-100 border-green-200' },
                        dinner: { label: '🌙 Dinner', icon: '🌆', color: 'from-blue-50 to-blue-100 border-blue-200' },
                        snack: { label: '🍎 Snack', icon: '✨', color: 'from-teal-50 to-cyan-50 border-teal-200' },
                    };

                    const config = mealTypeConfig[mealType] || { label: mealType, icon: '🍴', color: 'from-gray-100 to-gray-50 border-gray-200' };

                    return (
                        <div key={mealType} className="mb-6">
                            {/* Section Header */}
                            <div className={cn(
                                "px-4 py-3 rounded-lg mb-3 bg-gradient-to-r border",
                                config.color
                            )}>
                                <h2 className="text-lg font-bold text-foreground">{config.label}</h2>
                            </div>

                            {/* Meals in this category */}
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {typeMeals.map((meal: any, index: number) => {
                                        const isLogged = meal.isConsumed || meal.consumedAlternative;
                                        return (
                                            <motion.div
                                                key={meal.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <Card
                                                    onClick={() => handleMealCardClick(meal.id)}
                                                    className={cn(
                                                        "p-4 cursor-pointer transition-all hover:shadow-md active:scale-[0.99] border-l-4",
                                                        isLogged ? "border-l-primary bg-primary/5" : "border-l-gray-200 hover:border-l-primary"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {isLogged && <CheckCircle className="w-4 h-4 text-primary" />}
                                                            </div>
                                                            <h3 className="font-semibold text-foreground line-clamp-1">
                                                                {meal.consumedAlternative ? meal.alternativeDescription : meal.name}
                                                            </h3>
                                                            <div className="flex gap-3 mt-1 text-sm text-muted-foreground">
                                                                {meal.consumedAlternative ? (
                                                                    <>
                                                                        <span>~{meal.alternativeCalories} kcal</span>
                                                                        <span>~{meal.alternativeProtein}g protein</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <span>{meal.calories} kcal</span>
                                                                        <span>{meal.protein}g protein</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                                    </div>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    );
                })}
            </main>

            <Dialog open={showConsumptionPrompt} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Did you eat this meal?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        {activeMeal && (
                            <p className="text-muted-foreground">
                                <strong>{activeMeal.name}</strong> - {activeMeal.calories} cal, {activeMeal.protein}g protein
                            </p>
                        )}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleYesConsumed}
                                disabled={isToggling}
                                className="w-full h-12"
                            >
                                {isToggling ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                                Yes, I ate this
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowConsumptionPrompt(false); setShowRegenForm(true); }}
                                className="w-full h-12"
                                data-testid="button-regenerate-trigger"
                            >
                                <RefreshCw className="mr-2 w-4 h-4" />
                                Regenerate / Change Meal
                            </Button>
                            <Link href={activeMeal ? `/meal/${format(selectedDate, 'yyyy-MM-dd')}/${activeMeal.id}` : "#"}>
                                <Button variant="ghost" className="w-full text-muted-foreground">
                                    View full details
                                </Button>
                            </Link>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showRegenForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate Meal</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <p className="text-sm text-muted-foreground">
                            We'll swap this meal for something else that fits your daily plan.
                        </p>
                        <div className="space-y-2">
                            <Label>Reason (Optional)</Label>
                            <Textarea
                                placeholder="E.g. I don't like this, or I want something faster..."
                                value={regenReason}
                                onChange={(e) => setRegenReason(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>What ingredients do you have? (Optional)</Label>
                            <Textarea
                                placeholder="E.g. Eggs, spinach, bread..."
                                value={availableIngredients}
                                onChange={(e) => setAvailableIngredients(e.target.value)}
                            />
                        </div>
                        <Button
                            onClick={handleRegenerate}
                            disabled={isRegeneratingMeal}
                            className="w-full h-12"
                        >
                            {isRegeneratingMeal ? <Loader2 className="animate-spin mr-2" /> : <RefreshCw className="mr-2 w-4 h-4" />}
                            Generate New Meal
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={showAlternativeForm} onOpenChange={(open) => !open && handleCloseDialogs()}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>What did you eat instead?</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Textarea
                            placeholder="Describe what you ate..."
                            value={altDescription}
                            onChange={(e) => setAltDescription(e.target.value)}
                            className="min-h-[80px]"
                        />

                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Portion Size</Label>
                            <RadioGroup
                                value={altPortionSize}
                                onValueChange={(v) => setAltPortionSize(v as "small" | "medium" | "large")}
                                className="grid grid-cols-3 gap-3"
                            >
                                {[
                                    { value: "small", label: "Small" },
                                    { value: "medium", label: "Medium" },
                                    { value: "large", label: "Large" }
                                ].map((opt) => (
                                    <div key={opt.value}>
                                        <RadioGroupItem value={opt.value} id={`meals-${opt.value}`} className="peer sr-only" />
                                        <Label
                                            htmlFor={`meals-${opt.value}`}
                                            className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                                        >
                                            <span className="text-sm font-medium">{opt.label}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {showPreview && previewData && (
                            <Card className="p-4 bg-secondary/50">
                                <p className="text-lg font-bold text-primary">~{previewData.calories} calories</p>
                                <p className="text-sm text-muted-foreground">~{previewData.protein}g protein</p>
                            </Card>
                        )}

                        {!showPreview ? (
                            <Button
                                onClick={handleShowPreview}
                                disabled={!altDescription.trim()}
                                className="w-full"
                            >
                                Preview Estimate
                            </Button>
                        ) : (
                            <Button
                                onClick={handleConfirmAlternative}
                                disabled={isLoggingAlt}
                                className="w-full"
                            >
                                {isLoggingAlt ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                                Confirm and Log
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

