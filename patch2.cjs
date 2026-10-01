const fs = require('fs');

// Patch useSyncState.ts
let useSyncContent = fs.readFileSync('./src/lib/useSyncState.ts', 'utf8');
useSyncContent = useSyncContent.replace(
  'setDoc(doc(db, \'system\', key), { data: initialValue });',
  'setDoc(doc(db, \'system\', key), { data: JSON.parse(JSON.stringify(initialValue)) });'
);
fs.writeFileSync('./src/lib/useSyncState.ts', useSyncContent);

// Patch SocialPage.tsx
let socialContent = fs.readFileSync('./src/components/admin/SocialPage.tsx', 'utf8');
socialContent = socialContent.replace(
  'await setDoc(doc(db, \'system\', c.k), { data: c.v });',
  'await setDoc(doc(db, \'system\', c.k), { data: JSON.parse(JSON.stringify(c.v)) });'
);
fs.writeFileSync('./src/components/admin/SocialPage.tsx', socialContent);
