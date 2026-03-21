import { loadMeals } from "./loadMeals";
import { loadWorkouts } from "./workout-lib";

export interface UserProfile {
    goal: string;
    dietType: string;
    regionPreference: string;
    weightCategory?: string;
    adjustments?: {
        avoid: string[];
        prefer: string[];
    };
}

export async function generatePersonalizedPlan(userProfile: UserProfile) {
    // 1. Load Data
    const mealLib = await loadMeals();
    const allMeals = mealLib.meals;
    const workoutLib = loadWorkouts();
    const allWorkouts = workoutLib.workouts;

    console.log(`[Engine] Loaded ${allMeals.length} meals, ${allWorkouts.length} workouts`);

    const category = String(userProfile.weightCategory || '').trim().toLowerCase();
    const adjustments = userProfile.adjustments || { avoid: [], prefer: [] };

    const matchesCategory = (meal: any) => {
        if (!category) return true;
        const list = meal.suitableForCategories;
        return Array.isArray(list) ? list.map((c: any) => String(c).toLowerCase()).includes(category) : true;
    };

    const matchPrefer = (meal: any) => {
        const prefer = adjustments.prefer || [];
        if (!prefer.length) return true;

        const density = String(meal.calorieDensity || '').toLowerCase();
        const gl = String(meal.glycemicLoad || '').toLowerCase();
        const method = String(meal.cookingMethod || '').toLowerCase();
        const protein = Number(meal.protein || meal.protein_g || 0);
        const fiber = Number(meal.fiber || 0);

        return prefer.some((p) => {
            const pref = String(p).toLowerCase();
            if (pref === 'calorie_dense') return density === 'high' || density === 'very_high';
            if (pref === 'low_calorie_density') return density === 'low';
            if (pref === 'very_low_calorie') return Boolean(meal.isLowCalorie) && Number(meal.calories || 0) < 220;
            if (pref === 'protein_rich' || pref === 'lean_protein') return Boolean(meal.proteinPriority) || protein >= 20;
            if (pref === 'high_fiber') return Boolean(meal.isHighFiber) || fiber > 5;
            if (pref === 'low_glycemic') return gl === 'low';
            if (pref === 'vegetables') return method.includes('boil') || method.includes('steam') || method.includes('grill');
            if (pref === 'balanced') return density === 'medium' && gl !== 'high';
            if (pref === 'whole_foods') return true;
            if (pref === 'healthy_fats') return method.includes('roast') || method.includes('grill') || method.includes('steam');
            return Boolean((meal as any)[pref]);
        });
    };

    const hardFilter = (meals: any[]) => {
        const avoid = adjustments.avoid || [];
        if (!avoid.length) return meals;

        return meals.filter((meal: any) => {
            const density = String(meal.calorieDensity || '').toLowerCase();
            const gl = String(meal.glycemicLoad || '').toLowerCase();
            const method = String(meal.cookingMethod || '').toLowerCase();
            const calories = Number(meal.calories || 0);

            return !avoid.some((a) => {
                const av = String(a).toLowerCase();
                if (av === 'high_calorie_density') return density === 'high' || density === 'very_high';
                if (av === 'very_low_calorie') return Boolean(meal.isLowCalorie) || calories < 220;
                if (av === 'high_glycemic') return gl === 'high';
                if (av === 'deep_fried') return method.includes('deep') || (method.includes('fried') && !method.includes('pan'));
                if (av === 'sugary') return String(meal.name || '').toLowerCase().includes('sweet') || String(meal.name || '').toLowerCase().includes('halwa');
                if (av === 'refined_carbs') return String(meal.name || '').toLowerCase().includes('white bread');
                if (av === 'large_portions') return calories > 450;
                return Boolean((meal as any)[av]);
            });
        });
    };

    // 2. Filter Meals with 3-Tier Fallback System + category layer + hard avoid filter
    // Tier 1: region + diet + goal + category compatible + prefer match
    const tier1 = allMeals.filter((meal: any) => {
        const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
        const matchesDiet = meal.diet === userProfile.dietType;
        const matchesRegion = meal.region === userProfile.regionPreference;
        return matchesGoal && matchesDiet && matchesRegion && matchesCategory(meal) && matchPrefer(meal);
    });

    // Tier 2: diet + category compatible (ignore region)
    const tier2 = allMeals.filter((meal: any) => {
        const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
        const matchesDiet = meal.diet === userProfile.dietType;
        return matchesGoal && matchesDiet && matchesCategory(meal);
    });

    // Tier 3: diet only
    const tier3 = allMeals.filter((meal: any) => meal.diet === userProfile.dietType);

    let filteredMeals = hardFilter(tier1.length >= 3 ? tier1 : tier2.length >= 3 ? tier2 : tier3);

    console.log(`[Engine] Tier 1 candidates: ${tier1.length}, Tier 2: ${tier2.length}, Tier 3: ${tier3.length}, after hardFilter: ${filteredMeals.length}`);

    let breakfastOptions = filteredMeals.filter(m => m.mealType === 'breakfast');
    let lunchOptions = filteredMeals.filter(m => m.mealType === 'lunch');
    let dinnerOptions = filteredMeals.filter(m => m.mealType === 'dinner');

    // Per-meal-type fallback: if specific meal type is empty, use any meal matching diet (+ category if possible)
    if (breakfastOptions.length === 0) {
        console.warn(`[Engine] No breakfast options, using any breakfast matching diet`);
        breakfastOptions = hardFilter(allMeals.filter((m: any) => m.mealType === 'breakfast' && m.diet === userProfile.dietType && matchesCategory(m)));
    }
    if (lunchOptions.length === 0) {
        console.warn(`[Engine] No lunch options, using any lunch matching diet`);
        lunchOptions = hardFilter(allMeals.filter((m: any) => m.mealType === 'lunch' && m.diet === userProfile.dietType && matchesCategory(m)));
    }
    if (dinnerOptions.length === 0) {
        console.warn(`[Engine] No dinner options, using any dinner matching diet`);
        dinnerOptions = hardFilter(allMeals.filter((m: any) => m.mealType === 'dinner' && m.diet === userProfile.dietType && matchesCategory(m)));
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
