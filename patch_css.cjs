const fs = require('fs');
let client = fs.readFileSync('./src/components/ClientMenu.tsx', 'utf8');

// 1. App background
client = client.replace(
  'backgroundColor: theme?.backgroundColor || \'#eedec6\',',
  'backgroundColor: theme?.backgroundColor || \'#F8F9FA\',' // Clean off-white modern background
);

// 2. Header Redesign
client = client.replace(
  /className="sticky top-0 z-40 shadow-sm border-b transition-colors duration-300"/,
  'className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-stone-200/50 transition-colors duration-300 shadow-sm"'
);

// 3. Category Pills Redesign
client = client.replace(
  /className={`flex-shrink-0 px-4 py-2\.5 rounded-2xl text-sm font-black transition-all \${/g,
  'className={`flex-shrink-0 px-5 py-3 rounded-full text-sm font-bold transition-all shadow-sm ${'
);

client = client.replace(
  /isSelected\s*\?\s*'bg-\[#3D271D\] text-white shadow-md'\s*:\s*'bg-white\/60 text-stone-600 hover:bg-white'/g,
  'isSelected ? \'bg-[#2D1E18] text-white shadow-md scale-105\' : \'bg-white text-stone-500 hover:bg-stone-50 border border-stone-100\''
);

// 4. Menu Card Redesign
client = client.replace(
  /className={`bg-white\/90 rounded-3xl overflow-hidden shadow-sm border transition-all active:scale-\[0\.98\]/g,
  'className={`bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:scale-[0.98]'
);

// Image styling
client = client.replace(
  /className="w-full h-full object-cover"/g,
  'className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"'
);

// 5. Add to Cart Button (Card) Redesign
client = client.replace(
  /className="absolute bottom-3 left-3 w-10 h-10 rounded-2xl bg-white shadow-lg text-\[#3D271D\] flex items-center justify-center hover:bg-stone-50 active:scale-90 transition-all z-10"/g,
  'className="absolute bottom-3 left-3 w-11 h-11 rounded-full bg-[#2D1E18] shadow-xl text-white flex items-center justify-center hover:bg-[#1A110D] active:scale-90 transition-all z-10"'
);

// 6. Floating Cart Bar Redesign
client = client.replace(
  /className="fixed bottom-0 left-0 right-0 p-4 z-50 pointer-events-none"/g,
  'className="fixed bottom-6 left-0 right-0 px-4 z-50 pointer-events-none flex justify-center"'
);

client = client.replace(
  /className="bg-\[#3D271D\] text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between pointer-events-auto transition-transform active:scale-\[0\.98\] max-w-lg mx-auto w-full border border-\[#2A1D15\]"/g,
  'className="bg-[#2D1E18]/95 backdrop-blur-md text-white p-4 px-6 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex items-center justify-between pointer-events-auto transition-all hover:scale-[1.02] active:scale-[0.98] w-full max-w-md mx-auto border border-white/10"'
);

fs.writeFileSync('./src/components/ClientMenu.tsx', client);
