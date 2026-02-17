import { selectDeterministicMeals } from "./src/api/diet";

const testUser = {
    dietaryPreferences: 'veg',
    age: 25,
    primaryGoal: 'fat_loss'
};

const meals = selectDeterministicMeals(
    testUser.dietaryPreferences,
    testUser.age,
    testUser.primaryGoal,
    1
);

console.log("Generated Meals:", JSON.stringify(meals, null, 2));
if (meals.length === 0) {
    console.error("❌ No meals generated!");
} else {
    console.log(`✅ Generated ${meals.length} meals.`);
}
