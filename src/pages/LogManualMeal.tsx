import { useState } from "react";
import { useLocation } from "wouter";
import { usePlanMeta } from "@/hooks/use-plans";
import { useLogManualMeal } from "@/hooks/use-meals";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Loader2, Check, UtensilsCrossed } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

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
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">All Set!</h2>
          <p className="text-muted-foreground">
            We've roughly accounted for this meal.
            No stress — we'll adapt gently over the next few days.
          </p>
          <Button className="w-full" onClick={() => setLocation("/dashboard")} data-testid="button-done">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b bg-card flex items-center gap-4 sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/dashboard")} data-testid="button-back">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="font-semibold text-lg">Log Outside Meal</h1>
          <p className="text-xs text-muted-foreground">Had something not on your plan?</p>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-lg mx-auto w-full">
        <Card className="p-6 mb-6 bg-blue-50/50 border-blue-100">
          <div className="flex gap-3">
            <UtensilsCrossed className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              It's okay to eat outside your plan. Just describe what you had —
              we'll estimate gently and adapt your plan over the next few days. No judgment.
            </p>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="description">What did you eat?</Label>
            <Input
              id="description"
              placeholder="e.g., Pizza slice, burger, ice cream..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-description"
            />
            <p className="text-xs text-muted-foreground">Just a simple description is fine. No need to be precise.</p>

            {/* Calorie Estimation Preview */}
            {description.trim().length > 2 && (
              <Card className="p-3 mt-3 bg-amber-50/50 border-amber-200">
                <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                  💡 Estimated: {(() => {
                    const d = description.toLowerCase();
                    const estimates: Record<string, { cal: number; protein: number }> = {
                      pizza: { cal: 280, protein: 12 },
                      burger: { cal: 550, protein: 25 },
                      fries: { cal: 365, protein: 4 },
                      ice: { cal: 270, protein: 5 },
                      cake: { cal: 350, protein: 4 },
                      cookie: { cal: 150, protein: 2 },
                      chips: { cal: 250, protein: 3 },
                      soda: { cal: 140, protein: 0 },
                      chocolate: { cal: 230, protein: 3 },
                      biryani: { cal: 450, protein: 18 },
                      samosa: { cal: 260, protein: 5 },
                      naan: { cal: 260, protein: 8 },
                      pasta: { cal: 400, protein: 12 },
                      rice: { cal: 200, protein: 4 },
                      sandwich: { cal: 350, protein: 15 },
                      salad: { cal: 150, protein: 5 },
                    };

                    let cal = 300, protein = 10; // default
                    for (const [key, vals] of Object.entries(estimates)) {
                      if (d.includes(key)) {
                        cal = vals.cal;
                        protein = vals.protein;
                        break;
                      }
                    }

                    const multiplier = portionSize === 'small' ? 0.7 : portionSize === 'large' ? 1.4 : 1;
                    const mealMultiplier = mealType === 'meal' ? 1.5 : 1;

                    return `~${Math.round(cal * multiplier * mealMultiplier)} kcal, ${Math.round(protein * multiplier * mealMultiplier)}g protein`;
                  })()}
                </p>
                <p className="text-xs text-amber-700 mt-1">This is a rough estimate. We'll adjust your plan accordingly.</p>
              </Card>
            )}
          </div>

          <div className="space-y-3">
            <Label>Portion Size</Label>
            <RadioGroup
              value={portionSize}
              onValueChange={(v) => setPortionSize(v as "small" | "medium" | "large")}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { value: "small", label: "Small", desc: "Light bite" },
                { value: "medium", label: "Medium", desc: "Regular portion" },
                { value: "large", label: "Large", desc: "Generous serving" }
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                  <Label
                    htmlFor={opt.value}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <span className="text-sm font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>What was it?</Label>
            <RadioGroup
              value={mealType}
              onValueChange={(v) => setMealType(v as "snack" | "meal")}
              className="grid grid-cols-2 gap-3"
            >
              {[
                { value: "snack", label: "Snack", desc: "Something light" },
                { value: "meal", label: "Full Meal", desc: "A proper meal" }
              ].map((opt) => (
                <div key={opt.value}>
                  <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                  <Label
                    htmlFor={opt.value}
                    className="flex flex-col items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <span className="font-medium">{opt.label}</span>
                    <span className="text-xs text-muted-foreground">{opt.desc}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full h-14"
            disabled={isPending || !description.trim()}
            data-testid="button-log-meal"
          >
            {isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log This Meal"}
          </Button>
        </form>
      </main>
    </div>
  );
}
