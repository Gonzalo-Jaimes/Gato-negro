const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const docPath = path.join(__dirname, 'documentacion');
const outPath = `C:\\Users\\gonza\\.gemini\\antigravity\\brain\\dbf79cbe-7429-49fd-8365-c8a4232bc1db\\analisis_excels_marzo.md`;

const files = [
    'FORMATO ACTUALIZADO FABRIQUIN 2025 (1).xlsx',
    'FORMATO NUEVO NOMINA  FABRIQUIN 2026 (1).xlsx',
    'FORMATO RECEPCION TABACOS.xlsx',
    'MOVIMIENTO FABRIQUINES MARZO   2026.xlsx'
];

let mdContent = `# Análisis de Excels de Gonzalo (V1.8)\n\n`;

files.forEach(file => {
    try {
        const filePath = path.join(docPath, file);
        if (fs.existsSync(filePath)) {
            mdContent += `## Archivo: \`${file}\`\n\n`;
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
            
            mdContent += "```json\n" + JSON.stringify(data.slice(0, 15), null, 2) + "\n```\n\n";
        }
    } catch(err) {
         mdContent += `Error: ${err.message}\n`;
    }
});

fs.writeFileSync(outPath, mdContent, 'utf-8');
console.log("¡Volcado hacia el artefacto exitoso!");
