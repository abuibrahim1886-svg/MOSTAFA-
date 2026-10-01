const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

const start = content.indexOf('<div className="p-3 sm:p-4">', content.indexOf('categoryItems.map(item =>'));
const end = content.indexOf('</div>', content.indexOf('</button>', start)) + 14;

console.log(content.substring(start - 100, end));
