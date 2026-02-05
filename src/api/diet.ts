import fs from 'fs';
import path from 'path';

// --- Types ---
export interface Meal {
    id: string;
    name: string;
    mealType: string;
    dietType: string;
    calorieTier: number;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    prep?: string;
}

export interface MealLibrary {
    dietType: string;
    country: string;
    meals: Meal[];
}

export interface DailyPlanIDs {
    breakfast: string;
    lunch: string;
    snack: string;
    dinner: string;
    snack_2?: string;
}

// Map: Day (1-28) -> CalorieTier (1600/1800/2000) -> MealIDs
export type MonthlyPlan = Record<string, Record<number, DailyPlanIDs>>;

// --- Data Loading ---
const libraries: Record<string, string> = {
    'veg': 'data/veg.json',
    'non-veg': 'data/non_veg.json',
    'egg': 'data/egg.json'
};

function normalizeDietType(input: string): string {
    const lower = input.toLowerCase().trim();
    if (lower.includes('non') || lower.includes('meat')) return 'non-veg';
    if (lower.includes('egg')) return 'egg';
    return 'veg';
}

// REMOVED CACHING: Always read fresh from disk
function loadLibrary(dietType: string): MealLibrary | null {
    const key = normalizeDietType(dietType);
    const fileName = libraries[key];
    if (!fileName) return null;

    try {
        const filePath = path.resolve(process.cwd(), fileName);
        if (!fs.existsSync(filePath)) {
            console.error(`[Meals] Library file not found: ${fileName}`);
            return null;
        }
        // Reading synchronously is fine for this scale/requirement
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading meal library ${dietType}:`, error);
        return null;
    }
}

// --- Monthly Plan Generator (Dynamic) ---
// Regenerates on every call to support dynamic updates to source JSON.
function generateMonthlyPlan(): MonthlyPlan {
    const plan: MonthlyPlan = {};
    const tiers = [1600, 1800, 2000];

    // Load available meals to populate the plan (Fresh Read)
    const vegLib = loadLibrary('veg');

    // We base the "Master Plan" primarily on Veg options as the baseline, 
    // and substitutions happen if the user is Non-Veg.
    if (!vegLib) return {};

    for (let day = 1; day <= 28; day++) {
        plan[day] = {};

        for (const tier of tiers) {
            // Find meals for this tier in the library
            const mealsOfTier = vegLib.meals.filter(m => m.calorieTier === tier);

            // Simple deterministic rotation based on Day
            // This ensures Day 1 always gets the same meals IF the source file hasn't changed.
            const bk = mealsOfTier.filter(m => m.mealType === 'breakfast');
            const lu = mealsOfTier.filter(m => m.mealType === 'lunch');
            const sn = mealsOfTier.filter(m => m.mealType === 'snack');
            const di = mealsOfTier.filter(m => m.mealType === 'dinner');

            if (bk.length && lu.length && sn.length && di.length) {
                plan[day][tier] = {
                    breakfast: bk[(day - 1) % bk.length].id,
                    lunch: lu[(day - 1) % lu.length].id,
                    snack: sn[(day - 1) % sn.length].id,
                    dinner: di[(day - 1) % di.length].id,
                    // If 5 meals needed, reuse snack or use sn2 if exists
                    snack_2: sn[(day % sn.length)].id // offset for variety
                };
            }
        }
    }
    return plan;
}

// --- Helpers ---
export function getCalorieTier(age: number): number {
    if (age < 30) return 2000;
    if (age <= 45) return 1800;
    return 1600;
}

function getMealById(id: string): Meal | null {
    // Search in all loaded libraries (Load fresh)
    const allTypes = ['veg', 'non-veg', 'egg'];
    for (const type of allTypes) {
        const lib = loadLibrary(type);
        const found = lib?.meals.find(m => m.id === id);
        if (found) return found;
    }
    return null;
}

function findReplacement(
    originalMeal: Meal,
    targetDietType: string,
    goal: string // fat_loss, muscle_gain, maintenance
): Meal {
    // 5. If a resolved meal violates diet preference:
    // Replace it with another meal of the SAME TYPE (breakfast/lunch...)

    // Load fresh library for target type
    const lib = loadLibrary(targetDietType);
    if (!lib) return originalMeal; // Fail-safe: return original

    const candidates = lib.meals.filter(m =>
        m.mealType === originalMeal.mealType &&
        m.calorieTier === originalMeal.calorieTier // Strict calorie adherence
    );

    if (candidates.length === 0) return originalMeal;

    // Filter by goal bias
    // fat_loss -> light, high_protein
    // muscle_gain -> high_protein, energy

    // We strictly use Protein as the primary discriminator since Tags are implicit
    let sorted = candidates.sort((a, b) => {
        if (goal === 'muscle_gain' || goal === 'fat_loss') {
            return b.protein - a.protein; // Prefer higher protein
        }
        // maintenance -> balanced (default sort or random-ish but deterministic)
        // For deterministic behavior in maintenance, sort by name
        return a.name.localeCompare(b.name);
    });

    // Pick the first valid one
    return sorted[0];
}

// --- Main Engine ---

export function selectDeterministicMeals(
    userDietType: string,
    age: number,
    goal: string, // 'fat_loss', 'maintenance', 'muscle_gain'
    day: number = 1 // 1-28
) {
    // 1. Identify Tier
    const tier = getCalorieTier(age);

    // 2. Identify Day (Cycle of 28)
    const cycleDay = ((day - 1) % 28) + 1;

    // 3. Load Plan (Freshly Generated)
    const plan = generateMonthlyPlan();
    const dayPlan = plan[cycleDay]?.[tier];

    if (!dayPlan) {
        console.error(`[DietEngine] No plan found for Day ${cycleDay} / Tier ${tier}`);
        return [];
    }

    const slots = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
    const selectedMeals: any[] = [];

    for (const slot of slots) {
        const mealId = dayPlan[slot];
        let meal = getMealById(mealId);

        if (!meal) {
            console.warn(`[DietEngine] Meal ID ${mealId} not found in DB`);
            continue;
        }

        // 4. Apply Diet Preference Filtering
        // Rules:
        // veg -> allow "veg" only
        // egg -> allow "veg" or "egg"
        // non_veg -> allow all

        let isValid = false;
        const mealDiet = normalizeDietType(meal.dietType);
        const userDiet = normalizeDietType(userDietType);

        if (userDiet === 'non-veg') {
            isValid = true;
        } else if (userDiet === 'egg') {
            isValid = (mealDiet === 'veg' || mealDiet === 'egg');
        } else {
            // User is Veg
            isValid = (mealDiet === 'veg');
        }

        if (!isValid) {
            // 5. Swap
            meal = findReplacement(meal, userDiet, goal);
        }

        // Add to result
        selectedMeals.push({
            type: slot,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fats: meal.fats,
            ingredients: [meal.prep], // Using prep as ingredients/desc
            instructions: `Preparation: ${meal.prep || "Standard preparation"}.`,
            quantity: "1 Serving",
            why: `Selected based on ${age}y/${userDiet}/${goal} profile.`
        });
    }

    return selectedMeals;
}

export function selectBestMealForSlot(
    dietType: string,
    age: number,
    slotType: string,
    excludeNames: Set<string>,
    recentMeals: any[] = []
): any {
    // 1. Load fresh library
    const lib = loadLibrary(dietType);
    if (!lib) return null;

    const tier = getCalorieTier(age);

    // 2. Filter candidates
    const candidates = lib.meals.filter(m =>
        m.mealType === slotType &&
        m.calorieTier === tier &&
        !excludeNames.has(m.name)
    );

    if (candidates.length === 0) return null;

    // 3. Simple rotation (pick first available that isn't excluded)
    // In a real "best" logic we'd check recentMeals, but for now just returning valid data is crucial.
    const selected = candidates[0];

    return {
        type: slotType,
        name: selected.name,
        calories: selected.calories,
        protein: selected.protein,
        carbs: selected.carbs,
        fats: selected.fats,
        ingredients: [selected.prep],
        instructions: `Preparation: ${selected.prep || "Standard"}.`,
        quantity: "1 Serving",
        why: "Regenerated alternative."
    };
}
