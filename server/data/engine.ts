import { loadMeals } from "../../src/api/diet";
import { loadWorkouts } from "./workout-lib";

export interface UserProfile {
    goal: string;
    dietType: string;
    regionPreference: string;
}

export function generatePersonalizedPlan(userProfile: UserProfile) {
    // 1. Load Data
    const allMeals = loadMeals();
    const workoutLib = loadWorkouts();
    const allWorkouts = workoutLib.workouts;

    console.log(`[Engine] Loaded ${allMeals.length} meals, ${allWorkouts.length} workouts`);

    // 2. Filter Meals with 3-Tier Fallback System
    // Tier 1: Strict filtering (goal + diet + region)
    let filteredMeals = allMeals.filter(meal => {
        const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
        const matchesDiet = meal.diet === userProfile.dietType;
        const matchesRegion = meal.region === userProfile.regionPreference;
        return matchesGoal && matchesDiet && matchesRegion;
    });

    console.log(`[Engine] Tier 1 (strict) filtered meals: ${filteredMeals.length}`);

    // Tier 2: Relaxed filtering if strict yields nothing (ignore region)
    if (filteredMeals.length === 0) {
        console.warn(`[Engine] No meals found with strict filtering, falling back to relaxed (ignoring region)`);
        filteredMeals = allMeals.filter(meal => {
            const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
            const matchesDiet = meal.diet === userProfile.dietType;
            return matchesGoal && matchesDiet;
        });
        console.log(`[Engine] Tier 2 (relaxed) filtered meals: ${filteredMeals.length}`);
    }

    // Tier 3: Ultimate fallback (diet only)
    if (filteredMeals.length === 0) {
        console.warn(`[Engine] No meals found with relaxed filtering, falling back to diet-only`);
        filteredMeals = allMeals.filter(meal => meal.diet === userProfile.dietType);
        console.log(`[Engine] Tier 3 (diet-only) filtered meals: ${filteredMeals.length}`);
    }

    let breakfastOptions = filteredMeals.filter(m => m.mealType === 'breakfast');
    let lunchOptions = filteredMeals.filter(m => m.mealType === 'lunch');
    let dinnerOptions = filteredMeals.filter(m => m.mealType === 'dinner');

    // Per-meal-type fallback: if specific meal type is empty, use any meal matching diet
    if (breakfastOptions.length === 0) {
        console.warn(`[Engine] No breakfast options, using any breakfast matching diet`);
        breakfastOptions = allMeals.filter(m => m.mealType === 'breakfast' && m.diet === userProfile.dietType);
    }
    if (lunchOptions.length === 0) {
        console.warn(`[Engine] No lunch options, using any lunch matching diet`);
        lunchOptions = allMeals.filter(m => m.mealType === 'lunch' && m.diet === userProfile.dietType);
    }
    if (dinnerOptions.length === 0) {
        console.warn(`[Engine] No dinner options, using any dinner matching diet`);
        dinnerOptions = allMeals.filter(m => m.mealType === 'dinner' && m.diet === userProfile.dietType);
    }

    // 3. Filter Workouts
    // Rule: workout.goal includes userProfile.goal
    let filteredWorkouts = allWorkouts.filter(workout => {
        return Array.isArray(workout.goal) && workout.goal.includes(userProfile.goal);
    });

    console.log(`[Engine] Filtered workouts: ${filteredWorkouts.length}`);

    // Fallback: if no workouts match goal, use all workouts
    if (filteredWorkouts.length === 0) {
        console.warn(`[Engine] No workouts found for goal, using all available workouts`);
        filteredWorkouts = allWorkouts;
    }

    // 4. Random Selection
    const selectRandom = (arr: any[]) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    const breakfast = selectRandom(breakfastOptions);
    const lunch = selectRandom(lunchOptions);
    const dinner = selectRandom(dinnerOptions);
    const workout = selectRandom(filteredWorkouts);

    return {
        breakfast,
        lunch,
        dinner,
        workout,
        date: new Date().toISOString().split('T')[0]
    };
}
