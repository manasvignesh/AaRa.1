
import fs from 'fs';
import path from 'path';

// Check the ACTUAL files the server uses
const files = ['veg.json', 'non_veg.json', 'egg.json'];

files.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    console.log(`Checking ${file}...`);
    try {
        if (!fs.existsSync(filePath)) {
            console.error(`❌ File not found: ${filePath}`);
            return;
        }
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);

        if (!data.meals || !Array.isArray(data.meals)) {
            console.error(`❌ Invalid structure: 'meals' array missing in ${file}`);
        } else {
            console.log(`✅ ${file}: JSON valid. Found ${data.meals.length} meals.`);

            // Strict Schema Validation
            let invalidCount = 0;
            data.meals.forEach((m, idx) => {
                const issues = [];
                // Check 1: CalorieTier must be a number
                if (typeof m.calorieTier !== 'number') issues.push(`calorieTier is ${typeof m.calorieTier} ('${m.calorieTier}')`);

                // Check 2: MealType must be valid lowercase
                if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(m.mealType)) issues.push(`Invalid mealType: '${m.mealType}'`);

                // Check 3: Protein/Fat/Carbs presence
                if (typeof m.protein !== 'number') issues.push('protein missing/nan');

                if (issues.length > 0) {
                    invalidCount++;
                    if (invalidCount <= 5) console.error(`   Item ${idx} (${m.name}): ${issues.join(', ')}`);
                }
            });

            if (invalidCount === 0) {
                console.log(`   Schema Check: OK! All items have valid types.`);
            } else {
                console.error(`   Schema Check: FAILED! ${invalidCount} items have issues.`);
            }
        }
    } catch (err) {
        console.error(`❌ Error parsing ${file}:`, err.message);
    }
});
