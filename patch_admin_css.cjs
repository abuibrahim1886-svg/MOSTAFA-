const fs = require('fs');
let content = fs.readFileSync('./src/components/AdminDashboard.tsx', 'utf8');

// 1. Sidebar Design
content = content.replace(
  /className="w-full sm:w-64 bg-white border-b sm:border-b-0 sm:border-l border-stone-200 flex-shrink-0 sm:h-screen sm:sticky sm:top-0 overflow-y-auto flex sm:flex-col"/g,
  'className="w-full sm:w-72 bg-white/60 backdrop-blur-xl sm:border-l border-stone-200/50 flex-shrink-0 sm:h-screen sm:sticky sm:top-0 overflow-y-auto flex sm:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]"'
);

// 2. Tab Items in Sidebar
content = content.replace(
  /className={`flex items-center gap-3 w-full p-4 sm:p-3 sm:px-4 text-right transition-colors border-b sm:border-b-0 whitespace-nowrap sm:whitespace-normal \${/g,
  'className={`flex items-center gap-3 w-full p-4 sm:p-3.5 sm:px-5 sm:my-1 sm:rounded-2xl text-right transition-all border-b sm:border-b-0 whitespace-nowrap sm:whitespace-normal font-bold text-sm ${'
);

content = content.replace(
  /activeTab === tab\.id \? 'bg-\[#3D271D\] text-white font-black' : 'text-stone-600 hover:bg-stone-50 hover:text-\[#3D271D\]'/g,
  'activeTab === tab.id ? \'bg-[#2D1E18] text-white shadow-md\' : \'text-stone-500 hover:bg-stone-100 hover:text-stone-900\''
);

// 3. Stats Cards in Dashboard (Orders, Revenue, etc)
content = content.replace(
  /className="bg-white rounded-3xl p-6 border border-\[#E5D5BC\] shadow-sm flex items-center justify-between"/g,
  'className="bg-white rounded-[2rem] p-6 border border-stone-100 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex items-center justify-between transition-transform hover:scale-[1.02]"'
);

// 4. Order Cards
content = content.replace(
  /className={`bg-white rounded-3xl overflow-hidden border shadow-sm transition-all \${/g,
  'className={`bg-white rounded-[2rem] overflow-hidden border shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all ${'
);

// 5. Overall Admin Background
content = content.replace(
  /className="min-h-screen bg-\[#F9F6F0\] flex flex-col sm:flex-row text-right" style=\{\{ direction: 'rtl' \}\}/g,
  'className="min-h-screen bg-[#F4F5F7] flex flex-col sm:flex-row text-right font-sans antialiased" style={{ direction: \'rtl\' }}'
);

fs.writeFileSync('./src/components/AdminDashboard.tsx', content);
