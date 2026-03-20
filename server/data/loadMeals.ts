import fs from 'fs/promises';
import path from 'path';

interface Meal {
    id: string;
    name: string;
    mealType: 'breakfast' | 'lunch' | 'dinner';
    region: 'north_indian' | 'south_indian';
    diet: 'veg' | 'non_veg';
    goal: string[];
    calories: number;
    protein: number;
}

interface RawMealRecord {
    id?: string;
    name?: string;
    mealType?: string;
    region?: string;
    diet?: string;
    goal?: string[];
    calories?: number;
    protein?: number;
    meal_name?: string;
    category?: string;
    diet_type?: string;
    calories_kcal?: number;
    protein_g?: number;
    meal_time?: string;
}

const MEAL_TYPE_MAP: Record<string, Meal['mealType'] | null> = {
    breakfast: 'breakfast',
    lunch: 'lunch',
    dinner: 'dinner',
    snack: null,
    beverage: null,
    any: null,
};

const REGION_MAP: Record<string, Meal['region']> = {
    north: 'north_indian',
    south: 'south_indian',
    'pan-india': 'north_indian',
    'pan india': 'north_indian',
    'east/south': 'south_indian',
};

const DIET_MAP: Record<string, Meal['diet']> = {
    veg: 'veg',
    'non-veg': 'non_veg',
    nonveg: 'non_veg',
    non_veg: 'non_veg',
};

function inferGoals(mealType: Meal['mealType'], calories: number, protein: number): string[] {
    const goals = new Set<string>(['maintain']);

    if (protein >= 18 || (mealType === 'dinner' && protein >= 14)) {
        goals.add('weight_gain');
    }

    if (calories <= 220 || protein >= 12) {
        goals.add('weight_loss');
    }

    return Array.from(goals);
}

function normalizeMeal(rawMeal: RawMealRecord): Meal | null {
    if (rawMeal.name && rawMeal.mealType && rawMeal.diet && Array.isArray(rawMeal.goal)) {
        return {
            id: String(rawMeal.id ?? ''),
            name: rawMeal.name,
            mealType: rawMeal.mealType as Meal['mealType'],
            region: (rawMeal.region as Meal['region']) ?? 'north_indian',
            diet: rawMeal.diet as Meal['diet'],
            goal: rawMeal.goal,
            calories: Math.round(Number(rawMeal.calories ?? 0)),
            protein: Math.round(Number(rawMeal.protein ?? 0)),
        };
    }

    const mealTypeSource = String(rawMeal.meal_time ?? rawMeal.category ?? '').trim().toLowerCase();
    const mealType = MEAL_TYPE_MAP[mealTypeSource];
    if (!mealType) {
        return null;
    }

    const normalizedRegionKey = String(rawMeal.region ?? '').trim().toLowerCase();
    const region = REGION_MAP[normalizedRegionKey] ?? 'north_indian';

    const dietKey = String(rawMeal.diet_type ?? rawMeal.diet ?? '').trim().toLowerCase();
    const diet = DIET_MAP[dietKey];
    if (!diet) {
        return null;
    }

    const calories = Math.round(Number(rawMeal.calories_kcal ?? rawMeal.calories ?? 0));
    const protein = Math.round(Number(rawMeal.protein_g ?? rawMeal.protein ?? 0));
    const name = String(rawMeal.meal_name ?? rawMeal.name ?? '').trim();

    if (!name || !Number.isFinite(calories) || !Number.isFinite(protein)) {
        return null;
    }

    return {
        id: String(rawMeal.id ?? name),
        name,
        mealType,
        region,
        diet,
        goal: inferGoals(mealType, calories, protein),
        calories,
        protein,
    };
}

export async function loadMeals(): Promise<{ meals: Meal[] }> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'meals_database.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const rawMeals = JSON.parse(fileContent);

        if (!Array.isArray(rawMeals)) {
            console.error('[loadMeals] Invalid meals data: expected array');
            return { meals: [] };
        }

        const meals = rawMeals
            .map((meal: RawMealRecord) => normalizeMeal(meal))
            .filter((meal: Meal | null): meal is Meal => meal !== null);

        if (meals.length !== rawMeals.length) {
            console.warn(`[loadMeals] Skipped ${rawMeals.length - meals.length} meal entries that could not be normalized.`);
        }

        return { meals };
    } catch (error) {
        console.error('[loadMeals] Failed to load meals database:', error);
        return { meals: [] };
    }
}
