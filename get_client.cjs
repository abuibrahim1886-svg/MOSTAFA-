const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

// Just extracting the lock logic part
const idx = content.indexOf('const isSessionLockedByOther');
console.log(content.substring(idx - 200, idx + 500));
