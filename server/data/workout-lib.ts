import fs from "fs";
import path from "path";
import { calculateBmiKgCm, getWeightCategory, type WeightCategory } from "../services/planGenerator";

type WorkoutExercise = {
  name: string;
  sets?: number;
  reps?: string;
  rest_seconds?: number;
  notes?: string;
};

type WorkoutTemplateRaw = {
  id: string;
  workout_name: string;
  workout_type?: string;
  suitable_for_categories?: WeightCategory[] | string[];
  primary_goal?: string[];
  difficulty?: string;
  duration_minutes?: number;
  calories_burned_estimate?: number;
  equipment_needed?: string[];
  is_hostel_friendly?: boolean;
  is_no_equipment?: boolean;
  region_notes?: string;
  description?: string;
  exercises?: WorkoutExercise[];
  warmup?: string[];
  cooldown?: string[];
  nutrition_note?: string;
  tags?: string[];
};

// Back-compat (older simplified file versions)
type WorkoutLegacySimple = {
  id: string;
  name: string;
  level?: string;
  goal?: string[];
  duration?: string | number;
};

export type WorkoutTemplate = WorkoutTemplateRaw & {
  // Normalized aliases used by older parts of the codebase.
  name: string;
  level: string;
  goal: string[];
  duration: string;
  suitableForCategories: WeightCategory[];
  workoutType: string;
  durationMinutes: number;
};

type WorkoutLibraryFile = {
  meta: any;
  workouts: WorkoutTemplate[];
};

let cachedWorkouts: WorkoutLibraryFile | null = null;

function normalizeWeightCategories(list: any): WeightCategory[] {
  const raw = Array.isArray(list) ? list : [];
  const norm = raw.map((c) => String(c || "").trim().toLowerCase()).filter(Boolean);

  const allowed: WeightCategory[] = ["underweight", "healthy", "overweight", "obese", "severely_obese"];
  const picked = norm.filter((c) => (allowed as string[]).includes(c)) as WeightCategory[];
  return picked.length ? picked : allowed;
}

function normalizePrimaryGoals(list: any): string[] {
  const raw = Array.isArray(list) ? list : [];
  const norm = raw.map((g) => String(g || "").trim().toLowerCase()).filter(Boolean);
  return norm.length ? norm : ["maintain"];
}

function normalizeDifficulty(d: any): string {
  const v = String(d || "").trim().toLowerCase();
  if (v === "beginner" || v === "easy") return "beginner";
  if (v === "intermediate" || v === "medium") return "intermediate";
  if (v === "advanced" || v === "hard") return "advanced";
  return "beginner";
}

function normalizeWorkoutType(t: any): string {
  const v = String(t || "").trim().toLowerCase();
  if (!v) return "strength";
  return v;
}

function normalizeDurationMinutes(n: any): number {
  const v = Number(n);
  if (Number.isFinite(v) && v > 0) return Math.round(v);
  return 30;
}

function normalizeRawToTemplate(raw: any): WorkoutTemplate | null {
  // New format (workout_name, duration_minutes, exercises, suitable_for_categories)
  if (raw && typeof raw === "object" && typeof raw.workout_name === "string") {
    const durationMinutes = normalizeDurationMinutes(raw.duration_minutes);
    const workoutType = normalizeWorkoutType(raw.workout_type);
    const suitableForCategories = normalizeWeightCategories(raw.suitable_for_categories);
    const goal = normalizePrimaryGoals(raw.primary_goal);
    const level = normalizeDifficulty(raw.difficulty);

    return {
      ...(raw as WorkoutTemplateRaw),
      name: raw.workout_name,
      level,
      goal,
      duration: String(durationMinutes),
      suitableForCategories,
      workoutType,
      durationMinutes,
    };
  }

  // Legacy simplified list (name/goal/level/duration)
  if (raw && typeof raw === "object" && typeof raw.name === "string") {
    const legacy = raw as WorkoutLegacySimple;
    const durationMinutes = normalizeDurationMinutes(legacy.duration);
    const workoutType = normalizeWorkoutType((legacy as any).type);
    const suitableForCategories = normalizeWeightCategories((legacy as any).suitableForCategories);
    const goal = normalizePrimaryGoals(legacy.goal);
    const level = normalizeDifficulty(legacy.level);
    return {
      id: String(legacy.id || ""),
      workout_name: legacy.name,
      workout_type: workoutType,
      suitable_for_categories: suitableForCategories,
      primary_goal: goal,
      difficulty: level,
      duration_minutes: durationMinutes,
      calories_burned_estimate: (legacy as any).calories_burned_estimate,
      equipment_needed: (legacy as any).equipment_needed,
      is_hostel_friendly: (legacy as any).is_hostel_friendly,
      is_no_equipment: (legacy as any).is_no_equipment,
      region_notes: (legacy as any).region_notes,
      description: (legacy as any).description,
      exercises: (legacy as any).exercises,
      warmup: (legacy as any).warmup,
      cooldown: (legacy as any).cooldown,
      nutrition_note: (legacy as any).nutrition_note,
      tags: (legacy as any).tags,
      name: legacy.name,
      level,
      goal,
      duration: String(durationMinutes),
      suitableForCategories,
      workoutType,
      durationMinutes,
    };
  }

  return null;
}

