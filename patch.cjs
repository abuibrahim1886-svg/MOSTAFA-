const fs = require('fs');
let content = fs.readFileSync('./src/lib/useSyncState.ts', 'utf8');

content = content.replace(
  'transaction.set(docRef, { data: nextServerState });',
  'const cleanState = JSON.parse(JSON.stringify(nextServerState));\n        transaction.set(docRef, { data: cleanState });'
);

content = content.replace(
  'setDoc(doc(db, \'system\', key), { data: newValue });',
  'const cleanState = JSON.parse(JSON.stringify(newValue));\n      setDoc(doc(db, \'system\', key), { data: cleanState });'
);

fs.writeFileSync('./src/lib/useSyncState.ts', content);
