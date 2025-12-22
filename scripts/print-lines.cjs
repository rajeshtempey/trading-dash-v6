const fs = require('fs');
const s = fs.readFileSync('client/src/pages/Dashboard.tsx','utf8').split('\n');
for (let i=480;i<=500;i++) console.log((i+1)+': '+(s[i]||''));
