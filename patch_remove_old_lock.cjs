const fs = require('fs');
let content = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

// Replace the UserPlus import if it failed
if(!content.includes('UserPlus')) {
  content = content.replace(/import \{([\s\S]*?)User,([\s\S]*?)\} from 'lucide-react';/, "import {$1User, UserPlus,$2} from 'lucide-react';");
}
if(!content.includes('UserPlus')) {
  content = content.replace("import {", "import { UserPlus,");
}

fs.writeFileSync('./src/components/ClientMenu.tsx', content);
