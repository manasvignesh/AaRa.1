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

export async function loadMeals(): Promise<{ meals: Meal[] }> {
    try {
        const filePath = path.join(process.cwd(), 'data', 'meals_database.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const meals = JSON.parse(fileContent);

        if (!Array.isArray(meals)) {
            console.error('[loadMeals] Invalid meals data: expected array');
            return { meals: [] };
        }

        return { meals };
    } catch (error) {
        console.error('[loadMeals] Failed to load meals database:', error);
        return { meals: [] };
    }
}
