const fs = require('fs');
const path = require('path');

const folders = ['admin', 'equipos', 'finanzas', 'produccion'];
const baseDir = path.join(process.cwd(), 'views');

folders.forEach(folder => {
    const dirPath = path.join(baseDir, folder);
    if (!fs.existsSync(dirPath)) return;
    
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
        if (!file.endsWith('.ejs')) return;
        
        const filePath = path.join(dirPath, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Replace include('partials/ with include('../partials/
        const newContent = content.replace(/include\('partials\//g, "include('../partials/");
        
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`✅ Updated: ${folder}/${file}`);
        } else {
            console.log(`ℹ️ No changes: ${folder}/${file}`);
        }
    });
});
