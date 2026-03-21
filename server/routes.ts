import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { api } from "@shared/routes";
import { z } from "zod";
import { Request, Response, NextFunction } from "express";
import { openai } from "./replit_integrations/audio"; // Reuse openai client
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DailyPlanWithDetails, InsertDailyPlan, InsertMeal, InsertWorkout, InsertActivityLog, InsertGpsRoute } from "@shared/schema";
import { selectDeterministicMeals, selectBestMealForSlot } from "../src/api/diet";
import { getWorkoutForProfile, mapWorkoutDifficultyToDb, toWorkoutDbExercises } from "./data/workout-lib";
import { generatePersonalizedPlan } from "./data/engine";
import { calculateCategoryTargets, getWeightCategoryDisplayName } from "./services/planGenerator";
import { generateAiPlan } from "./services/aiPlan";

/**
 * Fetch nutrition data from API-Ninjas
 */
async function fetchNutritionInfo(query: string) {
  try {
    const apiKey = process.env.NUTRITION_API_KEY;
    if (!apiKey) {
      console.warn("[NUTRITION] No API key found in environment");
      return null;
    }

    const response = await fetch(`https://api.api-ninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`, {
      headers: { 'X-Api-Key': apiKey }
    });

    if (!response.ok) {
      console.error(`[NUTRITION] API Error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      console.log("[NUTRITION] No results found for query:", query);
      return null;
    }

    // Sum up nutrients if multiple items are returned
    const totals = data.reduce((acc: any, item: any) => ({
      calories: acc.calories + (item.calories || 0),
      protein: acc.protein + (item.protein_g || 0),
      carbs: acc.carbs + (item.carbohydrates_total_g || 0),
      fat: acc.fat + (item.fat_total_g || 0)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    console.log(`[NUTRITION] Success: ${totals.calories} kcal for query "${query}"`);
    return totals;
  } catch (err) {
    console.error("[NUTRITION] Fetch Exception:", err);
    return null;
  }
}

const generatedMealSchema = z.object({
  name: z.string().min(2),
  calories: z.number().int().min(50).max(1200),
  protein: z.number().int().min(1).max(120),
  carbs: z.number().int().min(0).max(200).optional().default(0),
  fats: z.number().int().min(0).max(120).optional().default(0),
  ingredients: z.array(z.string().min(1)).min(2).max(16),
  instructions: z.string().min(12).max(1200),
  description: z.string().max(240).optional().default(""),
});

function toJsonObject(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] ?? text;
  return JSON.parse(candidate.trim());
}

function normalizeIngredientsList(availableIngredients: string[] = []): string[] {
  return availableIngredients
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function registerRoutes(
  httpServer: Server,
  app: Express
): Server {
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.sendStatus(401);
  };

  // === USER PROFILE ===
  app.get(api.user.getProfile.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const profile = await storage.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json(profile);
    } catch (err: any) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.user.createProfile.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.user.createProfile.input.parse(req.body);

      const computed = calculateCategoryTargets({ ...input, userId } as any);
      const profile = await storage.createUserProfile({
        ...input,
        userId,
        bmi: computed.bmi,
        weightCategory: computed.weightCategory,
        bmiLastCalculated: new Date(),
      } as any);
      res.status(201).json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch(api.user.updateProfile.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.user.updateProfile.input.parse(req.body);

      const existing = await storage.getUserProfile(userId);
      const merged: any = { ...(existing || {}), ...(input || {}) };
      const computed = calculateCategoryTargets(merged);

      const profile = await storage.updateUserProfile(userId, {
        ...input,
        bmi: computed.bmi,
        weightCategory: computed.weightCategory,
        bmiLastCalculated: new Date(),
      } as any);

      // Recalculate targets for existing plans after profile update
      const todayStr = new Date().toISOString().split('T')[0];
      const plan = await storage.getDailyPlan(userId, todayStr);
      if (plan) {
        const { caloriesTarget, proteinTarget } = calculateCategoryTargets(profile as any);
        await storage.updateDailyPlanTargets(plan.id, caloriesTarget, proteinTarget);
      }

      res.json(profile);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.user.getStats.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });

      const weightHistory = await storage.getWeightHistory(userId);
      const recentPlans = await storage.getRecentPlansWithDetails(userId, 30);
      const gamification = await storage.getGamificationProfile(userId);

      // 1. Weight Change
      let weightChange = 0;
      if (weightHistory && weightHistory.length > 1) {
        const firstWeight = Number(weightHistory[weightHistory.length - 1].weight);
        const currentWeight = Number(weightHistory[0].weight);
        if (!isNaN(firstWeight) && !isNaN(currentWeight)) {
          weightChange = currentWeight - firstWeight;
        }
      }

      // 2. 7-Day Consistency Metrics
      const last7Days = recentPlans.slice(0, 7) || [];

      const caloriesAdherence = last7Days.length > 0
        ? last7Days.reduce((acc, p) => {
          const target = Number(p.caloriesTarget) || 0;
          const consumed = Number(p.caloriesConsumed) || 0;
          return acc + (target > 0 ? Math.min(100, (consumed / target) * 100) : 0);
        }, 0) / last7Days.length
        : 0;

      const proteinAdherence = last7Days.length > 0
        ? last7Days.reduce((acc, p) => {
          const target = Number(p.proteinTarget) || 0;
          const consumed = Number(p.proteinConsumed) || 0;
          return acc + (target > 0 ? Math.min(100, (consumed / target) * 100) : 0);
        }, 0) / last7Days.length
        : 0;

      const workoutCompletion = last7Days.length > 0
        ? last7Days.reduce((acc, p) => {
          const hasWorkout = (p.workouts?.length || 0) > 0;
          const anyDone = hasWorkout && p.workouts.some(w => w.isCompleted || w.type?.toLowerCase() === 'rest');
          return acc + (anyDone ? 1 : 0);
        }, 0) / last7Days.length * 100
        : 0;

      // 3. Streaks
      // Use gamification state for a true consecutive-day streak instead of plan completeness.
      const currentStreak = Number((gamification as any)?.currentStreak || 0);
      const bestStreak = Number((gamification as any)?.longestStreak || 0);

      res.json({
        currentWeight: Number(profile.currentWeight),
        weightChange: Number(weightChange.toFixed(1)),
        caloriesConsistency: Math.round(caloriesAdherence),
        proteinConsistency: Math.round(proteinAdherence),
        workoutConsistency: Math.round(workoutCompletion),
        currentStreak,
        streak: currentStreak,
        bestStreak
      });
    } catch (err) {
      console.error("Stats API Error:", err);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // === PLANS ===
  app.get(api.plans.getDaily.path, isAuthenticated, async (req, res) => {
    const userId = (req.user as any).id;
    const { date } = req.params;

    let plan = await storage.getDailyPlan(userId, date as string);

    if (!plan) {
      return res.status(404).json({ message: "Plan not found" });
    }

    res.json(plan);
  });

  app.get(api.plans.getMeta.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const { date } = req.params;
    console.log(`[API] GET Meta for user ${userId} on ${date}`);
    let plan = await storage.getDailyPlanMeta(userId, date);
    if (!plan) {
      console.log(`[API] Meta NOT FOUND for user ${userId} on ${date}`);
      return res.status(404).json({ message: "Plan not found" });
    }

    // Auto-heal legacy plans where targets were accidentally set to the sum of selected meals.
    // This prevents cases like ~490 kcal/day showing up in the UI.
    if ((plan.caloriesTarget || 0) < 800) {
      try {
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          const { caloriesTarget, proteinTarget } = calculateCategoryTargets(profile as any);
          plan = await storage.updateDailyPlanTargets(plan.id, caloriesTarget, proteinTarget);
        }
      } catch (err) {
        console.warn("[API] Failed to auto-refresh plan targets:", err);
      }
    }
    console.log(`[API] Meta FOUND: PlanID ${plan.id}`);
    res.json(plan);
  });

  app.get(api.plans.getMeals.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const { date } = req.params;
    console.log(`[API] GET Meals for user ${userId} on ${date}`);
    const plan = await storage.getDailyPlanMeta(userId, date);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    const meals = await storage.getPlanMeals(plan.id);
    console.log(`[API] Meals count for PlanID ${plan.id}: ${meals.length}`);
    res.json(meals);
  });

  app.get(api.plans.getWorkouts.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const { date } = req.params;
    console.log(`[API] GET Workouts for user ${userId} on ${date}`);
    const plan = await storage.getDailyPlanMeta(userId, date);
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    let workouts = await storage.getPlanWorkouts(plan.id);

    const isLegacyWorkoutRecord = (w: any) => {
      if (!w) return true;
      const ex = (w as any).exercises;
      const first = Array.isArray(ex) ? ex[0] : null;
      const instruction = first && typeof first === "object" ? String((first as any).instruction || "") : "";

      const looksLikeOldStepTemplate =
        !w.description &&
        Array.isArray(ex) &&
        ex.length >= 2 &&
        ex.every((e: any) => {
          const dur = Number(e?.duration);
          const instr = String(e?.instruction || "").toLowerCase();
          // Older fallback created 5-minute blocks with generic instruction text.
          return Number.isFinite(dur) && dur === 300 && instr.includes("perform as directed");
        });

      // Legacy placeholder created by older code paths.
      return (
        (!w.description &&
          Array.isArray(ex) &&
          ex.length <= 1 &&
          instruction.toLowerCase().includes("follow routine")) ||
        looksLikeOldStepTemplate
      );
    };

    // Auto-heal legacy placeholder workouts so new workout DB "sinks in"
    // without requiring the user to delete plans manually.
    if (workouts && workouts.length > 0 && isLegacyWorkoutRecord(workouts[0])) {
      try {
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          const dayNum = new Date(date).getDate();
          const template = getWorkoutForProfile(
            profile.age,
            profile.currentWeight,
            profile.targetWeight,
            profile.height,
            dayNum,
          );
          if (template) {
            const updated = await storage.updateWorkout(workouts[0].id, {
              type: ((template as any).workoutType || (template as any).workout_type || "strength") as any,
              name: (template as any).name,
              description: (template as any).description || null,
              duration: Number((template as any).durationMinutes || (template as any).duration_minutes || 30),
              difficulty: mapWorkoutDifficultyToDb((template as any).level || (template as any).difficulty),
              exercises: toWorkoutDbExercises(template as any),
            });
            workouts[0] = updated as any;
          }
        }
      } catch (err) {
        console.error("[API] Failed to auto-heal legacy workout:", err);
      }
    }

    // If no workouts exist for the plan, attempt to load deterministic workouts
    // from age group JSON files based on the user's profile/category.
    if ((!workouts || workouts.length === 0)) {
      try {
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          const dayNum = new Date(date).getDate();
          const template = getWorkoutForProfile(profile.age, profile.currentWeight, profile.targetWeight, profile.height, dayNum);
          if (template) {
            const exercises = toWorkoutDbExercises(template as any);

            const newWorkout = await storage.createWorkout({
              planId: plan.id,
              type: ((template as any).workoutType || (template as any).workout_type || "strength") as any,
              name: (template as any).name,
              description: (template as any).description || null,
              duration: Number((template as any).durationMinutes || (template as any).duration_minutes || 30),
              difficulty: mapWorkoutDifficultyToDb((template as any).level || (template as any).difficulty),
              exercises,
            });
            workouts = [newWorkout];
          }
        }
      } catch (err) {
        console.error("Failed to load library workouts:", err);
      }
    }
    console.log(`[API] Workouts count for PlanID ${plan.id}: ${workouts.length}`);
    res.json(workouts);
  });

  app.patch(api.plans.updateWater.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const { date, amount } = req.body;
    try {
      const updated = await storage.updateWaterIntake(userId, date, amount || 250);
      res.json(updated);
    } catch (err) {
      res.status(404).json({ message: "Plan not found" });
    }
  });

  app.post(api.plans.generate.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { date } = req.body;

      const profile = await storage.getUserProfile(userId);
      if (!profile) {
        return res.status(400).json({ message: "Complete profile first" });
      }

      console.log(`[GENERATION] Starting personalized plan generation for user ${userId} on ${date}`);

      // Check if plan already exists for today
      const existingFullPlan = await storage.getDailyPlan(userId, date);
      let existingHasMeals = Boolean(existingFullPlan?.meals && existingFullPlan.meals.length > 0);
      let existingHasWorkouts = Boolean(existingFullPlan?.workouts && existingFullPlan.workouts.length > 0);
      const existingLooksAiGenerated = Boolean(
        existingFullPlan?.meals?.some((meal) => String(meal.libraryMealId || "").startsWith("ai-generated")) ||
        existingFullPlan?.workouts?.some((workout) => String(workout.description || "").includes("AI-generated")),
      );

      if (existingFullPlan && process.env.GEMINI_API_KEY && !existingLooksAiGenerated) {
        console.log(`[GENERATION] Upgrading existing plan ${existingFullPlan.id} to AI-generated content`);
        await storage.clearPlanDetails(existingFullPlan.id);
        existingHasMeals = false;
        existingHasWorkouts = false;
      }

      if (existingFullPlan && existingHasMeals && existingHasWorkouts) {
        // Fix legacy plans that used meal-sum calories as "daily target".
        // Always ensure targets are based on the user's profile math.
        try {
          const { caloriesTarget, proteinTarget } = calculateCategoryTargets(profile as any);
          await storage.updateDailyPlanTargets(existingFullPlan.id, caloriesTarget, proteinTarget);
          const refreshed = await storage.getDailyPlan(userId, date);
          console.log(`[GENERATION] Returning existing plan ${existingFullPlan.id} for ${date} (targets refreshed)`);
          return res.status(200).json(refreshed ?? existingFullPlan);
        } catch (err) {
          console.warn("[GENERATION] Failed to refresh targets for existing plan:", err);
        }
        console.log(`[GENERATION] Returning existing plan ${existingFullPlan.id} for ${date}`);
        return res.status(200).json(existingFullPlan);
      }

      // If the plan already exists but is missing workouts, keep meals intact and
      // add a workout generated from the current workout library.
      if (existingFullPlan && existingHasMeals && !existingHasWorkouts) {
        try {
          const computedTargets = calculateCategoryTargets(profile as any);
          const { caloriesTarget, proteinTarget } = computedTargets;
          await storage.updateDailyPlanTargets(existingFullPlan.id, caloriesTarget, proteinTarget);

          const aiPlan = await generateAiPlan(profile as any);
          if (aiPlan?.workout) {
            await storage.createWorkout({
              planId: existingFullPlan.id,
              type: String(aiPlan.workout.workoutType || "strength") as any,
              name: aiPlan.workout.name,
              description: aiPlan.workout.description || null,
              duration: Math.round(Number(aiPlan.workout.durationMinutes || 30)),
              difficulty: mapWorkoutDifficultyToDb(aiPlan.workout.difficulty),
              exercises: toWorkoutDbExercises({
                id: "ai-generated",
                workout_name: aiPlan.workout.name,
                workout_type: aiPlan.workout.workoutType,
                primary_goal: [String(profile.primaryGoal || "maintain")],
                difficulty: aiPlan.workout.difficulty,
                duration_minutes: aiPlan.workout.durationMinutes,
                exercises: aiPlan.workout.exercises as any,
                warmup: aiPlan.workout.warmup,
                cooldown: aiPlan.workout.cooldown,
                suitable_for_categories: [computedTargets.weightCategory],
                name: aiPlan.workout.name,
                level: aiPlan.workout.difficulty,
                goal: [String(profile.primaryGoal || "maintain")],
                duration: String(aiPlan.workout.durationMinutes),
                suitableForCategories: [computedTargets.weightCategory],
                workoutType: aiPlan.workout.workoutType,
                durationMinutes: aiPlan.workout.durationMinutes,
              } as any),
            });

            const refreshed = await storage.getDailyPlan(userId, date);
            return res.status(201).json(refreshed ?? existingFullPlan);
          }

          const engineProfile = {
            goal:
              String(profile.primaryGoal || "").toLowerCase() === "fat_loss"
                ? "weight_loss"
                : String(profile.primaryGoal || "").toLowerCase() === "muscle_gain"
                  ? "weight_gain"
                  : "maintain",
            dietType:
              (() => {
                const d = String(profile.dietaryPreferences || "").trim().toLowerCase();
                if (["egg", "eggetarian"].includes(d)) return "veg";
                if (["non-veg", "nonveg", "non_veg", "non veg"].includes(d)) return "non_veg";
                return "veg";
              })(),
            regionPreference: profile.regionPreference || "north_indian",
            weightCategory: computedTargets.weightCategory as any,
            adjustments: {
              avoid: computedTargets.adjustments.avoid,
              prefer: computedTargets.adjustments.prefer,
            },
          };

          const pPlan = await generatePersonalizedPlan(engineProfile);
          if (pPlan.workout) {
            const durationMin =
              Number((pPlan.workout as any).durationMinutes || (pPlan.workout as any).duration_minutes || parseInt((pPlan.workout as any).duration)) ||
              30;
            await storage.createWorkout({
              planId: existingFullPlan.id,
              type: String((pPlan.workout as any).workoutType || (pPlan.workout as any).workout_type || "strength") as any,
              name: String((pPlan.workout as any).name || (pPlan.workout as any).workout_name || "Workout"),
              description: (pPlan.workout as any).description || null,
              duration: durationMin,
              difficulty: mapWorkoutDifficultyToDb((pPlan.workout as any).level || (pPlan.workout as any).difficulty),
              exercises: toWorkoutDbExercises(pPlan.workout as any),
            });
          }

          const refreshed = await storage.getDailyPlan(userId, date);
          return res.status(201).json(refreshed ?? existingFullPlan);
        } catch (err) {
          console.warn("[GENERATION] Failed to backfill workouts for existing plan:", err);
        }
      }

      // Mapping for Personalized Engine
      const mapGoal = (pg: string | null) => {
        if (!pg) {
          console.warn(`[GENERATION] Missing primaryGoal for user ${userId}, defaulting to 'maintain'`);
          return 'maintain';
        }
        if (pg === 'fat_loss') return 'weight_loss';
        if (pg === 'muscle_gain') return 'weight_gain';
        return 'maintain';
      };

      const mapDiet = (dp: string | null | undefined) => {
        const d = String(dp ?? "").trim().toLowerCase();

        // Keep the engine safe: if preference is missing/unknown, default to veg.
        if (!d) return "veg";

        // Common variants
        if (["veg", "vegetarian"].includes(d)) return "veg";

        // We don't have an "egg-only" meal library tier yet; map to veg so we never
        // accidentally serve meat-based meals to an eggetarian.
        if (["egg", "eggetarian"].includes(d)) return "veg";

        if (["non-veg", "nonveg", "non_veg", "non veg"].includes(d)) return "non_veg";

        // Fallback: be conservative.
        return "veg";
      };

      const computedTargets = calculateCategoryTargets(profile as any);
      const aiPlan = await generateAiPlan(profile as any);

      const engineProfile = {
        goal: mapGoal(profile.primaryGoal),
        dietType: mapDiet(profile.dietaryPreferences),
        regionPreference: profile.regionPreference || "north_indian",
        weightCategory: computedTargets.weightCategory,
        adjustments: {
          avoid: computedTargets.adjustments.avoid,
          prefer: computedTargets.adjustments.prefer,
        },
      };

      const fallbackPlan = await generatePersonalizedPlan(engineProfile);
      const pPlan = {
        breakfast: aiPlan?.breakfast ?? fallbackPlan?.breakfast ?? null,
        lunch: aiPlan?.lunch ?? fallbackPlan?.lunch ?? null,
        dinner: aiPlan?.dinner ?? fallbackPlan?.dinner ?? null,
        workout: aiPlan?.workout ?? fallbackPlan?.workout ?? null,
      };

      // Persistence: Save to database
      const existingPlanMeta = await storage.getDailyPlanMeta(userId, date);
      let targetPlan;

      // Daily targets should be based on the user's profile (TDEE/BMR + goal),
      // not the calories of whatever meals happened to be selected.
      const { caloriesTarget, proteinTarget } = computedTargets;

      if (existingPlanMeta) {
        // Update existing plan metadata
        targetPlan = await storage.updateDailyPlanTargets(existingPlanMeta.id, caloriesTarget, proteinTarget);
      } else {
        // Create new plan
        targetPlan = await storage.createDailyPlan({
          userId,
          date,
          caloriesTarget,
          proteinTarget,
          status: "active"
        });
      }

      const planId = targetPlan.id;

      // Save Meals
      const mealsToSave = [pPlan.breakfast, pPlan.lunch, pPlan.dinner].filter(Boolean);
      if (mealsToSave.length === 0) {
        throw new Error("No meals could be generated for this profile");
      }
      for (const m of mealsToSave) {
        await storage.createMeal({
          planId,
          type: (m as any).mealType,
          name: m.name,
          description: (m as any).description || null,
          calories: Math.round(Number(m.calories || 0)),
          protein: Math.round(Number(m.protein || 0)),
          carbs: Math.round(Number((m as any).carbs || 0)) || null,
          fats: Math.round(Number((m as any).fat || (m as any).fats || 0)) || null,
          fiber: Math.round(Number((m as any).fiber || 0)) || null,
          cookingMethod: String((m as any).cookingMethod || ""),
          libraryMealId: aiPlan ? `ai-generated-${String((m as any).mealType || "meal")}` : String((m as any).id || ""),
          suitableForCategories: (m as any).suitableForCategories || null,
          calorieDensity: (m as any).calorieDensity || null,
          glycemicLoad: (m as any).glycemicLoad || null,
          proteinPriority: Boolean((m as any).proteinPriority),
          isWeightLossFriendly: Boolean((m as any).isWeightLossFriendly),
          isMuscleGainFriendly: Boolean((m as any).isMuscleGainFriendly),
          isLowCalorie: Boolean((m as any).isLowCalorie),
          isHighFiber: Boolean((m as any).isHighFiber),
          ingredients: Array.isArray((m as any).ingredients) ? (m as any).ingredients : [m.name],
          instructions: String((m as any).instructions || `Simple ${String((m as any).mealType || "meal")} preparation.`),
        });
      }
      // Save Workout
      if (pPlan.workout) {
        try {
          const durationMin =
            Number((pPlan.workout as any).durationMinutes || (pPlan.workout as any).duration_minutes || parseInt((pPlan.workout as any).duration)) ||
            30;
          await storage.createWorkout({
            planId,
            type: String((pPlan.workout as any).workoutType || (pPlan.workout as any).workout_type || "strength") as any,
            name: String((pPlan.workout as any).name || (pPlan.workout as any).workout_name || "Workout"),
            description: aiPlan && aiPlan.workout
              ? `AI-generated workout. ${String((pPlan.workout as any).description || "")}`.trim()
              : (pPlan.workout as any).description || null,
            duration: durationMin,
            difficulty: mapWorkoutDifficultyToDb((pPlan.workout as any).level || (pPlan.workout as any).difficulty),
            exercises: toWorkoutDbExercises(pPlan.workout as any),
          });
        } catch (workoutError) {
          console.warn("[GENERATION] Workout generation failed but meals were created:", workoutError);
        }
      }
      const fullPlan = await storage.getDailyPlan(userId, date);
      console.log(`[GENERATION] Successfully generated and saved personalized plan ${planId} for user ${userId}`);
      res.status(201).json(fullPlan);

    } catch (error: any) {
      console.error("Personalized Plan generation error:", error);
      res.status(500).json({ message: "Failed to generate personalized plan", details: error?.message });
    }
  });

  // === MEALS ===
  app.patch(api.meals.toggleConsumed.path, isAuthenticated, async (req: any, res) => {
    const { isConsumed } = req.body;
    const id = parseInt(req.params.id);
    const meal = await storage.updateMeal(id, {
      isConsumed,
      consumedAlternative: false,
      alternativeDescription: null,
      alternativeCalories: null,
      alternativeProtein: null
    });
    res.json(meal);
  });

  // Log alternative meal (user ate something else)
  app.post(api.meals.logAlternative.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { description, portionSize } = api.meals.logAlternative.input.parse(req.body);

      // Fetch real nutrition data if possible
      const nutrition = await fetchNutritionInfo(`${portionSize} ${description}`);

      let estimatedCalories: number;
      let estimatedProtein: number;

      if (nutrition) {
        estimatedCalories = Math.round(nutrition.calories);
        estimatedProtein = Math.round(nutrition.protein);
      } else {
        // Fallback to estimation logic
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
                                350; // default estimate

        const multiplier = portionMultiplier[portionSize] || 1.0;
        estimatedCalories = Math.round(baseCalories * multiplier);
        estimatedProtein = Math.round(estimatedCalories * 0.15 / 4); // ~15% from protein
      }

      // Update meal with alternative data (replaces previous values)
      const meal = await storage.updateMeal(id, {
        isConsumed: false,
        consumedAlternative: true,
        alternativeDescription: description,
        alternativeCalories: estimatedCalories,
        alternativeProtein: estimatedProtein
      });

      res.json(meal);
    } catch (err) {
      console.error("Alternative meal error:", err);
      res.status(400).json({ message: "Invalid alternative meal data" });
    }
  });

  app.post(api.meals.regenerate.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const userId = (req.user as any).id;
    const parsedInput = api.meals.regenerate.input.safeParse(req.body);

    if (!parsedInput.success) {
      return res.status(400).json({ message: "Invalid meal optimization input." });
    }

    const { reason, availableIngredients = [] } = parsedInput.data;

    // 1. Get original meal to know targets
    const originalMeal = await storage.getMeal(id);
    if (!originalMeal) return res.status(404).json({ message: "Meal not found" });

    // 2. Get User Profile for preferences
    const profile = await storage.getUserProfile(userId);
    if (!profile) return res.status(400).json({ message: "Profile not found" });

    const pantry = normalizeIngredientsList(availableIngredients);
    const planMeta = await storage.getPlanMetaById(originalMeal.planId);
    const planMeals = await storage.getPlanMeals(originalMeal.planId);
    const otherMeals = planMeals.filter((meal) => meal.id !== originalMeal.id);
    const consumedCalories = otherMeals.reduce((sum, meal) => {
      if (meal.consumedAlternative) return sum + (meal.alternativeCalories || 0);
      if (meal.isConsumed) return sum + (meal.calories || 0);
      return sum;
    }, 0);
    const consumedProtein = otherMeals.reduce((sum, meal) => {
      if (meal.consumedAlternative) return sum + (meal.alternativeProtein || 0);
      if (meal.isConsumed) return sum + (meal.protein || 0);
      return sum;
    }, 0);
    const remainingCalories = planMeta
      ? Math.max((planMeta.caloriesTarget || 0) - consumedCalories, originalMeal.calories)
      : originalMeal.calories;
    const remainingProtein = planMeta
      ? Math.max((planMeta.proteinTarget || 0) - consumedProtein, originalMeal.protein)
      : originalMeal.protein;

    // 3. Get recent history to avoid repeating too soon
    const recentMeals = await storage.getRecentMealNames(userId, 20);

    if (process.env.GEMINI_API_KEY && pantry.length > 0) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const calorieTarget = Math.max(120, originalMeal.calories);
        const proteinTarget = Math.max(10, originalMeal.protein);
        const prompt = `
You are designing one Indian ${originalMeal.type} meal for AARA.

User requirements:
- Diet: ${profile.dietaryPreferences}
- Meal slot: ${originalMeal.type}
- Preferred ingredients to use: ${pantry.join(", ")}
- Avoid repeating recent meals: ${recentMeals.join(", ") || "none"}
- User note: ${reason || "No extra note provided"}
- Original meal being replaced: ${originalMeal.name}
- Target calories for this meal: about ${calorieTarget} kcal
- Target protein for this meal: at least ${proteinTarget} g
- Remaining day budget reference: ${remainingCalories} kcal and ${remainingProtein} g protein

Rules:
- Use the listed ingredients as the base pantry. You may add at most 3 common Indian staples if absolutely needed.
- Keep the meal realistic for a student/home kitchen.
- Match calories within about 15 percent of target.
- Try to meet or slightly exceed the protein target without becoming unrealistic.
- Respect the user's diet strictly.
- Return only valid JSON, no markdown.

JSON shape:
{
  "name": "string",
  "description": "short one-line summary",
  "calories": 320,
  "protein": 18,
  "carbs": 34,
  "fats": 10,
  "ingredients": ["item 1", "item 2"],
  "instructions": "2-4 concise steps"
}`;

        const result = await model.generateContent(prompt);
        const rawText = result.response.text();
        const aiMeal = generatedMealSchema.parse(toJsonObject(rawText));

        const updatedMeal = await storage.updateMeal(id, {
          name: aiMeal.name,
          description: aiMeal.description || `AI-optimized ${originalMeal.type} built from your available ingredients.`,
          calories: aiMeal.calories,
          protein: aiMeal.protein,
          carbs: aiMeal.carbs ?? 0,
          fats: aiMeal.fats ?? 0,
          ingredients: aiMeal.ingredients,
          instructions: aiMeal.instructions,
          isConsumed: false,
          consumedAlternative: false,
          alternativeDescription: null,
          alternativeCalories: null,
          alternativeProtein: null,
          feedback: reason || null,
        });

        return res.json(updatedMeal);
      } catch (error) {
        console.error("[MEAL_REGEN] Gemini optimization failed, falling back to library swap:", error);
      }
    }

    // 4. Deterministic "Next Best" selection
    try {
      console.log(`[MEAL_REGEN] Deterministic rebuild for meal ${id} (${originalMeal.type})`);

      const excludeNames = new Set([originalMeal.name]);
      const nextBest = selectBestMealForSlot(
        profile.dietaryPreferences,
        profile.age,
        originalMeal.type,
        excludeNames,
        recentMeals
      );

      if (!nextBest) {
        return res.status(404).json({
          status: "error",
          message: "No alternative Indian meals found for this slot and calorie tier.",
          reason: "NO_ALTERNATIVES"
        });
      }

      const updatedMeal = await storage.updateMeal(id, {
        name: nextBest.name,
        description: pantry.length
          ? `Fallback meal picked for ${originalMeal.type} after pantry optimization could not be generated.`
          : "Fallback meal picked from the AARA meal library.",
        calories: nextBest.calories,
        protein: nextBest.protein,
        carbs: nextBest.carbs ?? 0,
        fats: nextBest.fats ?? 0,
        ingredients: [nextBest.prep],
        instructions: "Follow traditional Indian home-style preparation. Keep oil minimal. Garnish with fresh coriander if available.",
        isConsumed: false // reset
      });

      console.log(`[MEAL_REGEN] Successfully replaced meal ${id} with ${nextBest.name}`);
      res.json(updatedMeal);

    } catch (error) {
      console.error("Meal regeneration error:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to select an alternative meal.",
        reason: "INTERNAL_ERROR"
      });
    }
  });

  // === WORKOUTS ===
  app.get(api.workouts.get.path, isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const userId = (req.user as any).id;
    const workout = await storage.getWorkoutWithPlan(id);

    if (!workout || workout.plan.userId !== userId) {
      return res.status(404).json({ message: "Workout not found" });
    }
    res.json(workout);
  });

  app.patch(api.workouts.complete.path, isAuthenticated, async (req: any, res) => {
    const { isCompleted, feedback } = req.body;
    const id = parseInt(req.params.id);
    const workout = await storage.updateWorkout(id, { isCompleted, feedback });
    res.json(workout);
  });

  // === WEIGHT ===
  app.post(api.weight.log.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const input = api.weight.log.input.parse(req.body);

    const log = await storage.logWeight({ ...input, userId });
    res.status(201).json(log);
  });

  app.get(api.weight.getHistory.path, isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const history = await storage.getWeightHistory(userId);
    res.json(history);
  });

  // === MANUAL MEALS ===
  app.post(api.manualMeals.log.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.manualMeals.log.input.parse(req.body);

      // Fetch real nutrition data if possible
      const nutrition = await fetchNutritionInfo(`${input.portionSize} ${input.description}`);

      let estimatedCaloriesMin: number;
      let estimatedCaloriesMax: number;
      let estimatedProtein: number;

      if (nutrition) {
        estimatedCaloriesMin = Math.round(nutrition.calories * 0.9);
        estimatedCaloriesMax = Math.round(nutrition.calories);
        estimatedProtein = Math.round(nutrition.protein);
      } else {
        // Fallback to conservative range estimation
        const portionMultiplier: Record<string, number> = { small: 0.7, medium: 1.0, large: 1.4 };
        const baseCalories = input.mealType === 'meal' ? 500 : 200;
        const multiplier = portionMultiplier[input.portionSize];

        estimatedCaloriesMin = Math.round(baseCalories * multiplier * 0.8);
        estimatedCaloriesMax = Math.round(baseCalories * multiplier * 1.3);
        estimatedProtein = Math.round((baseCalories * multiplier * 0.15) / 4); // ~15% from protein
      }

      const meal = await storage.createManualMeal({
        ...input,
        estimatedCaloriesMin,
        estimatedCaloriesMax,
        estimatedProtein
      });

      // Gentle adaptation: activate 3-day adaptation period if not already active
      const currentPlan = await storage.getPlanMetaById(input.planId);
      if (currentPlan && !currentPlan.adaptationActive) {
        await storage.activateAdaptation(input.planId, 3);
      }

      res.status(201).json(meal);
    } catch (err) {
      console.error("Manual meal error:", err);
      res.status(400).json({ message: "Invalid manual meal data" });
    }
  });

  // === WORKOUT SESSIONS ===
  app.post("/api/workouts/:id/start", isAuthenticated, async (req: any, res) => {
    const workoutId = parseInt(req.params.id);
    const userId = (req.user as any).id;

    const workout = await storage.getWorkout(workoutId);
    if (!workout) return res.status(404).json({ message: "Workout not found" });

    // If there's an existing in-progress session, reuse it (prevents duplicates on refresh).
    const existing = await storage.getWorkoutSession(workoutId);
    if (existing && existing.userId === userId && existing.status === "in_progress") {
      return res.status(200).json(existing);
    }

    const session = await storage.createWorkoutSession({
      workoutId,
      userId,
      status: 'in_progress',
      startedAt: new Date(),
      currentPhase: 'warmup',
      currentExerciseIndex: 0
    });

    res.status(201).json(session);
  });

  app.patch("/api/workout-sessions/:id", isAuthenticated, async (req: any, res) => {
    const id = parseInt(req.params.id);
    const updates = req.body;

    if (updates.status === 'completed') {
      updates.completedAt = new Date();
    }

    const session = await storage.updateWorkoutSession(id, updates);
    res.json(session);
  });

  // === WEIGHT TRACKING ===
  app.get("/api/weight/history", isAuthenticated, async (req: any, res) => {
    const userId = (req.user as any).id;
    const history = await storage.getWeightHistory(userId);
    res.json(history);
  });

  app.post("/api/weight", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { weight, date } = req.body;

      if (!weight || !date) {
        return res.status(400).json({ message: "Weight and date are required" });
      }

      const log = await storage.logWeight({ userId, weight, date });

      const previousProfile = await storage.getUserProfile(userId);
      const oldCategory = String((previousProfile as any)?.weightCategory ?? "");

      // Update profile's current weight + BMI/category (recalculated on each weight log)
      const merged: any = { ...(previousProfile || {}), currentWeight: weight };
      const computed = calculateCategoryTargets(merged);
      const updatedProfile = await storage.updateUserProfile(userId, {
        currentWeight: weight,
        bmi: computed.bmi,
        weightCategory: computed.weightCategory,
        bmiLastCalculated: new Date(),
      } as any);

      // Category transition rewards (XP + badge)
      const newCategory = String((updatedProfile as any)?.weightCategory ?? computed.weightCategory);
      let categoryChanged = false;
      let earnedXp = 0;
      let earnedBadge: string | null = null;

      if (oldCategory && newCategory && oldCategory !== newCategory) {
        categoryChanged = true;

        const g = await storage.getGamificationProfile(userId);
        const currentBadges = new Set<string>((g as any).badges || []);
        if (!currentBadges.has("category_unlocked")) {
          currentBadges.add("category_unlocked");
          earnedBadge = "category_unlocked";
        }

        earnedXp = 200;
        await storage.updateGamification(userId, {
          xp: (g.xp || 0) + earnedXp,
          level: Math.floor(((g.xp || 0) + earnedXp) / 1000) + 1,
          badges: Array.from(currentBadges),
          lastActiveDate: date,
        });
      }

      res.status(201).json({
        ...log,
        categoryChanged,
        oldCategory,
        newCategory,
        earnedXp,
        earnedBadge,
        bmi: computed.bmi,
        weightCategory: computed.weightCategory,
      });
    } catch (err) {
      console.error("Weight log error:", err);
      res.status(400).json({ message: "Failed to log weight" });
    }
  });

  // === AI COACH CHAT ===
  app.get("/api/coach/messages", isAuthenticated, async (req: any, res) => {
    try {
      const conversation = await storage.getCoachConversation(req.user.id);
      const messages = await storage.getConversationMessages(conversation.id);
      res.json(messages);
    } catch (err: any) {
      console.error("Failed to fetch coach messages:", err);
      res.status(500).json({ message: "Failed to fetch coach messages" });
    }
  });

  app.post("/api/coach/chat", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const { message, conversationHistory = [] } = req.body;
      const isProduction = process.env.NODE_ENV === "production";

      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        const missingKeyMessage = "AI Coach is not configured. Set GEMINI_API_KEY in your deployment environment.";
        if (isProduction) {
          return res.status(500).json({ message: missingKeyMessage });
        }
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.write(`data: ${JSON.stringify({ error: missingKeyMessage })}\n\n`);
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
        return;
      }

      // Get user context
      const profile = await storage.getUserProfile(userId);
      const todayStr = new Date().toISOString().split('T')[0];
      const plan = await storage.getDailyPlan(userId, todayStr);
      const categoryContext = profile ? calculateCategoryTargets(profile as any) : null;
      const phaseName = categoryContext
        ? getWeightCategoryDisplayName(categoryContext.weightCategory)
        : null;

      // Build context for the coach
      const userContext = profile ? `
 User Profile:
 - Name: ${profile.displayName || 'Unnamed User'}
 - Age: ${profile.age}, Gender: ${profile.gender}
 - Goals: ${profile.primaryGoal?.replace('_', ' ')} (Pace: ${profile.weeklyGoalPace})
 - Weight: Current ${profile.currentWeight}kg, Target ${profile.targetWeight}kg
 - Phase: ${phaseName || 'Unknown'} (BMI: ${categoryContext?.bmi ?? 'N/A'})
 - Health Metrics: Sleep ${profile.sleepDuration}hrs, Stress ${profile.stressLevel}
 - Lifestyle: Activity ${profile.activityLevel}, Diet ${profile.dietaryPreferences}
 - Coaching Preferences: Tone ${profile.coachingTone}, Frequency ${profile.reminderFrequency}
` : '';

      const planContext = plan ? `
Today's Plan (${todayStr}):
- Energy: ${plan.caloriesConsumed || 0} / ${plan.caloriesTarget} kcal
- Protein: ${plan.proteinConsumed || 0} / ${plan.proteinTarget} g
- Consistency: ${plan.meals?.filter((m: any) => m.isConsumed).length || 0} meals, ${plan.workouts?.filter((w: any) => w.isCompleted).length || 0} sessions
` : '';

      const systemPrompt = `# AI Coach System Instructions

## Role & Identity
You are AI Coach, a professional fitness and wellness guide.
Your tone is ${profile?.coachingTone || 'supportive'}.
You behave like a world-class health coach: expert, empathetic, and results-oriented.

## Core Objective
Help the user stay consistent by translating complex health data into simple, actionable steps.
Prioritize long-term health and sustainable habits over quick fixes.

## User Context
${userContext}
${planContext}

## Weight Category Guidance (Indian BMI cutoffs)
- Current BMI: ${categoryContext?.bmi ?? 'N/A'} (${phaseName || 'Unknown Phase'})
- Category-specific daily calories: ${categoryContext?.caloriesTarget ?? 'N/A'} kcal
- Protein priority: ${categoryContext ? `${categoryContext.adjustments.protein_per_kg}g/kg` : 'N/A'}
- Notes: ${categoryContext?.adjustments.notes ?? ''}
${categoryContext?.adjustments?.show_doctor_notice ? "- Safety: Encourage consulting a doctor/dietitian alongside app use.\n" : ""}

Constraints you MUST follow:
- Never recommend calorie restriction for underweight users.
- Never recommend deep-fried or sugary foods for overweight/obese/severely_obese users.
- When suggesting meals: only suggest meals compatible with the user's diet AND aligned with their weight category preferences (high-fiber/high-protein/low calorie density where appropriate).

## Coaching Logic
1. Analyze: Check sleep, stress, and adherence data first.
2. Prioritize: Address the biggest bottleneck (usually sleep or protein).
3. Recommend: Give 1-2 practical actions based on their ${profile?.coachingTone} preference.

Rules:
- High Stress/Low Sleep: Recommend recovery and light movement, not PRs.
- Muscle Gain Goal: Emphasize protein surplus and progressive overload.
- Fat Loss Goal: Focus on consistency and NEAT, not extreme deficits.

## Communication Style
- Language: Professional, clear, and grounded.
- Tone: ${profile?.coachingTone || 'supportive'}.
- No gamified or playful language. No motivational clichÃ©s.
- Address the user by name: ${profile?.displayName || 'there'}.
- Keep responses concise (2-4 sentences).

## Boundaries
- No medical diagnoses.
- No extreme or unsafe advice.
- Stay within your user's diet (${profile?.dietaryPreferences}) and lifestyle.`;

      const sendCoachPayload = (payload: { content?: string; error?: string; done?: boolean; fullResponse?: string }) => {
        if (isProduction) {
          return res.json(payload);
        }
        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/event-stream");
          res.setHeader("Cache-Control", "no-cache");
          res.setHeader("Connection", "keep-alive");
        }
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
        if (payload.done || payload.error) {
          res.end();
        }
        return undefined;
      };

      // === HARDENED GEMINI INTEGRATION ===
      console.log("--- Gemini API Call Started ---");
      console.log("GEMINI_API_KEY check:", process.env.GEMINI_API_KEY ? "EXISTS" : "MISSING");

      // 0. Persistence Prep
      const conversation = await storage.getCoachConversation(req.user.id);

      // Save user message to DB
      await storage.createMessage({
        conversationId: conversation.id,
        role: "user",
        content: message
      });

      // 1. Try a small set of models for compatibility across keys/projects.
      const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

      // 2. Input MUST be passed using contents
      const contents = [
        {
          role: "user",
          parts: [{ text: `System Instructions: ${systemPrompt}\n\nContext understood. Now answer this user message.` }]
        },
        {
          role: "model",
          parts: [{ text: "Understood. I am AaRa Coach and will strictly follow your guidelines and user context." }]
        }
      ];

      // Add conversation history to contents
      conversationHistory.forEach((m: any) => {
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        });
      });

      // Add final user message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      console.log("Gemini Request Payload (contents):", JSON.stringify(contents, null, 2));

      try {
        // 3. Call Gemini (fallback across models if one isn't available for this key)
        let result: any = null;
        let lastErr: any = null;
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
        for (const name of modelNames) {
          try {
            const model = genAI.getGenerativeModel({ model: name });
            result = await model.generateContent({ contents });
            lastErr = null;
            break;
          } catch (e) {
            lastErr = e;
          }
        }
        if (!result) throw lastErr || new Error("Gemini call failed");

        console.log("Gemini Response Metadata:", JSON.stringify({
          candidatesCount: result.response.candidates?.length,
          promptFeedback: result.response.promptFeedback
        }, null, 2));

        // 4. Response text MUST be extracted manually from candidates
        let text = "";
        try {
          if (result.response.candidates && result.response.candidates.length > 0) {
            text = result.response.candidates[0].content.parts[0].text || "";
          }
        } catch (extractError) {
          console.error("Manual extraction failed, trying result.response.text():", extractError);
          text = result.response.text(); // Resilient fallback
        }

        if (!text) {
          throw new Error("Gemini returned an empty response candidate.");
        }

        console.log("Gemini Response Text (First 100 chars):", text.substring(0, 100) + "...");

        // Save assistant message to DB
        await storage.createMessage({
          conversationId: conversation.id,
          role: "assistant",
          content: text
        });

        // Return JSON in production; SSE in development.
        sendCoachPayload({ content: text, done: true, fullResponse: text });

      } catch (geminiError: any) {
        // 5. Errors (full stack trace)
        console.error("!! GEMINI API FATAL ERROR !!");
        console.error("Stack trace:", geminiError.stack);
        console.error("Full Error Object:", JSON.stringify(geminiError, (key, value) => {
          if (key === 'stack') return undefined; // Already logged
          return value;
        }, 2));

        throw geminiError; // Re-throw to be caught by outer catch
      }

      console.log("--- Gemini API Call Completed Successfully ---");

      } catch (err: any) {
        console.error("Coach chat route catch block triggered:", err.message);

      // 6. Fallback message on failure
      const detail = err?.message ? ` (${String(err.message)})` : "";
      const fallbackMessage = `AI Coach is temporarily unavailable. Please try again.${detail}`;

      if (isProduction) {
        res.status(500).json({ message: fallbackMessage });
      } else if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: fallbackMessage })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ message: fallbackMessage });
      }
    }
  });

  // === WALK & RUN ===

  app.post("/api/activity/sync", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const input = req.body;
      // Basic validation
      if (input.steps === undefined || input.date === undefined) {
        return res.status(400).json({ message: "Steps and date are required" });
      }

      // 1. Log Activity
      const activity = await storage.logActivity({ ...input, userId });

      // 2. Gamification Logic
      let gamification = await storage.getGamificationProfile(userId);
      const newBadges: string[] = [];
      const today = String(input.date);
      const previousActiveDate = String((gamification as any).lastActiveDate || "");

      const parseDateUtc = (dateStr: string) => {
        const d = new Date(`${dateStr}T00:00:00Z`);
        return Number.isNaN(d.getTime()) ? null : d;
      };

      const diffDays = (a: string, b: string) => {
        const da = parseDateUtc(a);
        const db = parseDateUtc(b);
        if (!da || !db) return null;
        return Math.round((da.getTime() - db.getTime()) / 86400000);
      };

      // XP Calculation (Simplified)
      const stepsXp = (activity.steps || 0) * 0.1;
      const distXp = (activity.distance || 0) * 0.2; // meters
      let addedXp = Math.floor(stepsXp + distXp);

      // Prevent infinite XP farming by checking daily cap or diff?
      // For MVP, simplistic accumulation is fine, but typically we'd diff against previous sync.
      // Better approach: Recalculate Total XP from scratch or just add 'daily' XP?
      // Let's go with: Total XP = Cumulative. 
      // Issue: If client syncs 100 steps, then 110 steps, we shouldn't add 100 + 110 XP.
      // We should only awards based on the delta, OR simplistic: Levels are based on Lifetime Stats.
      // Since we defined XP in UserGamification, let's just add a fixed amount for "Activity" for now,
      // or assume the client sends the *delta*? No, client sends total for the day.
      // Correct Logic: 
      // We need a history of Total Steps to calculate Total XP accurately.
      // For now: Just give flat XP for hitting milestones to keep it simple.
      // Or: Update XP = (Total Steps / 10). This is idempotent.
      // Let's do Idempotent XP based on current level progress.

      const totalXp = (gamification.xp || 0) + 10; // Nominal reward for syncing

      // Check Badges (Daily)
      const currentBadges = new Set(gamification.badges || []);
      if ((activity.steps || 0) >= 5000) newBadges.push("5k_club");
      if ((activity.steps || 0) >= 10000) newBadges.push("10k_club");

      const earnedBadges = newBadges.filter(b => !currentBadges.has(b));
      if (earnedBadges.length > 0) {
        earnedBadges.forEach(b => currentBadges.add(b));
      }

      // Level Logic
      let level = Math.floor(totalXp / 1000) + 1;

      // Real streak logic:
      // - Same day: preserve current streak.
      // - Consecutive day: increment.
      // - Gap of more than one day: reset to 1 on the next active day.
      let currentStreak = Number((gamification as any).currentStreak || 0);
      let longestStreak = Number((gamification as any).longestStreak || 0);
      const dayGap = previousActiveDate ? diffDays(today, previousActiveDate) : null;
      if (!previousActiveDate) {
        currentStreak = 1;
      } else if (dayGap === 0) {
        // Same day sync, keep current streak as-is.
      } else if (dayGap === 1) {
        currentStreak = currentStreak + 1;
      } else if (dayGap && dayGap > 1) {
        currentStreak = 1;
      }
      longestStreak = Math.max(longestStreak, currentStreak);

      // Update Gamification
      gamification = await storage.updateGamification(userId, {
        xp: totalXp,
        level,
        currentStreak,
        longestStreak,
        lastActiveDate: input.date,
        badges: Array.from(currentBadges)
      });

      res.json({ activity, gamification, earnedBadges });
    } catch (err) {
      console.error("Activity sync error:", err);
      res.status(500).json({ message: "Failed to sync activity" });
    }
  });

  app.get("/api/activity/today", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const activity = await storage.getTodayActivity(userId);
      const gamification = await storage.getGamificationProfile(userId);
      res.json({ activity: activity || null, gamification });
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch activity" });
    }
  });

  app.post("/api/routes", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req.user as any).id;
      const route = await storage.saveGpsRoute({ ...req.body, userId });
      res.json(route);
    } catch (err) {
      console.error("Route save error:", err);
      res.status(500).json({ message: "Failed to save route" });
    }
  });

  app.get("/api/leaderboard", isAuthenticated, async (req: any, res) => {
    try {
      const type = req.query.type === 'distance' ? 'distance' : 'steps';
      const leaderboard = await storage.getLeaderboard(type, 20);
      res.json(leaderboard);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  return httpServer;
}

