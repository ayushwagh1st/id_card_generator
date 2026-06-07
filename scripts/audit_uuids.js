const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components'];
const fileTypes = ['.tsx', '.ts'];

function scanDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(scanDir(fullPath));
        } else {
            if (fileTypes.includes(path.extname(fullPath))) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const allFiles = [];
targetDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
        allFiles.push(...scanDir(fullPath));
    }
});

const regex = /\{[^}]*\.(id|uuid)\s*(\|\|[^}]*)?\}/g;
let violationCount = 0;

allFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, index) => {
        // Ignore lines that have key={...} or value={...} or pass the id to a component prop like id={...} or for={...}
        // Also ignore string templates in api endpoints for query building
        if (line.match(/key=\{.*\.id\}/) || line.match(/value=\{.*\.(id|uuid)\}/) || line.match(/href=\{.*\.id\}/)) return;
        
        // This is a naive regex, we check if it is between JSX tags.
        // E.g. >{model.id}
        const jsxRegex = />[^<]*\{[^}]*\.(id|uuid)\s*(\|\|[^}]*)?\}[^<]*</;
        if (jsxRegex.test(line)) {
            console.log(`[VIOLATION] ${file}:${index + 1}`);
            console.log(`  => ${line.trim()}`);
            violationCount++;
        }
    });
});

console.log(`\nScan complete. Found ${violationCount} potential UUID UI exposures.`);
if (violationCount > 0) process.exit(1);
