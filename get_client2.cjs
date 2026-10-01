const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

const returnIdx = content.indexOf('return (', content.indexOf('const aggregatedSessionItems'));
console.log(content.substring(returnIdx, returnIdx + 500));
