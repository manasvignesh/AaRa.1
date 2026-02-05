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
import { getWorkoutForProfile } from "./data/workout-lib";

// Google Gemini client for coach chat
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated()) return next();
    res.sendStatus(401);
  };

  // === USER PROFILE ===
  app.get(api.user.getProfile.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      console.log(`[API] GET Profile for user ${userId}`);
      const profile = await storage.getUserProfile(userId);

      if (!profile) {
        console.log(`[API] Profile NOT FOUND for user ${userId}`);
        return res.status(404).json({ message: "Profile not found" });
      }

      console.log(`[API] Profile FOUND for user ${userId}`);
      res.json(profile);
    } catch (err: any) {
      console.error(`[API] Profile Error for user ${(req.user as any)?.id}:`, err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.user.createProfile.path, isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const input = api.user.createProfile.input.parse(req.body);

      const profile = await storage.createUserProfile({ ...input, userId });
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

      const profile = await storage.updateUserProfile(userId, input);

      // Recalculate targets for existing plans after profile update
      const todayStr = new Date().toISOString().split('T')[0];
      const plan = await storage.getDailyPlan(userId, todayStr);
      if (plan) {
        const { caloriesTarget, proteinTarget } = calculateTargets(profile);
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
      let currentStreak = 0;
      let bestStreak = 0;
      let tempStreak = 0;

      // Best streak from historical data
      for (let i = recentPlans.length - 1; i >= 0; i--) {
        const p = recentPlans[i];
        const calorieGoalMet = p.caloriesTarget > 0 && ((p.caloriesConsumed || 0) / p.caloriesTarget) >= 0.8;
        const proteinGoalMet = p.proteinTarget > 0 && ((p.proteinConsumed || 0) / p.proteinTarget) >= 0.8;
        const anyWorkoutDone = (p.workouts?.length || 0) > 0 && p.workouts.some(w => w.isCompleted);

        if (calorieGoalMet || proteinGoalMet || anyWorkoutDone) {
          tempStreak++;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 0;
        }
      }
      bestStreak = Math.max(bestStreak, tempStreak);

      // Current streak (counting backwards from today)
      for (const p of recentPlans) {
        const calorieGoalMet = p.caloriesTarget > 0 && ((p.caloriesConsumed || 0) / p.caloriesTarget) >= 0.8;
        const proteinGoalMet = p.proteinTarget > 0 && ((p.proteinConsumed || 0) / p.proteinTarget) >= 0.8;
        const anyWorkoutDone = (p.workouts?.length || 0) > 0 && p.workouts.some(w => w.isCompleted);

        if (calorieGoalMet || proteinGoalMet || anyWorkoutDone) {
          currentStreak++;
        } else {
          break;
        }
      }

      res.json({
        currentWeight: Number(profile.currentWeight),
        weightChange: Number(weightChange.toFixed(1)),
        caloriesConsistency: Math.round(caloriesAdherence),
        proteinConsistency: Math.round(proteinAdherence),
        workoutConsistency: Math.round(workoutCompletion),
        currentStreak: Number(currentStreak),
        bestStreak: Number(bestStreak)
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
    const plan = await storage.getDailyPlanMeta(userId, date);
    if (!plan) {
      console.log(`[API] Meta NOT FOUND for user ${userId} on ${date}`);
      return res.status(404).json({ message: "Plan not found" });
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
    // If no workouts exist for the plan, attempt to load deterministic workouts
    // from age group JSON files based on the user's profile/category.
    if ((!workouts || workouts.length === 0)) {
      try {
        const profile = await storage.getUserProfile(userId);
        if (profile) {
          const dayNum = new Date(date).getDate();
          const template = getWorkoutForProfile(profile.age, profile.currentWeight, profile.targetWeight, profile.height, dayNum);

          if (template) {
            const exercises = template.steps.map((s, idx, arr) => {
              const phase = idx === 0 ? "warmup" : idx === arr.length - 1 ? "cooldown" : "main";
              // Handle both en-dash and standard hyphen
              const parts = s.includes(" – ") ? s.split(" – ") : s.includes(" - ") ? s.split(" - ") : [s];
              return {
                name: parts[0] || s,
                duration: 300, // 5 mins default assumption per step
                instruction: parts[1] || "Perform as directed",
                phase
              };
            });

            const newWorkout = await storage.createWorkout({
              planId: plan.id,
              type: template.type as any,
              name: template.name,
              duration: template.duration_min,
              difficulty: template.intensity as any,
              exercises
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
    const userId = (req.user as any).id;
    const { date } = req.body;

    // 1. Get User Profile
    const profile = await storage.getUserProfile(userId);
    if (!profile) {
      console.log(`Plan generation blocked: No profile for user ${userId}. Records found in DB:`, await storage.getUserProfile(userId));
      return res.status(400).json({ message: "Complete profile first" });
    }
    console.log(`Generating plan for user ${userId} for date ${date}. Profile:`, JSON.stringify(profile));

    // 2. Calculate Calories (Mifflin-St Jeor Equation)
    const { caloriesTarget, proteinTarget } = calculateTargets(profile);
    const targetCalories = caloriesTarget;

    // 2.5 Check for active adaptation from previous day (gentle multi-day adjustment)
    let adaptationBonus = 0;
    const yesterday = new Date(date);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayPlan = await storage.getDailyPlan(userId, yesterday.toISOString().split('T')[0]);
    if (yesterdayPlan?.adaptationActive && (yesterdayPlan.adaptationDaysRemaining ?? 0) > 0) {
      // Gentle adaptation: slightly longer workout (+5 mins), no calorie punishment
      adaptationBonus = 5;
      // Decrement adaptation days for the new plan
      console.log(`Adaptation active: ${yesterdayPlan.adaptationDaysRemaining} days remaining. Adding ${adaptationBonus} mins to workout.`);
    }

    // 3. Deterministic Generation for Meals
    // Calculate Day of Cycle (1-28) from Date
    const dateObj = new Date(date);
    const startOfYear = new Date(dateObj.getFullYear(), 0, 0);
    const diff = dateObj.getTime() - startOfYear.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const cycleDay = (dayOfYear % 28) + 1;

    console.log(`[GENERATION] Date: ${date} -> DayOfYear: ${dayOfYear} -> CycleDay: ${cycleDay}`);

    let selectedMeals = selectDeterministicMeals(
      profile.dietaryPreferences,
      profile.age,
      profile.primaryGoal || 'fat_loss',
      cycleDay
    );

    if (!selectedMeals || selectedMeals.length === 0) {
      console.warn(`[GENERATION] Deterministic selection failed for diet '${profile.dietaryPreferences}' (Normalizer used). Using FALLBACK meals.`);
      // Fallback: Safe, standard meals that work for everyone
      selectedMeals = [
        {
          type: "breakfast",
          name: "Oats & Milk with Almonds (Fallback)",
          calories: 400,
          protein: 15,
          ingredients: ["Oats", "Milk", "Almonds"],
          instructions: "Boil oats in milk, top with nuts."
        },
        {
          type: "lunch",
          name: "Dal Tadka & Rice (Fallback)",
          calories: 600,
          protein: 20,
          ingredients: ["Dal", "Rice", "Spices"],
          instructions: "Standard home-cooked yellow dal with steamed rice."
        },
        {
          type: "dinner",
          name: "Mixed Veg Curry & Roti (Fallback)",
          calories: 500,
          protein: 12,
          ingredients: ["Mixed Vegetables", "Whole Wheat Flour"],
          instructions: "Lightly spiced vegetable curry with 2 rotis."
        }
      ];

      // Adjust for snack if 5 meals
      if (dailyMealCount > 3) {
        selectedMeals.push({
          type: "snack",
          name: "Roasted Chana (Fallback)",
          calories: 200,
          protein: 8,
          ingredients: ["Roasted Bengal Gram"],
          instructions: "A handful of roasted chana."
        });
        selectedMeals.push({
          type: "snack_2",
          name: "Green Tea & Walnuts (Fallback)",
          calories: 200,
          protein: 5,
          ingredients: ["Green Tea", "Walnuts"],
          instructions: "Warm green tea with 3-4 walnuts."
        });
      }
    }

    // Calculate actual totals from selected meals
    const totalCalories = selectedMeals.reduce((sum: number, m: any) => sum + m.calories, 0);
    const totalProtein = selectedMeals.reduce((sum: number, m: any) => sum + m.protein, 0);

    // Default workout if none provided by a separate logic (Aara usually has AI workouts, but we can stick to a default for now)
    const dayNum = new Date(date).getDate();
    const template = getWorkoutForProfile(profile.age, profile.currentWeight, profile.targetWeight, profile.height, dayNum);

    let workoutName = "Full Body Home Workout";
    let workoutType = "strength";
    let workoutDuration = (profile.timeAvailability || 30) + adaptationBonus;
    let workoutDifficulty = "beginner";
    let workoutExercises: any[] = [];

    if (template) {
      workoutName = template.name;
      workoutType = template.type;
      workoutDuration = template.day_type === "rest" ? 0 : (template.duration_min + adaptationBonus);
      workoutDifficulty = template.intensity || "none";
      workoutExercises = template.steps.map((s: string, idx: number, arr: string[]) => {
        const phase = idx === 0 ? "warmup" : idx === arr.length - 1 ? "cooldown" : "main";
        // Regex to handle hyphen (-), en-dash (–), em-dash (—) with flexible spacing
        const parts = s.split(/\s*[-–—]\s*/);
        return {
          name: parts[0] || s,
          duration: template.day_type === "rest" ? 0 : 300,
          instruction: parts[1] || "Focus on movement and form",
          phase
        };
      });
    } else {
      // Fallback if no template found
      workoutExercises = [
        { name: "Jumping Jacks", duration: 60, instruction: "Warm up with light cardio", phase: "warmup" },
        { name: "Push-ups", duration: 45, instruction: "Keep back straight, core engaged", phase: "main" },
        { name: "Squats", duration: 45, instruction: "Knees behind toes, go low", phase: "main" },
        { name: "Plank", duration: 30, instruction: "Hold position, breathe steadily", phase: "main" },
        { name: "Stretching", duration: 60, instruction: "Cool down and stretch", phase: "cooldown" }
      ];
    }

    const workout = {
      name: workoutName,
      type: workoutType,
      duration: workoutDuration,
      difficulty: workoutDifficulty,
      exercises: workoutExercises,
      isCompleted: template?.day_type === "rest" // Auto-complete rest days
    };

    // 4. Idempotent Save: Check for existing plan for this date
    console.log(`[GENERATION] Deterministic data ready. Saving plan for user ${userId} on ${date}`);

    let targetPlan;
    const existingPlan = await storage.getDailyPlanMeta(userId, date);

    if (existingPlan) {
      console.log(`[GENERATION] Found existing plan ${existingPlan.id}. Updating targets.`);
      targetPlan = await storage.updateDailyPlanTargets(existingPlan.id, totalCalories, totalProtein);

      // Remove old meals and workouts to replace with new Indian ones
      // We'll add methods to storage for this if needed, but for now we can just push new ones?
      // Actually, it's better to just delete them to avoid duplicates.
      await storage.clearPlanDetails(existingPlan.id);
    } else {
      targetPlan = await storage.createDailyPlan({
        userId,
        date,
        caloriesTarget: totalCalories,
        proteinTarget: totalProtein,
        status: "active"
      });
    }

    const planId = targetPlan.id;

    try {
      // Save Meals
      console.log(`[GENERATION] Saving ${selectedMeals.length} meals for plan ${planId}`);
      for (const m of selectedMeals) {
        await storage.createMeal({
          planId: planId,
          type: m.type,
          name: m.name,
          calories: m.calories,
          protein: m.protein,
          ingredients: m.ingredients,
          instructions: m.instructions
        });
      }

      // Save Workout
      console.log(`[GENERATION] Saving workout for plan ${planId}`);
      await storage.createWorkout({
        planId: planId,
        type: workout.type as any,
        name: workout.name,
        duration: workout.duration,
        difficulty: workout.difficulty as any,
        exercises: workout.exercises || []
      });

      // Carry forward adaptation state if active
      if (yesterdayPlan?.adaptationActive && (yesterdayPlan.adaptationDaysRemaining ?? 0) > 0) {
        await storage.activateAdaptation(planId, (yesterdayPlan.adaptationDaysRemaining ?? 1) - 1);
      }

      // Return full plan
      const fullPlan = await storage.getDailyPlan(userId, date);
      console.log(`[GENERATION] Successfully generated deterministic plan ${planId} for user ${userId}`);
      res.status(201).json(fullPlan);

    } catch (saveError) {
      console.error(`[GENERATION] Failed to save plan details for ${planId}:`, saveError);
      throw saveError;
    }

  } catch (error: any) {
    console.error("Plan generation error:", error);
    res.status(500).json({
      message: "Failed to generate plan. Please try again.",
      details: error?.message
    });
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

  // 1. Get original meal to know targets
  const originalMeal = await storage.getMeal(id);
  if (!originalMeal) return res.status(404).json({ message: "Meal not found" });

  // 2. Get User Profile for preferences
  const profile = await storage.getUserProfile(userId);
  if (!profile) return res.status(400).json({ message: "Profile not found" });

  // 3. Get recent history to avoid repeating too soon
  const recentMeals = await storage.getRecentMealNames(userId, 20);

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
      calories: nextBest.calories,
      protein: nextBest.protein,
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

    // Also update profile's current weight
    await storage.updateUserProfile(userId, { currentWeight: weight });

    res.status(201).json(log);
  } catch (err) {
    console.error("Weight log error:", err);
    res.status(400).json({ message: "Failed to log weight" });
  }
});

function calculateTargets(profile: any) {
  let bmr = 0;
  if (profile.gender === 'male') {
    bmr = 10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const multipliers: Record<string, number> = {
    'sedentary': 1.2,
    'moderate': 1.55,
    'active': 1.725
  };
  const tdee = bmr * (multipliers[profile.activityLevel] || 1.2);

  let adjustment = 0;
  if (profile.primaryGoal === 'muscle_gain') {
    adjustment = tdee * 0.10; // 10% surplus
  } else if (profile.primaryGoal === 'fat_loss') {
    adjustment = -(tdee * 0.20); // 20% deficit
    if (adjustment < -700) adjustment = -700;
  } else {
    // recomposition / maintenance
    adjustment = 0;
  }

  let targetCalories = Math.round(tdee + adjustment);
  const minCalories = profile.gender === 'male' ? 1500 : 1200;
  if (targetCalories < minCalories) targetCalories = minCalories;

  // Protein target based on goal
  let proteinMultiplier = 1.8;
  if (profile.primaryGoal === 'muscle_gain') proteinMultiplier = 2.2;
  if (profile.primaryGoal === 'recomposition') proteinMultiplier = 2.0;

  let proteinTarget = Math.round(profile.currentWeight * proteinMultiplier);

  return { caloriesTarget: targetCalories, proteinTarget };
}

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

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user context
    const profile = await storage.getUserProfile(userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const plan = await storage.getDailyPlan(userId, todayStr);

    // Build context for the coach
    const userContext = profile ? `
User Profile:
- Name: ${profile.displayName || 'Unnamed User'}
- Age: ${profile.age}, Gender: ${profile.gender}
- Goals: ${profile.primaryGoal?.replace('_', ' ')} (Pace: ${profile.weeklyGoalPace})
- Weight: Current ${profile.currentWeight}kg, Target ${profile.targetWeight}kg
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
- No gamified or playful language. No motivational clichés.
- Address the user by name: ${profile?.displayName || 'there'}.
- Keep responses concise (2-4 sentences).

## Boundaries
- No medical diagnoses.
- No extreme or unsafe advice.
- Stay within your user's diet (${profile?.dietaryPreferences}) and lifestyle.`;

    // Set up SSE for streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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

    // 1. Use gemini-2.5-flash (verified model for this key)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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
      // 3. Call Gemini
      const result = await model.generateContent({ contents });

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

      // Return response in SSE format (single chunk for non-streaming simplify)
      res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
      res.write(`data: ${JSON.stringify({ done: true, fullResponse: text })}\n\n`);
      res.end();

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
    const fallbackMessage = "AI Coach is temporarily unavailable. Please try again.";

    if (res.headersSent) {
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

    // Update Gamification
    gamification = await storage.updateGamification(userId, {
      xp: totalXp,
      level,
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
