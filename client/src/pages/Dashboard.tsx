import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Droplets, Footprints, Loader2, Plus, Trophy, Zap } from "lucide-react";

import { usePlanMeta, useGeneratePlan, useUpdateWater, useWorkouts } from "@/hooks/use-plans";
import { useUserProfile } from "@/hooks/use-user";
import { useMeals } from "@/hooks/use-meals";
import { PageLayout, SectionHeader } from "@/components/PageLayout";
import { MacroRing } from "@/components/MacroRing";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Dashboard() {
  const [selectedDate] = useState(new Date());
  const { data: user, isLoading: userLoading } = useUserProfile();
  const { data: plan, isLoading: planLoading } = usePlanMeta(selectedDate);
  const { data: meals = [] } = useMeals(selectedDate);
  const { data: workouts = [] } = useWorkouts(selectedDate);
  const { mutate: generatePlan, isPending: isGenerating } = useGeneratePlan();
  const { mutate: updateWater } = useUpdateWater();
  const [generationError, setGenerationError] = useState<string | null>(null);

  const caloriesProgress = meals.reduce((sum: number, meal: any) => {
    if (meal.consumedAlternative) return sum + (meal.alternativeCalories || 0);
    if (meal.isConsumed) return sum + (meal.calories || 0);
    return sum;
  }, 0);

  const proteinProgress = meals.reduce((sum: number, meal: any) => {
    if (meal.consumedAlternative) return sum + (meal.alternativeProtein || 0);
    if (meal.isConsumed) return sum + (meal.protein || 0);
    return sum;
  }, 0);

  useEffect(() => {
    if (!userLoading && user && !planLoading && !plan && !isGenerating && !generationError) {
      generatePlan(selectedDate, {
        onError: (err: any) => setGenerationError(err.message || "Failed to generate plan."),
      });
    }
  }, [plan, planLoading, isGenerating, selectedDate, generatePlan, user, userLoading, generationError]);

  if (userLoading || (planLoading && !plan) || isGenerating) {
    return (
      <PageLayout>
        <div className="page-transition flex min-h-[70vh] items-center justify-center">
          <div className="wellness-card flex flex-col items-center gap-4 p-8">
            <Loader2 className="h-8 w-8 animate-spin text-brand" />
            <p style={{ color: "var(--text-secondary)" }}>Syncing your plan...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  const caloriesTarget = plan?.caloriesTarget || 2000;
  const proteinTarget = plan?.proteinTarget || 150;
  const remainingCalories = Math.max(0, caloriesTarget - caloriesProgress);

  return (
    <PageLayout
      header={
        <div className="flex items-start justify-between">
          <div className="animate-slide-up">
            <p className="section-label mb-2">{format(selectedDate, "EEEE, MMM do")}</p>
            <h1 className="font-display brand-gradient-text text-4xl">
              Hello, {user?.displayName || "Athlete"}
            </h1>
            <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
              Your wellness dashboard is ready for today.
            </p>
          </div>
          <ThemeToggle />
        </div>
      }
    >
      <div className="space-y-6 page-transition">
        <section className="wellness-card animate-slide-up p-6">
          <div className="grid items-center gap-6 md:grid-cols-[140px_1fr]">
            <MacroRing
              caloriesTarget={caloriesTarget}
              caloriesCurrent={caloriesProgress}
              proteinTarget={proteinTarget}
              proteinCurrent={proteinProgress}
              size={130}
            />
            <div className="space-y-5">
              <div>
                <div className="section-label mb-2">Calories Remaining</div>
                <div className="font-display text-5xl">{Math.round(remainingCalories)}</div>
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="section-label">Protein Goal</span>
                  <span style={{ color: "var(--text-secondary)" }}>{Math.round(proteinProgress)}g / {proteinTarget}g</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: `${Math.min(100, (proteinProgress / proteinTarget) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="animate-slide-up grid gap-4 md:grid-cols-3">
          <div className="metric-card stagger-1">
            <div className="section-label mb-3">Hydration</div>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-display text-3xl">{plan?.waterIntake || 0} ml</div>
              <Droplets className="h-5 w-5 text-brand" />
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost flex-1" onClick={() => updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: -250 })}>-250</button>
              <button className="btn-primary flex-1" onClick={() => updateWater({ date: format(selectedDate, "yyyy-MM-dd"), amount: 250 })}>+250</button>
            </div>
          </div>
          <div className="metric-card stagger-2">
            <div className="section-label mb-3">Steps</div>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-3xl">8,204</div>
              <Footprints className="h-5 w-5 text-brand" />
            </div>
            <div className="progress-bar"><div className="progress-bar-fill" style={{ width: "82%" }} /></div>
          </div>
          <div className="metric-card stagger-3">
            <div className="section-label mb-3">Streak</div>
            <div className="mb-4 flex items-center justify-between">
              <div className="font-display text-3xl">12 days</div>
              <Trophy className="h-5 w-5 text-brand" />
            </div>
            <span className="pill-green">On track</span>
          </div>
        </section>

        <section className="animate-slide-up space-y-4">
          <SectionHeader
            title="Today's Plan"
            action={
              <Link href="/log-meal">
                <button className="btn-primary">
                  <Plus className="h-4 w-4" />
                  Quick Log
                </button>
              </Link>
            }
          />
          <div className="grid gap-4">
            {meals.slice(0, 3).map((meal: any, index: number) => (
              <Link key={meal.id} href={`/meal/${format(selectedDate, "yyyy-MM-dd")}/${meal.id}`}>
                <div className={`wellness-card cursor-pointer p-5 ${["stagger-1", "stagger-2", "stagger-3"][index]}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="section-label mb-2">{meal.type}</div>
                      <h3 className="font-display text-2xl">{meal.name}</h3>
                      <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                        {meal.calories} kcal · {meal.protein}g protein
                      </p>
                    </div>
                    <span className={meal.isConsumed ? "pill-green" : "pill-brand"}>{meal.isConsumed ? "Logged" : "Planned"}</span>
                  </div>
                </div>
              </Link>
            ))}
            {meals.length === 0 && <div className="wellness-card p-6" style={{ color: "var(--text-secondary)" }}>No meals generated yet.</div>}
          </div>
        </section>

        <section className="animate-slide-up space-y-4">
          <SectionHeader title="Training" />
          {workouts.length > 0 ? (
            <Link href={`/workout/${workouts[0].id}`}>
              <div className="wellness-card stagger-4 cursor-pointer p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="section-label mb-2">Workout</div>
                    <h3 className="font-display text-2xl">{workouts[0].name}</h3>
                    <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {workouts[0].difficulty} · {workouts[0].duration} min
                    </p>
                  </div>
                  <button className="btn-primary">
                    <Zap className="h-4 w-4" />
                    Start
                  </button>
                </div>
              </div>
            </Link>
          ) : (
            <div className="wellness-card p-6" style={{ color: "var(--text-secondary)" }}>Rest day. No workout assigned yet.</div>
          )}
        </section>
      </div>
    </PageLayout>
  );
}
