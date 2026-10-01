const fs = require('fs');
let content = fs.readFileSync('./src/components/AdminDashboard.tsx', 'utf8');

// 1. Add states
const statesToAdd = `
  const [systemNameInput, setSystemNameInput] = useState(settings.systemName || '');
  const [systemNameEnInput, setSystemNameEnInput] = useState(settings.systemNameEn || '');
  const [identitySavedMsg, setIdentitySavedMsg] = useState(false);
  
  const [splashSloganInput, setSplashSloganInput] = useState(settings.splashSlogan || 'أهلاً بكم في أرقى تجربة ضيافة');
  const [splashSavedMsg, setSplashSavedMsg] = useState(false);

  const handleSaveIdentity = () => {
    setSettings(prev => ({ ...prev, systemName: systemNameInput, systemNameEn: systemNameEnInput }));
    setIdentitySavedMsg(true);
    setTimeout(() => setIdentitySavedMsg(false), 3000);
  };
  
  const handleSaveSplashSlogan = () => {
    setSettings(prev => ({ ...prev, splashSlogan: splashSloganInput }));
    setSplashSavedMsg(true);
    setTimeout(() => setSplashSavedMsg(false), 3000);
  };
`;

content = content.replace('  // Settings inputs', statesToAdd + '\n  // Settings inputs');

// 2. Replace the Identity inputs
content = content.replace(
  /value=\{settings\.systemName\}\s+onChange=\{\(e\) => setSettings\(prev => \(\{ \.\.\.prev, systemName: e\.target\.value \}\)\)\}/g,
  `value={systemNameInput}\n                    onChange={(e) => setSystemNameInput(e.target.value)}`
);

content = content.replace(
  /value=\{settings\.systemNameEn \|\| ''\}\s+placeholder="Smart Café & Resto"\s+onChange=\{\(e\) => setSettings\(prev => \(\{ \.\.\.prev, systemNameEn: e\.target\.value \}\)\)\}/g,
  `value={systemNameEnInput || ''}\n                    placeholder="Smart Café & Resto"\n                    onChange={(e) => setSystemNameEnInput(e.target.value)}`
);

// Add identity save button before Logo & Cover Upload
const identitySaveBtn = `
              <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={handleSaveIdentity}
                  className="px-5 py-2.5 rounded-2xl bg-[#3D271D] hover:bg-[#2A1D15] text-white text-xs font-bold shadow-sm transition-all"
                >
                  حفظ اسم المكان
                </button>
                {identitySavedMsg && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                    <Check size={14} />
                    <span>تم الحفظ!</span>
                  </span>
                )}
              </div>
`;
content = content.replace('{/* Logo & Cover Upload */}', identitySaveBtn + '\n              {/* Logo & Cover Upload */}');

// 3. Replace the Splash Slogan input
content = content.replace(
  /value=\{settings\.splashSlogan \?\? 'أهلاً بكم في أرقى تجربة ضيافة'\}\s+onChange=\{\(e\) => setSettings\(prev => \(\{ \.\.\.prev, splashSlogan: e\.target\.value \}\)\)\}/g,
  `value={splashSloganInput}\n                        onChange={(e) => setSplashSloganInput(e.target.value)}`
);

// 4. Add Splash Slogan Save Button
const splashSaveBtn = `
                  <div className="col-span-1 sm:col-span-2 flex items-center justify-between pt-2 border-t border-[#D5C2A5]">
                    <button
                      type="button"
                      onClick={handleSaveSplashSlogan}
                      className="px-5 py-2.5 rounded-2xl bg-[#3D271D] hover:bg-[#2A1D15] text-white text-xs font-bold shadow-sm transition-all"
                    >
                      حفظ العبارة الترحيبية
                    </button>
                    {splashSavedMsg && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <Check size={14} />
                        <span>تم الحفظ!</span>
                      </span>
                    )}
                  </div>
`;
content = content.replace(/<p className="text-\[10px\] text-stone-500 mt-1">تظهر هذه العبارة أسفل اسم وشعار الكافيه في شاشة الدخول<\/p>\s+<\/div>\s+<\/div>/g, 
  `<p className="text-[10px] text-stone-500 mt-1">تظهر هذه العبارة أسفل اسم وشعار الكافيه في شاشة الدخول</p>\n                    </div>\n${splashSaveBtn}\n                  </div>`
);

fs.writeFileSync('./src/components/AdminDashboard.tsx', content);
