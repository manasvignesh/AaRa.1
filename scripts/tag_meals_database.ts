import fs from "node:fs/promises";
import path from "node:path";

type WeightCategory =
  | "underweight"
  | "healthy"
  | "overweight"
  | "obese"
  | "severely_obese";

type MealRecord = Record<string, any>;

function toNum(v: any): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function detectDeepFried(meal: MealRecord): boolean {
  const method = String(meal.cooking_method ?? meal.cookingMethod ?? "").toLowerCase();
  const name = String(meal.meal_name ?? meal.name ?? "").toLowerCase();
  if (method.includes("deep")) return true;
  if (method.includes("deep-fry") || method.includes("deep fry")) return true;
  if (method.includes("fried") && !method.includes("pan")) return true;

  // Heuristics from common Indian deep-fried items
  if (/\b(puri|bhatura|pakora|samosa|vada|kachori|jalebi)\b/.test(name)) return true;
  return false;
}

function detectHighFatGhee(meal: MealRecord): boolean {
  const name = String(meal.meal_name ?? meal.name ?? "").toLowerCase();
  const fat = toNum(meal.fat_g ?? meal.fats ?? meal.fats_g);
  if (fat >= 16) return true;
  if (/\b(ghee|butter|cream|malai)\b/.test(name)) return true;
  return false;
}

function calorieDensity(calories: number): "low" | "medium" | "high" | "very_high" {
  if (calories <= 200) return "low";
  if (calories <= 350) return "medium";
  if (calories <= 450) return "high";
  return "very_high";
}

function glycemicLoad(meal: MealRecord): "low" | "medium" | "high" {
  const carbs = toNum(meal.carbs_g ?? meal.carbs);
  const fiber = toNum(meal.fiber_g ?? meal.fiber);
  // Very rough, but consistent across the dataset.
  if (carbs >= 45 && fiber <= 3) return "high";
  if (carbs >= 28) return "medium";
  return "low";
}

function buildSuitableCategories(meal: MealRecord): WeightCategory[] {
  const calories = toNum(meal.calories_kcal ?? meal.calories);
  const protein = toNum(meal.protein_g ?? meal.protein);
  const deepFried = detectDeepFried(meal);
  const highFatGhee = detectHighFatGhee(meal);

  const cats = new Set<WeightCategory>([
    "underweight",
    "healthy",
    "overweight",
    "obese",
    "severely_obese",
  ]);

  // Rules from spec
  if (calories > 400) {
    cats.delete("obese");
    cats.delete("severely_obese");
  }
  if (calories < 200) {
    cats.delete("underweight");
  }
  if (deepFried) {
    cats.delete("overweight");
    cats.delete("obese");
    cats.delete("severely_obese");
  }
  if (highFatGhee) {
    cats.delete("obese");
    cats.delete("severely_obese");
  }

  // High protein: universal
  if (protein > 20) {
    return ["underweight", "healthy", "overweight", "obese", "severely_obese"];
  }

  return Array.from(cats);
}

function tagMeal(meal: MealRecord): MealRecord {
  const calories = toNum(meal.calories_kcal ?? meal.calories);
  const protein = toNum(meal.protein_g ?? meal.protein);
  const fiber = toNum(meal.fiber_g ?? meal.fiber);

  const density = calorieDensity(calories);
  const gl = glycemicLoad(meal);
  const deepFried = detectDeepFried(meal);

  const proteinPriority = protein >= 20;
  const isLowCalorie = calories < 300;
  const isHighFiber = fiber > 5;
  const isWeightLossFriendly =
    !deepFried &&
    (density === "low" || density === "medium") &&
    gl !== "high" &&
    (protein >= 12 || isHighFiber);
  const isMuscleGainFriendly = protein >= 20 || (calories >= 350 && protein >= 12);

  return {
    ...meal,
    calorie_density: meal.calorie_density ?? density,
    glycemic_load: meal.glycemic_load ?? gl,
    protein_priority: meal.protein_priority ?? proteinPriority,
    is_weight_loss_friendly: meal.is_weight_loss_friendly ?? isWeightLossFriendly,
    is_muscle_gain_friendly: meal.is_muscle_gain_friendly ?? isMuscleGainFriendly,
    is_low_calorie: meal.is_low_calorie ?? isLowCalorie,
    is_high_fiber: meal.is_high_fiber ?? isHighFiber,
    suitable_for_categories: meal.suitable_for_categories ?? buildSuitableCategories(meal),
  };
}

async function main() {
  const filePath = path.join(process.cwd(), "data", "meals_database.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected meals_database.json to be an array");
  }

  const updated = parsed.map((m) => tagMeal(m));

  await fs.writeFile(filePath, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`[tag_meals_database] Updated ${updated.length} meals`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

