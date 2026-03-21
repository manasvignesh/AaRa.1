import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

import { loadMeals } from "../data/loadMeals";
import { loadWorkouts } from "../data/workout-lib";
import { calculateCategoryTargets, getWeightCategoryDisplayName, mapPrimaryGoalToPlanGoal } from "./planGenerator";

const generatedMealSchema = z.object({
  mealType: z.enum(["breakfast", "lunch", "dinner"]),
  name: z.string().min(2),
  calories: z.number().min(80).max(1200),
  protein: z.number().min(1).max(120),
  carbs: z.number().min(0).max(220).optional().default(0),
  fat: z.number().min(0).max(120).optional().default(0),
  fiber: z.number().min(0).max(60).optional().default(0),
  ingredients: z.array(z.string().min(1)).min(2).max(18),
  instructions: z.string().min(12).max(1200),
  cookingMethod: z.string().min(2).max(120).optional().default("Home-style"),
  region: z.string().min(2).max(120).optional().default("north_indian"),
});

const generatedWorkoutSchema = z.object({
  name: z.string().min(2),
  workoutType: z.string().min(2).max(40),
  difficulty: z.string().min(2).max(40),
  durationMinutes: z.number().min(10).max(180),
  description: z.string().min(12).max(500),
  warmup: z.array(z.string().min(1)).max(8).default([]),
  cooldown: z.array(z.string().min(1)).max(8).default([]),
  exercises: z.array(
    z.object({
      name: z.string().min(2),
      sets: z.number().min(1).max(10).optional(),
      reps: z.string().min(1).max(40).optional(),
      rest_seconds: z.number().min(10).max(300).optional(),
      notes: z.string().max(180).optional(),
    }),
  ).min(3).max(12),
});

const generatedPlanSchema = z.object({
  breakfast: generatedMealSchema,
  lunch: generatedMealSchema,
  dinner: generatedMealSchema,
  workout: generatedWorkoutSchema.optional().nullable(),
});

type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

type PlannerProfile = {
  age: number;
  gender: string;
  height: number;
  currentWeight: number;
  targetWeight: number;
  activityLevel: string;
  dietaryPreferences: string;
  regionPreference?: string | null;
  cookingAccess: string;
  timeAvailability: number;
  gymAccess: boolean;
  primaryGoal?: string | null;
  weightCategory?: string | null;
  displayName?: string | null;
};

function parseJsonBlock(text: string): unknown {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i) || text.match(/```\s*([\s\S]*?)```/i);
  const candidate = (fenced?.[1] ?? text).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("Could not parse Gemini JSON response");
  }
}

function normalizeDiet(value: string | null | undefined): "veg" | "non_veg" {
  const input = String(value || "").trim().toLowerCase();
  if (["non-veg", "nonveg", "non_veg", "non veg"].includes(input)) return "non_veg";
  return "veg";
}

function buildMealExamples(profile: PlannerProfile, mealType: "breakfast" | "lunch" | "dinner") {
  const diet = normalizeDiet(profile.dietaryPreferences);
  const categoryTargets = calculateCategoryTargets(profile as any);
  const category = categoryTargets.weightCategory;

  return loadMeals()
    .then(({ meals }) =>
      meals
        .filter((meal) => {
          const matchesType = meal.mealType === mealType;
          const matchesDiet = meal.diet === diet;
          const matchesCategory =
            !Array.isArray(meal.suitableForCategories) || meal.suitableForCategories.includes(category);
          return matchesType && matchesDiet && matchesCategory;
        })
        .slice(0, 6)
        .map((meal) => ({
          name: meal.name,
          calories: meal.calories,
          protein: meal.protein,
          cookingMethod: meal.cookingMethod || "home-style",
        })),
    )
    .catch(() => []);
}

function buildWorkoutExamples(profile: PlannerProfile) {
  const categoryTargets = calculateCategoryTargets(profile as any);
  const category = categoryTargets.weightCategory;
  return loadWorkouts()
    .workouts
    .filter((workout) => workout.suitableForCategories.includes(category))
    .slice(0, 6)
    .map((workout) => ({
      name: workout.name,
      durationMinutes: workout.durationMinutes,
      difficulty: workout.level,
      workoutType: workout.workoutType,
      hostelFriendly: Boolean(workout.is_hostel_friendly),
      noEquipment: Boolean(workout.is_no_equipment),
    }));
}

