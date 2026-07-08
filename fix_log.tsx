import fs from 'fs';
let content = fs.readFileSync('src/components/NBodySystem.tsx', 'utf-8');
content = content.replace('if (i === 0 && Math.random() < 0.05) console.log("rb1 mass", rb1.mass(), "b1 mass", b1.mass, "force", totalForce.length()); // \'force\', totalForce.length(), \'scale\', gravityScale);', '// removed log');
fs.writeFileSync('src/components/NBodySystem.tsx', content);
