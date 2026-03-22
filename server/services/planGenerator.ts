export type WeightCategory =
  | "underweight"
  | "healthy"
  | "overweight"
  | "obese"
  | "severely_obese";

export const getWeightCategory = (bmi: number): WeightCategory => {
  if (!Number.isFinite(bmi)) return "healthy";
  if (bmi < 18.5) return "underweight";
  if (bmi < 23.0) return "healthy";
  if (bmi < 27.5) return "overweight";
  if (bmi < 35.0) return "obese";
  return "severely_obese";
};

export const getWeightCategoryDisplayName = (category: WeightCategory) =>
  ({
    underweight: "Building Phase",
    healthy: "In the Zone",
    overweight: "Active Transformation",
    obese: "Power Journey",
    severely_obese: "Strong Start",
  })[category];

export function calculateBmiKgCm(weightKg: number, heightCm: number): number | null {
  const w = Number(weightKg);
  const hCm = Number(heightCm);
  if (!Number.isFinite(w) || !Number.isFinite(hCm) || w <= 0 || hCm <= 0) return null;
  const hM = hCm / 100;
  const bmi = w / (hM * hM);
  return Number.isFinite(bmi) ? bmi : null;
}

export type CategoryAdjustments = {
  calories: number;
  protein_per_kg: number;
  carb_percent: number;
  fat_percent: number;
  fiber_min_g: number;
  meal_frequency: number;
  notes: string;
  avoid: string[];
  prefer: string[];
  show_doctor_notice?: boolean;
};

export const getCategoryAdjustments = (
  category: WeightCategory,
  goal: "weight_loss" | "muscle_gain" | "weight_gain" | "maintain",
  tdee: number,
): CategoryAdjustments => {
  switch (category) {
    case "underweight":
      return {
        calories: tdee + 400,
        protein_per_kg: 1.8,
        carb_percent: 50,
        fat_percent: 25,
        fiber_min_g: 20,
        meal_frequency: 5,
        notes:
          "Focus on nutrient-dense, calorie-rich foods. Prioritize proteins and healthy fats.",
        avoid: ["very_low_calorie", "high_fiber_only"],
        prefer: ["calorie_dense", "protein_rich", "healthy_fats"],
      };

    case "healthy":
      return {
        calories:
          goal === "weight_loss"
            ? tdee - 300
            : goal === "weight_gain"
              ? tdee + 400
              : goal === "muscle_gain"
              ? tdee + 250
              : tdee,
        protein_per_kg: goal === "muscle_gain" || goal === "weight_gain" ? 1.8 : 1.4,
        carb_percent: 45,
        fat_percent: 30,
        fiber_min_g: 25,
        meal_frequency: 4,
        notes:
          "Balanced nutrition. Maintain current habits with minor adjustments for your goal.",
        avoid: [],
        prefer: ["balanced", "whole_foods"],
      };

    case "overweight":
      return {
        calories: Math.max(tdee - 400, 1400),
        protein_per_kg: 1.6,
        carb_percent: 40,
        fat_percent: 28,
        fiber_min_g: 30,
        meal_frequency: 4,
        notes:
          "Prioritize high-fiber, high-protein meals. Avoid refined carbs and fried foods.",
        avoid: ["high_calorie_density", "high_glycemic", "deep_fried"],
        prefer: ["high_fiber", "lean_protein", "low_calorie_density"],
      };

    case "obese":
      return {
        calories: Math.max(tdee - 500, 1200),
        protein_per_kg: 1.8,
        carb_percent: 35,
        fat_percent: 30,
        fiber_min_g: 35,
        meal_frequency: 4,
        notes:
          "Focus on volume eating: high fiber, low calorie density foods. Avoid sugar and refined carbs.",
        avoid: ["high_calorie_density", "high_glycemic", "sugary", "deep_fried", "refined_carbs"],
        prefer: ["high_fiber", "lean_protein", "vegetables", "low_calorie_density", "low_glycemic"],
      };

    case "severely_obese":
      return {
        calories: Math.max(tdee - 600, 1200),
        protein_per_kg: 2.0,
        carb_percent: 30,
        fat_percent: 35,
        fiber_min_g: 40,
        meal_frequency: 5,
        notes:
          "Smaller portions more frequently. High protein is essential. Consider consulting a doctor alongside app use.",
        avoid: [
          "high_calorie_density",
          "high_glycemic",
          "sugary",
          "deep_fried",
          "refined_carbs",
          "large_portions",
        ],
        prefer: ["high_fiber", "lean_protein", "vegetables", "very_low_calorie", "low_glycemic"],
        show_doctor_notice: true,
      };
  }
};

export function mapPrimaryGoalToPlanGoal(primaryGoal: string | null | undefined): "weight_loss" | "muscle_gain" | "weight_gain" | "maintain" {
  const g = String(primaryGoal ?? "").trim().toLowerCase();
  if (g === "fat_loss") return "weight_loss";
  if (g === "weight_loss") return "weight_loss";
  if (g === "muscle_gain") return "muscle_gain";
  if (g === "weight_gain") return "weight_gain";
  return "maintain";
}

export function calculateTdee(profile: {
  gender: string;
  currentWeight: number;
  height: number;
  age: number;
  activityLevel: string;
}): number {
  const weightKg = Number(profile.currentWeight) || 0;
  const heightCm = Number(profile.height) || 0;
  const age = Number(profile.age) || 0;

  // Mifflin-St Jeor
  const isMale = String(profile.gender).toLowerCase() === "male";
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (isMale ? 5 : -161);

  const multipliers: Record<string, number> = {
    sedentary: 1.2,
    moderate: 1.55,
    active: 1.725,
  };
  return bmr * (multipliers[String(profile.activityLevel)] || 1.2);
}

export function computeBmiAndCategory(profile: { currentWeight: number; height: number }) {
  const bmi = calculateBmiKgCm(profile.currentWeight, profile.height);
  if (bmi == null) {
    return { bmi: null as number | null, category: "healthy" as WeightCategory };
  }
  const rounded = Math.round(bmi * 10) / 10;
  return { bmi: rounded, category: getWeightCategory(rounded) };
}

export function calculateCategoryTargets(profile: {
  gender: string;
  currentWeight: number;
  height: number;
  age: number;
  activityLevel: string;
  primaryGoal?: string | null;
  weightCategory?: string | null;
  bmi?: any;
}): {
  bmi: number | null;
  weightCategory: WeightCategory;
  caloriesTarget: number;
  proteinTarget: number;
  adjustments: CategoryAdjustments;
} {
  const tdee = calculateTdee(profile);

  const computed = computeBmiAndCategory(profile);
  const existingCategory = String(profile.weightCategory ?? "").trim().toLowerCase() as WeightCategory;
  const weightCategory: WeightCategory =
    existingCategory === "underweight" ||
    existingCategory === "healthy" ||
    existingCategory === "overweight" ||
    existingCategory === "obese" ||
    existingCategory === "severely_obese"
      ? existingCategory
      : computed.category;

  const goal = mapPrimaryGoalToPlanGoal(profile.primaryGoal);
  const adjustments = getCategoryAdjustments(weightCategory, goal, tdee);

  // Hard safety floors similar to prior logic.
  const minCalories = String(profile.gender).toLowerCase() === "male" ? 1500 : 1200;
  const caloriesTarget = Math.max(minCalories, Math.round(adjustments.calories));
  const proteinTarget = Math.round((Number(profile.currentWeight) || 0) * adjustments.protein_per_kg);

  return {
    bmi: computed.bmi,
    weightCategory,
    caloriesTarget,
    proteinTarget,
    adjustments,
  };
}