export function loadWorkouts(): WorkoutLibraryFile {
  if (cachedWorkouts) return cachedWorkouts;

  const p = path.join(process.cwd(), "data", "workouts_database.json");
  if (!fs.existsSync(p)) {
    console.warn(`[WORKOUT_LIB] Workouts file not found at ${p}. Using empty fallback.`);
    cachedWorkouts = { meta: {}, workouts: [] };
    return cachedWorkouts;
  }

  try {
    const content = fs.readFileSync(p, "utf8");
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed)) {
      const workouts = parsed.map(normalizeRawToTemplate).filter(Boolean) as WorkoutTemplate[];
      cachedWorkouts = { meta: {}, workouts };
    } else if (parsed && typeof parsed === "object" && Array.isArray((parsed as any).workouts)) {
      // Some older formats store { workouts: [...] }
      const workouts = (parsed as any).workouts.map(normalizeRawToTemplate).filter(Boolean) as WorkoutTemplate[];
      cachedWorkouts = { meta: (parsed as any).meta ?? {}, workouts };
    } else {
      cachedWorkouts = { meta: {}, workouts: [] };
    }
  } catch (err) {
    console.error(`[WORKOUT_LIB] Error parsing workouts database:`, err);
    cachedWorkouts = { meta: {}, workouts: [] };
  }

  return cachedWorkouts!;
}

export function getWorkoutForProfile(
  age: number,
  currentWeight: number,
  targetWeight: number | null,
  height: number,
  dayNumber: number = 1,
): WorkoutTemplate | null {
  try {
    const data = loadWorkouts();
    const all = data.workouts || [];
    if (!all.length) return null;

    const bmi = calculateBmiKgCm(currentWeight, height) ?? 22;
    const category = getWeightCategory(bmi);
    const wantsToGain = Boolean(targetWeight && Number(targetWeight) > Number(currentWeight));

    // Determine "intent" goals for selection. We keep this loose because the user may not have
    // explicitly set a workout goal, and the library also includes posture/flexibility/recovery.
    const desiredGoals = (() => {
      if (wantsToGain) return ["muscle_gain", "weight_gain", "maintain"];
      if (category === "overweight" || category === "obese" || category === "severely_obese") {
        return ["weight_loss", "endurance", "recovery", "flexibility"];
      }
      return ["maintain", "endurance", "flexibility", "posture", "recovery"];
    })();

    console.log(
      `[WORKOUT_LIB] Profile: Age=${age}, Weight=${currentWeight}, Height=${height}, BMI=${bmi.toFixed(
        1,
      )}, Category=${category}, WantsToGain=${wantsToGain}`,
    );

    const byCategory = all.filter((w) =>
      Array.isArray(w.suitableForCategories) ? w.suitableForCategories.includes(category) : true,
    );

    const categoryPool = byCategory.length ? byCategory : all;
    const goalPool = categoryPool.filter((w) =>
      w.goal.some((g) => desiredGoals.includes(String(g).toLowerCase())),
    );
    const pool = goalPool.length ? goalPool : categoryPool;

    // Deterministic pick by dayNumber for a stable "daily workout"
    const sorted = [...pool].sort((a, b) => String(a.id).localeCompare(String(b.id)));
    const idx = ((Number(dayNumber) || 1) - 1) % sorted.length;
    const selected = sorted[Math.max(0, idx)];

    console.log(`[WORKOUT_LIB] Selected workout: ${selected.name} (${selected.workoutType})`);
    return selected;
  } catch (err) {
    console.error("[WORKOUT_LIB] Error selecting workout:", err);
    return null;
  }
}

export function mapWorkoutDifficultyToDb(difficulty: string | null | undefined): "easy" | "medium" | "hard" {
  const d = String(difficulty || "").trim().toLowerCase();
  if (d === "beginner" || d === "easy") return "easy";
  if (d === "intermediate" || d === "medium") return "medium";
  if (d === "advanced" || d === "hard") return "hard";
  return "medium";
}

export function toWorkoutDbExercises(template: WorkoutTemplate): any[] {
  const warmup = Array.isArray(template.warmup) ? template.warmup : [];
  const cooldown = Array.isArray(template.cooldown) ? template.cooldown : [];
  const main = Array.isArray(template.exercises) ? template.exercises : [];

  const warmupObjs = warmup
    .filter(Boolean)
    .map((w) => ({
      name: String(w),
      sets: 1,
      reps: "60s",
      rest_seconds: 10,
      notes: "Warmup",
      phase: "warmup",
    }));

  const mainObjs = main
    .filter((m) => m && typeof m === "object" && typeof (m as any).name === "string")
    .map((m) => ({
      name: String(m.name),
      sets: Number.isFinite(Number(m.sets)) ? Number(m.sets) : 1,
      reps: m.reps ? String(m.reps) : undefined,
      rest_seconds: Number.isFinite(Number(m.rest_seconds)) ? Number(m.rest_seconds) : 20,
      notes: m.notes ? String(m.notes) : undefined,
      phase: "main",
    }));

  const cooldownObjs = cooldown
    .filter(Boolean)
    .map((c) => ({
      name: String(c),
      sets: 1,
      reps: "45s",
      rest_seconds: 10,
      notes: "Cooldown",
      phase: "cooldown",
    }));

  const combined = [...warmupObjs, ...mainObjs, ...cooldownObjs];
  return combined.length
    ? combined
    : [{ name: template.name, sets: 1, reps: "as directed", rest_seconds: 20, phase: "main" }];
}

export function getAllWorkoutCategories() {
  const data = loadWorkouts();
  const counts: Record<string, number> = {};
  for (const w of data.workouts) {
    for (const c of w.suitableForCategories) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  return Object.entries(counts).map(([cat, count]) => ({ cat, count }));
}

