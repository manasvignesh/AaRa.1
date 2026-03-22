import Groq from "groq-sdk";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

const readJsonArray = (filename: string) => {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[AARA_AI] Failed to read ${filename}:`, error);
    return [];
  }
};

const mealLibrary = readJsonArray("meals_database.json");
const workoutLibrary = readJsonArray("workouts_database.json");

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not configured");
  return new Groq({ apiKey });
};

export interface AaraUserProfile {
  userId: number;
  userName: string;
  age: number;
  gender: string;
  region: string;
  dietType: string;
  primaryGoal: string;
  livingSituation: string;
  currentWeight: number;
  targetWeight: number;
  heightCm: number;
  bmi: number;
  weightCategory: string;
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyWaterTargetMl: number;
}

export interface AaraDayContext {
  caloriesConsumed: number;
  proteinConsumed: number;
  waterConsumedMl: number;
  streakDays: number;
  cheatMealsThisWeek: number;
  todaysMeals?: string[];
  todaysWorkout?: string;
  lastWeightKg?: number;
  weightTrend?: "losing" | "gaining" | "stable";
}

export interface AaraMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CoachRequest {
  message: string;
  profile: AaraUserProfile;
  dayContext: AaraDayContext;
  conversationHistory: AaraMessage[];
  contextType?:
    | "general"
    | "meal_advice"
    | "workout_advice"
    | "hostel_mode"
    | "cheat_meal"
    | "ingredient_suggest"
    | "weight_category";
}

export interface IngredientRequest {
  ingredients: string[];
  cookingMethod: "no_cook" | "kettle" | "microwave" | "stovetop" | "oven";
  remainingCalories: number;
  remainingProtein: number;
  profile: AaraUserProfile;
}

export interface MealSuggestion {
  meal_name: string;
  recipe_steps: string[];
  estimated_calories: number;
  estimated_protein: number;
  estimated_carbs: number;
  estimated_fat: number;
  prep_time_minutes: number;
  cooking_method: string;
  tips: string;
}

const REGION_DISPLAY: Record<string, string> = {
  north_indian: "North Indian",
  south_indian: "South Indian",
  east_indian: "East Indian",
  west_indian: "West Indian",
  pan_india: "Pan India",
  pan_indian: "Pan India",
  "Pan-India": "Pan India",
};

const GOAL_DISPLAY: Record<string, string> = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  weight_gain: "Weight Gain",
  maintain: "Maintenance",
  fat_loss: "Weight Loss",
};

const CATEGORY_DISPLAY: Record<string, string> = {
  underweight: "Building Phase",
  healthy: "In the Zone",
  overweight: "Active Transformation",
  obese: "Power Journey",
  severely_obese: "Strong Start",
};

const LIVING_DISPLAY: Record<string, string> = {
  home: "at home with a kitchen",
  hostel: "hostel student",
  pg: "PG resident",
  working: "working professional",
};

const fmt = {
  region: (r: string) => REGION_DISPLAY[r] ?? r.replace(/_/g, " "),
  goal: (g: string) => GOAL_DISPLAY[g] ?? g.replace(/_/g, " "),
  category: (c: string) => CATEGORY_DISPLAY[c] ?? c.replace(/_/g, " "),
  living: (l: string) => LIVING_DISPLAY[l] ?? l.replace(/_/g, " "),
};

const normalizeDiet = (value: string) => {
  const v = String(value || "").toLowerCase();
  if (["non-veg", "nonveg", "non_veg", "non veg"].includes(v)) return "non-veg";
  if (["egg", "eggetarian"].includes(v)) return "egg";
  return "veg";
};

const retrieveMeals = (query: string, profile: AaraUserProfile, limit = 6): string => {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const diet = normalizeDiet(profile.dietType);
  const region = String(profile.region || "").toLowerCase();

  let pool = mealLibrary.filter((m: any) => {
    const mealDiet = String(m.diet_type || m.diet || "").toLowerCase();
    const mealRegion = String(m.region || "").toLowerCase();
    const dietMatch =
      mealDiet === diet ||
      (diet === "egg" && mealDiet === "veg");
    const regionMatch =
      !region ||
      mealRegion === region ||
      mealRegion.includes("pan");
    return dietMatch && regionMatch;
  });

  if (pool.length < 5) {
    pool = mealLibrary.filter((m: any) => {
      const mealDiet = String(m.diet_type || m.diet || "").toLowerCase();
      return mealDiet === diet || (diet === "egg" && mealDiet === "veg");
    });
  }

  if (pool.length < 5) pool = mealLibrary;

  const scored = pool
    .map((m: any) => {
      let score = 0;
      const name = String(m.meal_name || m.name || "").toLowerCase();
      const category = String(m.category || m.meal_time || "").toLowerCase();
      const method = String(m.cooking_method || m.cookingMethod || "").toLowerCase();

      for (const k of keywords) {
        if (name.includes(k)) score += 3;
        if (category.includes(k)) score += 2;
        if (method.includes(k)) score += 1;
      }

      const calories = Number(m.calories_kcal || m.calories || 0);
      const protein = Number(m.protein_g || m.protein || 0);
      if (protein >= 18) score += 2;
      if (profile.weightCategory === "underweight" && calories >= 300) score += 2;
      if (["overweight", "obese", "severely_obese"].includes(profile.weightCategory) && calories <= 250) score += 2;

      return { ...m, score };
    })
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit);

  if (!scored.length) return "No specific meals found in the database.";

  return scored
    .map((m: any) => {
      const name = m.meal_name || m.name;
      const calories = Number(m.calories_kcal || m.calories || 0);
      const protein = Number(m.protein_g || m.protein || 0);
      const carbs = Number(m.carbs_g || m.carbs || 0);
      const fat = Number(m.fat_g || m.fat || m.fats || 0);
      return `- ${name}: ${calories} kcal, ${protein}g protein, ${carbs}g carbs, ${fat}g fat`;
    })
    .join("\n");
};

const retrieveWorkouts = (profile: AaraUserProfile, limit = 3): string => {
  const category = String(profile.weightCategory || "").toLowerCase();
  const pool = workoutLibrary.filter((w: any) => {
    const categories = Array.isArray(w.suitable_for_categories) ? w.suitable_for_categories : [];
    if (!categories.length) return true;
    return categories.map((c: any) => String(c).toLowerCase()).includes(category);
  });

  const picked = (pool.length ? pool : workoutLibrary).slice(0, limit);
  return picked
    .map((w: any) => {
      const name = w.workout_name || w.name;
      const duration = w.duration_minutes || w.duration || 30;
      const difficulty = w.difficulty || w.level || "easy";
      return `- ${name}: ${difficulty}, ${duration} min`;
    })
    .join("\n");
};

const buildSystemPrompt = (
  profile: AaraUserProfile,
  dayContext: AaraDayContext,
  retrievedMeals: string,
  retrievedWorkouts: string,
  contextType: string,
) => {
  const caloriesLeft = Math.max(0, profile.dailyCalorieTarget - dayContext.caloriesConsumed);
  const proteinLeft = Math.max(0, profile.dailyProteinTarget - dayContext.proteinConsumed);

  return `You are AARA, a warm and practical Indian wellness coach.

User profile:
- Name: ${profile.userName}
- Age: ${profile.age}
- Gender: ${profile.gender}
- Region: ${fmt.region(profile.region)}
- Diet: ${profile.dietType}
- Goal: ${fmt.goal(profile.primaryGoal)}
- Living: ${fmt.living(profile.livingSituation)}
- Phase: ${fmt.category(profile.weightCategory)}
- BMI: ${profile.bmi.toFixed(1)}

Today's progress:
- Calories: ${dayContext.caloriesConsumed}/${profile.dailyCalorieTarget} (${caloriesLeft} left)
- Protein: ${dayContext.proteinConsumed}/${profile.dailyProteinTarget} (${proteinLeft}g left)
- Water: ${dayContext.waterConsumedMl}/${profile.dailyWaterTargetMl} ml
- Streak: ${dayContext.streakDays} days

Relevant meals from AARA database:
${retrievedMeals}

Relevant workouts:
${retrievedWorkouts}

Rules:
- Keep answers practical and concise.
- Prefer Indian food suggestions from the database context above.
- Never use raw database labels like north_indian or weight_loss.
- Be encouraging, not clinical.
- End with one direct actionable next step.
- Context type: ${contextType}.`;
};

const stripCodeFence = (value: string) =>
  value.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

export const askAARA = async (request: CoachRequest): Promise<string> => {
  const { message, profile, dayContext, conversationHistory, contextType = "general" } = request;
  const groq = getGroqClient();
  const systemPrompt = buildSystemPrompt(
    profile,
    dayContext,
    retrieveMeals(message, profile),
    retrieveWorkouts(profile),
    contextType,
  );

  const history = conversationHistory.slice(-6).map((item) => ({
    role: item.role,
    content: item.content,
  }));

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      { role: "system", content: systemPrompt },
      ...history,
      { role: "user", content: message },
    ],
    max_tokens: 500,
    temperature: 0.72,
    top_p: 0.9,
  });

  return response.choices[0]?.message?.content ?? "I'm here to help. Could you try asking that another way?";
};

export const suggestFromIngredients = async (
  request: IngredientRequest,
): Promise<MealSuggestion> => {
  const groq = getGroqClient();
  const { ingredients, cookingMethod, remainingCalories, remainingProtein, profile } = request;

  const prompt = `You are AARA's meal suggestion engine for Indian users.

User:
- Diet: ${profile.dietType}
- Region: ${fmt.region(profile.region)}
- Goal: ${fmt.goal(profile.primaryGoal)}
- Living: ${fmt.living(profile.livingSituation)}
- Phase: ${fmt.category(profile.weightCategory)}

Ingredients: ${ingredients.join(", ")}
Cooking method: ${cookingMethod}
Remaining calories today: ${remainingCalories}
Remaining protein today: ${remainingProtein}

Suggest one practical Indian meal using the listed ingredients.
Respond in JSON only:
{
  "meal_name": "string",
  "recipe_steps": ["step 1", "step 2"],
  "estimated_calories": 300,
  "estimated_protein": 18,
  "estimated_carbs": 35,
  "estimated_fat": 9,
  "prep_time_minutes": 15,
  "cooking_method": "string",
  "tips": "string"
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.35,
    });
    const raw = response.choices[0]?.message?.content ?? "{}";
    return JSON.parse(stripCodeFence(raw));
  } catch {
    return {
      meal_name: "Dal Rice Bowl",
      recipe_steps: ["Boil dal with salt and turmeric", "Cook rice separately", "Serve together with any available sides"],
      estimated_calories: Math.min(remainingCalories, 350),
      estimated_protein: Math.min(remainingProtein, 14),
      estimated_carbs: 55,
      estimated_fat: 5,
      prep_time_minutes: 20,
      cooking_method: "stovetop",
      tips: "Add curd or roasted chana on the side if you need extra protein.",
    };
  }
};
