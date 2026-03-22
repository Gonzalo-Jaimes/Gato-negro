const xlsx = require('xlsx');
const fs = require('fs');

const files = fs.readdirSync('documentacion').filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
const results = {};

files.forEach(f => {
    try {
        const wb = xlsx.readFile('documentacion/' + f);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        
        // Take top 10 rows
        const data = xlsx.utils.sheet_to_json(sheet, { header: 1 }).slice(0, 15);
        results[f] = data;
    } catch (e) {
        results[f] = { error: e.message };
    }
});

fs.writeFileSync('result_excel.json', JSON.stringify(results, null, 2), 'utf8');
console.log("Done. Check result_excel.json");
