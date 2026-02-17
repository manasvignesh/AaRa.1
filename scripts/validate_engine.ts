import { loadMeals } from '../src/api/diet';
import { loadWorkouts } from '../server/data/workout-lib';

type UserProfile = {
    goal: 'weight_loss' | 'weight_gain' | 'maintain';
    dietType: 'veg' | 'non_veg';
    regionPreference: 'north_indian' | 'south_indian';
};

function generatePersonalizedPlan(userProfile: UserProfile) {
    const mealLib = loadMeals();
    const allMeals = mealLib.meals;
    const workoutLib = loadWorkouts();
    const allWorkouts = workoutLib.workouts;

    // 2. Filter Meals with 3-Tier Fallback System
    let filteredMeals = allMeals.filter(meal => {
        const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
        const matchesDiet = meal.diet === userProfile.dietType;
        const matchesRegion = meal.region === userProfile.regionPreference;
        return matchesGoal && matchesDiet && matchesRegion;
    });

    const tier1Count = filteredMeals.length;

    // Tier 2: Relaxed filtering if strict yields nothing (ignore region)
    if (filteredMeals.length === 0) {
        filteredMeals = allMeals.filter(meal => {
            const matchesGoal = Array.isArray(meal.goal) && meal.goal.includes(userProfile.goal);
            const matchesDiet = meal.diet === userProfile.dietType;
            return matchesGoal && matchesDiet;
        });
    }

    const tier2Count = filteredMeals.length;

    // Tier 3: Ultimate fallback (diet only)
    if (filteredMeals.length === 0) {
        filteredMeals = allMeals.filter(meal => meal.diet === userProfile.dietType);
    }

    const tier3Count = filteredMeals.length;

    let breakfastOptions = filteredMeals.filter(m => m.mealType === 'breakfast');
    let lunchOptions = filteredMeals.filter(m => m.mealType === 'lunch');
    let dinnerOptions = filteredMeals.filter(m => m.mealType === 'dinner');

    // Per-meal-type fallback
    if (breakfastOptions.length === 0) {
        breakfastOptions = allMeals.filter(m => m.mealType === 'breakfast' && m.diet === userProfile.dietType);
    }
    if (lunchOptions.length === 0) {
        lunchOptions = allMeals.filter(m => m.mealType === 'lunch' && m.diet === userProfile.dietType);
    }
    if (dinnerOptions.length === 0) {
        dinnerOptions = allMeals.filter(m => m.mealType === 'dinner' && m.diet === userProfile.dietType);
    }

    // 3. Filter Workouts
    let filteredWorkouts = allWorkouts.filter(workout => {
        return Array.isArray(workout.goal) && workout.goal.includes(userProfile.goal);
    });

    const workoutCount = filteredWorkouts.length;

    // Fallback: if no workouts match goal, use all workouts
    if (filteredWorkouts.length === 0) {
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
        poolSizes: {
            tier1: tier1Count,
            tier2: tier2Count,
            tier3: tier3Count,
            breakfastOptions: breakfastOptions.length,
            lunchOptions: lunchOptions.length,
            dinnerOptions: dinnerOptions.length,
            workoutOptions: workoutCount || filteredWorkouts.length
        }
    };
}

// Test Scenarios
const scenarios = [
    {
        name: "Veg + North Indian + Weight Loss",
        profile: {
            goal: "weight_loss" as const,
            dietType: "veg" as const,
            regionPreference: "north_indian" as const
        }
    },
    {
        name: "Veg + South Indian + Maintain",
        profile: {
            goal: "maintain" as const,
            dietType: "veg" as const,
            regionPreference: "south_indian" as const
        }
    },
    {
        name: "Non-Veg + North Indian + Weight Gain",
        profile: {
            goal: "weight_gain" as const,
            dietType: "non_veg" as const,
            regionPreference: "north_indian" as const
        }
    },
    {
        name: "Non-Veg + South Indian + Weight Loss",
        profile: {
            goal: "weight_loss" as const,
            dietType: "non_veg" as const,
            regionPreference: "south_indian" as const
        }
    },
    {
        name: "Veg + North Indian + Weight Gain",
        profile: {
            goal: "weight_gain" as const,
            dietType: "veg" as const,
            regionPreference: "north_indian" as const
        }
    },
    {
        name: "Non-Veg + South Indian + Maintain",
        profile: {
            goal: "maintain" as const,
            dietType: "non_veg" as const,
            regionPreference: "south_indian" as const
        }
    }
];

console.log("=".repeat(80));
console.log("PERSONALIZATION ENGINE - FUNCTIONAL VALIDATION");
console.log("=".repeat(80));
console.log();