export async function generateAiPlan(profile: PlannerProfile): Promise<GeneratedPlan | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const targets = calculateCategoryTargets(profile as any);
  const planGoal = mapPrimaryGoalToPlanGoal(profile.primaryGoal);
  const mealExamples = await Promise.all([
    buildMealExamples(profile, "breakfast"),
    buildMealExamples(profile, "lunch"),
    buildMealExamples(profile, "dinner"),
  ]);
  const workoutExamples = buildWorkoutExamples(profile);

  const breakfastTarget = {
    calories: Math.round(targets.caloriesTarget * 0.28),
    protein: Math.max(15, Math.round(targets.proteinTarget * 0.25)),
  };
  const lunchTarget = {
    calories: Math.round(targets.caloriesTarget * 0.37),
    protein: Math.max(20, Math.round(targets.proteinTarget * 0.4)),
  };
  const dinnerTarget = {
    calories: Math.round(targets.caloriesTarget * 0.35),
    protein: Math.max(18, Math.round(targets.proteinTarget * 0.35)),
  };

  const prompt = `
You are building a single realistic Indian day plan for AARA.

User:
- Name: ${profile.displayName || "User"}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Height: ${profile.height} cm
- Weight: ${profile.currentWeight} kg
- Target weight: ${profile.targetWeight} kg
- BMI phase: ${getWeightCategoryDisplayName(targets.weightCategory)} (${targets.weightCategory})
- Goal: ${planGoal}
- Diet: ${profile.dietaryPreferences}
- Region preference: ${profile.regionPreference || "north_indian"}
- Cooking access: ${profile.cookingAccess}
- Time available for exercise: ${profile.timeAvailability} minutes
- Gym access: ${profile.gymAccess ? "yes" : "no"}
- Activity level: ${profile.activityLevel}

Nutrition targets:
- Daily calories: ${targets.caloriesTarget}
- Daily protein: ${targets.proteinTarget} g
- Category notes: ${targets.adjustments.notes}
- Prefer: ${targets.adjustments.prefer.join(", ") || "none"}
- Avoid: ${targets.adjustments.avoid.join(", ") || "none"}

Meal targets:
- Breakfast: about ${breakfastTarget.calories} kcal and ${breakfastTarget.protein} g protein
- Lunch: about ${lunchTarget.calories} kcal and ${lunchTarget.protein} g protein
- Dinner: about ${dinnerTarget.calories} kcal and ${dinnerTarget.protein} g protein

Real-life rules:
- Meals must be realistic for an Indian student or working adult.
- Respect cooking access. If cooking access is basic or none, keep meals simple, hostel-friendly, mess-friendly, or easy to assemble.
- Respect diet strictly.
- Protein matters. Use practical protein sources, not fantasy nutrition.
- Workout must fit within time available and gym access.
- If BMI phase suggests caution, keep the workout sustainable and realistic.
- Prefer consistency over intensity.

Inspiration from current backup libraries:
- Breakfast examples: ${JSON.stringify(mealExamples[0])}
- Lunch examples: ${JSON.stringify(mealExamples[1])}
- Dinner examples: ${JSON.stringify(mealExamples[2])}
- Workout examples: ${JSON.stringify(workoutExamples)}

Return only valid JSON matching this exact shape:
{
  "breakfast": {
    "mealType": "breakfast",
    "name": "string",
    "calories": 300,
    "protein": 18,
    "carbs": 35,
    "fat": 9,
    "fiber": 6,
    "ingredients": ["item 1", "item 2"],
    "instructions": "short practical steps",
    "cookingMethod": "string",
    "region": "north_indian"
  },
  "lunch": { "...same shape..." },
  "dinner": { "...same shape..." },
  "workout": {
    "name": "string",
    "workoutType": "strength or cardio or mobility",
    "difficulty": "easy or medium or hard",
    "durationMinutes": 30,
    "description": "string",
    "warmup": ["step 1"],
    "cooldown": ["step 1"],
    "exercises": [
      {
        "name": "string",
        "sets": 3,
        "reps": "10-12",
        "rest_seconds": 45,
        "notes": "string"
      }
    ]
  }
}`;

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];

  let lastError: unknown = null;
  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const parsed = generatedPlanSchema.parse(parseJsonBlock(text));
      console.log(`[AI_PLAN] Generated plan successfully with ${modelName}`);
      return parsed;
    } catch (error) {
      lastError = error;
      console.warn(`[AI_PLAN] Model ${modelName} failed:`, error);
    }
  }

  console.error("[AI_PLAN] Failed to generate AI plan with all models:", lastError);
  return null;
}
