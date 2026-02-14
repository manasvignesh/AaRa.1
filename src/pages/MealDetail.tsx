import { useLocation, useRoute } from "wouter";
import { usePlanMeta } from "@/hooks/use-plans";
import { useMeals, useToggleMealConsumed, useRegenerateMeal, useLogAlternativeMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Check, RefreshCw, Loader2, X } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

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
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!meal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-secondary/30 gap-4">
        <p className="text-muted-foreground">Meal data not found.</p>
        <Button onClick={() => setLocation("/dashboard")} data-testid="button-return">Return to Dashboard</Button>
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
    const baseCalories = description.toLowerCase().includes('salad') ? 250 :
      description.toLowerCase().includes('pizza') ? 450 :
        description.toLowerCase().includes('burger') ? 550 :
          description.toLowerCase().includes('sandwich') ? 400 :
            description.toLowerCase().includes('rice') ? 350 :
              description.toLowerCase().includes('pasta') ? 450 :
                description.toLowerCase().includes('fruit') ? 150 :
                  description.toLowerCase().includes('snack') ? 200 :
                    description.toLowerCase().includes('dessert') ? 350 :
                      description.toLowerCase().includes('chicken') ? 350 :
                        description.toLowerCase().includes('fish') ? 300 :
                          description.toLowerCase().includes('soup') ? 200 :
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
  const loggedCalories = meal.consumedAlternative ? meal.alternativeCalories : meal.calories;
  const loggedProtein = meal.consumedAlternative ? meal.alternativeProtein : meal.protein;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b bg-card flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation(params?.date && params.date === format(new Date(), 'yyyy-MM-dd') ? "/dashboard" : "/meals")} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg capitalize">{meal.type}</h1>
          <p className="text-xs text-muted-foreground">{format(planDate, "MMM do")}</p>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-2xl mx-auto w-full space-y-6">
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <h2 className="text-3xl font-display font-bold text-foreground">{meal.name}</h2>
            {isLogged && (
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
                <Check className="w-4 h-4" /> Logged
              </span>
            )}
          </div>

          {meal.consumedAlternative && (
            <Card className="p-4 bg-amber-50 border-amber-200">
              <p className="text-sm text-amber-800">
                You logged: <strong>{meal.alternativeDescription}</strong>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Approx. {meal.alternativeCalories} cal, {meal.alternativeProtein}g protein
              </p>
            </Card>
          )}

          <div className="flex gap-4 flex-wrap">
            <div className="bg-secondary px-4 py-2 rounded-lg">
              <span className="block text-xl font-bold text-primary">{meal.calories}</span>
              <span className="text-xs text-muted-foreground font-bold uppercase">Planned Cal</span>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <span className="block text-xl font-bold text-blue-600">{meal.protein}g</span>
              <span className="text-xs text-blue-400 font-bold uppercase">Protein</span>
            </div>
            {meal.carbs && (
              <div className="bg-orange-50 px-4 py-2 rounded-lg">
                <span className="block text-xl font-bold text-orange-600">{meal.carbs}g</span>
                <span className="text-xs text-orange-400 font-bold uppercase">Carbs</span>
              </div>
            )}
            {meal.fats && (
              <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                <span className="block text-xl font-bold text-yellow-600">{meal.fats}g</span>
                <span className="text-xs text-yellow-600 font-bold uppercase">Fats</span>
              </div>
            )}
          </div>
        </div>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Ingredients</h3>
          <ul className="space-y-2">
            {meal.ingredients?.map((ing: any, i: number) => (
              <li key={i} className="flex items-center gap-2 text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {typeof ing === 'object' && ing !== null && 'item' in ing ? (
                  <span>{String((ing as any).item)} - {String((ing as any).amount)}</span>
                ) : (
                  String(ing)
                )}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Preparation</h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {meal.instructions || "No instructions provided."}
          </p>
        </Card>

        <div className="flex flex-col gap-4 pt-4 pb-12">
          {!isLogged ? (
            <>
              <Button
                size="lg"
                className="w-full h-14 text-lg bg-primary hover:bg-primary/90"
                disabled={isToggling}
                onClick={handleYesConsumed}
                data-testid="button-log-meal-direct"
              >
                {isToggling ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                I Ate This
              </Button>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => setShowConsumptionPrompt(true)}
              >
                More Options...
              </Button>

              <Dialog open={isRegenOpen} onOpenChange={setIsRegenOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full" data-testid="button-regenerate">
                    <RefreshCw className="mr-2 w-4 h-4" />
                    Regenerate: I don't like this / Change ingredients
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Regenerate Meal</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <p className="text-sm text-muted-foreground">
                      Tell us why you want to change this meal. We'll generate a new one that fits your macros.
                    </p>
                    <Textarea
                      placeholder="E.g., I don't have avocados, or I want something spicy..."
                      value={regenReason}
                      onChange={(e) => setRegenReason(e.target.value)}
                      className="mb-2"
                      data-testid="textarea-regen-reason"
                    />
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Available Ingredients (Optional)</label>
                      <Textarea
                        placeholder="E.g., eggs, bread, milk, chicken..."
                        value={availableIngredients}
                        onChange={(e) => setAvailableIngredients(e.target.value)}
                        data-testid="textarea-ingredients"
                      />
                    </div>
                    <Button
                      onClick={handleRegenerate}
                      disabled={isRegenerating || !regenReason}
                      className="w-full"
                      data-testid="button-generate-new"
                    >
                      {isRegenerating ? <Loader2 className="animate-spin mr-2" /> : null}
                      Generate New Option
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-14 text-lg"
              disabled={isToggling}
              onClick={() => toggleConsumed({ id: meal.id, isConsumed: false, date: dateStr })}
              data-testid="button-unlog"
            >
              {isToggling ? <Loader2 className="animate-spin" /> : "Undo Log"}
            </Button>
          )}
        </div>
      </main>

      <Dialog open={showConsumptionPrompt} onOpenChange={setShowConsumptionPrompt}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Did you eat this meal?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-muted-foreground">
              <strong>{meal.name}</strong> - {meal.calories} cal, {meal.protein}g protein
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleYesConsumed}
                disabled={isToggling}
                className="w-full h-12"
                data-testid="button-yes-consumed"
              >
                {isToggling ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
                Yes, I ate this
              </Button>
              <Button
                variant="outline"
                onClick={handleConsumedSomethingElse}
                className="w-full h-12"
                data-testid="button-ate-something-else"
              >
                <X className="mr-2 w-4 h-4" />
                No, I ate something else
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAlternativeForm} onOpenChange={setShowAlternativeForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>What did you eat instead?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Describe what you ate (e.g., 'chicken salad with dressing', 'two slices of pizza')"
              value={altDescription}
              onChange={(e) => setAltDescription(e.target.value)}
              className="min-h-[80px]"
              data-testid="textarea-alt-description"
            />

            <div className="space-y-2">
              <Label className="text-sm font-medium">Portion Size</Label>
              <RadioGroup
                value={altPortionSize}
                onValueChange={(v) => setAltPortionSize(v as "small" | "medium" | "large")}
                className="grid grid-cols-3 gap-3"
              >
                {[
                  { value: "small", label: "Small", desc: "Light portion" },
                  { value: "medium", label: "Medium", desc: "Regular portion" },
                  { value: "large", label: "Large", desc: "Generous serving" }
                ].map((opt) => (
                  <div key={opt.value}>
                    <RadioGroupItem value={opt.value} id={`alt-${opt.value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`alt-${opt.value}`}
                      className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-3 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="text-sm font-medium">{opt.label}</span>
                      <span className="text-xs text-muted-foreground">{opt.desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {showPreview && previewData && (
              <Card className="p-4 bg-secondary/50">
                <p className="text-sm font-medium">Estimated Values</p>
                <p className="text-lg font-bold text-primary">~{previewData.calories} calories</p>
                <p className="text-sm text-muted-foreground">~{previewData.protein}g protein</p>
                <p className="text-xs text-muted-foreground mt-2">
                  This is a rough estimate. We focus on the big picture, not exact numbers.
                </p>
              </Card>
            )}

            {!showPreview ? (
              <Button
                onClick={handleShowPreview}
                disabled={!altDescription.trim()}
                className="w-full"
                data-testid="button-preview"
              >
                Preview Estimate
              </Button>
            ) : (
              <Button
                onClick={handleConfirmAlternative}
                disabled={isLoggingAlt}
                className="w-full"
                data-testid="button-confirm-alt"
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
