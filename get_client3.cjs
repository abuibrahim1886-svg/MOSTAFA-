const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

const returnIdx = content.lastIndexOf('return (');
console.log(content.substring(returnIdx, returnIdx + 1000));
