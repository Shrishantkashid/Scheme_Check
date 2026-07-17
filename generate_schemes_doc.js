const fs = require('fs');
const path = require('path');

const schemesDir = path.join(__dirname, 'backend', 'data', 'schemes');
const files = fs.readdirSync(schemesDir).filter(f => f.endsWith('.json'));

let htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>Schemes List</title>
<style>
body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
h1 { color: #2C3E50; text-align: center; font-size: 24px; margin-bottom: 20px; }
h2 { color: #2980B9; border-bottom: 2px solid #BDC3C7; padding-bottom: 5px; margin-top: 20px; text-transform: capitalize; }
ul { margin-bottom: 20px; line-height: 1.6; }
li { margin-bottom: 8px; }
strong { color: #34495E; font-size: 14px; }
.desc { color: #555; font-size: 13px; }
</style>
</head>
<body>
<h1>SchemesCheck - Complete List of Schemes</h1>
<p style="text-align: center;">This document contains all the government schemes currently integrated into the SchemesCheck platform database.</p>
`;

files.forEach(file => {
    try {
        const filePath = path.join(schemesDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Format category name (e.g., self_employed.json -> Self Employed)
        const categoryName = file.replace('.json', '').split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        
        htmlContent += `<h2>Category: ${categoryName}</h2><ul>`;
        
        data.forEach(scheme => {
            htmlContent += `<li><strong>${scheme.title || 'Unknown Title'}</strong><br><span class="desc">${scheme.description || 'No description available.'}</span></li>`;
        });
        
        htmlContent += `</ul>`;
    } catch (e) {
        console.error(`Error processing file ${file}:`, e);
    }
});

htmlContent += `</body></html>`;

// Save as .doc so Microsoft Word opens it natively
const outputPath = path.join(__dirname, 'Schemes_List.doc');
fs.writeFileSync(outputPath, htmlContent);
console.log('Document created successfully at: ' + outputPath);
