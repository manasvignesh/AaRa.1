
const fs = require('fs');
const path = require('path');

const files = ['veg.json', 'non_veg.json', 'egg.json'];

files.forEach(file => {
    try {
        const content = fs.readFileSync(path.resolve(process.cwd(), file), 'utf-8');
        const data = JSON.parse(content);
        const tiers = {};

        data.meals.forEach(m => {
            if (!tiers[m.calorieTier]) tiers[m.calorieTier] = 0;
            tiers[m.calorieTier]++;
        });

        console.log(`\n📄 ${file}:`);
        Object.keys(tiers).sort().forEach(t => {
            console.log(`   Tier ${t}: ${tiers[t]} meals`);
        });

    } catch (e) {
        console.error(`Error reading ${file}: ${e.message}`);
    }
});
