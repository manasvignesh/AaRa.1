
import fs from 'fs';
import path from 'path';

const file = 'veg.json';
const filePath = path.resolve(process.cwd(), file);

try {
    const content = fs.readFileSync(filePath, 'utf-8');
    JSON.parse(content);
    console.log("✅ Valid JSON");
} catch (e) {
    console.log(`❌ Error: ${e.message}`);
    // e.message usually looks like "Unexpected token ] in JSON at position 12345"
    const match = e.message.match(/position (\d+)/);
    if (match) {
        const pos = parseInt(match[1]);
        const start = Math.max(0, pos - 50);
        const end = Math.min(content.length, pos + 50);
        console.log("--- Context ---");
        console.log(content.slice(start, end));
        console.log("--- cursor ^ ---");
        // Print a marker
        let marker = "";
        for (let i = 0; i < (pos - start); i++) marker += " ";
        marker += "^";
        console.log(marker);
    }
}
