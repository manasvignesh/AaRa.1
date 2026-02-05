
const fs = require('fs');
const path = require('path');

// Mock Data from meals.ts
const libraries = {
    'veg': 'veg.json',
    'non-veg': 'non_veg.json',
    'egg': 'egg.json'
};

function loadLibrary(dietType) {
    const fileName = libraries[dietType];
    if (!fileName) {
        console.log(`[Load] No mapping found for dietType: '${dietType}'`);
        return null;
    }
    try {
        const filePath = path.resolve(process.cwd(), fileName);
        const data = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error loading ${fileName}:`, error.message);
        return null;
    }
}

function getCalorieTier(age) {
    if (age < 30) return 2000;
    if (age <= 45) return 1800;
    return 1600;
}

function selectDeterministicMeals(dietType, age) {
    console.log(`\n--- Testing Generation for Diet: '${dietType}', Age: ${age} ---`);
    const library = loadLibrary(dietType);
    if (!library) {
        console.log("❌ FAILED: Library not loaded.");
        return;
    }

    const tier = getCalorieTier(age);
    console.log(`   Tier: ${tier} kcal`);

    const tierMeals = library.meals.filter(m => m.calorieTier === tier);
    console.log(`   Found ${tierMeals.length} meals for this tier.`);

    if (tierMeals.length === 0) {
        console.log("❌ FAILED: No meals found for this tier.");
        return;
    }

    // Try to find a breakfast
    const breakfast = tierMeals.filter(m => m.mealType === 'breakfast');
    if (breakfast.length > 0) {
        console.log(`✅ SUCCESS: Found ${breakfast.length} breakfast options. Example: ${breakfast[0].name}`);
    } else {
        console.log("❌ FAILED: No breakfast meals found.");
    }
}

// Test common variations
const testCases = ['veg', 'Veg', 'vegetarian', 'non-veg', 'Non-Veg', 'egg', 'Egg', 'eggitarian'];
testCases.forEach(diet => selectDeterministicMeals(diet, 25));
