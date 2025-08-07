// scripts/fetchMasterList.js
const fs = require('fs');
const https = require('https');

const url = 'https://raw.githubusercontent.com/baconhoney/3DPuzzleQuiz/refs/heads/main/Server/masterdata/masterList.json';
const outputPath = './src/masterList.jsx';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => (data += chunk));
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const fileContent =
                `// Auto-generated at build time\nexport default ${JSON.stringify(json, null, 2)};\n`;
            fs.writeFileSync(outputPath, fileContent);
            console.log('✅ masterList.jsx generated.');
        } catch (e) {
            console.error('❌ Failed to parse JSON:', e);
        }
    });
}).on('error', (err) => {
    console.error('❌ Failed to fetch JSON:', err);
});