scenarios.forEach((scenario, index) => {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`SCENARIO ${index + 1}: ${scenario.name}`);
    console.log(`${"=".repeat(80)}`);
    console.log(`Profile: goal=${scenario.profile.goal}, diet=${scenario.profile.dietType}, region=${scenario.profile.regionPreference}`);
    console.log();

    const plan = generatePersonalizedPlan(scenario.profile);

    console.log("FILTERING RESULTS:");
    console.log("-".repeat(80));
    console.log(`Tier 1 (strict): ${plan.poolSizes.tier1} meals`);
    if (plan.poolSizes.tier1 === 0) {
        console.log(`Tier 2 (relaxed): ${plan.poolSizes.tier2} meals`);
    }
    if (plan.poolSizes.tier2 === 0) {
        console.log(`Tier 3 (diet-only): ${plan.poolSizes.tier3} meals`);
    }
    console.log(`Breakfast options: ${plan.poolSizes.breakfastOptions}`);
    console.log(`Lunch options: ${plan.poolSizes.lunchOptions}`);
    console.log(`Dinner options: ${plan.poolSizes.dinnerOptions}`);
    console.log(`Workout options: ${plan.poolSizes.workoutOptions}`);
    console.log();

    console.log("GENERATED PLAN:");
    console.log("-".repeat(80));

    if (plan.breakfast) {
        console.log(`✅ BREAKFAST: ${plan.breakfast.name}`);
        console.log(`   Calories: ${plan.breakfast.calories} kcal | Protein: ${plan.breakfast.protein}g`);
        console.log(`   Diet: ${plan.breakfast.diet} | Region: ${plan.breakfast.region} | Goals: ${plan.breakfast.goal.join(', ')}`);
    } else {
        console.log(`❌ BREAKFAST: null`);
    }

    console.log();

    if (plan.lunch) {
        console.log(`✅ LUNCH: ${plan.lunch.name}`);
        console.log(`   Calories: ${plan.lunch.calories} kcal | Protein: ${plan.lunch.protein}g`);
        console.log(`   Diet: ${plan.lunch.diet} | Region: ${plan.lunch.region} | Goals: ${plan.lunch.goal.join(', ')}`);
    } else {
        console.log(`❌ LUNCH: null`);
    }

    console.log();

    if (plan.dinner) {
        console.log(`✅ DINNER: ${plan.dinner.name}`);
        console.log(`   Calories: ${plan.dinner.calories} kcal | Protein: ${plan.dinner.protein}g`);
        console.log(`   Diet: ${plan.dinner.diet} | Region: ${plan.dinner.region} | Goals: ${plan.dinner.goal.join(', ')}`);
    } else {
        console.log(`❌ DINNER: null`);
    }

    console.log();

    if (plan.workout) {
        console.log(`✅ WORKOUT: ${plan.workout.name}`);
        console.log(`   Duration: ${plan.workout.duration} mins | Level: ${plan.workout.level} | Goals: ${plan.workout.goal.join(', ')}`);
    } else {
        console.log(`❌ WORKOUT: null`);
    }

    console.log();

    // Validation checks
    const validations = [];

    if (plan.breakfast && plan.breakfast.diet !== scenario.profile.dietType) {
        validations.push(`⚠️  Breakfast diet mismatch`);
    }
    if (plan.lunch && plan.lunch.diet !== scenario.profile.dietType) {
        validations.push(`⚠️  Lunch diet mismatch`);
    }
    if (plan.dinner && plan.dinner.diet !== scenario.profile.dietType) {
        validations.push(`⚠️  Dinner diet mismatch`);
    }

    const usedFallback = plan.poolSizes.tier1 === 0;
    if (usedFallback) {
        validations.push(`ℹ️  Fallback triggered (no strict matches found)`);
    }

    if (!plan.breakfast || !plan.lunch || !plan.dinner || !plan.workout) {
        validations.push(`❌ CRITICAL: Null values detected`);
    }

    console.log("VALIDATION:");
    console.log("-".repeat(80));
    if (validations.length === 0) {
        console.log("✅ Perfect match - All validations passed!");
    } else {
        validations.forEach(v => console.log(v));
    }

    const totalCalories = (plan.breakfast?.calories || 0) + (plan.lunch?.calories || 0) + (plan.dinner?.calories || 0);
    const totalProtein = (plan.breakfast?.protein || 0) + (plan.lunch?.protein || 0) + (plan.dinner?.protein || 0);

    console.log(`\nDaily Totals: ${totalCalories} kcal, ${totalProtein}g protein`);
});

console.log("\n" + "=".repeat(80));
console.log("VALIDATION COMPLETE");
console.log("=".repeat(80));
