
import fs from "fs";
import path from "path";

// Types matching the JSON structure
interface WorkoutStep {
    day_type: string;
    name: string;
    type: string;
    intensity: string;
    duration_min: number;
    estimated_calories_burned: number;
    steps: string[];
    week_progression: number;
}

interface WorkoutCategory {
    age_range: string;
    weight_category: string;
    goal: string;
    rotation_strategy: {
        avoid_repeat_days: number;
        shuffle_weekly: boolean;
    };
    workout_options: WorkoutStep[];
}

interface WorkflowFile {
    meta: any;
    workouts: WorkoutCategory[];
}

let cachedWorkouts: WorkflowFile | null = null;

export function loadWorkouts(): WorkflowFile {
    if (cachedWorkouts) return cachedWorkouts;

    const p = path.join(process.cwd(), "data", "workouts_database.json");
    if (!fs.existsSync(p)) {
        console.warn(`[WORKOUT_LIB] Workouts file not found at ${p}. Using empty fallback.`);
        return { meta: {}, workouts: [] };
    }

    try {
        const content = fs.readFileSync(p, "utf8");
        const parsed = JSON.parse(content);

        // Handle both object { workouts: [] } and direct array [] patterns
        if (Array.isArray(parsed)) {
            cachedWorkouts = { meta: {}, workouts: parsed };
        } else {
            cachedWorkouts = parsed;
        }

        if (!cachedWorkouts || !cachedWorkouts.workouts) {
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
    dayNumber: number = 1
): WorkoutStep | null {
    try {
        const data = loadWorkouts();

        // Determine Categories and Goals
        // Map strictly to what's in the JSON: 
        // "underweight" -> "weight_gain"
        // "overweight" -> "fat_loss"
        // "obese" -> "safe_fat_loss"

        let weightCategory = "overweight";
        let goal = "fat_loss";

        // Calculate BMI
        const heightM = height / 100;
        const bmi = heightM > 0 ? currentWeight / (heightM * heightM) : 22;

        console.log(`[WORKOUT_LIB] Profile Analysis: Age=${age}, Weight=${currentWeight}, Height=${height}, BMI=${bmi.toFixed(1)}`);

        const wantsToGain = targetWeight && targetWeight > currentWeight;

        if (wantsToGain) {
            weightCategory = "underweight";
            goal = "weight_gain";
        } else {
            // Fat loss context
            if (bmi >= 30) {
                weightCategory = "obese";
                goal = "safe_fat_loss";
            } else {
                weightCategory = "overweight";
                // If the user is "normal" (<25) but wants to lose/maintain, we still map to overweight plan
                goal = "fat_loss";
            }
        }
        console.log(`[WORKOUT_LIB] Mapped Category: ${weightCategory}, Goal: ${goal}`);

        // Find Matching Category Group
        let bestMatch: WorkoutCategory | null = null;

        for (const group of data.workouts) {
            if (group.weight_category !== weightCategory) continue;
            if (group.goal !== goal) continue;

            // Check Age Range safely handling potential en-dashes
            const parts = group.age_range.split(/[-–]/);
            if (parts.length < 2) continue;

            const min = parseInt(parts[0].trim());
            const max = parseInt(parts[1].trim());

            if (age >= min && age <= max) {
                bestMatch = group;
                console.log(`[WORKOUT_LIB] Matched Age Group: ${group.age_range}`);
                break;
            }
        }

        // Fallback 1: match category/goal, ignoring age
        if (!bestMatch) {
            console.warn(`[WORKOUT_LIB] No exact age match. Searching fallback for ${weightCategory}/${goal}`);
            bestMatch = data.workouts.find(w => w.weight_category === weightCategory && w.goal === goal) || null;
        }

        // Fallback 2: Any match (should not happen if mapped correctly, but just in case)
        if (!bestMatch) {
            console.warn(`[WORKOUT_LIB] No match found for Age:${age} Cat:${weightCategory} Goal:${goal}. Using first available.`);
            bestMatch = data.workouts[0];
        }

        if (!bestMatch || !bestMatch.workout_options.length) {
            console.error(`[WORKOUT_LIB] No workouts found in matched group!`);
            return null;
        }

        // Select a specific workout from options using ALL types (workout, mobility, recovery, rest)
        // This ensures the 30-day plan provided in the JSON is followed sequentially
        const optionsToUse = bestMatch.workout_options;

        console.log(`[WORKOUT_LIB] Selecting from ${optionsToUse.length} options for ${bestMatch.age_range}/${bestMatch.weight_category}. DayNumber=${dayNumber}`);

        // Use DayNumber to pick the workout. If DayNumber > options, it wraps around.
        const index = (dayNumber - 1) % optionsToUse.length;
        const selected = optionsToUse[index];

        console.log(`[WORKOUT_LIB] Choice: Day ${dayNumber} -> Index ${index} -> ${selected.name} (${selected.day_type})`);
        return selected;

    } catch (err) {
        console.error("[WORKOUT_LIB] Error selecting workout:", err);
        return null;
    }
}

export function getAllWorkoutCategories() {
    const data = loadWorkouts();
    return data.workouts.map(w => ({
        age: w.age_range,
        cat: w.weight_category,
        goal: w.goal,
        count: w.workout_options.length
    }));
}
