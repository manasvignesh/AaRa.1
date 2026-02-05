
import fs from 'fs';
import path from 'path';

const files = ['veg.json', 'non_veg.json', 'egg.json'];

files.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    try {
        let content = fs.readFileSync(filePath, 'utf-8');

        // 1. Fix missing commas between objects
        // Look for } followed by whitespace/newlines then {
        const fixedContent = content.replace(/}\s*\{/g, '},{');

        // 2. Write to _fixed version
        const fixedPath = path.resolve(process.cwd(), file.replace('.json', '_fixed.json'));
        fs.writeFileSync(fixedPath, fixedContent);
        console.log(`✅ Fixed ${file} -> ${fixedPath}`);

        // 3. Verify
        try {
            JSON.parse(fixedContent);
            console.log(`   Verfication: Valid JSON!`);
        } catch (e) {
            console.error(`   Verification Failed: ${e.message}`);
        }

    } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
    }
});
